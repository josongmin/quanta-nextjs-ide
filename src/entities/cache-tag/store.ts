import { create } from 'zustand';
import type { CacheTag } from '@shared/types';
import { mockCacheTags } from '@shared/mocks/cache-tags';

interface CacheTagStore {
  tags: CacheTag[];
  selectedTagId: string | null;
  view: 'list' | 'graph';
  setSelected(id: string | null): void;
  setView(v: 'list' | 'graph'): void;
  byId(id: string): CacheTag | undefined;
  byName(name: string): CacheTag | undefined;
  forRoute(routeId: string): CacheTag[];
  withProducers(): CacheTag[];
  withInvalidators(): CacheTag[];
}

export const useCacheTagStore = create<CacheTagStore>((set, get) => ({
  tags: mockCacheTags,
  selectedTagId: mockCacheTags[0]?.id ?? null,
  view: 'list',
  setSelected: (id) => set({ selectedTagId: id }),
  setView: (v) => set({ view: v }),
  byId: (id) => get().tags.find((t) => t.id === id),
  byName: (name) => get().tags.find((t) => t.name === name),
  forRoute: (routeId) =>
    get().tags.filter((t) => t.affectedRouteIds.includes(routeId)),
  withProducers: () => get().tags.filter((t) => t.producers.length > 0),
  withInvalidators: () => get().tags.filter((t) => t.invalidators.length > 0),
}));

// Standalone selectors
export const selectCacheTags = (s: CacheTagStore): CacheTag[] => s.tags;
export const selectCacheTagById =
  (id: string) =>
  (s: CacheTagStore): CacheTag | undefined =>
    s.tags.find((t) => t.id === id);
export const selectCacheTagByName =
  (name: string) =>
  (s: CacheTagStore): CacheTag | undefined =>
    s.tags.find((t) => t.name === name);
export const selectCacheTagsForRoute =
  (routeId: string) =>
  (s: CacheTagStore): CacheTag[] =>
    s.tags.filter((t) => t.affectedRouteIds.includes(routeId));
