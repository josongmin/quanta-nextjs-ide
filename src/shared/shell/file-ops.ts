import { getShell } from '.';

/**
 * High-level file save helper used by editors.
 *
 * Web shell: throws — callers should disable Save UI when shell.kind === 'web'.
 * Tauri shell: writes through the global `__TAURI__.fs.writeTextFile`.
 */
export async function saveTextFile(path: string, content: string): Promise<void> {
  const shell = getShell();
  if (shell.kind === 'web') {
    throw new Error('saveTextFile: requires Tauri build');
  }
  const tauri = (globalThis as unknown as {
    __TAURI__?: { fs?: { writeTextFile: (p: string, c: string) => Promise<void> } };
  }).__TAURI__;
  if (!tauri?.fs) throw new Error('Tauri fs plugin unavailable');
  await tauri.fs.writeTextFile(path, content);
}
