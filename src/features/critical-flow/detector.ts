/**
 * Critical flow detector.
 *
 * Scans Routes + ServerActions and groups any whose path/file/name match
 * one of the kind heuristics. Pure function — no I/O, no store access.
 *
 * Confidence is computed as `min(1, sum_of_weights / 2)` so a single
 * strong match yields ~0.5 and two reinforcing matches saturate.
 */

import type { Route } from '@shared/types/route';
import type { ServerAction } from '@shared/types/server-action';
import { FLOW_HEURISTICS, severityFromConfidence } from './heuristics';
import type {
  CriticalFlow,
  CriticalFlowKind,
  CriticalFlowSignal,
} from './types';

interface Bucket {
  kind: CriticalFlowKind;
  label: string;
  routes: Set<string>;
  actions: Set<string>;
  signals: CriticalFlowSignal[];
  weightSum: number;
}

function emptyBucket(kind: CriticalFlowKind, label: string): Bucket {
  return {
    kind,
    label,
    routes: new Set(),
    actions: new Set(),
    signals: [],
    weightSum: 0,
  };
}

function matchKeyword(name: string, keywords: string[]): string | undefined {
  const lower = name.toLowerCase();
  return keywords.find((k) => lower.includes(k.toLowerCase()));
}

export function detectCriticalFlows(
  routes: Route[],
  actions: ServerAction[],
): CriticalFlow[] {
  const buckets = new Map<CriticalFlowKind, Bucket>();

  for (const h of FLOW_HEURISTICS) {
    if (!buckets.has(h.kind)) {
      buckets.set(h.kind, emptyBucket(h.kind, h.label));
    }
    const bucket = buckets.get(h.kind)!;

    for (const r of routes) {
      const haystack = `${r.path} ${r.files.page ?? ''} ${r.files.layout ?? ''}`;
      const m = haystack.match(h.pattern);
      if (m) {
        bucket.routes.add(r.id);
        bucket.signals.push({
          source: r.path,
          matched: `path:${m[0]}`,
          weight: h.weight,
        });
        bucket.weightSum += h.weight;
      }
    }

    for (const a of actions) {
      const fileMatch = h.pattern.test(a.file);
      const kw = matchKeyword(a.name, h.keywords);
      if (fileMatch || kw) {
        bucket.actions.add(a.id);
        bucket.signals.push({
          source: a.name,
          matched: kw ? `keyword:${kw}` : `file:${a.file}`,
          weight: h.weight * (kw ? 1 : 0.6),
        });
        bucket.weightSum += h.weight * (kw ? 1 : 0.6);
      }
    }
  }

  const flows: CriticalFlow[] = [];
  for (const bucket of buckets.values()) {
    if (bucket.routes.size === 0 && bucket.actions.size === 0) continue;
    const confidence = Math.min(1, bucket.weightSum / 2);
    flows.push({
      id: `flow_${bucket.kind}`,
      kind: bucket.kind,
      label: bucket.label,
      routes: [...bucket.routes].sort(),
      actions: [...bucket.actions].sort(),
      confidence,
      severity: severityFromConfidence(confidence, bucket.kind),
      signals: bucket.signals,
    });
  }

  // Stable order: severity desc, then kind alpha.
  const sevWeight = { critical: 4, high: 3, medium: 2, low: 1 } as const;
  flows.sort((a, b) => {
    const ds = sevWeight[b.severity] - sevWeight[a.severity];
    if (ds !== 0) return ds;
    return a.kind.localeCompare(b.kind);
  });

  return flows;
}

/** True when the route or action belongs to ANY auto-detected flow. */
export function isCriticalRouteId(flows: CriticalFlow[], routeId: string): boolean {
  return flows.some((f) => f.routes.includes(routeId));
}

export function flowsForRoute(
  flows: CriticalFlow[],
  routeId: string,
): CriticalFlow[] {
  return flows.filter((f) => f.routes.includes(routeId));
}

export function flowsForAction(
  flows: CriticalFlow[],
  actionId: string,
): CriticalFlow[] {
  return flows.filter((f) => f.actions.includes(actionId));
}

/** Returns the set of CriticalFlowKinds touched by the change's files. */
export function flowKindsForChange(
  flows: CriticalFlow[],
  routes: Route[],
  actions: ServerAction[],
  changedFiles: string[],
): CriticalFlowKind[] {
  const touchedRouteIds = new Set(
    routes
      .filter((r) =>
        changedFiles.some(
          (f) =>
            f === r.files.page ||
            f === r.files.layout ||
            f === r.files.loading ||
            f === r.files.error,
        ),
      )
      .map((r) => r.id),
  );
  const touchedActionIds = new Set(
    actions.filter((a) => changedFiles.includes(a.file)).map((a) => a.id),
  );
  const kinds = new Set<CriticalFlowKind>();
  for (const f of flows) {
    if (
      f.routes.some((rid) => touchedRouteIds.has(rid)) ||
      f.actions.some((aid) => touchedActionIds.has(aid))
    ) {
      kinds.add(f.kind);
    }
  }
  // Fallback: heuristic match against the raw filenames (covers files
  // that didn't resolve to a known route entity).
  for (const f of flows) {
    if (kinds.has(f.kind)) continue;
    const heuristic = FLOW_HEURISTICS.find((h) => h.kind === f.kind);
    if (!heuristic) continue;
    if (changedFiles.some((cf) => heuristic.pattern.test(cf))) {
      kinds.add(f.kind);
    }
  }
  return [...kinds];
}
