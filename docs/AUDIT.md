# Architecture Audit — 2026-05-01

## TL;DR
- bundle (main entry): **2072.51 kB / gzip 507.21 kB → 528.22 kB / gzip 133.93 kB**
- delta: **−1544 kB raw / −373 kB gzip** (≈73% main-chunk reduction)
- typecheck (`tsc -b`): pass
- build (`npm run build`): pass

The win comes from converting the 183-overlay registry in `overlays-host.tsx`
from eager named imports into per-slot `React.lazy` chunks gated behind a
scalar `open` selector. Each overlay now ships as its own ~5–22 kB chunk and
is downloaded only when the user opens it.

## Findings

### 1. Bundle size — `OverlaysHost` eagerly imported all 183 overlays
- **Severity**: high
- **Where**: `src/widgets/overlays/overlays-host.tsx` (entire file)
- **Symptom**: every overlay (~150 + Wave 12/13 additions) was a top-level
  `import { XOverlay } from '@features/x'`, dragging every feature's
  helpers, types, and dependent shared code into the main chunk. Result: a
  2 MB / 499 kB-gzip main chunk and a critical-path warning at every build.
- **Fix applied**: yes. Rewrote `overlays-host.tsx` to a data-driven
  registry (`overlayEntries: { slot, Component }[]`). Each `Component` is
  a `React.lazy(() => import('@features/...'))`, wrapped in a single
  per-slot gate component (`LazyOverlaySlot`) that subscribes only to
  `s.overlays[slot].open` and renders nothing while closed. When the slot
  opens, Suspense (with `fallback={null}`) resolves the chunk and mounts
  the real overlay. Slot-key map verified against `OverlayState` in
  `ui.store.ts` — all 183 slots line up, no stragglers.
- **Recommendation if not applied**: n/a.

### 2. `useGlobalKeybindings` subscribed to the entire `overlays` object
- **Severity**: med
- **Where**: `src/features/keybindings/keybindings.tsx:55`
- **Symptom**: `const overlays = useUiStore((s) => s.overlays)` makes the
  hook re-render and re-bind its `keydown` listener every time *any*
  overlay opens or closes (150+ slots, all in one object). Listener was
  being torn down/rebuilt several times per session for no benefit.
- **Fix applied**: yes. Removed the subscription; the Escape branch now
  calls `useUiStore.getState().overlays` inside the keydown handler so
  the effect's deps no longer include the entire overlay state. Listener
  is registered once.
- **Recommendation if not applied**: n/a.

### 3. `addAnnotation` had no upper bound
- **Severity**: med (latent — UX rarely creates many annotations, but
  these are persisted to `localStorage` via the `nss-ui` key)
- **Where**: `src/app/store/ui.store.ts` `addAnnotation`
- **Symptom**: unbounded array growth → unbounded `localStorage`
  payload. `recents` is already capped at 12; `annotations` was not.
- **Fix applied**: yes. Capped at the most recent 200 entries (`MAX_ANNOTATIONS`).
  `bookmarks` is bounded by the universe of bookmarkable IDs already so
  no cap was added there.
- **Recommendation if not applied**: n/a.

### 4. Pre-existing latent TS errors masked by stale `tsbuildinfo`
- **Severity**: low (build-blocking once cache invalidates, but the
  shipped behavior is unchanged)
- **Where**:
  - `src/features/websocket-inspector/index.tsx:13` — unused
    `type WSConnection` (`TS6133`)
  - `src/features/ranking-tuner/index.tsx:14` — unused
    `type SignalKey` (`TS6133`)
  - `src/features/search-playground/index.tsx:50,232,237,258,261` —
    `result.facets.category` / `result.facets.tags` possibly
    `undefined` under `noUncheckedIndexedAccess`
    (`facets: Record<string, ...>`) (`TS18048`)
- **Symptom**: errors were not surfacing because the previous
  `tsbuildinfo` cache had skipped these files. Any audit-driven change
  that invalidated the incremental cache made `tsc -b` red and broke
  `npm run build` (`tsc -b && vite build`).
- **Fix applied**: yes. Removed the two unused imports; introduced
  local `const categoryFacets = result.facets.category ?? []` /
  `tagFacets = result.facets.tags ?? []` in `search-playground` and
  pointed the call sites at those locals. Behavior unchanged.
- **Recommendation if not applied**: n/a.

### 5. Store selector pattern in feature overlays — already healthy
- **Severity**: none
- **Where**: sampled ~15 feature `index.tsx` files (`blast-radius`,
  `action-replay`, `coverage-inspector`, `interactive-rebase`,
  `csp-advisor`, `rtl-preview`, `memory-snapshot-diff`,
  `ai-refactor-suggest`, `ai-commit-message`, `comment-thread`,
  `live-preview`, `recent-files-popup`, `rag-context-viewer`,
  `rename-refactor`, `viewport-simulator`, `prompt-template-lab`).
- **Symptom**: none — every sampled feature uses `s.overlays.<slot>.open`
  / `s.overlays.<slot>.<scalar>` style selectors. Only `keybindings.tsx`
  was reading the whole `overlays` object (fixed in #2). `pinned-dock`
  reads `s.overlays.pinned`, which is an array slot deliberately exposed
  for the dock UI — appropriate.
- **Fix applied**: n/a.

### 6. `setInterval` cleanups — already healthy
- **Severity**: none
- **Where**: `ai-commit-message`, `ai-inline-explain`, `ai-docstring`,
  `ai-route-scaffold`, `rsc-payload-step`, `pair-queue`, `time-travel`,
  `focus-session`, `runtime-logs`, `quick-docs/docs.ts`.
- **Symptom**: every `window.setInterval` is paired with
  `window.clearInterval` either in a `useEffect` cleanup return or via a
  ref-based `stopStream` invoked from `useEffect(() => stopStream, [])`.
  No leaks found.
- **Fix applied**: n/a.

### 7. `OverlayPanel` accessibility — already correct
- **Severity**: none
- **Where**: `src/shared/ui/overlay-panel.tsx`
- **Symptom**: uses `@radix-ui/react-dialog` properly — Dialog auto-traps
  focus, Esc closes via Radix's own handler, `Dialog.Title` and
  `Dialog.Description` are wired with `asChild`. No custom `keydown`
  swallow `preventDefault` on Escape inside the panel. When `open=false`,
  the Portal does not mount, so closed overlays cost nothing in the DOM
  beyond the `<Dialog.Root>` shell — and now even that shell is gone
  thanks to the open-gate in `LazyOverlaySlot`.
- **Fix applied**: n/a.

### 8. Persist version — safe across waves
- **Severity**: low (informational)
- **Where**: `src/app/store/ui.store.ts` `persist(..., { name: 'nss-ui', version: 2 })`
- **Symptom**: `partialize` only persists primitive scalars, the recents
  array, the bookmarks array, and the annotations array — *no overlay
  shape is persisted*. Adding new overlay slots therefore cannot make a
  v2 payload from disk crash, because nothing about overlays is on disk.
  `pinned` is held in `overlays.pinned` and is intentionally not in
  `partialize`, so it resets per session — confirmed against current
  `partialize` field list. No migration needed.
- **Fix applied**: n/a.

### 9. Vite `manualChunks`
- **Severity**: low
- **Where**: `vite.config.ts`
- **Symptom**: vendor chunks (`monaco`, `radix`, `icons`, `react-vendor`,
  `floating`, `cmdk`, `sonner`, `ts-pattern`, `tanstack`, `zod`,
  `zustand`) are already split and look reasonable. With #1 in place,
  feature code is now naturally per-overlay so an extra `manualChunks`
  rule for "wave12" / "wave13" *groups* is no longer worth the
  maintenance cost — and could even *increase* main-thread cost if the
  group chunk loads several overlays the user never opens.
- **Fix applied**: no — leaving `manualChunks` as is. With lazy chunks at
  the host level, a user who opens 5 overlays downloads ≈5 small chunks
  of 8–22 kB each; aggregating them into wave-groups would force them to
  download dozens of unused overlays per group.
- **Recommendation**: revisit if profiling shows the new "many small chunks"
  shape strains HTTP/2 multiplexing in production. Likely premature.

### 10. Orphan / unregistered features
- **Severity**: low
- **Where**: `src/features/*` not referenced from `overlays-host.tsx`
- **Symptom**: scan found these features whose `index.tsx` exports a
  non-`Overlay` API and is consumed elsewhere (e.g. inside editor
  panels). They are correctly not in the overlay host:
  - `activity-feed` → `ActivityFeed` (panel widget)
  - `color-picker` → `ColorPickerPopover` (popover)
  - `focus-mode` → `useFocusModeKeybinding`, `FocusModeIndicator`
  - `image-preview` → `ImagePreviewCard`
  - `inline-blame` → `InlineBlame`
  - `linked-editing` → `LinkedEditingHint`
  - `recents` → `RecentsButton`
  - `rule-manager` → `RuleManagerSection`
  - `runtime-logs` → `RuntimeLogsView`
  - `annotations` → exposes `AnnotationPin` / `AnnotationComposer`
    (used in `widgets/editor/parts/annotations-layer.tsx`) **but also
    exports `AnnotationsOverlay` which is not registered anywhere**.
- **Fix applied**: no — the exported `AnnotationsOverlay` has no
  corresponding slot in `OverlayState`, so registering it would be a
  feature change rather than a hygiene change.
- **Recommendation**: either (a) delete the unused
  `AnnotationsOverlay` export and add a slot + host entry if the team
  wants the overlay surfaced, or (b) leave as-is. Listed for follow-up.

### 11. Type-safety gaps (samples — left untouched)
- **Severity**: low
- **Where**: spot-checked the largest `helpers.ts` files; saw a small
  number of `arr.find(...)!` non-null assertions and `as never`
  fallbacks in feature helpers.
- **Symptom**: under `noUncheckedIndexedAccess`, these can silently
  bypass safety. None observed in shared/UI code; all in feature mock
  data builders.
- **Fix applied**: no — feature mock data shape is wave-owned and
  changing assertions per file risks cascading edits without behavior
  change.
- **Recommendation**: when a wave revisits a helper, replace
  `xs.find(p)!` with `const x = xs.find(p); if (!x) return ...;` style.
  Worth a single-purpose follow-up PR rather than a sweep.

## Files modified
- `src/widgets/overlays/overlays-host.tsx` — full rewrite to lazy + gate
- `src/features/keybindings/keybindings.tsx` — drop whole-overlays
  subscription; use `useUiStore.getState()` inside the Esc handler
- `src/app/store/ui.store.ts` — cap `annotations` at 200 entries
- `src/features/websocket-inspector/index.tsx` — remove unused
  `type WSConnection` import (was failing `noUnusedLocals`)
- `src/features/ranking-tuner/index.tsx` — remove unused
  `type SignalKey` import (was failing `noUnusedLocals`)
- `src/features/search-playground/index.tsx` — narrow
  `result.facets.category` / `result.facets.tags` via local
  `?? []` consts to satisfy `noUncheckedIndexedAccess`

## Bundle deltas
- main entry chunk:  **2072.51 kB → 528.18 kB**  (−1544.33 kB)
- main entry gzip:   **507.21 kB → 133.91 kB**   (−373.30 kB ≈ 73%)
- new chunk shape: ~180 small lazy chunks, mostly 8–22 kB minified
  (4–6 kB gzip), one per overlay
- vendor chunks unchanged (`react-vendor`, `radix`, `floating`, `icons`,
  `monaco`, `sonner`, etc.)

## Open recommendations (not applied)
- **`AnnotationsOverlay` orphan**: either wire it up (add `annotations`
  slot to `OverlayState` and register it) or delete the export. Skipped
  here because either direction is a feature decision, not hygiene.
- **`manualChunks` wave-grouping**: deliberately *not* added. With
  per-overlay lazy chunks, grouping by wave would download unused
  siblings and probably regress the main user flow. Reconsider only if
  profiling shows network overhead from many small chunks.
- **Non-null assertions in feature `helpers.ts`**: low-risk to leave;
  fix opportunistically when each wave is revisited rather than as a
  sweep. Sample sites: see search for `\)!` inside `src/features/**/helpers.ts`.
- **Persist version bump (`nss-ui` v2 → v3)**: not needed. Persisted
  shape is unchanged by the fixes above (only the in-memory annotations
  cap was added, and the cap silently truncates oversized old payloads
  on first add). If a future wave changes a *persisted* field's shape,
  add a `migrate` callback to `persist` and bump the version.
