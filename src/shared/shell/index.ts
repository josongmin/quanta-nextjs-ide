import { TauriShell } from './tauri-shell';
import { WebShell } from './web-shell';
import type { Shell } from './types';

export type { FileEntry, Shell, ShellCommandResult, ShellKind } from './types';

let cached: Shell | null = null;

/**
 * Returns the host-appropriate Shell.
 *
 * Detection: Tauri injects `__TAURI_INTERNALS__` on `window`; without it we
 * fall back to the web stub. Cached after first call.
 */
export function getShell(): Shell {
  if (cached) return cached;
  const w = typeof window !== 'undefined' ? window : undefined;
  const isTauri = !!(w as unknown as { __TAURI_INTERNALS__?: unknown })?.__TAURI_INTERNALS__;
  cached = isTauri ? new TauriShell() : new WebShell();
  return cached;
}

export function resetShellForTests(): void {
  cached = null;
}
