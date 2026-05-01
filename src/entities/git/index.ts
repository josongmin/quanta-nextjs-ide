import { getShell } from '@shared/shell';

export interface GitFileStatus {
  /** Index status (XY format from `git status --porcelain`). */
  status: string;
  path: string;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: ReadonlyArray<GitFileStatus>;
  available: boolean;
  reason?: string;
}

export interface GitDiffResult {
  available: boolean;
  diff: string;
  reason?: string;
}

export async function getGitStatus(cwd?: string): Promise<GitStatus> {
  const shell = getShell();
  if (shell.kind === 'web') {
    return mockStatus('Web shell — git unavailable. Run in Tauri build to inspect the open project.');
  }
  const branchOut = await shell.run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  if (!branchOut.ok) {
    return mockStatus(branchOut.stderr || 'git rev-parse failed');
  }
  const branch = branchOut.stdout.trim();
  const statusOut = await shell.run('git', ['status', '--porcelain'], { cwd });
  if (!statusOut.ok) {
    return mockStatus(statusOut.stderr || 'git status failed');
  }
  const files = statusOut.stdout
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => ({
      status: line.slice(0, 2),
      path: line.slice(3),
    }));
  let ahead = 0;
  let behind = 0;
  const trackOut = await shell.run('git', ['rev-list', '--left-right', '--count', '@{u}...HEAD'], { cwd });
  if (trackOut.ok) {
    const [b, a] = trackOut.stdout.trim().split(/\s+/).map((n) => Number(n) || 0);
    behind = b ?? 0;
    ahead = a ?? 0;
  }
  return { branch, ahead, behind, files, available: true };
}

export async function getGitDiff(path?: string, cwd?: string): Promise<GitDiffResult> {
  const shell = getShell();
  if (shell.kind === 'web') {
    return { available: false, diff: '', reason: 'Web shell — git diff unavailable' };
  }
  const args = ['diff', '--no-color'];
  if (path) args.push('--', path);
  const out = await shell.run('git', args, { cwd });
  if (!out.ok) return { available: false, diff: '', reason: out.stderr };
  return { available: true, diff: out.stdout };
}

function mockStatus(reason: string): GitStatus {
  return {
    branch: '(unknown)',
    ahead: 0,
    behind: 0,
    files: [],
    available: false,
    reason,
  };
}
