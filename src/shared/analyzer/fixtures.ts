// Loads the next-app fixture files as raw source strings at build time.
//
// `import.meta.glob('…', { query: '?raw', eager: true })` returns a record
// keyed by module path with values of `{ default: string }`. Vite resolves
// these statically, so the analyzer can run entirely in the browser without
// any filesystem access.
import type { UseCacheInputFile } from './use-cache';

type RawModule = { default: string };

// Path is resolved relative to this file:
//   src/shared/analyzer/fixtures.ts → e2e/fixtures/next-app/app/**
const modules = import.meta.glob<RawModule>(
  '../../../e2e/fixtures/next-app/app/**/*.{ts,tsx}',
  { query: '?raw', eager: true },
);

const PREFIX_RE = /.*\/e2e\/fixtures\/next-app\//;

export function loadFixtureFiles(): UseCacheInputFile[] {
  const out: UseCacheInputFile[] = [];
  for (const [absPath, mod] of Object.entries(modules)) {
    const path = absPath.replace(PREFIX_RE, '');
    out.push({ path, content: mod.default });
  }
  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return out;
}
