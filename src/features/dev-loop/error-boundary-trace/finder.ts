/**
 * Walks up the route tree finding the nearest error.tsx / not-found.tsx /
 * global-error.tsx for a given route file.
 *
 * `routePath` is the page/layout file path (e.g. "app/products/[id]/page.tsx")
 * and `allFiles` is the set of file paths in the app/ directory.
 */

import type { BoundaryChain } from './types';

const ERROR_FILES = ['error.tsx', 'error.jsx', 'error.ts', 'error.js'];
const NOT_FOUND_FILES = [
  'not-found.tsx',
  'not-found.jsx',
  'not-found.ts',
  'not-found.js',
];
const GLOBAL_ERROR_FILES = [
  'global-error.tsx',
  'global-error.jsx',
  'global-error.ts',
  'global-error.js',
];
const LAYOUT_FILES = ['layout.tsx', 'layout.jsx', 'layout.ts', 'layout.js'];

function dirOf(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? '' : path.slice(0, idx);
}

/** Generate ancestor dirs from the route's dir up to (and including) "app". */
function ancestors(routePath: string): string[] {
  const start = dirOf(routePath);
  const out: string[] = [];
  let cur = start;
  while (cur && cur !== 'app' && cur !== '') {
    out.push(cur);
    cur = dirOf(cur);
  }
  if (cur === 'app') out.push('app');
  return out;
}

function findInDir(
  dir: string,
  candidates: ReadonlyArray<string>,
  files: ReadonlySet<string>,
): string | null {
  for (const f of candidates) {
    const full = dir ? `${dir}/${f}` : f;
    if (files.has(full)) return full;
  }
  return null;
}

export function findBoundaries(
  routePath: string,
  allFiles: ReadonlyArray<string>,
): BoundaryChain {
  const set = new Set(allFiles);
  const dirs = ancestors(routePath); // closest first
  const segments = dirs.slice().reverse(); // outer first for render order

  let error: string | null = null;
  let notFound: string | null = null;

  for (const dir of dirs) {
    if (!error) error = findInDir(dir, ERROR_FILES, set);
    if (!notFound) notFound = findInDir(dir, NOT_FOUND_FILES, set);
    if (error && notFound) break;
  }

  const globalError =
    findInDir('app', GLOBAL_ERROR_FILES, set) ??
    findInDir('', GLOBAL_ERROR_FILES, set);

  const layoutsBetween: string[] = [];
  for (const dir of segments) {
    const layout = findInDir(dir, LAYOUT_FILES, set);
    if (layout) layoutsBetween.push(layout);
  }

  return {
    route: routePath,
    segments,
    layoutsBetween,
    error,
    notFound,
    globalError,
  };
}
