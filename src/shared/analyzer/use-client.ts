/**
 * Static analyzer: detects `'use client'` and `'use server'` directives.
 *
 * Walks the fixture next-app sources captured by `import.meta.glob` (no Node
 * fs) and reports each directive site. This is the AST half of Phase 12 —
 * paired with the Probe runtime data in `entities/code-graph` to produce
 * ground-truth client/server boundaries.
 */

import { Project, ScriptKind } from 'ts-morph';

export type DirectiveKind = 'use-client' | 'use-server';

export interface DirectiveFinding {
  /** Absolute-ish path inside the fixture (e.g. `app/island/Counter.tsx`). */
  file: string;
  /** Which directive. */
  kind: DirectiveKind;
  /** 1-based line number. */
  line: number;
  /** Names of exports declared in this file (best-effort). */
  exportNames: ReadonlyArray<string>;
  /** Files that import from this file (best-effort, scoped to the corpus). */
  importedBy: ReadonlyArray<string>;
}

export interface DirectiveInputFile {
  file: string;
  source: string;
}

export interface DirectiveReport {
  findings: ReadonlyArray<DirectiveFinding>;
  /** Total .ts/.tsx files scanned. */
  scanned: number;
}

const FIRST_STATEMENT_DIRECTIVES = new Set(["'use client'", '"use client"', "'use server'", '"use server"']);

function getFileDirective(source: string): DirectiveKind | null {
  // Trim leading whitespace and comments, look at the first non-trivial token.
  const lines = source.split('\n');
  for (const raw of lines) {
    const t = raw.trim();
    if (t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
    if (!t.endsWith(';') && !FIRST_STATEMENT_DIRECTIVES.has(t)) {
      // Some authors omit ;
    }
    if (t === "'use client'" || t === '"use client"' || t === "'use client';" || t === '"use client";') {
      return 'use-client';
    }
    if (t === "'use server'" || t === '"use server"' || t === "'use server';" || t === '"use server";') {
      return 'use-server';
    }
    return null;
  }
  return null;
}

export function analyzeUseClientServer(files: ReadonlyArray<DirectiveInputFile>): DirectiveReport {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true, jsx: 4 /* Preserve */ },
  });

  // Track imports across the corpus so we can resolve `importedBy`.
  // Map<targetFilePath, Set<importerFilePath>>.
  const incoming = new Map<string, Set<string>>();
  const sourceMap = new Map<string, string>();

  for (const f of files) {
    sourceMap.set(f.file, f.source);
  }

  // First pass: build import graph using ts-morph for each file.
  for (const f of files) {
    const ext = f.file.endsWith('.tsx') ? '.tsx' : f.file.endsWith('.jsx') ? '.jsx' : '.ts';
    const sf = project.createSourceFile(`/${f.file}`, f.source, {
      overwrite: true,
      scriptKind: ext === '.tsx' || ext === '.jsx' ? ScriptKind.TSX : ScriptKind.TS,
    });
    for (const imp of sf.getImportDeclarations()) {
      const spec = imp.getModuleSpecifierValue();
      const target = resolveImport(f.file, spec, files);
      if (!target) continue;
      const set = incoming.get(target) ?? new Set();
      set.add(f.file);
      incoming.set(target, set);
    }
  }

  // Second pass: directive + exports.
  const findings: DirectiveFinding[] = [];
  for (const f of files) {
    const directive = getFileDirective(f.source);
    if (!directive) continue;
    const sf = project.getSourceFile(`/${f.file}`);
    const exportNames = sf
      ? Array.from(sf.getExportedDeclarations().keys())
      : [];
    findings.push({
      file: f.file,
      kind: directive,
      line: 1,
      exportNames,
      importedBy: Array.from(incoming.get(f.file) ?? []).sort(),
    });
  }

  return { findings, scanned: files.length };
}

/**
 * Resolve a relative or alias import to a fixture-relative path.
 * Best-effort: handles `./Foo`, `../Foo`, with .ts/.tsx/.jsx/.js extensions.
 */
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
