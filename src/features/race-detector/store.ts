// Zustand store wrapping the race detector. Pulls input source files from the
// existing source-files mock; runs the analyzer eagerly on first read.
import { create } from 'zustand';
import { mockSources } from '@shared/mocks/source-files';
import { analyzeRaceConditions, type SourceInputFile } from './detector';
import type { RaceReport } from './types';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

interface RaceDetectorStore {
  status: ScanStatus;
  report: RaceReport | null;
  error: string | null;
  expandedRiskId: string | null;
  lastScannedAt: number;

  runScan(): void;
  ensureScanned(): void;
  toggleExpanded(id: string): void;
}

function loadFiles(): SourceInputFile[] {
  return Object.entries(mockSources).map(([path, content]) => ({
    path,
    content,
  }));
}

export const useRaceDetectorStore = create<RaceDetectorStore>((set, get) => ({
  status: 'idle',
  report: null,
  error: null,
  expandedRiskId: null,
  lastScannedAt: 0,

  runScan: () => {
    set({ status: 'scanning', error: null });
    try {
      const report = analyzeRaceConditions(loadFiles());
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
