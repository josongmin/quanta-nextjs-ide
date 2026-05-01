import type { StateCreator } from 'zustand';
import type { RecentItem } from './types';

export interface RecentsSlice {
  recents: RecentItem[];
  bookmarks: string[];
  pushRecent(item: Omit<RecentItem, 'at'>): void;
  toggleBookmark(id: string): void;
}

export const recentsPersistKeys = ['recents', 'bookmarks'] as const;

export const createRecentsSlice: StateCreator<
  RecentsSlice,
  [],
  [],
  RecentsSlice
> = (set) => ({
  recents: [],
  bookmarks: [],
  pushRecent: (item) =>
    set((s) => {
      const filtered = s.recents.filter(
        (r) => !(r.kind === item.kind && r.id === item.id),
      );
      const next: RecentItem[] = [{ ...item, at: Date.now() }, ...filtered].slice(
        0,
        12,
      );
      return { recents: next };
    }),
  toggleBookmark: (id) =>
    set((s) => ({
      bookmarks: s.bookmarks.includes(id)
        ? s.bookmarks.filter((b) => b !== id)
        : [...s.bookmarks, id],
    })),
});
