// Real static analyzer for the Next.js `'use cache'` directive.
//
// Powered by ts-morph (TypeScript Compiler API wrapper). For each input file
// the analyzer reports:
//
//   • `has-directive` — file or function already declares `'use cache'`.
//   • `candidate`     — pure server function that *could* safely cache.
//   • `unsafe`        — function reads request-scoped data (cookies, headers),
//                       uses non-deterministic APIs (Date.now, Math.random,
//                       crypto.randomUUID, performance.now), or performs
//                       cache-busting fetches (`cache: 'no-store'`,
//                       `next.revalidate: 0`).
//
// The analyzer is a pure function: pass `{ path, content }` records and get
// back a `UseCacheReport`. No filesystem access, so it runs in the browser
// (with ts-morph's in-memory project) just as well as in Node.
import {
  Project,
  Node,
  ScriptKind,
  type SourceFile,
  type FunctionDeclaration,
  type FunctionExpression,
  type ArrowFunction,
  type MethodDeclaration,
} from 'ts-morph';

// ── Public types ───────────────────────────────────────────────────────────

export type UseCacheKind = 'has-directive' | 'candidate' | 'unsafe';

export type UseCacheScope = 'file' | 'function';

export interface UseCacheFinding {
  /** Workspace-relative file path, e.g. `app/mixed/page.tsx`. */
  file: string;
  /** 1-based line in the source file. */
  line: number;
  /** What the analyzer concluded. */
  kind: UseCacheKind;
  /** Whether the directive applies file-wide or to a single function. */
  scope: UseCacheScope;
  /** Function name when known, or `'<module>'` for file-level findings. */
  name: string;
  /** Human-readable explanation, ≤ 1 sentence. */
  reason: string;
}

export interface UseCacheInputFile {
  /** A stable, workspace-relative path. */
  path: string;
  /** UTF-8 source text. */
  content: string;
}

export interface UseCacheReport {
  findings: UseCacheFinding[];
  /** Number of files actually parsed (excludes unsupported extensions). */
  filesScanned: number;
  /** ms wall-clock cost of the scan. */
  durationMs: number;
}

// ── Internals ──────────────────────────────────────────────────────────────

type FunctionLike =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunction
  | MethodDeclaration;

interface UnsafeHit {
  reason: string;
}

const REQUEST_SCOPED_CALLS: ReadonlySet<string> = new Set([
  'cookies',
  'headers',
  'draftMode',
  'connection',
]);

const NONDETERMINISTIC_PROPERTY_ACCESSES: ReadonlySet<string> = new Set([
  // <object>.<member> — matched as a whole token below.
  'Date.now',
  'Math.random',
  'performance.now',
  'crypto.randomUUID',
  'crypto.getRandomValues',
]);

function isFunctionLike(node: Node): node is FunctionLike {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node) ||
    Node.isMethodDeclaration(node)
  );
}

function getFunctionName(fn: FunctionLike): string {
  if (Node.isFunctionDeclaration(fn) || Node.isMethodDeclaration(fn)) {
    return fn.getName() ?? '<anonymous>';
  }
  // Function expressions / arrow functions: try the parent (e.g. variable
  // declaration) for a friendly name.
  const parent = fn.getParent();
  if (Node.isVariableDeclaration(parent)) return parent.getName();
  if (Node.isPropertyAssignment(parent)) return parent.getName();
  return '<anonymous>';
}

/** Returns the leading directive prologue strings of a function body. */
function getFunctionDirectives(fn: FunctionLike): string[] {
  const body = fn.getBody?.();
  if (!body || !Node.isBlock(body)) return [];
  const out: string[] = [];
  for (const stmt of body.getStatements()) {
    if (!Node.isExpressionStatement(stmt)) break;
    const expr = stmt.getExpression();
    if (!Node.isStringLiteral(expr) && !Node.isNoSubstitutionTemplateLiteral(expr)) {
      break;
    }
    out.push(expr.getLiteralText());
  }
  return out;
}

/** Returns the file-level directive prologue strings of a source file. */
function getFileDirectives(sf: SourceFile): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = [];
  for (const stmt of sf.getStatements()) {
    if (!Node.isExpressionStatement(stmt)) break;
    const expr = stmt.getExpression();
    if (!Node.isStringLiteral(expr) && !Node.isNoSubstitutionTemplateLiteral(expr)) {
      break;
    }
    out.push({
      text: expr.getLiteralText(),
      line: sf.getLineAndColumnAtPos(stmt.getStart()).line,
    });
  }
  return out;
}

/** Detects unsafe patterns inside `fn` that disqualify it from `'use cache'`. */
function findUnsafeReasons(fn: FunctionLike): UnsafeHit[] {
  const hits: UnsafeHit[] = [];

  fn.forEachDescendant((node) => {
    // <a>.<b> property access (Date.now, Math.random, performance.now, …)
    if (Node.isPropertyAccessExpression(node)) {
      const text = node.getText();
      if (NONDETERMINISTIC_PROPERTY_ACCESSES.has(text)) {
        hits.push({ reason: `non-deterministic API: \`${text}\`` });
      }
      return;
    }

    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();

    // request-scoped calls: cookies(), headers(), draftMode(), connection()
    if (Node.isIdentifier(expr)) {
      const name = expr.getText();
      if (REQUEST_SCOPED_CALLS.has(name)) {
        hits.push({ reason: `request-scoped API: \`${name}()\`` });
        return;
      }
    }

    // member calls — e.g. `crypto.randomUUID()` even when called from inside.
    if (Node.isPropertyAccessExpression(expr)) {
      const memberText = expr.getText();
      if (NONDETERMINISTIC_PROPERTY_ACCESSES.has(memberText)) {
        hits.push({ reason: `non-deterministic API: \`${memberText}()\`` });
        return;
      }
    }

    // fetch(..., { cache: 'no-store' }) or { next: { revalidate: 0 } }
    if (
      (Node.isIdentifier(expr) && expr.getText() === 'fetch') ||
      (Node.isPropertyAccessExpression(expr) && expr.getName() === 'fetch')
    ) {
      const args = node.getArguments();
      const opts = args[1];
      if (opts && Node.isObjectLiteralExpression(opts)) {
        for (const prop of opts.getProperties()) {
          if (!Node.isPropertyAssignment(prop)) continue;
          const key = prop.getName();
          if (key === 'cache') {
            const init = prop.getInitializer();
            if (init && Node.isStringLiteral(init) && init.getLiteralText() === 'no-store') {
              hits.push({ reason: "cache-busting fetch: `cache: 'no-store'`" });
            }
          } else if (key === 'next') {
            const init = prop.getInitializer();
            if (init && Node.isObjectLiteralExpression(init)) {
              for (const sub of init.getProperties()) {
                if (!Node.isPropertyAssignment(sub)) continue;
                if (sub.getName() !== 'revalidate') continue;
                const subInit = sub.getInitializer();
                if (subInit && Node.isNumericLiteral(subInit) && subInit.getLiteralText() === '0') {
                  hits.push({ reason: 'cache-busting fetch: `next.revalidate: 0`' });
                }
              }
            }
          }
        }
      }
    }
  });

  return hits;
}

/** True if the file imports `'next/headers'` (signal that it's server code). */
function importsNextHeaders(sf: SourceFile): boolean {
  return sf
    .getImportDeclarations()
    .some((d) => d.getModuleSpecifierValue() === 'next/headers');
}

// ── Entry point ────────────────────────────────────────────────────────────

export function analyzeUseCache(files: ReadonlyArray<UseCacheInputFile>): UseCacheReport {
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

  const findings: UseCacheFinding[] = [];
  let filesScanned = 0;

  for (const f of files) {
    const ext = f.path.toLowerCase();
    if (!ext.endsWith('.ts') && !ext.endsWith('.tsx')) continue;
    const scriptKind = ext.endsWith('.tsx') ? ScriptKind.TSX : ScriptKind.TS;
    const sf = project.createSourceFile(f.path, f.content, {
      overwrite: true,
      scriptKind,
    });

    filesScanned += 1;

    const fileDirectives = getFileDirectives(sf);
    const fileHasUseCache = fileDirectives.some((d) => d.text === 'use cache');
    const fileHasUseClient = fileDirectives.some((d) => d.text === 'use client');

    if (fileHasUseCache) {
      const dir = fileDirectives.find((d) => d.text === 'use cache');
      findings.push({
        file: f.path,
        line: dir ? dir.line : 1,
        kind: 'has-directive',
        scope: 'file',
        name: '<module>',
        reason: "file declares `'use cache'` at the top of the module",
      });
    }

    // Skip per-function analysis on `'use client'` files — the directive can't
    // legally appear there and they aren't candidates either.
    if (fileHasUseClient) continue;

    // Walk top-level functions only — nested closures inherit the parent.
    for (const stmt of sf.getStatements()) {
      const fns: FunctionLike[] = [];
      if (Node.isFunctionDeclaration(stmt)) {
        fns.push(stmt);
      } else if (Node.isVariableStatement(stmt)) {
        for (const decl of stmt.getDeclarationList().getDeclarations()) {
          const init = decl.getInitializer();
          if (init && isFunctionLike(init)) fns.push(init);
        }
      } else if (Node.isExportAssignment(stmt)) {
        const expr = stmt.getExpression();
        if (isFunctionLike(expr)) fns.push(expr);
      }

      for (const fn of fns) {
        const directives = getFunctionDirectives(fn);
        const line = sf.getLineAndColumnAtPos(fn.getStart()).line;
        const name = getFunctionName(fn);

        if (directives.includes('use cache')) {
          findings.push({
            file: f.path,
            line,
            kind: 'has-directive',
            scope: 'function',
            name,
            reason: `function \`${name}\` declares \`'use cache'\``,
          });
          continue;
        }
        // `'use server'` action functions are not cache candidates by default.
        if (directives.includes('use server')) continue;

        // If the file is already file-level cached we don't double-report.
        if (fileHasUseCache) continue;

        const unsafe = findUnsafeReasons(fn);
        if (unsafe.length > 0) {
          findings.push({
            file: f.path,
            line,
            kind: 'unsafe',
            scope: 'function',
            name,
            reason: `\`${name}\` is unsafe to cache: ${unsafe[0]?.reason ?? 'dynamic IO'}`,
          });
          continue;
        }

        // Heuristic candidate: top-level function in a server module
        // (not a `'use client'` file) with no unsafe patterns.
        // Slight bonus: file imports `next/headers` ⇒ definitely server.
        const serverHinted = importsNextHeaders(sf);
        findings.push({
          file: f.path,
          line,
          kind: 'candidate',
          scope: 'function',
          name,
          reason: serverHinted
            ? `\`${name}\` is server-side (file imports \`next/headers\`) — safe to add \`'use cache'\``
            : `\`${name}\` is a pure server function — safe to add \`'use cache'\``,
        });
      }
    }
  }

  // Stable sort: file ↑, line ↑, kind (has-directive < unsafe < candidate).
  const kindRank: Record<UseCacheKind, number> = {
    'has-directive': 0,
    unsafe: 1,
    candidate: 2,
  };
  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    return kindRank[a.kind] - kindRank[b.kind];
  });

  const t1 =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  return { findings, filesScanned, durationMs: Math.round((t1 - t0) * 100) / 100 };
}
