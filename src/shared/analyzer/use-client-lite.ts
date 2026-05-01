/**
 * Lightweight regex-based 'use client' / 'use server' detector.
 *
 * No ts-morph dependency — runs synchronously on the main thread. Trades
 * full AST accuracy for zero bundle weight; good enough for the *directive*
 * itself (which is always the file's first non-trivial statement) and
 * import basenames.
 *
 * For deep analysis (export resolution, symbol references, type info)
 * use `use-client.ts` (worker-backed, planned).
 */

export type DirectiveKind = 'use-client' | 'use-server';

export interface DirectiveFinding {
  file: string;
  kind: DirectiveKind;
  line: number;
  /** Default + named exports detected by regex (best-effort). */
  exportNames: ReadonlyArray<string>;
  /** Files that import (relatively) from this file. */
  importedBy: ReadonlyArray<string>;
}

export interface DirectiveInputFile {
  file: string;
  source: string;
}

export interface DirectiveReport {
  findings: ReadonlyArray<DirectiveFinding>;
  scanned: number;
}

const DIRECTIVE_RE =
  /^\s*(?:["']use\s+(client|server)["']\s*;?)\s*$/m;

const EXPORT_RE = /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_DEFAULT_NAMED_RE = /\bexport\s+\{\s*([A-Za-z_$][\w$]*)/g;
const IMPORT_RE = /import\s+[^'"]*from\s+["']([^"']+)["']/g;

export function detectDirective(source: string): DirectiveKind | null {
  // Skip leading comments and blank lines, then check the first statement.
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]!.trim();
    if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
    const m = t.match(/^["']use\s+(client|server)["']\s*;?$/);
    if (!m) return null;
    return m[1] === 'client' ? 'use-client' : 'use-server';
  }
  return null;
}

export function detectExports(source: string): string[] {
  const names = new Set<string>();
  for (const m of source.matchAll(EXPORT_RE)) {
    if (m[1]) names.add(m[1]);
  }
  for (const m of source.matchAll(EXPORT_DEFAULT_NAMED_RE)) {
    if (m[1]) names.add(m[1]);
  }
  if (/\bexport\s+default\s+function\s*\(/.test(source)) names.add('default');
  if (/\bexport\s+default\s+/.test(source) && !names.has('default')) names.add('default');
  return Array.from(names);
}

export function analyzeDirectives(
  files: ReadonlyArray<DirectiveInputFile>,
): DirectiveReport {
  const incoming = new Map<string, Set<string>>();
  // Build an import graph first.
  for (const f of files) {
    for (const m of f.source.matchAll(IMPORT_RE)) {
      const target = resolveImport(f.file, m[1] ?? '', files);
      if (!target) continue;
      const set = incoming.get(target) ?? new Set();
      set.add(f.file);
      incoming.set(target, set);
    }
  }

  const findings: DirectiveFinding[] = [];
  for (const f of files) {
    const m = f.source.match(DIRECTIVE_RE);
    if (!m) continue;
    const kind: DirectiveKind = m[1] === 'client' ? 'use-client' : 'use-server';
    findings.push({
      file: f.file,
      kind,
      line: lineOf(f.source, m.index ?? 0),
      exportNames: detectExports(f.source),
      importedBy: Array.from(incoming.get(f.file) ?? []).sort(),
    });
  }
  return { findings, scanned: files.length };
}

function lineOf(source: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function resolveImport(
  fromFile: string,
  spec: string,
  files: ReadonlyArray<DirectiveInputFile>,
): string | null {
  if (!spec.startsWith('.')) return null;
  const fromDir = fromFile.split('/').slice(0, -1).join('/');
  const parts = (fromDir + '/' + spec).split('/');
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  const base = stack.join('/');
  for (const ext of ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
    const candidate = base + ext;
    if (files.some((f) => f.file === candidate)) return candidate;
  }
  return null;
}
