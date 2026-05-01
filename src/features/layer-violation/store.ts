/**
 * Layer-violation store — keeps the latest scan result and any user-edited
 * layer overrides (so a team can rebrand `service` as `domain`, etc.).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_LAYERS } from './config';
import type { LayerDefinition, ViolationReport } from './types';

interface LayerViolationState {
  layers: ReadonlyArray<LayerDefinition>;
  report: ViolationReport;
  setLayers(next: ReadonlyArray<LayerDefinition>): void;
  setReport(report: ViolationReport): void;
  reset(): void;
}

const EMPTY_REPORT: ViolationReport = {
  violations: [],
  scanned: 0,
  edges: 0,
};

export const useLayerViolationStore = create<LayerViolationState>()(
  persist(
    (set) => ({
      layers: DEFAULT_LAYERS,
      report: EMPTY_REPORT,
      setLayers: (next) => set({ layers: next }),
      setReport: (report) => set({ report }),
      reset: () => set({ layers: DEFAULT_LAYERS, report: EMPTY_REPORT }),
    }),
    {
      name: 'quanta.layerViolation',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ layers: s.layers }),
    },
  ),
);
