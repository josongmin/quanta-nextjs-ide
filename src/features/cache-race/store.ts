// Zustand store wrapping the cache-race detector. Source of truth is the
// existing cache-tag store — we re-derive on each scan.
import { create } from 'zustand';
import { useCacheTagStore } from '@entities/cache-tag';
import { analyzeCacheRaces } from './detector';
import type { CacheRaceReport } from './types';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

interface CacheRaceStore {
  status: ScanStatus;
  report: CacheRaceReport | null;
  error: string | null;
  expandedRiskId: string | null;
  lastScannedAt: number;

  runScan(): void;
  ensureScanned(): void;
  toggleExpanded(id: string): void;
}

export const useCacheRaceStore = create<CacheRaceStore>((set, get) => ({
  status: 'idle',
  report: null,
  error: null,
  expandedRiskId: null,
  lastScannedAt: 0,

  runScan: () => {
    set({ status: 'scanning', error: null });
    try {
      const tags = useCacheTagStore.getState().tags;
      const report = analyzeCacheRaces(tags);
      set({
        status: 'ready',
        report,
        lastScannedAt: Date.now(),
      });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  ensureScanned: () => {
    if (get().status === 'idle') get().runScan();
  },

  toggleExpanded: (id) =>
    set({
      expandedRiskId: get().expandedRiskId === id ? null : id,
    }),
}));
