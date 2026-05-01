// Quanta — Tauri 2 entry. macOS-first SOTA UX wiring.
//
// Reads as a checklist of what a 2026-grade native macOS app needs:
//   - single-instance lock (deep links / Spotlight launches don't fork)
//   - window-state restore (size/position/fullscreen across relaunches)
//   - hidden titlebar with traffic-light overlay (drawn via tauri.conf.json)
//   - native menu bar (File / Edit / View / Probe / Window / Help)
//   - tray icon with quick actions
//   - global shortcut: ⌘⇧Space → toggle window (Raycast-style)
//   - deep link handler: quanta://route?url=...
//   - notifications + auto-updater + log forwarding

use std::sync::Mutex;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, RunEvent, WindowEvent,
};
#[cfg(desktop)]
use tauri::{
    image::Image,
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

mod tsserver;
pub mod watcher;
pub mod workspace;
mod runner;

#[derive(Default)]
struct AppState {
    last_deep_link: Mutex<Option<String>>,
}

#[tauri::command]
fn get_last_deep_link(state: tauri::State<'_, AppState>) -> Option<String> {
    state.last_deep_link.lock().ok()?.clone()
}

#[tauri::command]
fn show_main_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.unminimize();
    }
}

#[tauri::command]
fn hide_main_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
}

#[tauri::command]
fn toggle_main_window(app: AppHandle) {
    let Some(win) = app.get_webview_window("main") else {
        return;
    };
    let visible = win.is_visible().unwrap_or(false);
    let focused = win.is_focused().unwrap_or(false);
    if visible && focused {
        let _ = win.hide();
    } else {
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.unminimize();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .manage(tsserver::TsServerState::default())
        .manage(workspace::WorkspaceState::default())
        .manage(runner::RunnerRegistry::default())
        // ── Single-instance lock: focuses the existing window when a second
        //    launch happens (Spotlight, deep-link, dock click).
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
                let _ = win.unminimize();
            }
        }))
        // ── Window state restore (size/position/fullscreen).
        .plugin(tauri_plugin_window_state::Builder::default().build())
        // ── Standard plugin set.
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        // ⌘⇧Space → toggle window (Raycast-style).
                        if shortcut
                            == &Shortcut::new(
                                Some(Modifiers::SUPER | Modifiers::SHIFT),
                                Code::Space,
                            )
                        {
                            toggle_main_window(app.clone());
                        }
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            get_last_deep_link,
            show_main_window,
            hide_main_window,
            toggle_main_window,
            tsserver::tsserver_start,
            tsserver::tsserver_stop,
            tsserver::tsserver_request,
            workspace::open_workspace,
            workspace::close_workspace,
            workspace::read_workspace_file,
            workspace::list_workspace_files,
            workspace::current_workspace,
            runner::runner_start,
            runner::runner_stop,
            runner::runner_status,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // ── Native menu bar (macOS app menu).
            build_app_menu(&handle)?;

            // ── Tray icon (template image: matches macOS dark/light menu bar).
            #[cfg(desktop)]
            build_tray_icon(&handle)?;

            // ── Register global shortcut ⌘⇧Space (toggle window).
            #[cfg(desktop)]
            {
                let gs = handle.global_shortcut();
                let _ = gs.register(Shortcut::new(
                    Some(Modifiers::SUPER | Modifiers::SHIFT),
                    Code::Space,
                ));
            }

            // ── Deep-link: store last url + emit to JS.
            // Tauri 2: idiomatic call is `app.deep_link().on_open_url(cb)`.
            let state_handle = handle.clone();
            use tauri_plugin_deep_link::DeepLinkExt;
            handle.deep_link().on_open_url(move |event| {
                let urls: Vec<String> =
                    event.urls().iter().map(|u| u.to_string()).collect();
                if let Some(first) = urls.first() {
                    if let Ok(mut last) =
                        state_handle.state::<AppState>().last_deep_link.lock()
                    {
                        *last = Some(first.clone());
                    }
                    let _ = state_handle.emit("quanta://deep-link", first.clone());
                }
            });

            // ── Show window after first paint to avoid white flash (macOS UX best practice).
            if let Some(win) = handle.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Quanta")
        .run(|app, event| match event {
            // Reopen window when the user clicks the dock icon (macOS).
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { has_visible_windows, .. } => {
                if !has_visible_windows {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
            }
            // Close-to-tray on macOS: hide instead of quitting when the user
            // clicks the red traffic light. ⌘Q still quits.
            RunEvent::WindowEvent {
                label,
                event: WindowEvent::CloseRequested { api, .. },
                ..
            } if label == "main" => {
                api.prevent_close();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.hide();
                }
            }
            _ => {}
        });
}

fn build_app_menu(handle: &AppHandle) -> tauri::Result<()> {
    // App menu: About / Settings / Quit
    let app_menu = SubmenuBuilder::new(handle, "Quanta")
        .item(&PredefinedMenuItem::about(handle, Some("About Quanta"), None)?)
        .separator()
        .item(
            &MenuItemBuilder::with_id("settings", "Settings…")
                .accelerator("CmdOrCtrl+,")
                .build(handle)?,
        )
        .separator()
        .item(&PredefinedMenuItem::services(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::hide(handle, None)?)
        .item(&PredefinedMenuItem::hide_others(handle, None)?)
        .item(&PredefinedMenuItem::show_all(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(handle, None)?)
        .build()?;

    let file_menu = SubmenuBuilder::new(handle, "File")
        .item(
            &MenuItemBuilder::with_id("open-folder", "Open Folder…")
                .accelerator("CmdOrCtrl+O")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("import-trace", "Import Trace…")
                .accelerator("CmdOrCtrl+Shift+O")
                .build(handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id("save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("export-trace", "Export Trace…")
                .accelerator("CmdOrCtrl+E")
                .build(handle)?,
        )
        .separator()
        .item(&PredefinedMenuItem::close_window(handle, None)?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(handle, "Edit")
        .item(&PredefinedMenuItem::undo(handle, None)?)
        .item(&PredefinedMenuItem::redo(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(handle, None)?)
        .item(&PredefinedMenuItem::copy(handle, None)?)
        .item(&PredefinedMenuItem::paste(handle, None)?)
        .item(&PredefinedMenuItem::select_all(handle, None)?)
        .build()?;

    let view_menu = SubmenuBuilder::new(handle, "View")
        .item(
            &MenuItemBuilder::with_id("command-palette", "Command Palette…")
                .accelerator("CmdOrCtrl+K")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("quick-open", "Quick Open…")
                .accelerator("CmdOrCtrl+P")
                .build(handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id("toggle-bottom-panel", "Toggle Bottom Panel")
                .accelerator("CmdOrCtrl+`")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("toggle-left-panel", "Toggle Left Panel")
                .accelerator("CmdOrCtrl+B")
                .build(handle)?,
        )
        .separator()
        .item(&PredefinedMenuItem::fullscreen(handle, None)?)
        .build()?;

    let probe_menu = SubmenuBuilder::new(handle, "Probe")
        .item(
            &MenuItemBuilder::with_id("open-rsc", "Open RSC Payload Step")
                .accelerator("CmdOrCtrl+R")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("capture-now", "Capture Last Trace")
                .accelerator("CmdOrCtrl+Shift+C")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("open-ai", "Open Quanta AI")
                .accelerator("CmdOrCtrl+I")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("open-plugins", "Plugin Findings")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("open-git", "Git Status")
                .accelerator("CmdOrCtrl+Shift+G")
                .build(handle)?,
        )
        .build()?;

    let window_menu = SubmenuBuilder::new(handle, "Window")
        .item(&PredefinedMenuItem::minimize(handle, None)?)
        .item(&PredefinedMenuItem::maximize(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::bring_all_to_front(handle, None)?)
        .build()?;

    let help_menu = SubmenuBuilder::new(handle, "Help")
        .item(
            &MenuItemBuilder::with_id("docs", "Quanta Docs")
                .build(handle)?,
        )
        .item(
            &MenuItemBuilder::with_id("report-issue", "Report Issue…")
                .build(handle)?,
        )
        .build()?;

    let menu = MenuBuilder::new(handle)
        .items(&[
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &probe_menu,
            &window_menu,
            &help_menu,
        ])
        .build()?;

    handle.set_menu(menu)?;

    // Forward menu clicks to JS so the web side runs the actual action.
    let h = handle.clone();
    handle.on_menu_event(move |_app, event| {
        let _ = h.emit("quanta://menu", event.id().0.clone());
    });

    Ok(())
}

#[cfg(desktop)]
fn build_tray_icon(handle: &AppHandle) -> tauri::Result<()> {
    let show = MenuItemBuilder::with_id("tray-show", "Show Quanta")
        .accelerator("CmdOrCtrl+Shift+Space")
        .build(handle)?;
    let capture = MenuItemBuilder::with_id("tray-capture", "Capture Last Route").build(handle)?;
    let open_rsc = MenuItemBuilder::with_id("tray-open-rsc", "Open RSC Probe…").build(handle)?;
    let open_ai = MenuItemBuilder::with_id("tray-open-ai", "Open Quanta AI…").build(handle)?;
    let separator = PredefinedMenuItem::separator(handle)?;
    let quit = PredefinedMenuItem::quit(handle, Some("Quit Quanta"))?;

    let menu = MenuBuilder::new(handle)
        .items(&[&show, &capture, &open_rsc, &open_ai, &separator, &quit])
        .build()?;

    let h = handle.clone();
    let _tray = TrayIconBuilder::with_id("main")
        .icon(Image::from_bytes(include_bytes!("../icons/tray-icon.png"))?)
        .icon_as_template(true)
        .menu(&menu)
        // Tauri 2: left-click should NOT open the menu — we toggle the
        // window instead via the tray-icon event handler below.
        .menu_on_left_click(false)
        .on_menu_event(move |_app, event| {
            let id = event.id().as_ref();
            match id {
                "tray-show" => toggle_main_window(h.clone()),
                "tray-capture" => {
                    let _ = h.emit("quanta://menu", "capture-now".to_string());
                }
                "tray-open-rsc" => {
                    let _ = h.emit("quanta://menu", "open-rsc".to_string());
                    show_main_window(h.clone());
                }
                "tray-open-ai" => {
                    let _ = h.emit("quanta://menu", "open-ai".to_string());
                    show_main_window(h.clone());
                }
                _ => {}
            }
        })
        .on_tray_icon_event(move |tray, event| {
            // Left click on tray icon → toggle main window (macOS convention).
            if let TrayIconEvent::Click { button, .. } = event {
                if button == MouseButton::Left {
                    toggle_main_window(tray.app_handle().clone());
                }
            }
        })
        .build(handle)?;

    Ok(())
}
