/**
 * Per-route cost calculation.
 *
 * Inputs:
 *   - the route's rendering class (already classified by render-reasoner)
 *   - a traffic estimate per route (or a global default)
 *   - the provider pricing
 *
 * Output: a row per route plus the rolled-up total, plus diff cards if the
 * caller passes a "previous classification" map (to show "+$N when route
 * promoted from static → dynamic").
 */

import type { Route } from '@shared/types';
import {
  bucketFor,
  ratePerMillion,
  type CostBucket,
  type ProviderPricing,
} from './model';

export interface RouteCostRow {
  routeId: string;
  path: string;
  bucket: CostBucket;
  /** Monthly request volume in absolute requests (not millions). */
  trafficPerMonth: number;
  /** USD per request. */
  perRequest: number;
  /** USD per month for this route alone. */
  monthly: number;
}

export interface CostBreakdown {
  rows: RouteCostRow[];
  totalMonthly: number;
  byBucket: Record<CostBucket, number>;
}

export interface CostDiff {
  routeId: string;
  path: string;
  fromBucket: CostBucket;
  toBucket: CostBucket;
  monthlyDelta: number;
}

export function calculateCosts(
  routes: ReadonlyArray<Route>,
  pricing: ProviderPricing,
  defaultTrafficPerMonth: number,
  trafficOverrides?: ReadonlyMap<string, number>,
): CostBreakdown {
  const rows: RouteCostRow[] = [];
  const byBucket: Record<CostBucket, number> = {
    static: 0,
    isr: 0,
    ssr: 0,
    edge: 0,
  };
  let total = 0;

  for (const r of routes) {
    // Heuristic: route uses edge if its `costClass` is 'A' (cheap) AND
    // it's dynamic. We don't have explicit runtime here so this is a
    // best-effort hint.
    const isEdge = r.costClass === 'A' && r.rendering !== 'static';
    const bucket = bucketFor(r.rendering, isEdge);
    const traffic = trafficOverrides?.get(r.id) ?? defaultTrafficPerMonth;
    const perReq = ratePerMillion(pricing, bucket) / 1_000_000;
    const monthly = perReq * traffic;
    byBucket[bucket] += monthly;
    total += monthly;
    rows.push({
      routeId: r.id,
      path: r.path,
      bucket,
      trafficPerMonth: traffic,
      perRequest: perReq,
      monthly,
    });
  }

  return { rows, totalMonthly: total, byBucket };
}

/**
 * Compare a "current" calculation against a baseline `previousBuckets`
 * snapshot. Returns one diff entry per route whose bucket changed.
 *
 * `previousBuckets` is keyed by routeId; missing entries are skipped.
 */
export function diffCosts(
  current: CostBreakdown,
  previousBuckets: ReadonlyMap<string, CostBucket>,
  pricing: ProviderPricing,
): CostDiff[] {
  const diffs: CostDiff[] = [];
  for (const row of current.rows) {
    const prev = previousBuckets.get(row.routeId);
    if (!prev || prev === row.bucket) continue;
    const prevPerReq = ratePerMillion(pricing, prev) / 1_000_000;
    const prevMonthly = prevPerReq * row.trafficPerMonth;
    diffs.push({
      routeId: row.routeId,
      path: row.path,
      fromBucket: prev,
      toBucket: row.bucket,
      monthlyDelta: row.monthly - prevMonthly,
    });
  }
  diffs.sort((a, b) => Math.abs(b.monthlyDelta) - Math.abs(a.monthlyDelta));
  return diffs;
}

export function formatUsd(amount: number): string {
  if (amount === 0) return '$0';
  if (Math.abs(amount) < 0.01) return amount > 0 ? '<$0.01' : '<-$0.01';
  if (Math.abs(amount) < 1) return `$${amount.toFixed(2)}`;
  if (Math.abs(amount) < 100) return `$${amount.toFixed(2)}`;
  return `$${amount.toFixed(0)}`;
}
