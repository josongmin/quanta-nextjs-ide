// Real static analyzer for TypeScript strict-mode violations.
//
// Powered by ts-morph (TypeScript Compiler API wrapper). For each input file
// the analyzer reports loose-typing patterns that strict mode would catch
// in spirit but that the compiler may still accept without error:
//
//   • `any` annotations (parameters, returns, variables, type assertions)
//   • `as` type assertions (excluding `as const`)
//   • `@ts-ignore` / `@ts-expect-error` comment directives
//   • Missing return types on exported functions
//   • Loose nominal types `Function` / `object`
//   • Non-null assertions (`x!`)
//
// The analyzer is a pure function: pass `{ path, content }` records and
// receive back a `TsStrictReport`. No filesystem access, so it runs in the
// browser (with ts-morph's in-memory project) just as well as in Node.
import {
  Project,
  Node,
  ScriptKind,
  SyntaxKind,
  type SourceFile,
  type FunctionDeclaration,
  type FunctionExpression,
  type ArrowFunction,
  type MethodDeclaration,
} from 'ts-morph';

// ── Public types ───────────────────────────────────────────────────────────

export type TsStrictKind =
  | 'any-usage'
  | 'as-assertion'
  | 'ignore-comment'
  | 'missing-return-type'
  | 'loose-type'
  | 'non-null-assertion';

export type TsStrictSeverity = 'warn' | 'hint';

export interface TsStrictFinding {
  /** Workspace-relative file path, e.g. `app/mixed/page.tsx`. */
  file: string;
  /** 1-based line in the source file. */
  line: number;
  /** Category of strict-mode violation. */
  kind: TsStrictKind;
  /** Suggested severity (most are `warn`; missing-return-type is `hint`). */
  severity: TsStrictSeverity;
  /** Short verbatim source snippet covering the offending span. */
  snippet: string;
  /** Human-readable explanation, ≤ 1 sentence. */
  reason: string;
}

export interface TsStrictInputFile {
  /** A stable, workspace-relative path. */
  path: string;
  /** UTF-8 source text. */
  content: string;
}

export interface TsStrictReport {
  findings: TsStrictFinding[];
  /** Number of files actually parsed (excludes unsupported extensions). */
  filesScanned: number;
  /** Wall-clock cost of the scan, in ms. */
  durationMs: number;
}

// ── Internals ──────────────────────────────────────────────────────────────

type FunctionLike =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunction
  | MethodDeclaration;

const KIND_RANK: Record<TsStrictKind, number> = {
  'ignore-comment': 0,
  'any-usage': 1,
  'as-assertion': 2,
  'loose-type': 3,
  'non-null-assertion': 4,
  'missing-return-type': 5,
};

function isFunctionLike(node: Node): node is FunctionLike {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node) ||
    Node.isMethodDeclaration(node)
  );
}

function snippetOf(node: Node): string {
  const text = node.getText().replace(/\s+/g, ' ').trim();
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

function lineOf(sf: SourceFile, pos: number): number {
  return sf.getLineAndColumnAtPos(pos).line;
}

/** True when this declaration (or a containing statement) is exported. */
function isExportedFunctionLike(fn: FunctionLike): boolean {
  if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) {
    if (fn.getModifiers().some((m) => m.getKind() === SyntaxKind.ExportKeyword)) {
      return true;
    }
    if (fn.getModifiers().some((m) => m.getKind() === SyntaxKind.DefaultKeyword)) {
      return true;
    }
  }
  // Variable declaration `export const foo = () => …`
  let cur: Node | undefined = fn.getParent();
  while (cur) {
    if (Node.isVariableStatement(cur)) {
      return cur.hasExportKeyword();
    }
    if (Node.isExportAssignment(cur) || Node.isExportDeclaration(cur)) {
      return true;
    }
    cur = cur.getParent();
  }
  return false;
}

/** Returns true if a function-like node has an explicit return-type annotation. */
function hasReturnTypeAnnotation(fn: FunctionLike): boolean {
  const tn = fn.getReturnTypeNode();
  return tn !== undefined;
}

function fnDisplayName(fn: FunctionLike): string {
  if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) {
    return fn.getName() ?? '<anonymous>';
  }
  const parent = fn.getParent();
  if (Node.isVariableDeclaration(parent)) return parent.getName();
  if (Node.isPropertyAssignment(parent)) return parent.getName();
  return '<anonymous>';
}

/**
 * Walk every comment in the file looking for `@ts-ignore` / `@ts-expect-error`
 * directives. ts-morph exposes the underlying TS scanner via
 * `forEachComment`-style iteration through the source-file token tree.
 */
function collectIgnoreComments(sf: SourceFile, push: (f: TsStrictFinding) => void, file: string): void {
  const fullText = sf.getFullText();
  // Iterate every node that may carry leading/trailing comments.
  sf.forEachDescendant((node) => {
    const ranges = node.getLeadingCommentRanges();
    for (const r of ranges) {
      const text = fullText.slice(r.getPos(), r.getEnd());
      if (/@ts-(ignore|expect-error)\b/.test(text)) {
        const line = lineOf(sf, r.getPos());
        const trimmed = text.replace(/\s+/g, ' ').trim();
        push({
          file,
          line,
          kind: 'ignore-comment',
          severity: 'warn',
          snippet: trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed,
          reason: '`@ts-ignore` / `@ts-expect-error` silences the type checker',
        });
      }
    }
  });
}

// ── Entry point ────────────────────────────────────────────────────────────

export function analyzeTsStrict(files: ReadonlyArray<TsStrictInputFile>): TsStrictReport {
  const t0 =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    compilerOptions: {
      allowJs: true,
      jsx: 4 /* ts.JsxEmit.ReactJSX */,
      target: 99 /* ts.ScriptTarget.ESNext */,
      module: 99 /* ts.ModuleKind.ESNext */,
      moduleResolution: 100 /* ts.ModuleResolutionKind.Bundler */,
      noEmit: true,
      isolatedModules: true,
    },
  });

  const findings: TsStrictFinding[] = [];
  let filesScanned = 0;

  for (const f of files) {
    const lower = f.path.toLowerCase();
    if (!lower.endsWith('.ts') && !lower.endsWith('.tsx')) continue;
    const scriptKind = lower.endsWith('.tsx') ? ScriptKind.TSX : ScriptKind.TS;
    const sf = project.createSourceFile(f.path, f.content, {
      overwrite: true,
      scriptKind,
    });
    filesScanned += 1;

    // Capture locations we already reported `any-usage` at to avoid double
    // reporting (e.g. an `any` keyword inside a parameter type).
    const reportedAnyAt = new Set<number>();

    sf.forEachDescendant((node) => {
      // ── `any` keyword ────────────────────────────────────────────────
      if (node.getKind() === SyntaxKind.AnyKeyword) {
        // The `any` keyword node itself; locate the enclosing TypeNode for
        // a friendlier snippet.
        const owner = node.getParent() ?? node;
        const pos = owner.getStart();
        if (!reportedAnyAt.has(pos)) {
          reportedAnyAt.add(pos);
          findings.push({
            file: f.path,
            line: lineOf(sf, pos),
            kind: 'any-usage',
            severity: 'warn',
            snippet: snippetOf(owner),
            reason: '`any` disables type checking for this position',
          });
        }
        return;
      }

      // ── `as` assertions (excluding `as const`) ──────────────────────
      if (Node.isAsExpression(node)) {
        const tn = node.getTypeNode();
        // `as const` is fine, skip it.
        if (tn && tn.getText() === 'const') return;
        findings.push({
          file: f.path,
          line: lineOf(sf, node.getStart()),
          kind: 'as-assertion',
          severity: 'warn',
          snippet: snippetOf(node),
          reason: '`as` assertion bypasses structural type checking',
        });
        return;
      }

      // Old-style `<Type>expr` cast.
      if (Node.isTypeAssertion(node)) {
        findings.push({
          file: f.path,
          line: lineOf(sf, node.getStart()),
          kind: 'as-assertion',
          severity: 'warn',
          snippet: snippetOf(node),
          reason: 'angle-bracket type assertion bypasses structural type checking',
        });
        return;
      }

      // ── Non-null assertion `expr!` ─────────────────────────────────
      if (Node.isNonNullExpression(node)) {
        findings.push({
          file: f.path,
          line: lineOf(sf, node.getStart()),
          kind: 'non-null-assertion',
          severity: 'warn',
          snippet: snippetOf(node),
          reason: 'non-null assertion (`!`) hides potential `null`/`undefined`',
        });
        return;
      }

      // ── Loose nominal types: `Function` / `object` ─────────────────
      if (Node.isTypeReference(node)) {
        const name = node.getTypeName().getText();
        if (name === 'Function' || name === 'object') {
          findings.push({
            file: f.path,
            line: lineOf(sf, node.getStart()),
            kind: 'loose-type',
            severity: 'warn',
            snippet: snippetOf(node),
            reason: `\`${name}\` is too loose — prefer a specific signature or shape`,
          });
        }
        return;
      }
    });

    // ── Missing return types on exported functions ────────────────────
    sf.forEachDescendant((node) => {
      if (!isFunctionLike(node)) return;
      if (!isExportedFunctionLike(node)) return;
      if (hasReturnTypeAnnotation(node)) return;
      const name = fnDisplayName(node);
      // For arrow functions, position to the variable declaration when present.
      const start = node.getStart();
      findings.push({
        file: f.path,
        line: lineOf(sf, start),
        kind: 'missing-return-type',
        severity: 'hint',
        snippet: snippetOf(node).slice(0, 80),
        reason: `exported \`${name}\` has no explicit return type`,
      });
    });

    // ── @ts-ignore / @ts-expect-error comments ────────────────────────
    collectIgnoreComments(sf, (finding) => findings.push(finding), f.path);
  }

  // Stable sort: file ↑, line ↑, kind rank ↑.
  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return KIND_RANK[a.kind] - KIND_RANK[b.kind];
  });

  const t1 =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  return { findings, filesScanned, durationMs: Math.round((t1 - t0) * 100) / 100 };
}

// ── Diagnostic adapter ─────────────────────────────────────────────────────
//
// Convenience helpers to convert findings → the existing `Diagnostic` shape so
// callers can merge them with the mock list without leaking analyzer details.

import type { Diagnostic, RuleId } from '@shared/types';

const KIND_TO_RULE: Record<TsStrictKind, RuleId> = {
  'any-usage': 'ts-any-usage',
  'as-assertion': 'ts-as-assertion',
  'ignore-comment': 'ts-ignore-comment',
  'missing-return-type': 'ts-missing-return-type',
  'loose-type': 'ts-strict-gap',
  'non-null-assertion': 'ts-strict-gap',
};

const KIND_TO_TITLE: Record<TsStrictKind, string> = {
  'any-usage': '`any` disables type checking',
  'as-assertion': '`as` type assertion',
  'ignore-comment': '`@ts-ignore` / `@ts-expect-error`',
  'missing-return-type': 'Exported function lacks a return type',
  'loose-type': 'Loose nominal type',
  'non-null-assertion': 'Non-null assertion (`!`)',
};

export function findingToDiagnostic(finding: TsStrictFinding, idx: number): Diagnostic {
  return {
    id: `ts-strict-${idx}`,
    ruleId: KIND_TO_RULE[finding.kind],
    title: KIND_TO_TITLE[finding.kind],
    message: finding.reason,
    severity: finding.severity,
    confidence: 'high',
    scope: finding.file,
    routeId: null,
    location: { file: finding.file, line: finding.line },
    evidence: [
      {
        id: `${finding.file}:${finding.line}:ev`,
        label: finding.snippet,
        location: { file: finding.file, line: finding.line },
        kind: 'direct',
      },
    ],
    impact: [],
    affectedRouteIds: [],
    fixes: [],
    introducedInCurrentDiff: false,
    category: 'typescript',
  };
}

/**
 * Browser-safe entry point: snapshot the fixture's `app/` tree at build time
 * via Vite's `import.meta.glob`, run the analyzer, and return the findings.
 *
 * Mirrors the discovery pattern used by `analyzeRoutes` in `routes.ts`.
 */
export function analyzeFixtureTsStrict(): TsStrictReport {
  const FIXTURE_PREFIX = '../../../e2e/fixtures/next-app/';
  const FIXTURE_FILES = import.meta.glob<string>(
    '../../../e2e/fixtures/next-app/app/**/*.{ts,tsx}',
    { query: '?raw', import: 'default', eager: true },
  );
  const inputs: TsStrictInputFile[] = [];
  for (const [globKey, source] of Object.entries(FIXTURE_FILES)) {
    if (!globKey.startsWith(FIXTURE_PREFIX)) continue;
    inputs.push({ path: globKey.slice(FIXTURE_PREFIX.length), content: source });
  }
  return analyzeTsStrict(inputs);
}
