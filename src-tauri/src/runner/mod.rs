// Runner module — spawns build / typecheck / lint / test / e2e child processes
// in a workspace, streams stdout/stderr to the frontend via Tauri events, and
// parses well-known output formats (tsc diagnostics, eslint json) into typed
// "runner:diagnostic" events the frontend can render in the Problems tab.
//
// Public surface (Tauri commands):
//   runner_start(kind, workspaceRoot) -> RunId
//   runner_stop(runId)
//   runner_status(runId)              -> RunnerStatus
//
// Streamed events:
//   "runner:stdout"     { runId, line }
//   "runner:stderr"     { runId, line }
//   "runner:exit"       { runId, code, durationMs, kind }
//   "runner:diagnostic" { runId, kind, file, line, col, code, message, severity }
//   "runner:summary"    { runId, kind, summary }   // best-effort parsed result

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Mutex;
use std::time::Instant;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::oneshot;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum RunnerKind {
    Build,
    TypeCheck,
    Lint,
    Test,
    #[serde(rename = "E2E")]
    E2E,
    #[serde(rename_all = "camelCase")]
    Custom { command: String, args: Vec<String> },
}

impl RunnerKind {
    fn label(&self) -> &'static str {
        match self {
            RunnerKind::Build => "build",
            RunnerKind::TypeCheck => "typecheck",
            RunnerKind::Lint => "lint",
            RunnerKind::Test => "test",
            RunnerKind::E2E => "e2e",
            RunnerKind::Custom { .. } => "custom",
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RunState {
    Running,
    Succeeded,
    Failed,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunnerStatus {
    pub run_id: String,
    pub kind_label: String,
    pub state: RunState,
    pub exit_code: Option<i32>,
    pub started_at_ms: u128,
    pub duration_ms: Option<u128>,
}

#[derive(Default)]
pub struct RunnerRegistry {
    inner: Mutex<HashMap<String, RunHandle>>,
}

struct RunHandle {
    status: RunnerStatus,
    cancel: Option<oneshot::Sender<()>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PackageManager {
    Npm,
    Yarn,
    Pnpm,
}

impl PackageManager {
    fn detect(root: &Path) -> Self {
        if root.join("pnpm-lock.yaml").exists() {
            return PackageManager::Pnpm;
        }
        if root.join("yarn.lock").exists() {
            return PackageManager::Yarn;
        }
        PackageManager::Npm
    }

    fn exec_bin(self) -> &'static str {
        match self {
            PackageManager::Npm => "npx",
            PackageManager::Yarn => "yarn",
            PackageManager::Pnpm => "pnpm",
        }
    }

    /// `dlx`-style invocation (`pnpm exec foo`, `yarn exec foo`, `npx foo`).
    fn exec_args(self, bin: &str, rest: &[&str]) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        match self {
            PackageManager::Npm => {
                out.push(bin.to_string());
                out.extend(rest.iter().map(|s| s.to_string()));
            }
            PackageManager::Yarn => {
                out.push("exec".to_string());
                out.push("--".to_string());
                out.push(bin.to_string());
                out.extend(rest.iter().map(|s| s.to_string()));
            }
            PackageManager::Pnpm => {
                out.push("exec".to_string());
                out.push(bin.to_string());
                out.extend(rest.iter().map(|s| s.to_string()));
            }
        }
        out
    }
}

fn read_text(path: &Path) -> Option<String> {
    std::fs::read_to_string(path).ok()
}

fn has_dep(root: &Path, name: &str) -> bool {
    let pkg = match read_text(&root.join("package.json")) {
        Some(s) => s,
        None => return false,
    };
    let v: serde_json::Value = match serde_json::from_str(&pkg) {
        Ok(v) => v,
        Err(_) => return false,
    };
    for key in ["dependencies", "devDependencies", "optionalDependencies"] {
        if v.get(key)
            .and_then(|d| d.get(name))
            .is_some()
        {
            return true;
        }
    }
    false
}

/// Resolves the (program, args) pair that should be spawned for a given
/// RunnerKind in the given workspace, taking package-manager and installed
/// deps into account.
fn resolve_command(kind: &RunnerKind, root: &Path) -> (String, Vec<String>) {
    if let RunnerKind::Custom { command, args } = kind {
        return (command.clone(), args.clone());
    }

    let pm = PackageManager::detect(root);
    let bin = pm.exec_bin().to_string();

    match kind {
        RunnerKind::Build => (bin, pm.exec_args("next", &["build"])),
        RunnerKind::TypeCheck => (bin, pm.exec_args("tsc", &["--noEmit", "--pretty", "false"])),
        RunnerKind::Lint => {
            // Prefer `next lint` if next is installed, otherwise `eslint .`
            if has_dep(root, "next") {
                (bin, pm.exec_args("next", &["lint", "--format", "json"]))
            } else {
                (
                    bin,
                    pm.exec_args("eslint", &[".", "--format", "json"]),
                )
            }
        }
        RunnerKind::Test => {
            if has_dep(root, "vitest") {
                (bin, pm.exec_args("vitest", &["run", "--reporter", "default"]))
            } else if has_dep(root, "jest") {
                (bin, pm.exec_args("jest", &[]))
            } else {
                (bin, pm.exec_args("vitest", &["run"]))
            }
        }
        RunnerKind::E2E => (bin, pm.exec_args("playwright", &["test"])),
        RunnerKind::Custom { .. } => unreachable!(),
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StdoutEvent {
    run_id: String,
    line: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExitEvent {
    run_id: String,
    kind: String,
    code: Option<i32>,
    duration_ms: u128,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DiagnosticEvent {
    run_id: String,
    kind: String,
    file: String,
    line: u32,
    col: u32,
    code: Option<String>,
    message: String,
    severity: String, // "error" | "warning" | "info"
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct RunSummary {
    run_id: String,
    kind: String,
    typecheck_errors: u32,
    lint_errors: u32,
    lint_warnings: u32,
    tests_passed: u32,
    tests_failed: u32,
}

fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

#[tauri::command]
pub async fn runner_start(
    app: AppHandle,
    registry: State<'_, RunnerRegistry>,
    kind: RunnerKind,
    workspace_root: String,
) -> Result<String, String> {
    let run_id = generate_id();
    let root = PathBuf::from(&workspace_root);
    if !root.exists() {
        return Err(format!("workspace root does not exist: {workspace_root}"));
    }

    let (program, args) = resolve_command(&kind, &root);
    let kind_label = kind.label().to_string();
    let started_at = now_ms();

    let initial_status = RunnerStatus {
        run_id: run_id.clone(),
        kind_label: kind_label.clone(),
        state: RunState::Running,
        exit_code: None,
        started_at_ms: started_at,
        duration_ms: None,
    };

    let (cancel_tx, cancel_rx) = oneshot::channel::<()>();
    {
        let mut map = registry.inner.lock().map_err(|e| e.to_string())?;
        map.insert(
            run_id.clone(),
            RunHandle {
                status: initial_status,
                cancel: Some(cancel_tx),
            },
        );
    }

    let app_for_task = app.clone();
    let run_id_for_task = run_id.clone();
    let kind_label_for_task = kind_label.clone();

    tokio::spawn(async move {
        let started = Instant::now();
        let mut cmd = Command::new(&program);
        cmd.args(&args)
            .current_dir(&root)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                let _ = app_for_task.emit(
                    "runner:stderr",
                    StdoutEvent {
                        run_id: run_id_for_task.clone(),
                        line: format!("failed to spawn `{program}`: {e}"),
                    },
                );
                let _ = app_for_task.emit(
                    "runner:exit",
                    ExitEvent {
                        run_id: run_id_for_task.clone(),
                        kind: kind_label_for_task.clone(),
                        code: Some(-1),
                        duration_ms: started.elapsed().as_millis(),
                    },
                );
                if let Some(reg) = app_for_task.try_state::<RunnerRegistry>() {
                    if let Ok(mut map) = reg.inner.lock() {
                        if let Some(h) = map.get_mut(&run_id_for_task) {
                            h.status.state = RunState::Failed;
                            h.status.exit_code = Some(-1);
                            h.status.duration_ms = Some(started.elapsed().as_millis());
                        }
                    }
                }
                return;
            }
        };

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let stdout_handle = if let Some(stdout) = stdout {
            let app = app_for_task.clone();
            let run_id = run_id_for_task.clone();
            let kind_label = kind_label_for_task.clone();
            Some(tokio::spawn(async move {
                let mut reader = BufReader::new(stdout).lines();
                let mut buf_for_parse = String::new();
                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = app.emit(
                        "runner:stdout",
                        StdoutEvent {
                            run_id: run_id.clone(),
                            line: line.clone(),
                        },
                    );
                    parse_tsc_line(&app, &run_id, &kind_label, &line);
                    buf_for_parse.push_str(&line);
                    buf_for_parse.push('\n');
                }
                // After completion, try to parse aggregated output (eslint json,
                // vitest summary) from stdout.
                buf_for_parse
            }))
        } else {
            None
        };

        let stderr_handle = if let Some(stderr) = stderr {
            let app = app_for_task.clone();
            let run_id = run_id_for_task.clone();
            Some(tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = app.emit(
                        "runner:stderr",
                        StdoutEvent {
                            run_id: run_id.clone(),
                            line,
                        },
                    );
                }
            }))
        } else {
            None
        };

        // Wait for either the child to exit or a cancel request.
        let exit_status = tokio::select! {
            res = child.wait() => res.map(Some).map_err(|e| e.to_string()),
            _ = cancel_rx => {
                let _ = child.start_kill();
                let _ = child.wait().await;
                Ok(None)
            }
        };

        let collected_stdout = if let Some(h) = stdout_handle {
            h.await.unwrap_or_default()
        } else {
            String::new()
        };
        if let Some(h) = stderr_handle {
            let _ = h.await;
        }

        let elapsed = started.elapsed().as_millis();
        let (state, exit_code): (RunState, Option<i32>) = match &exit_status {
            Ok(Some(st)) => {
                let code = st.code();
                let state = if code == Some(0) {
                    RunState::Succeeded
                } else {
                    RunState::Failed
                };
                (state, code)
            }
            Ok(None) => (RunState::Stopped, None),
            Err(_) => (RunState::Failed, None),
        };

        // Best-effort summary parsing.
        let summary = build_summary(
            &run_id_for_task,
            &kind_label_for_task,
            &collected_stdout,
        );
        let _ = app_for_task.emit("runner:summary", &summary);

        if let Some(reg) = app_for_task.try_state::<RunnerRegistry>() {
            if let Ok(mut map) = reg.inner.lock() {
                if let Some(h) = map.get_mut(&run_id_for_task) {
                    h.status.state = state;
                    h.status.exit_code = exit_code;
                    h.status.duration_ms = Some(elapsed);
                    h.cancel = None;
                }
            }
        }

        let _ = app_for_task.emit(
            "runner:exit",
            ExitEvent {
                run_id: run_id_for_task.clone(),
                kind: kind_label_for_task.clone(),
                code: exit_code,
                duration_ms: elapsed,
            },
        );
    });

    Ok(run_id)
}

#[tauri::command]
pub fn runner_stop(registry: State<'_, RunnerRegistry>, run_id: String) -> Result<(), String> {
    let mut map = registry.inner.lock().map_err(|e| e.to_string())?;
    if let Some(handle) = map.get_mut(&run_id) {
        if let Some(tx) = handle.cancel.take() {
            let _ = tx.send(());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn runner_status(
    registry: State<'_, RunnerRegistry>,
    run_id: String,
) -> Result<Option<RunnerStatus>, String> {
    let map = registry.inner.lock().map_err(|e| e.to_string())?;
    Ok(map.get(&run_id).map(|h| h.status.clone()))
}

fn generate_id() -> String {
    // Cheap unique id: timestamp + counter; avoids pulling in `uuid` crate.
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let n = COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("run_{}_{n:x}", now_ms())
}

// ---- Parsers --------------------------------------------------------------

/// Match `path/file.ts(line,col): error TSxxxx: message`
/// or       `path/file.ts:line:col - error TSxxxx: message`
fn parse_tsc_line(app: &AppHandle, run_id: &str, kind: &str, line: &str) {
    // Form A: file(LINE,COL): error TSxxxx: message
    if let Some((file, rest)) = line.split_once('(') {
        if let Some((coords, after)) = rest.split_once(')') {
            if let Some((ln, col)) = coords.split_once(',') {
                if let (Ok(ln), Ok(col)) = (ln.trim().parse::<u32>(), col.trim().parse::<u32>()) {
                    if let Some(rest) = after.strip_prefix(':').map(str::trim_start) {
                        if let Some((sev, body)) = rest.split_once(' ') {
                            let severity = match sev {
                                "error" => "error",
                                "warning" => "warning",
                                _ => return,
                            };
                            let (code, message) = body
                                .split_once(':')
                                .map(|(c, m)| (Some(c.trim().to_string()), m.trim().to_string()))
                                .unwrap_or((None, body.trim().to_string()));
                            let _ = app.emit(
                                "runner:diagnostic",
                                DiagnosticEvent {
                                    run_id: run_id.to_string(),
                                    kind: kind.to_string(),
                                    file: file.trim().to_string(),
                                    line: ln,
                                    col,
                                    code,
                                    message,
                                    severity: severity.to_string(),
                                },
                            );
                            return;
                        }
                    }
                }
            }
        }
    }
}

fn build_summary(run_id: &str, kind: &str, stdout: &str) -> RunSummary {
    let mut s = RunSummary {
        run_id: run_id.to_string(),
        kind: kind.to_string(),
        ..Default::default()
    };

    match kind {
        "typecheck" => {
            // Count tsc "error TSxxxx" occurrences as a fallback.
            for line in stdout.lines() {
                if line.contains("): error TS") || line.contains(" - error TS") {
                    s.typecheck_errors += 1;
                }
            }
        }
        "lint" => {
            // Try to parse eslint --format json.
            if let Some(start) = stdout.find('[') {
                let json_slice = &stdout[start..];
                if let Ok(reports) =
                    serde_json::from_str::<Vec<serde_json::Value>>(json_slice)
                {
                    for r in reports {
                        if let Some(ec) = r.get("errorCount").and_then(|v| v.as_u64()) {
                            s.lint_errors += ec as u32;
                        }
                        if let Some(wc) = r.get("warningCount").and_then(|v| v.as_u64()) {
                            s.lint_warnings += wc as u32;
                        }
                    }
                }
            }
        }
        "test" => {
            // Vitest "Tests  N passed | M failed"; Jest "Tests:       N passed,..."
            for line in stdout.lines() {
                let l = line.to_ascii_lowercase();
                if l.contains("passed") {
                    if let Some(n) = pick_count_before(&l, "passed") {
                        s.tests_passed = s.tests_passed.max(n);
                    }
                }
                if l.contains("failed") {
                    if let Some(n) = pick_count_before(&l, "failed") {
                        s.tests_failed = s.tests_failed.max(n);
                    }
                }
            }
        }
        _ => {}
    }
    s
}

fn pick_count_before(line: &str, needle: &str) -> Option<u32> {
    let idx = line.find(needle)?;
    let head = &line[..idx];
    // Walk back over whitespace, then digits.
    let bytes = head.as_bytes();
    let mut end = bytes.len();
    while end > 0 && bytes[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    let mut start = end;
    while start > 0 && bytes[start - 1].is_ascii_digit() {
        start -= 1;
    }
    if start == end {
        return None;
    }
    head[start..end].parse::<u32>().ok()
}
