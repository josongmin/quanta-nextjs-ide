// Workspace loader: opens a folder on disk, classifies it (Next.js? App
// Router?), and exposes Tauri commands the frontend can use to read files.
//
// On `open_workspace`, the file watcher (see `crate::watcher`) is started
// against the workspace root and emits `fs:changed` events with debounced
// paths. `close_workspace` tears it down.
//
// All paths returned to the frontend are workspace-relative POSIX-style
// (forward slashes), so the analyzer bus in the web side can consume them
// uniformly.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::watcher::WatcherHandle;

#[derive(Default)]
pub struct WorkspaceState {
    pub root: Mutex<Option<PathBuf>>,
    pub watcher: Mutex<Option<WatcherHandle>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceInfo {
    pub root: String,
    pub name: String,
    pub is_next_project: bool,
    pub has_app_router: bool,
    pub package_json: Option<serde_json::Value>,
    pub next_config: Option<String>,
    pub tsconfig: Option<serde_json::Value>,
}

fn to_posix(p: &Path) -> String {
    let s = p.to_string_lossy().to_string();
    s.replace('\\', "/")
}

fn read_optional_text(path: &Path) -> Option<String> {
    std::fs::read_to_string(path).ok()
}

fn read_optional_json(path: &Path) -> Option<serde_json::Value> {
    let txt = read_optional_text(path)?;
    serde_json::from_str(&txt).ok()
}

fn detect_next(pkg: &serde_json::Value) -> bool {
    let has = |key: &str| -> bool {
        pkg.get(key)
            .and_then(|v| v.as_object())
            .map(|m| m.contains_key("next"))
            .unwrap_or(false)
    };
    has("dependencies") || has("devDependencies") || has("peerDependencies")
}

#[tauri::command]
pub fn open_workspace(
    path: String,
    app: AppHandle,
    state: State<'_, WorkspaceState>,
) -> Result<WorkspaceInfo, String> {
    let root = PathBuf::from(&path);
    if !root.is_dir() {
        return Err(format!("not a directory: {}", path));
    }

    // Tear down any previous watcher first.
    if let Ok(mut w) = state.watcher.lock() {
        if let Some(h) = w.take() {
            drop(h); // Drop stops the underlying watcher thread.
        }
    }

    let pkg_path = root.join("package.json");
    let next_config_paths = [
        root.join("next.config.ts"),
        root.join("next.config.mjs"),
        root.join("next.config.js"),
    ];
    let tsconfig_path = root.join("tsconfig.json");

    let package_json = read_optional_json(&pkg_path);
    let next_config = next_config_paths
        .iter()
        .find_map(|p| read_optional_text(p));
    let tsconfig = read_optional_json(&tsconfig_path);

    let is_next_project = package_json.as_ref().map(detect_next).unwrap_or(false);
    let has_app_router = root.join("app").is_dir() || root.join("src").join("app").is_dir();

    let name = root
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "workspace".to_string());

    // Stash root + start watcher.
    if let Ok(mut r) = state.root.lock() {
        *r = Some(root.clone());
    }
    match crate::watcher::start_watcher(app.clone(), root.clone()) {
        Ok(handle) => {
            if let Ok(mut w) = state.watcher.lock() {
                *w = Some(handle);
            }
        }
        Err(e) => {
            // Non-fatal — workspace still opens, just no live updates.
            log::warn!("workspace watcher failed to start: {e}");
        }
    }

    Ok(WorkspaceInfo {
        root: to_posix(&root),
        name,
        is_next_project,
        has_app_router,
        package_json,
        next_config,
        tsconfig,
    })
}

#[tauri::command]
pub fn close_workspace(state: State<'_, WorkspaceState>) -> Result<(), String> {
    if let Ok(mut w) = state.watcher.lock() {
        if let Some(h) = w.take() {
            drop(h);
        }
    }
    if let Ok(mut r) = state.root.lock() {
        *r = None;
    }
    Ok(())
}

fn resolve_within<'a>(root: &'a Path, rel: &str) -> Result<PathBuf, String> {
    // Disallow absolute and traversal paths.
    let rel_path = Path::new(rel);
    if rel_path.is_absolute() {
        return Err("absolute path not allowed".into());
    }
    let mut out = root.to_path_buf();
    for comp in rel_path.components() {
        match comp {
            std::path::Component::ParentDir => return Err("parent traversal not allowed".into()),
            std::path::Component::Normal(n) => out.push(n),
            std::path::Component::CurDir => {}
            _ => return Err("invalid path component".into()),
        }
    }
    Ok(out)
}

#[tauri::command]
pub fn read_workspace_file(
    relative_path: String,
    state: State<'_, WorkspaceState>,
) -> Result<String, String> {
    let root = state
        .root
        .lock()
        .ok()
        .and_then(|r| r.clone())
        .ok_or_else(|| "no workspace open".to_string())?;
    let abs = resolve_within(&root, &relative_path)?;
    std::fs::read_to_string(&abs).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_workspace_files(
    glob: String,
    state: State<'_, WorkspaceState>,
) -> Result<Vec<String>, String> {
    let root = state
        .root
        .lock()
        .ok()
        .and_then(|r| r.clone())
        .ok_or_else(|| "no workspace open".to_string())?;

    // Compose absolute pattern: <root>/<glob>. Always use forward slashes.
    let root_str = root.to_string_lossy().replace('\\', "/");
    let pattern = if glob.starts_with('/') {
        format!("{}{}", root_str, glob)
    } else {
        format!("{}/{}", root_str, glob)
    };

    let mut out = Vec::new();
    let walker = match ::glob::glob(&pattern) {
        Ok(w) => w,
        Err(e) => return Err(format!("bad glob: {e}")),
    };
    for entry in walker.flatten() {
        if !entry.is_file() {
            continue;
        }
        // Filter out junk dirs.
        let s = entry.to_string_lossy().replace('\\', "/");
        if s.contains("/node_modules/")
            || s.contains("/.next/")
            || s.contains("/dist/")
            || s.contains("/.git/")
        {
            continue;
        }
        if let Ok(rel) = entry.strip_prefix(&root) {
            out.push(rel.to_string_lossy().replace('\\', "/"));
        }
    }
    out.sort();
    Ok(out)
}

#[tauri::command]
pub fn current_workspace(state: State<'_, WorkspaceState>) -> Option<String> {
    state
        .root
        .lock()
        .ok()
        .and_then(|r| r.clone())
        .map(|p| to_posix(&p))
}
