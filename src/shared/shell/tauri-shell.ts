import type { FileEntry, Shell, ShellCommandResult } from './types';

/**
 * Tauri shell — resolves Tauri plugins via the global `window.__TAURI__`
 * object that the runtime injects when the desktop binary loads. We never
 * `import('@tauri-apps/...')` because Vite would try to resolve those at
 * dev time even with @vite-ignore, breaking the web build.
 *
 * In a Tauri shell the plugins ARE on the window. In a web shell this class
 * is never instantiated (see getShell()), so the runtime path is fine.
 */
type GlobalTauri = {
  fs?: {
    readTextFile: (p: string) => Promise<string>;
    readDir: (p: string) => Promise<Array<{ name?: string; isDirectory?: boolean }>>;
    writeTextFile: (p: string, c: string) => Promise<void>;
  };
  shell?: {
    Command: new (
      cmd: string,
      args: string[],
      options?: { cwd?: string },
    ) => { execute(): Promise<{ code: number | null; stdout: string; stderr: string }> };
  };
  dialog?: {
    open: (opts: { directory: boolean }) => Promise<string | null>;
  };
};

function getTauri(): GlobalTauri | null {
  const g = (globalThis as unknown as { __TAURI__?: GlobalTauri }).__TAURI__;
  return g ?? null;
}

export class TauriShell implements Shell {
  readonly kind = 'tauri' as const;

  async readTextFile(path: string): Promise<string> {
    const t = getTauri();
    if (!t?.fs) throw new Error('Tauri fs plugin unavailable');
    return t.fs.readTextFile(path);
  }

  async readDir(path: string): Promise<ReadonlyArray<FileEntry>> {
    const t = getTauri();
    if (!t?.fs) throw new Error('Tauri fs plugin unavailable');
    const entries = await t.fs.readDir(path);
    return entries.map((e) => ({
      path: `${path}/${e.name ?? ''}`,
      name: e.name ?? '',
      isDirectory: !!e.isDirectory,
    }));
  }

  async run(
    command: string,
    args: ReadonlyArray<string>,
    opts?: { cwd?: string },
  ): Promise<ShellCommandResult> {
    const t = getTauri();
    if (!t?.shell) {
      return {
        ok: false,
        exitCode: -1,
        stdout: '',
        stderr: 'Tauri shell plugin unavailable',
      };
    }
    const out = await new t.shell.Command(command, [...args], opts).execute();
    return {
      ok: (out.code ?? -1) === 0,
      exitCode: out.code ?? -1,
      stdout: out.stdout,
      stderr: out.stderr,
    };
  }

  async pickDirectory(): Promise<string | null> {
    const t = getTauri();
    if (!t?.dialog) return null;
    return t.dialog.open({ directory: true });
  }
}
