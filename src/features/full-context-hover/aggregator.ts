/**
 * Phase 6 — Full Context Hover aggregator.
 *
 * Pure function. Reads from every existing zustand store via `getState()` so
 * the result is a snapshot at call-time. Callers that want reactivity should
 * subscribe to the relevant stores themselves and re-run aggregation.
 *
 * Design notes
 * ────────────
 *  - We intentionally do NOT import `react` here so the aggregator can run in
 *    workers and from the AI tool layer.
 *  - Every section uses heuristics with graceful empty arrays — the hover card
 *    is forgiving and just hides a section when its array is empty.
 *  - We never throw — a missing store / mock simply returns an empty list.
 */

import type { CodeSymbolKind } from '@entities/code-symbol';
import { useCodeSymbolStore } from '@entities/code-symbol';
import { useRouteStore } from '@entities/route';
import { useDiagnosticStore } from '@entities/diagnostic';
import { useActionStore } from '@entities/server-action';
import { useCacheTagStore } from '@entities/cache-tag';
import { useBoundaryStore } from '@entities/boundary';
import { useEvidenceStore } from '@entities/evidence';
import type { Diagnostic } from '@shared/types';
import type {
  CacheImpactRef,
  ConsumerRef,
  DiagnosticLike,
  MutationRef,
  PiiNodeRef,
  RiskRef,
  RouteRef,
  SymbolContext,
  TestRef,
} from './types';

export interface AggregateInput {
  /** Symbol name as captured from Monaco (`getWordAtPosition`). */
  symbol: string;
  /** Absolute or workspace-relative file path. */
  file: string;
  /** 1-based line. */
  line: number;
  /** Optional Monaco/tsserver quickInfo display string. */
  signature?: string;
  /** Optional documentation. */
  docs?: string;
}

const PII_NEEDLES = ['email', 'phone', 'address', 'ssn', 'password', 'token', 'secret', 'apiKey', 'session'];

function inferKind(symbol: string): CodeSymbolKind | 'unknown' {
  if (!symbol) return 'unknown';
  if (/^use[A-Z]/.test(symbol)) return 'hook';
  if (/^[A-Z]/.test(symbol)) return 'component';
  return 'function';
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

function diagnosticToRisk(d: Diagnostic | DiagnosticLike, fromAdmission = false): RiskRef {
  return {
    id: d.id,
    ruleId: d.ruleId,
    severity: d.severity,
    title: d.title ?? d.ruleId,
    file: d.location.file,
    line: d.location.line,
    fromAdmission,
  };
}

/**
 * Read all stores and synthesize a SymbolContext.
 *
 * Heuristic: we don't have a true cross-file reference index in mock mode,
 * so consumers/routes/etc. are derived by string-matching the symbol name
 * inside known surfaces. When a real reference index exists (Phase 2 LSP),
 * a future commit can replace these heuristics with `lspClient.references`.
 */
export function aggregateContext(input: AggregateInput): SymbolContext {
  const { symbol, file, line } = input;
  const lower = symbol.toLowerCase();
  const kind = inferKind(symbol);

  // ── Consumers (code-symbol store + cross-feature symbol matches) ─────
  const symbolState = useCodeSymbolStore.getState();
  const consumers: ConsumerRef[] = symbolState.symbols
    .filter((s) => s.name === symbol && (s.file !== file || s.line !== line))
    .map((s) => ({
      file: s.file,
      line: s.line,
      label: s.name,
      via: s.kind === 'component' ? 'jsx' : 'reference',
      detail: s.signature,
    }));

  // ── Routes (heuristic: route.files contain this file path) ───────────
  const { routes } = useRouteStore.getState();
  const routeMatches: RouteRef[] = routes
    .filter((r) => {
      const files = Object.values(r.files ?? {}).filter(Boolean) as string[];
      if (files.some((f) => f === file)) return true;
      // Also surface routes whose data sources name-match the symbol.
      if (r.dataSources.some((ds) => ds.name === symbol)) return true;
      return false;
    })
    .map((r) => ({
      routeId: r.id,
      path: r.path,
      rendering: r.rendering,
      archetype: r.archetype,
    }));

  // ── Mutations (server-action store) ──────────────────────────────────
  const { actions, handlers } = useActionStore.getState();
  const mutations: MutationRef[] = [
    ...actions
      .filter((a) => a.name === symbol || a.name.toLowerCase().includes(lower))
      .map<MutationRef>((a) => ({
        id: a.id,
        name: a.name,
        ...(a.routeId ? { routeId: a.routeId } : {}),
        mutates: a.exposedSurface ?? [],
      })),
    ...handlers
      .filter((h) => h.path.toLowerCase().includes(lower) || h.file === file)
      .map<MutationRef>((h) => ({
        id: h.id,
        name: `${h.method} ${h.path}`,
        mutates: [],
      })),
  ];

  // ── Cache impact (cache-tag store) ───────────────────────────────────
  const { tags } = useCacheTagStore.getState();
  const cache: CacheImpactRef[] = tags
    .filter((t) => {
      // Tag matches if the symbol references it directly or any data source
      // on a matching route advertises the tag.
      if (t.name === symbol) return true;
      if (routeMatches.some((rm) => t.affectedRouteIds.includes(rm.routeId))) return true;
      const producerHits = (t.producers ?? []).some((p) => p.location.file === file);
      const invalidatorHits = (t.invalidators ?? []).some((i) => i.location.file === file);
      return producerHits || invalidatorHits;
    })
    .map<CacheImpactRef>((t) => ({
      tag: t.name,
      affectedRouteIds: t.affectedRouteIds,
      hasInvalidator: (t.invalidators?.length ?? 0) > 0,
    }));

  // ── PII flow (heuristic on field names — pii-lineage analyzer would
  //    produce a richer graph; we surface anything matching needles in
  //    the same file). ──────────────────────────────────────────────────
  const pii: PiiNodeRef[] = PII_NEEDLES.flatMap((needle) =>
    lower.includes(needle)
      ? [
          {
            file,
            line,
            label: symbol,
            classification: needle === 'secret' || needle === 'password' || needle === 'token'
              ? 'secret'
              : 'pii',
          } as PiiNodeRef,
        ]
      : [],
  );

  // ── Tests (test-impact would be ideal — heuristic: file is in __tests__
  //    or its name appears in route diagnostics impact strings). ────────
  const tests: TestRef[] = [];
  if (file.includes('/__tests__/') || file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
    tests.push({ file, line, status: 'unknown', label: basename(file) });
  }

  // ── Risks: diagnostics matching file/line + admission findings ───────
  const { diagnostics } = useDiagnosticStore.getState();
  const diagRisks: RiskRef[] = diagnostics
    .filter((d) => d.location.file === file)
    .map((d) => diagnosticToRisk(d));

  const evState = useEvidenceStore.getState();
  const admissionRisks: RiskRef[] = (evState.packets ?? []).flatMap((pkt) =>
    pkt.findings
      .filter((f) => f.filePath === file)
      .map<RiskRef>((f) => ({
        id: f.id,
        ruleId: f.ruleId,
        severity:
          f.severity === 'critical'
            ? 'err'
            : f.severity === 'high'
              ? 'err'
              : f.severity === 'medium'
                ? 'warn'
                : 'info',
        title: f.message,
        file: f.filePath,
        line: f.line ?? 1,
        fromAdmission: true,
      })),
  );
  const risks: RiskRef[] = [...diagRisks, ...admissionRisks];

  // ── Boundary (use-client / use-server analyzer would supply truth —
  //    fall back to file-name heuristics + boundary store islands). ────
  const boundaryState = useBoundaryStore.getState();
  const isClientIsland = boundaryState.islands.some((i) => i.file === file);
  const surface = isClientIsland
    ? 'client'
    : file.includes('/server/') || file.endsWith('.server.ts') || file.endsWith('.server.tsx')
      ? 'server'
      : file.includes('/edge/') || file.includes('middleware')
        ? 'edge'
        : 'unknown';

  return {
    name: symbol || basename(file),
    kind,
    file,
    line,
    signature: input.signature,
    docs: input.docs,
    consumers,
    routes: routeMatches,
    mutations,
    cache,
    pii,
    tests,
    risks,
    boundary: {
      surface,
      reason: isClientIsland
        ? "matches a known client island"
        : surface === 'unknown'
          ? "no boundary markers detected"
          : `inferred from path: ${file}`,
    },
    counts: {
      consumers: consumers.length,
      routes: routeMatches.length,
      mutations: mutations.length,
      cache: cache.length,
      pii: pii.length,
      tests: tests.length,
      risks: risks.length,
    },
  };
}
