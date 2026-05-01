/**
 * Public API for the Phase-5 taint solver.
 *
 * `analyzeTaint(workspaceRoot)` is the headline export. It tries, in order:
 *   1. fast-glob if available (Node-side / Tauri host)
 *   2. import.meta.glob fallback (Vite browser bundle), if defined
 *   3. an empty file list (still returns a valid SolverResult)
 *
 * Phase 1 may later own a richer file-list provider; this module accepts an
 * optional override so callers can plug it in without touching the solver.
 */

import { solveTaint, type SolverResult } from './solver';
import type { DirectiveInputFile } from './adapters';

export type { TaintSource, TaintSink, TaintPath, TaintEdge, TaintConfidence } from './types';
export type { SolverResult } from './solver';
export { solveTaint } from './solver';

export interface AnalyzeTaintOptions {
  /** Override the built-in file resolver. */
  resolveFiles?: (root: string) => Promise<DirectiveInputFile[]>;
}

async function defaultResolveFiles(root: string): Promise<DirectiveInputFile[]> {
  // Try fast-glob (Node host) first.
  try {
    const fg = (await import('fast-glob')).default as unknown as (
      pattern: string | string[],
      options: Record<string, unknown>,
    ) => Promise<string[]>;
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const matches = await fg(['**/*.{ts,tsx}', '!**/node_modules/**', '!**/.next/**', '!**/dist/**'], {
      cwd: root,
      dot: false,
      onlyFiles: true,
    });
    const out: DirectiveInputFile[] = [];
    for (const m of matches) {
      const abs = path.join(root, m);
      try {
        const source = await fs.readFile(abs, 'utf8');
        out.push({ file: m, source });
      } catch {
        // ignore unreadable
      }
    }
    return out;
  } catch {
    // fall through
  }

  // Vite-time fallback: callers in the browser bundle should pass `resolveFiles`.
  return [];
}

export async function analyzeTaint(
  workspaceRoot: string,
  options: AnalyzeTaintOptions = {},
): Promise<SolverResult> {
  const resolver = options.resolveFiles ?? defaultResolveFiles;
  const files = await resolver(workspaceRoot);
  return solveTaint({ files });
}
