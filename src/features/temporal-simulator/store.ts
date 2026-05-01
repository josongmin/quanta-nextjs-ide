// Zustand store for the temporal cache simulator.
//
// Holds:
//   • the currently-selected tag/timeline
//   • the cursor position (seconds from t=0)
//   • playback state (paused / playing) — used by index.tsx for the scrubber
import { create } from 'zustand';
import { useCacheTagStore } from '@entities/cache-tag';
import { buildTimelinesForTags } from './scenario';
import type { Timeline } from './types';

interface TemporalSimStore {
  /** Lazily-built list — derived from the cache-tag store on first access. */
  timelines: Timeline[];
  selectedTimelineId: string | null;
  /** Cursor seconds. */
  tSec: number;
  isPlaying: boolean;
  /** Real-time multiplier: 1× = wallclock, 4× = 4s sim per 1s real. */
  speed: 1 | 2 | 4 | 8;

  ensureBuilt(): void;
  selectTimeline(id: string): void;
  setCursor(t: number): void;
  togglePlay(): void;
  setSpeed(s: 1 | 2 | 4 | 8): void;
  selectedTimeline(): Timeline | undefined;
}

export const useTemporalSimStore = create<TemporalSimStore>((set, get) => ({
  timelines: [],
  selectedTimelineId: null,
  tSec: 0,
  isPlaying: false,
  speed: 2,

  ensureBuilt: () => {
    if (get().timelines.length > 0) return;
    const tags = useCacheTagStore.getState().tags;
    const timelines = buildTimelinesForTags(tags);
    set({
      timelines,
      selectedTimelineId: timelines[0]?.id ?? null,
      tSec: 0,
    });
  },

  selectTimeline: (id) => set({ selectedTimelineId: id, tSec: 0, isPlaying: false }),

  setCursor: (t) => {
    const tl = get().selectedTimeline();
    const horizon = tl?.horizonSec ?? 60;
    const clamped = Math.max(0, Math.min(horizon, t));
    set({ tSec: clamped });
  },

  togglePlay: () => set({ isPlaying: !get().isPlaying }),

  setSpeed: (speed) => set({ speed }),

  selectedTimeline: () => {
    const { timelines, selectedTimelineId } = get();
    return timelines.find((t) => t.id === selectedTimelineId);
  },
}));
