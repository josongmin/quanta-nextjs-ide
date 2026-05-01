/**
 * Native (Tauri) bridge for the web side.
 *
 * Each helper degrades gracefully on the web build (no-op or web-equivalent),
 * so surfaces don't need to branch on `isNative()` everywhere.
 */

export type Platform = 'macos' | 'windows' | 'linux' | 'web';

export function isNative(): boolean {
  return !!(globalThis as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

export function getPlatform(): Platform {
  if (!isNative()) return 'web';
  // Tauri 2 exposes `__TAURI_OS__` after plugin-os init; fall back to UA.
  const os = (globalThis as { __TAURI_OS__?: { platform: string } }).__TAURI_OS__?.platform;
  if (os === 'macos' || os === 'darwin') return 'macos';
  if (os === 'windows') return 'windows';
  if (os === 'linux') return 'linux';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('win')) return 'windows';
  return 'linux';
}

export function isMacOS(): boolean {
  return getPlatform() === 'macos';
}

/**
 * Listen for `quanta://menu` events emitted by the native menu/tray.
 * Returns an unsubscribe function. On web build, returns a no-op.
 */
export function onNativeMenu(handler: (action: string) => void): () => void {
  if (!isNative()) return () => undefined;
  const tauri = (globalThis as { __TAURI__?: { event?: { listen: (e: string, cb: (e: { payload: string }) => void) => Promise<() => void> } } }).__TAURI__;
  if (!tauri?.event) return () => undefined;
  let unlisten: (() => void) | null = null;
  void tauri.event.listen('quanta://menu', (e) => handler(e.payload)).then((u) => {
    unlisten = u;
  });
  return () => {
    unlisten?.();
  };
}

/**
 * Listen for deep-link opens (`quanta://...`).
 */
export function onDeepLink(handler: (url: string) => void): () => void {
  if (!isNative()) return () => undefined;
  const tauri = (globalThis as { __TAURI__?: { event?: { listen: (e: string, cb: (e: { payload: string }) => void) => Promise<() => void> } } }).__TAURI__;
  if (!tauri?.event) return () => undefined;
  let unlisten: (() => void) | null = null;
  void tauri.event.listen('quanta://deep-link', (e) => handler(e.payload)).then((u) => {
    unlisten = u;
  });
  return () => {
    unlisten?.();
  };
}

/**
 * Show a native notification (or browser Notification on web).
 */
export async function nativeNotify(title: string, body?: string): Promise<void> {
  if (isNative()) {
    const tauri = (globalThis as { __TAURI__?: { notification?: { sendNotification: (opts: { title: string; body?: string }) => void } } }).__TAURI__;
    tauri?.notification?.sendNotification({ title, body });
    return;
  }
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') new Notification(title, { body });
  }
}

/**
 * Invoke a Tauri command. No-op + warning on web.
 */
export async function nativeInvoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isNative()) return null;
  const tauri = (globalThis as { __TAURI__?: { core?: { invoke: <R>(cmd: string, args?: Record<string, unknown>) => Promise<R> } } }).__TAURI__;
  if (!tauri?.core) return null;
  return tauri.core.invoke<T>(cmd, args);
}

/**
 * Reveal a file in Finder (macOS) / Explorer (Windows) / file manager (Linux).
 *
 * Uses the Tauri shell plugin's `open()` which is platform-aware. On web
 * this opens the path as a `file://` URL in a new tab (rarely useful but
 * harmless).
 */
export async function revealInFileManager(path: string): Promise<void> {
  if (!isNative()) {
    window.open(`file://${path}`, '_blank', 'noopener');
    return;
  }
  const tauri = (globalThis as {
    __TAURI__?: { shell?: { open: (path: string) => Promise<void> } };
  }).__TAURI__;
  if (!tauri?.shell) return;
  await tauri.shell.open(path);
}
