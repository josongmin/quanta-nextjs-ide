/**
 * Quanta Shell — runtime-agnostic interface to the host environment.
 *
 * In a browser SPA today: every method returns a "not available" stub.
 * Under Tauri tomorrow: each method goes through `@tauri-apps/api`.
 *
 * Surfaces never branch on `window.__TAURI__`; they call `useShell()` and
 * check `shell.kind === 'web'` for capability gating, or just rely on the
 * stub returning a sensible fallback.
 */

export type ShellKind = 'web' | 'tauri';

export interface ShellCommandResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
}

export interface Shell {
  readonly kind: ShellKind;
  /** Read a UTF-8 file. Web: rejects. */
  readTextFile(path: string): Promise<string>;
  /** List directory entries. Web: rejects. */
  readDir(path: string): Promise<ReadonlyArray<FileEntry>>;
  /** Run a shell command, capture stdout/stderr. Web: stub failure. */
  run(command: string, args: ReadonlyArray<string>, opts?: { cwd?: string }): Promise<ShellCommandResult>;
  /** Pick a directory via OS dialog. Web: rejects. */
  pickDirectory(): Promise<string | null>;
}
