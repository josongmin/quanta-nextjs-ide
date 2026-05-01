// ts-morph based race-condition detector for server actions.
//
// The detector scans every input file and:
//   1. flags top-level files marked with `'use server'`
//   2. for each exported async function inside, builds a tiny per-function
//      summary (mutations, reads, idempotency markers, transaction wrapping)
//   3. derives a list of `RaceRisk` records from the summaries
//
// It is intentionally heuristic — false positives are preferable to silent
// gaps. Pure function: no FS access, no globals.
import {
  Project,
  Node,
  ScriptKind,
  SyntaxKind,
  type CallExpression,
  type FunctionDeclaration,
  type SourceFile,
} from 'ts-morph';
import {
  ID_GEN_IMPORTS,
  ID_PARAM_HINTS,
  IDEMPOTENCY_NAMES,
  TRANSACTION_NAMES,
  isMutation,
  isRead,
} from './patterns';
import type {
  RaceEvidence,
  RaceReport,
  RaceRisk,
  RaceSeverity,
} from './types';

export interface SourceInputFile {
  path: string;
  content: string;
}

interface ActionSummary {
  file: string;
  name: string;
  line: number;
  /** Mutation call sites within the function body. */
  mutations: { method: string; line: number; snippet: string }[];
  reads: { method: string; line: number; snippet: string }[];
  hasIdempotencyParam: boolean;
  hasIdGenImport: boolean;
  hasTransaction: boolean;
  /** Whether the action's parameters carry an `id`-like identifier. */
  paramsLookLikeRowKey: boolean;
}

const SCRIPT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs']);

export function analyzeRaceConditions(files: SourceInputFile[]): RaceReport {
  const start = Date.now();
  const project = new Project({ useInMemoryFileSystem: true });
  let scanned = 0;

  for (const f of files) {
    const idx = f.path.lastIndexOf('.');
    const ext = idx === -1 ? '' : f.path.slice(idx);
    if (!SCRIPT_EXTS.has(ext)) continue;
    project.createSourceFile(f.path, f.content, {
      scriptKind: ext.endsWith('tsx') ? ScriptKind.TSX : ScriptKind.TS,
    });
    scanned++;
  }

  const summaries: ActionSummary[] = [];
  for (const sf of project.getSourceFiles()) {
    const fileLevelUseServer = hasFileLevelUseServer(sf);
    const idGenImported = hasIdGenImport(sf);

    for (const fn of sf.getFunctions()) {
      if (!fn.isExported() || !fn.getAsyncKeyword()) continue;
      const localUseServer =
        fileLevelUseServer || hasFunctionLevelUseServer(fn);
      if (!localUseServer) continue;
      summaries.push(summarizeFunction(sf, fn, idGenImported));
    }
  }

  const risks: RaceRisk[] = [];
  for (const s of summaries) {
    risks.push(...riskFromSummary(s));
  }

  return {
    risks,
    filesScanned: scanned,
    durationMs: Date.now() - start,
  };
}

function hasFileLevelUseServer(sf: SourceFile): boolean {
  // Body-level "use server" appears as the first ExpressionStatement.
  for (const stmt of sf.getStatements()) {
    if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
      const text = stmt.getText().trim();
      if (text === "'use server'" || text === '"use server"' || text.startsWith("'use server'")) {
        return true;
      }
      // Permit one preceding directive-style comment, otherwise stop.
      break;
    } else {
      break;
    }
  }
  return false;
}

function hasFunctionLevelUseServer(fn: FunctionDeclaration): boolean {
  const body = fn.getBody();
  if (!body) return false;
  const first = body.getDescendantStatements()[0];
  if (!first) return false;
  const text = first.getText().trim();
  return text.startsWith("'use server'") || text.startsWith('"use server"');
}

function hasIdGenImport(sf: SourceFile): boolean {
  for (const decl of sf.getImportDeclarations()) {
    const mod = decl.getModuleSpecifierValue();
    // Bare module — match exactly or as a prefix (e.g. "uuid/v4").
    for (const id of ID_GEN_IMPORTS) {
      if (mod === id || mod.startsWith(`${id}/`) || mod === `node:${id}`) {
        return true;
      }
    }
  }
  return false;
}

function summarizeFunction(
  sf: SourceFile,
  fn: FunctionDeclaration,
  idGenImported: boolean,
): ActionSummary {
  const name = fn.getName() ?? '<anonymous>';
  const line = sf.getLineAndColumnAtPos(fn.getStart()).line;

  const mutations: ActionSummary['mutations'] = [];
  const reads: ActionSummary['reads'] = [];
  let hasTransaction = false;

  fn.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.CallExpression) {
      const call = node as CallExpression;
      const expr = call.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        const method = expr.getName();
        const callLine = sf.getLineAndColumnAtPos(call.getStart()).line;
        const snippet = clampSnippet(call.getText());
        if (isMutation(method)) {
          mutations.push({ method, line: callLine, snippet });
        } else if (isRead(method)) {
          reads.push({ method, line: callLine, snippet });
        }
        if (TRANSACTION_NAMES.has(method)) hasTransaction = true;
      } else if (Node.isIdentifier(expr)) {
        const id = expr.getText();
        if (TRANSACTION_NAMES.has(id)) hasTransaction = true;
      }
    }
  });

  // Param scan — names + destructured fields.
  const paramText = fn.getParameters().map((p) => p.getText()).join(',');
  const hasIdempotencyParam = [...IDEMPOTENCY_NAMES].some((k) =>
    paramText.includes(k),
  );
  const paramsLookLikeRowKey =
    [...ID_PARAM_HINTS].some((id) =>
      new RegExp(`\\b${id}\\b`).test(paramText),
    ) ||
    /formData\.get\(['"](id|userId|orderId|productId)['"]\)/.test(fn.getText());

  return {
    file: sf.getFilePath(),
    name,
    line,
    mutations,
    reads,
    hasIdempotencyParam,
    hasIdGenImport: idGenImported,
    hasTransaction,
    paramsLookLikeRowKey,
  };
}

function riskFromSummary(s: ActionSummary): RaceRisk[] {
  const out: RaceRisk[] = [];
  const baseEvidence = (
    line: number,
    snippet: string,
    reason: string,
  ): RaceEvidence => ({
    file: s.file.replace(/^\//, ''),
    line,
    snippet,
    reason,
  });

  // 1. Double-submit: any mutation, no idempotency, identifiable row key.
  if (
    s.mutations.length > 0 &&
    !s.hasIdempotencyParam &&
    !s.hasIdGenImport &&
    s.paramsLookLikeRowKey
  ) {
    out.push({
      id: `${s.name}__double_submit`,
      action: s.name,
      kind: 'double-submit',
      severity: pickSeverity(s.mutations.length, 'high'),
      evidence: s.mutations.map((m) =>
        baseEvidence(m.line, m.snippet, `${m.method}() with no idempotency key`),
      ),
      mitigation:
        'Add an `idempotencyKey` parameter (or generate one client-side via `ulid()`/`crypto.randomUUID()`) and reject duplicates on the server.',
      before: `export async function ${s.name}(input) {\n  await db.user.update({ where: { id: input.id }, data: input })\n}`,
      after: `export async function ${s.name}(input: { id: string; idempotencyKey: string; ... }) {\n  if (await seenKey(input.idempotencyKey)) return { ok: true, replayed: true }\n  await db.user.update({ where: { id: input.id }, data: input })\n  await rememberKey(input.idempotencyKey)\n}`,
    });
  }

  // 2. Lost update: read-then-write without transaction wrapping.
  if (s.reads.length > 0 && s.mutations.length > 0 && !s.hasTransaction) {
    const firstRead = s.reads[0]!;
    const firstMut = s.mutations[0]!;
    if (firstMut.line > firstRead.line) {
      out.push({
        id: `${s.name}__lost_update`,
        action: s.name,
        kind: 'lost-update',
        severity: 'high',
        evidence: [
          baseEvidence(firstRead.line, firstRead.snippet, `read via ${firstRead.method}()`),
          baseEvidence(firstMut.line, firstMut.snippet, `write via ${firstMut.method}() — no $transaction wrapper`),
        ],
        mitigation:
          'Wrap the read+write pair in a `db.$transaction(async (tx) => { ... })` block, or use optimistic locking via a `version` column.',
        before: `const row = await db.row.findUnique({ where: { id } })\nawait db.row.update({ where: { id }, data: { count: row.count + 1 } })`,
        after: `await db.$transaction(async (tx) => {\n  const row = await tx.row.findUnique({ where: { id } })\n  await tx.row.update({ where: { id, version: row.version }, data: { count: row.count + 1, version: { increment: 1 } } })\n})`,
      });
    }
  }

  // 3. Phantom read: multiple reads without transaction → state-of-the-world drifts.
  if (s.reads.length >= 2 && !s.hasTransaction) {
    out.push({
      id: `${s.name}__phantom_read`,
      action: s.name,
      kind: 'phantom-read',
      severity: 'medium',
      evidence: s.reads.map((r) =>
        baseEvidence(r.line, r.snippet, `read via ${r.method}() outside transaction`),
      ),
      mitigation:
        'If the reads must agree, group them in a `$transaction` with `isolationLevel: "Serializable"`.',
    });
  }

  // 4. No-dedupe: many mutation calls, no transaction, no idempotency.
  if (
    s.mutations.length >= 2 &&
    !s.hasTransaction &&
    !s.hasIdempotencyParam
  ) {
    out.push({
      id: `${s.name}__no_dedupe`,
      action: s.name,
      kind: 'no-dedupe',
      severity: 'medium',
      evidence: s.mutations.map((m) =>
        baseEvidence(m.line, m.snippet, `${m.method}() — concurrent calls coalesce silently`),
      ),
      mitigation:
        'Either dedupe the action with React `cache()`/`unstable_cache`, or move to a single transactional write.',
    });
  }

  return out;
}

function pickSeverity(n: number, fallback: RaceSeverity): RaceSeverity {
  if (n >= 3) return 'high';
  if (n >= 2) return 'medium';
  return fallback;
}

function clampSnippet(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 120 ? flat.slice(0, 117) + '…' : flat;
}
