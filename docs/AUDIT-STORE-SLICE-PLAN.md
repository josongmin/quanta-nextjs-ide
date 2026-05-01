# Store Slice Plan — `src/app/store/ui.store.ts`

Status: PROPOSED — no code changes applied. This document captures the
current shape of `useUiStore` and a proposed refactor into composed slices
so the file can be split safely later without breaking any consumer.

## Why slice now?

`ui.store.ts` is currently a single ~660-line module that mixes seven
distinct concerns under one Zustand store:

| Concern | Approx. lines | Surface |
| --- | --- | --- |
| Layout (panels / widths / heights / tabs) | 535–565 | `leftPanelOpen`, `rightPanelOpen`, `bottomPanelOpen`, `leftPanelWidth`, `rightPanelWidth`, `bottomPanelHeight`, `leftTab`, `bottomTab` plus toggles/setters |
| Inspector context | 542–569 | `inspectorContext`, `inspectorPinned`, `setInspectorContext`, `toggleInspectorPinned` |
| Preferences (density / profile / color / autofix / onboarding) | 545–574 | `density`, `profile`, `colorMode`, `autofixPolicy`, `onboardingComplete` plus setters |
| **Overlays** (the 800-lb gorilla) | 55–530, 575–604 | `OverlayState` shape with **190+ overlay slot keys**, `openOverlay`, `closeOverlay`, `pin`, `unpin` |
| Recents (MRU file/route/action/tag) | 605–610 | `recents`, `pushRecent` |
| Bookmarks | 611–616 | `bookmarks`, `toggleBookmark` |
| Focus mode + Annotations | 617–635 | `focusMode`, `toggleFocusMode`, `setFocusMode`, `annotations`, `addAnnotation`, `removeAnnotation` |

The overlays slice alone declares **190+ entries** (one per registered
overlay across Waves 8–13) plus an identically shaped `initialOverlays`
constant — about 380 lines of mostly mechanical declarations.

Risks of leaving as-is:
- Any new wave adds two duplicate places to update (`OverlayState` interface
  and `initialOverlays`). Drift is easy.
- Hot reload diffs are large because edits to one concern touch a shared module.
- Test setups can't mock just the overlay slice without the whole store.
- Type narrowing on `openOverlay<K extends keyof OverlayState>` traverses a
  giant union on every call site.

## Proposed slice topology (Zustand "slices" pattern)

Split `ui.store.ts` into one composed root + six slice files. The
composed `useUiStore` keeps its current public type and is still the only
hook exported, so consumers continue to work unchanged.

```
src/app/store/
├─ index.ts                       (re-exports useUiStore, useEditorStore, types)
├─ editor.store.ts                (unchanged)
└─ ui/
   ├─ ui.store.ts                 ← create<UiStore>()(persist((...a) => ({
   │                                  ...createLayoutSlice(...a),
   │                                  ...createInspectorSlice(...a),
   │                                  ...createPrefsSlice(...a),
   │                                  ...createOverlaysSlice(...a),
   │                                  ...createRecentsSlice(...a),
   │                                  ...createBookmarksSlice(...a),
   │                                  ...createFocusAnnotationsSlice(...a),
   │                                }), { ...persistOpts }))
   ├─ types.ts                    (LeftTab, BottomTab, InspectorContext,
   │                               Density, InspectionProfile, ColorMode,
   │                               AutofixPolicy, RecentItem)
   ├─ slice.layout.ts             (LayoutSlice — panels/widths/tabs)
   ├─ slice.inspector.ts          (InspectorSlice)
   ├─ slice.prefs.ts              (PrefsSlice — density/profile/color/autofix/onboarding)
   ├─ slice.overlays.ts           (OverlaysSlice + OverlayState + initialOverlays)
   ├─ slice.recents.ts            (RecentsSlice)
   ├─ slice.bookmarks.ts          (BookmarksSlice)
   └─ slice.focus-annotations.ts  (FocusAnnotationsSlice)
```

Each slice exports a creator of the form:

```ts
import type { StateCreator } from 'zustand';
export type LayoutSlice = { ... };
export const createLayoutSlice: StateCreator<UiStore, [], [], LayoutSlice> =
  (set) => ({ ... });
```

`UiStore = LayoutSlice & InspectorSlice & PrefsSlice & OverlaysSlice
       & RecentsSlice & BookmarksSlice & FocusAnnotationsSlice`.

## Sub-plan for the OverlaysSlice (high-leverage)

`OverlayState` and `initialOverlays` are paired — every overlay key must
appear in both. Two complementary cleanups can land alongside the slice
split:

1. **Generate `initialOverlays` from a key list.** Replace the 190-entry
   manual literal with:
   ```ts
   const overlayKeys = [
     'evidenceTracer', 'blastRadius', 'whatIf', /* ... */
   ] as const;
   const initialOverlays = Object.fromEntries(
     overlayKeys.map((k) => [k, defaultOverlayStateFor(k)]),
   ) as OverlayState;
   ```
   `defaultOverlayStateFor` returns `{ open: false }` plus any per-overlay
   default fields (e.g. `onboarding: { open: false, step: 0 }`).

2. **Co-locate slot metadata.** `slice.overlays.ts` can also export
   `overlayEntries` (currently in `widgets/overlays/overlays-host.tsx`) so
   the registry of slot → lazy component is owned by the same file as
   the slot keys. This removes the chance of registering a slot in
   `OverlayState` but forgetting to wire it in `overlays-host.tsx`.

## Migration sequence (proposed, NOT applied here)

1. Add `src/app/store/ui/types.ts`. Re-export from `ui.store.ts`. (no behavior change)
2. Create `slice.layout.ts`. Replace inline body with `...createLayoutSlice(...a)`. Verify build.
3. Repeat for `slice.inspector.ts`, `slice.prefs.ts`, `slice.recents.ts`,
   `slice.bookmarks.ts`, `slice.focus-annotations.ts`. After each step:
   `npx tsc -b && npm run build`.
4. Last and largest: `slice.overlays.ts`. Move `OverlayState`,
   `initialOverlays`, `openOverlay`, `closeOverlay`, `pin`, `unpin`. Keep
   `OverlayState` exported from the same path (`@app/store`) to preserve
   `import type { OverlayState } from '@app/store'` in consumers.
5. Add `partialize` ownership per slice — each slice exposes a
   `pickPersistKeys(state)` helper that the root combines, so persistence
   is no longer one giant inline literal.

## Persistence considerations

Current `persist` config:
- `name: 'nss-ui'`
- `version: 2`
- `partialize` excludes `overlays` and `inspectorContext` (correct — overlays
  are ephemeral, inspector context is recomputed at runtime).

A slice split must keep the partialize exclusions identical to avoid
re-hydrating overlays as `{ open: true }` from a stale localStorage entry.

## Risk and rollback

- Each slice extraction is a strict mechanical move (cut/paste under a
  `StateCreator` wrapper). No behavior changes.
- `useUiStore` remains the only externally referenced symbol; the typed
  shape is preserved by intersecting the slice types.
- If any step turns the build red, revert that one slice file —
  preceding slices stay intact.

## Out of scope (defer)

- Splitting `editor.store.ts` (separate concern, much smaller).
- Switching off `persist` — the localStorage payload is already bounded
  by `partialize` plus the existing 200-annotation cap.
- Replacing Zustand with another store — not warranted by this refactor.
