// Zustand store for the `'use cache'` analyzer's output.
//
// On first read the store kicks off an async scan over the bundled fixture
// sources (loaded via `import.meta.glob` at build time). The actual scan
// runs in a Web Worker — see `@shared/analyzer/use-cache-client` — so the
// ts-morph payload stays out of the main app bundle.
//
// `runScan` re-runs the analyzer; useful for the overlay's "Re-scan" button.
import { create } from 'zustand';
import { analyzeUseCacheAsync } from '@shared/analyzer/use-cache-client';
import { loadFixtureFiles } from '@shared/analyzer/fixtures';
import type { UseCacheReport, UseCacheKind } from './types';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

interface CacheDirectiveStore {
  status: ScanStatus;
  report: UseCacheReport | null;
  error: string | null;
  /** Last scan timestamp (epoch ms). 0 if never scanned. */
  lastScannedAt: number;
  runScan(): Promise<void>;
  ensureScanned(): void;
  countsByKind(): Record<UseCacheKind, number>;
}

const EMPTY_COUNTS: Record<UseCacheKind, number> = {
  'has-directive': 0,
  candidate: 0,
  unsafe: 0,
};

export const useCacheDirectiveStore = create<CacheDirectiveStore>((set, get) => ({
  status: 'idle',
  report: null,
  error: null,
  lastScannedAt: 0,

  runScan: async () => {
    set({ status: 'scanning', error: null });
    try {
      const files = loadFixtureFiles();
      const report = await analyzeUseCacheAsync(files);
      set({
        status: 'ready',
        report,
        lastScannedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  ensureScanned: () => {
    const s = get();
    if (s.status === 'idle') {
      // Fire-and-forget — store state transitions drive the UI.
      void s.runScan();
    }
  },

  countsByKind: () => {
    const r = get().report;
    if (!r) return EMPTY_COUNTS;
    const counts = { ...EMPTY_COUNTS };
    for (const f of r.findings) counts[f.kind] += 1;
    return counts;
  },
}));
