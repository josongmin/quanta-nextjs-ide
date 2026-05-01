/**
 * Local store for the cost predictor.
 *
 * Tracks the user's chosen provider, traffic assumption, and a snapshot of
 * the "previous" rendering buckets so we can compute diff cards when a
 * route gets promoted from static → dynamic.
 */

import { create } from 'zustand';
import type { Route } from '@shared/types';
import { bucketFor, DEFAULT_PROVIDER, type CostBucket, type Provider } from './model';

interface CostState {
  provider: Provider;
  /** Default monthly request volume per route (used when no override). */
  trafficPerMonth: number;
  /** Last snapshot of route → bucket so we can show diffs. */
  baseline: Map<string, CostBucket>;
  setProvider(p: Provider): void;
  setTraffic(n: number): void;
  snapshot(routes: ReadonlyArray<Route>): void;
  clearBaseline(): void;
}

export const useCostStore = create<CostState>((set) => ({
  provider: DEFAULT_PROVIDER,
  trafficPerMonth: 1_000_000,
  baseline: new Map(),
  setProvider: (p) => set({ provider: p }),
  setTraffic: (n) => set({ trafficPerMonth: Math.max(0, Math.round(n)) }),
  snapshot: (routes) => {
    const next = new Map<string, CostBucket>();
    for (const r of routes) {
      const isEdge = r.costClass === 'A' && r.rendering !== 'static';
      next.set(r.id, bucketFor(r.rendering, isEdge));
    }
    set({ baseline: next });
  },
  clearBaseline: () => set({ baseline: new Map() }),
}));
