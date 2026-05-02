/**
 * Ship-it Drawer store.
 *
 * Holds the last aggregation snapshot, the in-flight aggregating flag,
 * the last shipped timestamp + URL, and a small action surface
 * (`refresh`, `runAllChecks`, `markShipped`).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useRunnerStore, type RunnerKindLabel } from '@shared/runner';
import { aggregate } from './aggregator';
import type { ShipReadiness, ShipResult } from './types';

const STORAGE_KEY = 'quanta.shipDrawer';

const ALL_CHECKS: RunnerKindLabel[] = ['build', 'typecheck', 'lint', 'test'];

interface ShipDrawerState {
  /** Last aggregation result (null until first compute). */
  readiness: ShipReadiness | null;
  /** True while an aggregator pass / runner kickoff is in flight. */
  isAggregating: boolean;
  /** True while a Vercel deploy is in progress. */
  isShipping: boolean;
  /** Last successful ship timestamp (epoch ms). */
  lastShippedAt: number | null;
  /** Last ship URL (Vercel deployment URL or PR URL). */
  lastShipUrl: string | null;
  /** Last ship result for inline display. */
  lastShipResult: ShipResult | null;

  // ---- actions ----
  refresh(): ShipReadiness;
  setAggregating(on: boolean): void;
  setShipping(on: boolean): void;
  runAllChecks(workspaceRoot?: string): Promise<void>;
  markShipped(result: ShipResult): void;
  reset(): void;
}

export const useShipDrawerStore = create<ShipDrawerState>()(
  persist(
    (set) => ({
      readiness: null,
      isAggregating: false,
      isShipping: false,
      lastShippedAt: null,
      lastShipUrl: null,
      lastShipResult: null,

      refresh() {
        const r = aggregate();
        set({ readiness: r });
        return r;
      },

      setAggregating(on) {
        set({ isAggregating: on });
      },

      setShipping(on) {
        set({ isShipping: on });
      },

      async runAllChecks(workspaceRoot) {
        set({ isAggregating: true });
        const runner = useRunnerStore.getState();
        try {
          // Kick off all four checks in parallel; we don't block on
          // completion — events update the runner store and a follow-up
          // refresh() will pick up the new state.
          await Promise.all(
            ALL_CHECKS.map((k) => runner.startByLabel(k, workspaceRoot)),
          );
        } catch {
          /* ignore — surfaced via runner.lastError */
        } finally {
          // Refresh once now (state is "running"), then again after a
          // microtask so chips animate in.
          set({ readiness: aggregate() });
          setTimeout(() => {
            set({ readiness: aggregate(), isAggregating: false });
          }, 250);
        }
      },

      markShipped(result) {
        if (result.ok) {
          set({
            lastShippedAt: Date.now(),
            lastShipUrl: result.url ?? null,
            lastShipResult: result,
            isShipping: false,
          });
        } else {
          set({ lastShipResult: result, isShipping: false });
        }
      },

      reset() {
        set({
          readiness: null,
          isAggregating: false,
          isShipping: false,
          lastShipResult: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        lastShippedAt: s.lastShippedAt,
        lastShipUrl: s.lastShipUrl,
      }),
    },
  ),
);

/** Selector: human-friendly relative time string for "last shipped". */
export function selectLastShippedRelative(s: ShipDrawerState): string | null {
  if (!s.lastShippedAt) return null;
  const diff = Date.now() - s.lastShippedAt;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

/** Top-bar dot tone derived from cached aggregator. */
export function selectShipDot(s: ShipDrawerState): 'green' | 'amber' | 'red' | 'neutral' {
  if (!s.readiness) return 'neutral';
  switch (s.readiness.shipState) {
    case 'ready':
      return 'green';
    case 'risky':
      return 'amber';
    case 'blocked':
      return 'red';
    default:
      return 'neutral';
  }
}
