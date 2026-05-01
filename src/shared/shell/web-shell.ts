import type { FileEntry, Shell, ShellCommandResult } from './types';

const WEB_NA: ShellCommandResult = {
  ok: false,
  exitCode: -1,
  stdout: '',
  stderr: 'Shell unavailable in browser. Open in Tauri build.',
};

export class WebShell implements Shell {
  readonly kind = 'web' as const;

  async readTextFile(_path: string): Promise<string> {
    throw new Error('readTextFile: not available in web shell');
  }

  async readDir(_path: string): Promise<ReadonlyArray<FileEntry>> {
    throw new Error('readDir: not available in web shell');
  }

  async run(): Promise<ShellCommandResult> {
    return WEB_NA;
  }

  async pickDirectory(): Promise<string | null> {
    return null;
  }
}
