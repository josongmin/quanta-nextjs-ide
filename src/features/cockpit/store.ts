/**
 * Tiny zustand store that caches the most-recent computed `ProjectPulse`
 * so the cockpit can render from cache during rapid mounts/unmounts (e.g.
 * tab switches). The cache TTL is short — callers should still call
 * `refresh()` when they want a fresh derivation.
 */

import { create } from 'zustand';
import { deriveProjectPulse } from './derive';
import type { ProjectPulse } from './types';

const STALE_MS = 5_000;

interface CockpitState {
  pulse: ProjectPulse | null;
  lastComputedAt: number | null;
  /** Force a fresh derivation. */
  refresh(): ProjectPulse;
  /** Read the cached pulse, computing on first access or when stale. */
  read(): ProjectPulse;
  reset(): void;
}

export const useCockpitStore = create<CockpitState>((set, get) => ({
  pulse: null,
  lastComputedAt: null,
  refresh: () => {
    const next = deriveProjectPulse();
    set({ pulse: next, lastComputedAt: next.computedAt });
    return next;
  },
  read: () => {
    const { pulse, lastComputedAt } = get();
    if (pulse && lastComputedAt && Date.now() - lastComputedAt < STALE_MS) {
      return pulse;
    }
    return get().refresh();
  },
  reset: () => set({ pulse: null, lastComputedAt: null }),
}));
