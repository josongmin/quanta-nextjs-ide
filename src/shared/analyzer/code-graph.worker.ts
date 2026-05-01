/// <reference lib="webworker" />
import { Project, ScriptKind } from 'ts-morph';
import type { DirectiveInputFile } from './use-client-lite';

/**
 * Worker-side full AST analyzer.
 *
 * Runs ts-morph off the main thread so the IDE bundle never includes
 * 4MB of TypeScript compiler. Mirrors the lite analyzer's findings but
 * adds: precise export resolution, symbol references, and a real import
 * graph (vs the lite regex version).
 */

export interface CodeGraphAnalyzeRequest {
  type: 'analyze';
  id: number;
  files: ReadonlyArray<DirectiveInputFile>;
}

export interface CodeGraphFinding {
  file: string;
  kind: 'use-client' | 'use-server';
  exportNames: ReadonlyArray<string>;
  importedBy: ReadonlyArray<string>;
  imports: ReadonlyArray<string>;
}

export interface CodeGraphReport {
  findings: ReadonlyArray<CodeGraphFinding>;
  importGraph: Record<string, ReadonlyArray<string>>;
  scanned: number;
}

export type WorkerOutbound =
  | { type: 'result'; id: number; report: CodeGraphReport }
  | { type: 'error'; id: number; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', (event: MessageEvent<CodeGraphAnalyzeRequest>) => {
  const data = event.data;
  if (!data || data.type !== 'analyze') return;
  try {
    const report = analyze(data.files);
    const msg: WorkerOutbound = { type: 'result', id: data.id, report };
    ctx.postMessage(msg);
  } catch (e) {
    ctx.postMessage({
      type: 'error',
      id: data.id,
      message: (e as Error).message,
    } satisfies WorkerOutbound);
  }
});

function detectDirective(source: string): 'use-client' | 'use-server' | null {
  for (const raw of source.split(/\r?\n/)) {
    const t = raw.trim();
    if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
    const m = t.match(/^["']use\s+(client|server)["']\s*;?$/);
    if (!m) return null;
    return m[1] === 'client' ? 'use-client' : 'use-server';
  }
  return null;
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

function analyze(files: ReadonlyArray<DirectiveInputFile>): CodeGraphReport {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true, jsx: 4 /* Preserve */ },
  });

  const incoming = new Map<string, Set<string>>();
  const imports = new Map<string, Set<string>>();

  for (const f of files) {
    const ext = f.file.endsWith('.tsx') || f.file.endsWith('.jsx') ? ScriptKind.TSX : ScriptKind.TS;
    const sf = project.createSourceFile(`/${f.file}`, f.source, {
      overwrite: true,
      scriptKind: ext,
    });
    const myImports = new Set<string>();
    for (const imp of sf.getImportDeclarations()) {
      const spec = imp.getModuleSpecifierValue();
      const target = resolveImport(f.file, spec, files);
      if (!target) continue;
      myImports.add(target);
      const into = incoming.get(target) ?? new Set();
      into.add(f.file);
      incoming.set(target, into);
    }
    imports.set(f.file, myImports);
  }

  const findings: CodeGraphFinding[] = [];
  for (const f of files) {
    const directive = detectDirective(f.source);
    if (!directive) continue;
    const sf = project.getSourceFile(`/${f.file}`);
    const exportNames = sf
      ? Array.from(sf.getExportedDeclarations().keys())
      : [];
    findings.push({
      file: f.file,
      kind: directive,
      exportNames,
      importedBy: Array.from(incoming.get(f.file) ?? []).sort(),
      imports: Array.from(imports.get(f.file) ?? []).sort(),
    });
  }

  const importGraph: Record<string, ReadonlyArray<string>> = {};
  for (const [k, v] of imports) importGraph[k] = Array.from(v).sort();

  return { findings, importGraph, scanned: files.length };
}
