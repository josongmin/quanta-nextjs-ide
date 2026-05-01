// tsserver bridge — spawn the workspace's local `node_modules/typescript/lib/tsserver.js`
// as a child process and speak the tsserver JSON protocol over stdio.
//
// tsserver framing: each message is `Content-Length: N\r\n\r\n<json>` (LSP-style).
// We forward async events ("type": "event") to the JS side as the Tauri event
// `tsserver:event`, and resolve request promises by matching `request_seq`.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, Mutex};

#[derive(Default)]
pub struct TsServerState {
    inner: Arc<Mutex<Option<TsServerProc>>>,
}

struct TsServerProc {
    child: Child,
    stdin: ChildStdin,
    pending: Arc<Mutex<HashMap<u32, oneshot::Sender<Value>>>>,
}

#[derive(Debug, Serialize)]
struct OutgoingRequest<'a> {
    seq: u32,
    #[serde(rename = "type")]
    kind: &'a str,
    command: &'a str,
    arguments: Value,
}

fn resolve_tsserver_path(workspace_root: &str) -> PathBuf {
    let mut p = PathBuf::from(workspace_root);
    p.push("node_modules");
    p.push("typescript");
    p.push("lib");
    p.push("tsserver.js");
    p
}

#[tauri::command]
pub async fn tsserver_start(
    app: AppHandle,
    state: State<'_, TsServerState>,
    workspace_root: String,
) -> Result<(), String> {
    let mut guard = state.inner.lock().await;
    if guard.is_some() {
        return Ok(()); // already running
    }

    let tsserver_js = resolve_tsserver_path(&workspace_root);
    if !tsserver_js.exists() {
        return Err(format!(
            "tsserver.js not found at {}",
            tsserver_js.display()
        ));
    }

    let mut child = Command::new("node")
        .arg(&tsserver_js)
        .arg("--useSingleInferredProject")
        .arg("--disableAutomaticTypingAcquisition")
        .current_dir(&workspace_root)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|e| format!("spawn node tsserver failed: {e}"))?;

    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| "failed to capture tsserver stdin".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "failed to capture tsserver stdout".to_string())?;
    let stderr = child.stderr.take();

    let pending: Arc<Mutex<HashMap<u32, oneshot::Sender<Value>>>> =
        Arc::new(Mutex::new(HashMap::new()));

    // Reader task: parse Content-Length framed JSON messages from stdout.
    let app_for_reader = app.clone();
    let pending_for_reader = pending.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        loop {
            // Read header lines until empty line.
            let mut content_length: Option<usize> = None;
            loop {
                let mut line = String::new();
                let n = match reader.read_line(&mut line).await {
                    Ok(n) => n,
                    Err(_) => return,
                };
                if n == 0 {
                    return; // EOF
                }
                let trimmed = line.trim_end_matches(['\r', '\n']);
                if trimmed.is_empty() {
                    break;
                }
                if let Some(rest) = trimmed.strip_prefix("Content-Length:") {
                    if let Ok(v) = rest.trim().parse::<usize>() {
                        content_length = Some(v);
                    }
                }
            }
            let Some(len) = content_length else {
                continue;
            };
            let mut buf = vec![0u8; len];
            if reader.read_exact(&mut buf).await.is_err() {
                return;
            }
            let Ok(text) = std::str::from_utf8(&buf) else {
                continue;
            };
            let Ok(value) = serde_json::from_str::<Value>(text) else {
                continue;
            };

            let kind = value.get("type").and_then(|v| v.as_str()).unwrap_or("");
            match kind {
                "response" => {
                    let req_seq = value
                        .get("request_seq")
                        .and_then(|v| v.as_u64())
                        .map(|v| v as u32);
                    if let Some(seq) = req_seq {
                        let tx_opt = {
                            let mut map = pending_for_reader.lock().await;
                            map.remove(&seq)
                        };
                        if let Some(tx) = tx_opt {
                            let _ = tx.send(value);
                        }
                    }
                }
                "event" => {
                    let _ = app_for_reader.emit("tsserver:event", value);
                }
                _ => {
                    // Unknown — surface as event for visibility.
                    let _ = app_for_reader.emit("tsserver:event", value);
                }
            }
        }
    });

    // Stderr task: forward to the log + emit as a diagnostic event.
    if let Some(stderr) = stderr {
        let app_for_err = app.clone();
        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_for_err.emit(
                    "tsserver:stderr",
                    serde_json::json!({ "line": line }),
                );
            }
        });
    }

    *guard = Some(TsServerProc {
        child,
        stdin,
        pending,
    });

    Ok(())
}

#[tauri::command]
pub async fn tsserver_stop(state: State<'_, TsServerState>) -> Result<(), String> {
    let mut guard = state.inner.lock().await;
    if let Some(mut proc) = guard.take() {
        // Drain pending senders so JS promises don't hang.
        {
            let mut map = proc.pending.lock().await;
            map.clear();
        }
        let _ = proc.stdin.shutdown().await;
        let _ = proc.child.start_kill();
        let _ = proc.child.wait().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn tsserver_request(
    state: State<'_, TsServerState>,
    seq: u32,
    command: String,
    arguments: Value,
) -> Result<Value, String> {
    // Snapshot the bits we need without holding the outer lock during the await on rx.
    let (pending, payload) = {
        let mut guard = state.inner.lock().await;
        let proc = guard
            .as_mut()
            .ok_or_else(|| "tsserver not started".to_string())?;

        let req = OutgoingRequest {
            seq,
            kind: "request",
            command: &command,
            arguments,
        };
        let body = serde_json::to_string(&req)
            .map_err(|e| format!("serialize tsserver request: {e}"))?;
        // tsserver actually accepts a single trailing \n, but Content-Length framing
        // is the safer wire format and matches what protocol.d.ts documents.
        let framed = format!("Content-Length: {}\r\n\r\n{}", body.len(), body);

        let (tx, rx_local) = oneshot::channel::<Value>();
        {
            let mut map = proc.pending.lock().await;
            map.insert(seq, tx);
        }

        proc.stdin
            .write_all(framed.as_bytes())
            .await
            .map_err(|e| format!("write tsserver stdin: {e}"))?;
        proc.stdin
            .flush()
            .await
            .map_err(|e| format!("flush tsserver stdin: {e}"))?;

        (proc.pending.clone(), rx_local)
    };

    // Await the response without holding the proc lock.
    match payload.await {
        Ok(value) => Ok(value),
        Err(_) => {
            // Sender dropped — clean up pending entry just in case.
            let mut map = pending.lock().await;
            map.remove(&seq);
            Err("tsserver request cancelled".to_string())
        }
    }
}

