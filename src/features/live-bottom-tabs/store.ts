/**
 * Single zustand store with three slices:
 *   - liveEvents: chronological stream feeding the Live tab
 *   - cacheState: synthesized cache-tag liveness for the Cache tab
 *   - traceData:  ui state for the Trace tab (selected trace, sub-view)
 *
 * Sources (`./sources/*`) push into this store; the tabs subscribe.
 */

import { create } from 'zustand';
import type {
  CacheAggregate,
  CacheState,
  CacheTagLive,
  LiveEvent,
} from './types';

const MAX_EVENTS = 500;

type LiveFilter = 'all' | 'rsc' | 'actions' | 'cache' | 'errors';
type TraceSubView = 'flame' | 'waterfall' | 'spans';

interface LiveBottomTabsState {
  // ---- liveEvents slice ----
  events: LiveEvent[];
  filter: LiveFilter;
  search: string;
  paused: boolean;
  pushEvent: (e: LiveEvent) => void;
  pushEvents: (es: ReadonlyArray<LiveEvent>) => void;
  clearEvents: () => void;
  setFilter: (f: LiveFilter) => void;
  setSearch: (s: string) => void;
  togglePaused: () => void;

  // ---- cacheState slice ----
  cache: Record<string, CacheTagLive>;
  cacheOrder: string[];
  selectedCacheId: string | null;
  upsertCache: (entry: CacheTagLive) => void;
  setCacheState: (id: string, state: CacheState) => void;
  selectCache: (id: string | null) => void;
  recordInvalidation: (id: string, source: string) => void;

  // ---- traceData slice ----
  selectedTraceId: string | null;
  traceSubView: TraceSubView;
  setSelectedTraceId: (id: string | null) => void;
  setTraceSubView: (v: TraceSubView) => void;
}

export const useLiveBottomTabsStore = create<LiveBottomTabsState>((set) => ({
  events: [],
  filter: 'all',
  search: '',
  paused: false,

  pushEvent: (e) =>
    set((s) => ({
      events: [...s.events, e].slice(-MAX_EVENTS),
    })),

  pushEvents: (es) =>
    set((s) => ({
      events: [...s.events, ...es].slice(-MAX_EVENTS),
    })),

  clearEvents: () => set({ events: [] }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),

  cache: {},
  cacheOrder: [],
  selectedCacheId: null,

  upsertCache: (entry) =>
    set((s) => {
      const existed = entry.id in s.cache;
      return {
        cache: { ...s.cache, [entry.id]: entry },
        cacheOrder: existed ? s.cacheOrder : [...s.cacheOrder, entry.id],
        selectedCacheId: s.selectedCacheId ?? entry.id,
      };
    }),

  setCacheState: (id, state) =>
    set((s) => {
      const cur = s.cache[id];
      if (!cur) return s;
      const now = Date.now();
      const next: CacheTagLive = {
        ...cur,
        state,
        changedAt: now,
        ...(state === 'fresh' ? { freshAt: now, remainingMs: cur.ttlMs } : {}),
      };
      return { cache: { ...s.cache, [id]: next } };
    }),

  selectCache: (id) => set({ selectedCacheId: id }),

  recordInvalidation: (id, source) =>
    set((s) => {
      const cur = s.cache[id];
      if (!cur) return s;
      const stamped = { at: Date.now(), source };
      const next: CacheTagLive = {
        ...cur,
        state: 'revalidating',
        changedAt: stamped.at,
        recentInvalidations: [stamped, ...cur.recentInvalidations].slice(0, 5),
      };
      return { cache: { ...s.cache, [id]: next } };
    }),

  selectedTraceId: null,
  traceSubView: 'flame',
  setSelectedTraceId: (id) => set({ selectedTraceId: id }),
  setTraceSubView: (v) => set({ traceSubView: v }),
}));

// ---- Selectors ------------------------------------------------------------

export function selectFilteredEvents(s: LiveBottomTabsState): LiveEvent[] {
  const { events, filter, search } = s;
  const term = search.trim().toLowerCase();
  return events.filter((e) => {
    if (filter !== 'all') {
      if (filter === 'rsc' && e.kind !== 'rsc-chunk') return false;
      if (filter === 'actions' && e.kind !== 'server-action') return false;
      if (filter === 'cache' && e.kind !== 'revalidate') return false;
      if (filter === 'errors' && e.kind !== 'error') return false;
    }
    if (term && !e.summary.toLowerCase().includes(term)) return false;
    return true;
  });
}

export function selectCacheAggregate(s: LiveBottomTabsState): CacheAggregate {
  let fresh = 0;
  let stale = 0;
  let revalidating = 0;
  const ids = s.cacheOrder;
  for (const id of ids) {
    const e = s.cache[id];
    if (!e) continue;
    if (e.state === 'fresh') fresh += 1;
    else if (e.state === 'stale') stale += 1;
    else revalidating += 1;
  }
  return { total: ids.length, fresh, stale, revalidating };
}

/**
 * Returns cache entries sorted by state then by remaining-time ascending.
 * Stable across re-renders for the same input.
 */
export function selectSortedCache(s: LiveBottomTabsState): CacheTagLive[] {
  const order: Record<CacheState, number> = {
    revalidating: 0,
    stale: 1,
    fresh: 2,
  };
  return s.cacheOrder
    .map((id) => s.cache[id])
    .filter((e): e is CacheTagLive => !!e)
    .slice()
    .sort((a, b) => {
      const ds = order[a.state] - order[b.state];
      if (ds !== 0) return ds;
      return a.remainingMs - b.remainingMs;
    });
}

/** Helper used by sources to ensure ids are unique-enough for list keys. */
let _seq = 0;
export function nextEventId(prefix: string): string {
  _seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${_seq.toString(36)}`;
}
