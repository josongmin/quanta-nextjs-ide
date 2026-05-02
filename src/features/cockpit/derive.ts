/**
 * Pure derivation of the Cockpit's `ProjectPulse` from the existing
 * zustand stores. Read-only — uses `getState()` so callers can derive
 * on demand without forcing a re-render subscription.
 */

import { useDiagnosticStore } from '@entities/diagnostic';
import { useEvidenceStore } from '@entities/evidence';
import { useRouteStore } from '@entities/route';
import type {
  CockpitRisk,
  DeployReadiness,
  ProjectPulse,
  ReadinessGate,
  ReadinessVerdict,
  RiskKind,
  RouteTotals,
  ShippedChange,
  ShippedChangeKind,
} from './types';
import type { Diagnostic, Severity } from '@shared/types';
import type { AdmissionDecision, EvidencePacket } from '@entities/evidence';

const SEVERITY_RANK: Record<Severity, number> = {
  err: 0,
  warn: 1,
  info: 2,
  hint: 3,
};

/**
 * Map the admission verdict (when the diagnostic has a linked evidence
 * packet) plus the raw severity into a single ranked `RiskKind`.
 */
function classifyRisk(
  diagnostic: Diagnostic,
  decisionByDiag: Map<string, AdmissionDecision>,
): RiskKind {
  const dec = decisionByDiag.get(diagnostic.id);
  if (dec === 'reject') return 'reject';
  if (dec === 'review') return 'review';
  if (diagnostic.severity === 'err') return 'err';
  return 'warn';
}

const KIND_RANK: Record<RiskKind, number> = {
  reject: 0,
  err: 1,
  review: 2,
  warn: 3,
};

function pickRisks(
  diagnostics: Diagnostic[],
  packets: EvidencePacket[],
  routePathById: Map<string, string>,
  limit: number,
): CockpitRisk[] {
  // Build a map: diagnostic.ruleId → highest-severity admission decision
  // observed in any packet whose findings reference that ruleId. This is
  // a lossy join (we don't track diag→packet directly) but it's stable
  // and keeps the derive pure.
  const decisionByRule = new Map<string, AdmissionDecision>();
  const witnessByRule = new Map<string, string[]>();
  for (const p of packets) {
    for (const f of p.findings) {
      const prior = decisionByRule.get(f.ruleId);
      if (
        !prior ||
        (p.verdict.decision === 'reject' && prior !== 'reject') ||
        (p.verdict.decision === 'review' && prior === 'admit')
      ) {
        decisionByRule.set(f.ruleId, p.verdict.decision);
      }
      if (!witnessByRule.has(f.ruleId)) {
        const witness = Array.isArray(f.witness) ? f.witness.slice(0, 4) : [];
        witnessByRule.set(f.ruleId, witness);
      }
    }
  }
  const decisionByDiag = new Map<string, AdmissionDecision>();
  for (const d of diagnostics) {
    const dec = decisionByRule.get(d.ruleId);
    if (dec) decisionByDiag.set(d.id, dec);
  }

  // Filter to actionable diagnostics (warn/err only) — Cockpit shows
  // *needs attention*, not info/hint.
  const candidates = diagnostics.filter(
    (d) => d.severity === 'warn' || d.severity === 'err',
  );

  const risks: CockpitRisk[] = candidates.map((d) => {
    const kind = classifyRisk(d, decisionByDiag);
    const routePath = d.routeId ? routePathById.get(d.routeId) : undefined;
    const evidenceWitness = d.evidence
      .slice(0, 3)
      .filter((e) => e.location)
      .map((e) => `${e.location!.file}:${e.location!.line}`);
    const ruleWitness = witnessByRule.get(d.ruleId) ?? [];
    return {
      id: d.id,
      diagnosticId: d.id,
      kind,
      severity: d.severity,
      routeId: d.routeId ?? undefined,
      routePath,
      title: d.title,
      cause: d.message,
      witness: evidenceWitness.length ? evidenceWitness : ruleWitness,
      affectedFiles: Array.from(
        new Set([
          d.location.file,
          ...d.evidence
            .map((e) => e.location?.file)
            .filter((f): f is string => Boolean(f)),
        ]),
      ),
    };
  });

  risks.sort((a, b) => {
    const k = KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (k !== 0) return k;
    return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  });

  return risks.slice(0, limit);
}

/**
 * Mock recently-shipped changes. Real wiring (git log + semantic-diff
 * snapshots) is left for a follow-up; for now we derive plausible items
 * from the route catalog so the section is never empty.
 */
function mockShipped(
  routes: ReturnType<typeof useRouteStore.getState>['routes'],
): ShippedChange[] {
  const now = Date.now();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const samples: Array<{
    kind: ShippedChangeKind;
    description: string;
    author: string;
    age: number;
  }> = [
    {
      kind: 'static-to-isr',
      description: 'static → ISR (revalidate 60s)',
      author: 'rin',
      age: 12 * minute,
    },
    {
      kind: 'cache-policy',
      description: "added 'use cache' directive",
      author: 'song',
      age: 2 * hour,
    },
    {
      kind: 'boundary',
      description: 'added error.tsx + loading.tsx',
      author: 'mira',
      age: 5 * hour,
    },
    {
      kind: 'metadata',
      description: 'generateMetadata() OG image fixed',
      author: 'song',
      age: 1 * day,
    },
    {
      kind: 'refactor',
      description: 'extracted client island',
      author: 'rin',
      age: 2 * day,
    },
  ];
  // Pair samples to actual routes when available.
  const pageRoutes = routes.filter(
    (r) => r.archetype !== 'api' && r.archetype !== 'webhook',
  );
  return samples.slice(0, 4).map((s, i) => {
    const route = pageRoutes[i % Math.max(pageRoutes.length, 1)];
    return {
      id: `shipped-${i}`,
      routeId: route?.id,
      routePath: route?.path ?? '/',
      kind: s.kind,
      description: s.description,
      author: s.author,
      shippedAt: now - s.age,
    };
  });
}

function deriveTotals(
  routes: ReturnType<typeof useRouteStore.getState>['routes'],
): RouteTotals {
  const pageRoutes = routes.filter(
    (r) => r.archetype !== 'api' && r.archetype !== 'webhook',
  );
  const staticCount = pageRoutes.filter(
    (r) => r.rendering === 'static' || r.rendering === 'isr',
  ).length;
  const dynamicCount = pageRoutes.filter(
    (r) => r.rendering === 'dynamic',
  ).length;
  // Approximate "streaming" coverage by routes that report a `loading.tsx`
  // or partial-prerender boundary — Next 15 doesn't expose a dedicated
  // rendering class for this, so we proxy via boundary state.
  const streamingCount = pageRoutes.filter(
    (r) => r.boundaries.loading === 'present',
  ).length;

  // p50 client KB across page routes (simple median).
  const kbs = pageRoutes
    .map((r) => r.clientKb)
    .filter((kb) => kb > 0)
    .sort((a, b) => a - b);
  const clientKbP50 = kbs.length
    ? Math.round(kbs[Math.floor(kbs.length / 2)] ?? 0)
    : 0;

  // Server-budget headroom: a heuristic — fewer cost-class D/E (highest
  // tiers) routes = healthier. 100 = pristine.
  const heavy = pageRoutes.filter(
    (r) => r.costClass === 'D' || r.costClass === 'E',
  ).length;
  const denom = Math.max(pageRoutes.length, 1);
  const serverBudgetPct = Math.max(
    0,
    Math.min(100, Math.round(100 - (heavy / denom) * 100)),
  );

  return {
    total: pageRoutes.length,
    static: staticCount,
    dynamic: dynamicCount,
    streaming: streamingCount,
    clientKbP50,
    serverBudgetPct,
  };
}

function deriveReadiness(
  risks: CockpitRisk[],
  packets: EvidencePacket[],
): DeployReadiness {
  // Aggregate verdict — most-recent packet wins, fall back to risk roll-up.
  const latest = packets[0];
  let verdict: ReadinessVerdict = 'admit';
  let score = 0;
  let reasons: string[] = [];
  if (latest) {
    verdict = latest.verdict.decision;
    score = latest.verdict.score;
    reasons = latest.verdict.reasons.slice(0, 3);
  } else {
    if (risks.some((r) => r.kind === 'reject')) verdict = 'reject';
    else if (risks.some((r) => r.kind === 'review' || r.kind === 'err'))
      verdict = 'review';
    score = risks.length;
    reasons = risks.slice(0, 3).map((r) => r.title);
  }

  // Pure mock for the 4 gates — these would be wired to a real CI summary
  // in production. We tint the verdict if any risks exist.
  const hasErr = risks.some((r) => r.severity === 'err' || r.kind === 'reject');
  const hasWarn = risks.some(
    (r) => r.severity === 'warn' || r.kind === 'review',
  );
  const gates: ReadinessGate[] = [
    {
      id: 'build',
      label: 'Build',
      status: hasErr ? 'fail' : 'pass',
      detail: hasErr ? 'compile error in 1 route' : 'all routes built',
    },
    {
      id: 'typecheck',
      label: 'Typecheck',
      status: hasErr ? 'warn' : 'pass',
      detail: hasErr ? '2 ts errors' : 'tsc -b clean',
    },
    {
      id: 'lint',
      label: 'Lint',
      status: hasWarn ? 'warn' : 'pass',
      detail: hasWarn ? `${risks.length} warnings` : 'no warnings',
    },
    {
      id: 'tests',
      label: 'Tests',
      status: 'pass',
      detail: 'all green',
    },
  ];

  return { verdict, score, reasons, gates };
}

/**
 * Compute the cockpit pulse from the current state of the existing stores.
 * Reads only via `getState()` — no subscription is created.
 */
export function deriveProjectPulse(): ProjectPulse {
  const routeState = useRouteStore.getState();
  const diagState = useDiagnosticStore.getState();
  const evidenceState = useEvidenceStore.getState();

  const routes = routeState.routes;
  const diagnostics = diagState.diagnostics;
  const packets = evidenceState.packets;

  const routePathById = new Map(routes.map((r) => [r.id, r.path]));
  const totals = deriveTotals(routes);
  const risks = pickRisks(diagnostics, packets, routePathById, 3);
  const recentShipped = mockShipped(routes);
  const deployReadiness = deriveReadiness(risks, packets);

  return {
    projectName: 'Next Static Studio',
    framework: 'Next 15.0.3',
    workspacePath: 'Demo workspace',
    totals,
    risks,
    recentShipped,
    deployReadiness,
    computedAt: Date.now(),
  };
}
