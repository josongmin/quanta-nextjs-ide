# Quanta — Tauri shell (macOS-first)

Native desktop wrapper for Quanta IDE. Targets macOS 12+ (Apple Silicon +
Intel via universal binary) with 2026-grade UX patterns.

## What's wired

- **Transparent vibrancy window** with HUD/sidebar effect, 12px corner
  radius, hidden titlebar, custom traffic-light position (matches Linear /
  Notion).
- **Native menu bar**: Quanta · File · Edit · View · Probe · Window · Help.
  Every menu item emits `quanta://menu` events that the web side maps to
  IDE actions.
- **Tray icon** (template style — auto-tints for dark/light menu bar) with
  Show / Capture / Open RSC / Open AI / Quit.
- **Global shortcut** `⌘⇧Space` toggles the window from anywhere
  (Raycast-style).
- **Single-instance lock**: a second launch (Spotlight, deep-link, dock
  click) focuses the existing window instead of forking.
- **Window state restore**: size, position, fullscreen survive relaunch.
- **Close-to-tray**: the red traffic light hides instead of quits. ⌘Q quits.
- **Reopen**: clicking the dock icon re-shows the hidden window (macOS
  convention).
- **Deep links**: `quanta://route?url=/__rsc/products/walnut-table`,
  `quanta://ai`. Captured pre-launch and replayed once the JS side mounts.
- **Auto-updater**: polls `releases.quanta.dev` on launch + every 6h.
  In-app banner offers "Install + relaunch" without leaving the workspace.
- **Notifications**: Probe done / CI complete / Update available — falls
  back to browser `Notification` API on web build.
- **Capabilities scoped**: fs only inside `$HOME` (with `.ssh`/`.aws`
  blocklisted), shell only `git/node/npm/pnpm/yarn`. No wildcards.
- **Entitlements**: hardened runtime, network client, user-selected files,
  Apple events for "Reveal in Finder" automation.

## Local dev

```bash
# Once: install Rust toolchain + Tauri CLI + JS plugin clients
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm install -D @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-fs \
  @tauri-apps/plugin-shell @tauri-apps/plugin-dialog \
  @tauri-apps/plugin-notification @tauri-apps/plugin-os \
  @tauri-apps/plugin-process @tauri-apps/plugin-updater \
  @tauri-apps/plugin-window-state @tauri-apps/plugin-deep-link \
  @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-clipboard-manager \
  @tauri-apps/plugin-positioner @tauri-apps/plugin-autostart \
  @tauri-apps/plugin-single-instance @tauri-apps/plugin-log

# Run the desktop dev shell — boots the IDE web build in a native window.
npm run tauri:dev

# Production builds
npm run tauri:macos:universal   # Apple Silicon + Intel
npm run tauri:macos:arm         # Apple Silicon only (faster)
```

Replace placeholder icons in `icons/` before bundling — see
`icons/README.md`.

## Codesigning + notarization (production)

`signingIdentity` is `null` for local builds. For shipping, set:

```bash
export APPLE_CERTIFICATE="..."
export APPLE_CERTIFICATE_PASSWORD="..."
export APPLE_SIGNING_IDENTITY="Developer ID Application: Quanta"
export APPLE_ID="..."
export APPLE_PASSWORD="..."
export APPLE_TEAM_ID="..."
npm run tauri:build
```

Tauri runs `codesign` + Apple's `notarytool` automatically when those env
vars are set.

## Updater pubkey

Set the updater's `pubkey` field in `tauri.conf.json` to your generated
public key. Sign release artifacts with the matching private key:

```bash
npm run tauri signer generate -- -w ~/.quanta/updater.key
npm run tauri signer sign -- -k ~/.quanta/updater.key path/to/Quanta.app.tar.gz
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Tauri shell (Rust)                                      │
│  - Window management + traffic-light overlay             │
│  - Native menu bar + tray + global shortcut              │
│  - Plugin host: fs / shell / dialog / notification /     │
│    updater / window-state / single-instance / etc.       │
│  - Emits quanta://menu and quanta://deep-link events     │
└──────────────────────────┬───────────────────────────────┘
                           │ IPC (Tauri's invoke + events)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Quanta IDE (web)                                        │
│  - useNativeMenu(): listens to quanta://menu and runs    │
│    openOverlay / setBottomTab actions                    │
│  - useUpdater(): polls Tauri updater + shows banner      │
│  - getShell(): returns TauriShell (uses globalThis.      │
│    __TAURI__) when running inside Tauri, WebShell when   │
│    running in a regular browser                          │
└─────────────────────────────────────────────────────────┘
```
