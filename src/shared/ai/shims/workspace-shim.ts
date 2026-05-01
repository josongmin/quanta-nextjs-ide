/**
 * Workspace IO shim.
 *
 * The Tauri workspace plugin is owned by another phase; we don't modify it.
 * Until that surface is available, we read through `@tauri-apps/plugin-fs`
 * if Tauri is detected at runtime, and otherwise fall back to the
 * fixture corpus snapshotted by `import.meta.glob` (used by analyzers).
 */

// Snapshot of the e2e fixture next-app — same source the analyzers consume.
// This guarantees the agent can answer questions in browser dev mode.
const FIXTURE_FILES = import.meta.glob<string>(
  '../../../../e2e/fixtures/next-app/**/*.{ts,tsx,js,jsx,json,md,css}',
  { query: '?raw', import: 'default', eager: true },
);

const FIXTURE_PREFIX = '../../../../e2e/fixtures/next-app/';

function fixturePath(globKey: string): string {
  return globKey.startsWith(FIXTURE_PREFIX) ? globKey.slice(FIXTURE_PREFIX.length) : globKey;
}

interface FixtureEntry {
  path: string;
  source: string;
}

function listFixture(): FixtureEntry[] {
  const out: FixtureEntry[] = [];
  for (const [k, v] of Object.entries(FIXTURE_FILES)) {
    out.push({ path: fixturePath(k), source: v });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Workspace root resolved at runtime. Tauri sessions set this once a folder is opened. */
let workspaceRoot: string | null = null;
export function setWorkspaceRoot(root: string | null): void {
  workspaceRoot = root;
}
export function getWorkspaceRoot(): string | null {
  return workspaceRoot;
}

/** Read a single file by workspace-relative path. */
export async function readWorkspaceFile(path: string): Promise<string> {
  if (isTauri() && workspaceRoot) {
    try {
      const fs = await import('@tauri-apps/plugin-fs');
      const abs = `${workspaceRoot.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
      return await fs.readTextFile(abs);
    } catch (err) {
      throw new Error(`Failed to read ${path}: ${(err as Error).message}`);
    }
  }
  // Browser/dev fallback: serve from fixture corpus
  const entry = listFixture().find((e) => e.path === path);
  if (!entry) throw new Error(`File not found: ${path}`);
  return entry.source;
}

/** Write a file (only used after admission gate ADMITS a patch). */
export async function writeWorkspaceFile(path: string, content: string): Promise<void> {
  if (isTauri() && workspaceRoot) {
    const fs = await import('@tauri-apps/plugin-fs');
    const abs = `${workspaceRoot.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    await fs.writeTextFile(abs, content);
    return;
  }
  // In browser dev mode, simulate a write by stashing on globalThis. This is
  // only ever exercised by tests/storybook; production runs through Tauri.
  const w = globalThis as unknown as { __quantaSimWrites?: Record<string, string> };
  w.__quantaSimWrites = w.__quantaSimWrites ?? {};
  w.__quantaSimWrites[path] = content;
}

export async function listWorkspaceFiles(globPattern?: string): Promise<string[]> {
  const entries = listFixture().map((e) => e.path);
  if (!globPattern) return entries;
  const re = globToRegex(globPattern);
  return entries.filter((p) => re.test(p));
}

/** Very small glob → RegExp converter (supports **, *, ?). */
function globToRegex(glob: string): RegExp {
  let re = '^';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '.' || c === '/' || c === '+' || c === '(' || c === ')' || c === '|' || c === '^' || c === '$' || c === '{' || c === '}' || c === '[' || c === ']' || c === '\\') {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  re += '$';
  return new RegExp(re);
}

/** Naive ripgrep-like search across the corpus (or Tauri workspace if present). */
export async function grepWorkspace(pattern: string, pathFilter?: string): Promise<Array<{ file: string; line: number; text: string }>> {
  const out: Array<{ file: string; line: number; text: string }> = [];
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'm');
  } catch {
    re = new RegExp(escapeRegex(pattern), 'm');
  }
  const fileFilter = pathFilter ? globToRegex(pathFilter) : null;
  // For Tauri workspaces this would walk the disk; for now we use the fixture corpus.
  for (const entry of listFixture()) {
    if (fileFilter && !fileFilter.test(entry.path)) continue;
    const lines = entry.source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      if (text === undefined) continue;
      if (re.test(text)) {
        out.push({ file: entry.path, line: i + 1, text: text.trimEnd() });
        if (out.length >= 200) return out;
      }
    }
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
