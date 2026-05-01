/**
 * Local store for the hotspot detector. Mostly UI state — the heat scores
 * themselves are derived in the overlay via useMemo since they depend on
 * the diagnostic and code-graph stores.
 */

import { create } from 'zustand';

export type HotspotView = 'treemap' | 'list';

interface HotspotState {
  view: HotspotView;
  filter: string;
  selectedFile: string | null;
  /** True when the user has connected a (mock) git source for churn data. */
  gitConnected: boolean;
  setView(v: HotspotView): void;
  setFilter(s: string): void;
  setSelected(f: string | null): void;
  setGitConnected(b: boolean): void;
}

export const useHotspotStore = create<HotspotState>((set) => ({
  view: 'treemap',
  filter: '',
  selectedFile: null,
  gitConnected: false,
  setView: (v) => set({ view: v }),
  setFilter: (s) => set({ filter: s }),
  setSelected: (f) => set({ selectedFile: f }),
  setGitConnected: (b) => set({ gitConnected: b }),
}));
