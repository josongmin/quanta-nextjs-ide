/**
 * Helpers that bridge `@shared/workspace` (Tauri-backed) to the analyzer
 * input shapes. Each loader returns workspace-relative POSIX paths so the
 * analyzers don't have to know about absolute paths.
 *
 * In demo mode (workspaceRoot === '__demo__'), we delegate to the existing
 * `import.meta.glob` fixture loader. Storybook + Vitest get the same
 * fixture data they had before.
 */

import { workspace, DEMO_WORKSPACE_ROOT } from '@shared/workspace';
import { loadFixtureFiles } from './fixtures';
import type { UseCacheInputFile } from './use-cache';
import type { DirectiveInputFile } from './use-client-lite';

export const DEFAULT_GLOBS = [
  'app/**/*.{ts,tsx,js,jsx}',
  'src/app/**/*.{ts,tsx,js,jsx}',
];

/** Load all files under `app/` (App Router) as `{ path, content }`. */
export async function loadAppFiles(
  workspaceRoot: string,
): Promise<UseCacheInputFile[]> {
  if (workspaceRoot === DEMO_WORKSPACE_ROOT) return loadFixtureFiles();

  const seen = new Set<string>();
  const out: UseCacheInputFile[] = [];
  for (const pattern of DEFAULT_GLOBS) {
    const paths = await workspace.listFiles(pattern);
    for (const p of paths) {
      if (seen.has(p)) continue;
      seen.add(p);
      try {
        const content = await workspace.readFile(p);
        out.push({ path: p, content });
      } catch {
        // skip unreadable
      }
    }
  }
  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return out;
}

/** Convert a `UseCacheInputFile[]` into the directive analyzer's shape. */
export function toDirectiveInputs(
  files: ReadonlyArray<UseCacheInputFile>,
): DirectiveInputFile[] {
  return files.map((f) => ({ file: f.path, source: f.content }));
}
