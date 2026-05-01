// Composed UI store. The store body lives in slice files under ./ui/*.
// This module is a thin composer that preserves the public API:
//   - `useUiStore` hook
//   - exported types: LeftTab, BottomTab, InspectorContext, Density,
//     InspectionProfile, ColorMode, AutofixPolicy, OverlayState, RecentItem
//   - persist payload shape under localStorage key 'nss-ui' v2
//
// All 234 importers calling `useUiStore((s) => s.foo)` continue to work
// unchanged because the composed state type is the intersection of every
// slice's state and actions.

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  createLayoutSlice,
  layoutPersistKeys,
  type LayoutSlice,
} from './ui/layout.slice';
import {
  createPrefsSlice,
  prefsPersistKeys,
  type PrefsSlice,
} from './ui/prefs.slice';
import {
  createInspectorSlice,
  type InspectorSlice,
} from './ui/inspector.slice';
import {
  createOverlaysSlice,
  type OverlaysSlice,
} from './ui/overlays.slice';
import {
  createRecentsSlice,
  recentsPersistKeys,
  type RecentsSlice,
} from './ui/recents.slice';
import {
  createAnnotationsSlice,
  annotationsPersistKeys,
  type AnnotationsSlice,
} from './ui/annotations.slice';

// Re-export types so `import type { ... } from '@app/store'` still works.
export type {
  LeftTab,
  BottomTab,
  InspectorContext,
  Density,
  InspectionProfile,
  ColorMode,
  AutofixPolicy,
  RecentItem,
} from './ui/types';
export type { OverlayState } from './ui/overlays.slice';

export type UiStore = LayoutSlice &
  PrefsSlice &
  InspectorSlice &
  OverlaysSlice &
  RecentsSlice &
  AnnotationsSlice;

// Slice creators are written against their own slice type. Composition
// requires casting the creator to the full UiStore creator type — this is
// the canonical Zustand slice pattern and is type-safe because each
// slice's set/get only touches its own fields.
const compose: StateCreator<UiStore, [], [], UiStore> = (...a) => ({
  ...(createLayoutSlice as unknown as StateCreator<UiStore, [], [], LayoutSlice>)(...a),
  ...(createPrefsSlice as unknown as StateCreator<UiStore, [], [], PrefsSlice>)(...a),
  ...(createInspectorSlice as unknown as StateCreator<UiStore, [], [], InspectorSlice>)(...a),
  ...(createOverlaysSlice as unknown as StateCreator<UiStore, [], [], OverlaysSlice>)(...a),
  ...(createRecentsSlice as unknown as StateCreator<UiStore, [], [], RecentsSlice>)(...a),
  ...(createAnnotationsSlice as unknown as StateCreator<UiStore, [], [], AnnotationsSlice>)(...a),
});

export const useUiStore = create<UiStore>()(
  persist(compose, {
    name: 'nss-ui',
    version: 2,
    storage: createJSONStorage(() => localStorage),
    // partialize must produce the exact same JSON shape as before to keep
    // existing localStorage payloads valid.
    partialize: (state) => {
      const picked: Record<string, unknown> = {};
      for (const k of layoutPersistKeys) picked[k] = state[k];
      for (const k of prefsPersistKeys) picked[k] = state[k];
      for (const k of recentsPersistKeys) picked[k] = state[k];
      for (const k of annotationsPersistKeys) picked[k] = state[k];
      return picked as Pick<
        UiStore,
        | (typeof layoutPersistKeys)[number]
        | (typeof prefsPersistKeys)[number]
        | (typeof recentsPersistKeys)[number]
        | (typeof annotationsPersistKeys)[number]
      >;
    },
  }),
);
