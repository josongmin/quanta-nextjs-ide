// Workspace file watcher.
//
// Spawns a `notify` recommended-watcher in a background thread, debounces
// events on a 100ms window, normalizes paths to workspace-relative POSIX
// strings, and emits `fs:changed` Tauri events to the JS side.
//
// The frontend analyzer bus subscribes to `fs:changed` and decides which
// analyzers to re-run based on the changed paths.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::thread;
use std::time::{Duration, Instant};

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Kind {
    Create,
    Modify,
    Delete,
}

impl Kind {
    fn as_str(self) -> &'static str {
        match self {
            Kind::Create => "create",
            Kind::Modify => "modify",
            Kind::Delete => "delete",
        }
    }
}

#[derive(Serialize, Clone)]
struct FsChangedPayload {
    paths: Vec<String>,
    kind: &'static str,
}

const DEBOUNCE_MS: u64 = 100;

const IGNORE_DIR_SEGMENTS: &[&str] = &["node_modules", ".next", "dist", ".git"];

fn should_ignore(path: &Path) -> bool {
    for comp in path.components() {
        if let std::path::Component::Normal(name) = comp {
            let s = name.to_string_lossy();
            if IGNORE_DIR_SEGMENTS.iter().any(|ig| *ig == s) {
                return true;
            }
        }
    }
    false
}

fn classify(kind: &EventKind) -> Option<Kind> {
    match kind {
        EventKind::Create(_) => Some(Kind::Create),
        EventKind::Modify(_) => Some(Kind::Modify),
        EventKind::Remove(_) => Some(Kind::Delete),
        _ => None,
    }
}

/// Handle returned to the workspace state. Dropping it stops the watcher:
/// the underlying `notify::RecommendedWatcher` is dropped, which closes the
/// event channel; the worker thread sees `RecvTimeoutError::Disconnected`
/// and exits cleanly. The OS watch is removed automatically.
pub struct WatcherHandle {
    _watcher: RecommendedWatcher,
}

pub fn start_watcher(app: AppHandle, root: PathBuf) -> Result<WatcherHandle, String> {
    // Channel for raw notify events from `notify` -> our worker thread.
    let (tx, rx) = channel::<notify::Result<Event>>();

    let mut watcher: RecommendedWatcher = notify::recommended_watcher(move |res| {
        let _ = tx.send(res);
    })
    .map_err(|e| format!("watcher init: {e}"))?;

    watcher
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| format!("watch root: {e}"))?;

    let root_for_thread = root.clone();
    thread::spawn(move || {
        // Pending events bucketed by `Kind` so we can flush per-kind batches.
        let mut pending: HashMap<Kind, Vec<String>> = HashMap::new();
        let mut last_event: Option<Instant> = None;

        loop {
            // Block up to debounce window for the next event. If we have
            // pending changes and nothing new arrives in that window, flush.
            let timeout = if last_event.is_some() {
                Duration::from_millis(DEBOUNCE_MS)
            } else {
                Duration::from_secs(1)
            };

            match rx.recv_timeout(timeout) {
                Ok(Ok(ev)) => {
                    let Some(kind) = classify(&ev.kind) else {
                        continue;
                    };
                    for p in ev.paths {
                        if should_ignore(&p) {
                            continue;
                        }
                        // Make path workspace-relative POSIX.
                        let rel = p
                            .strip_prefix(&root_for_thread)
                            .map(|r| r.to_path_buf())
                            .unwrap_or(p);
                        let posix = rel.to_string_lossy().replace('\\', "/");
                        if posix.is_empty() {
                            continue;
                        }
                        pending.entry(kind).or_default().push(posix);
                    }
                    last_event = Some(Instant::now());
                }
                Ok(Err(e)) => {
                    log::warn!("watcher event error: {e}");
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Either no pending data (just spin) or debounce window
                    // elapsed → flush.
                    if let Some(t) = last_event {
                        if t.elapsed() >= Duration::from_millis(DEBOUNCE_MS) {
                            for (kind, mut paths) in pending.drain() {
                                paths.sort();
                                paths.dedup();
                                let _ = app.emit(
                                    "fs:changed",
                                    FsChangedPayload {
                                        paths,
                                        kind: kind.as_str(),
                                    },
                                );
                            }
                            last_event = None;
                        }
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => break,
            }
        }
    });

    Ok(WatcherHandle { _watcher: watcher })
}
