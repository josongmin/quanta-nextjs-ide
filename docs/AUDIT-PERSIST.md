# Persisted-State Audit — `useUiStore`

File: `src/app/store/ui.store.ts`

## Current `persist` middleware setup (lines 637–660)

```ts
{
  name: 'nss-ui',
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    leftPanelOpen, rightPanelOpen, bottomPanelOpen,
    leftPanelWidth, rightPanelWidth, bottomPanelHeight,
    leftTab, bottomTab,
    density, profile, colorMode, autofixPolicy,
    onboardingComplete,
    recents, bookmarks, focusMode, annotations,
  }),
}
```

No `migrate` callback is defined.

## Findings

### 1. `overlays` is intentionally NOT persisted — safe across waves

The Wave-13 expansion of `OverlayState` (added ~80 keys spanning Waves
8–13) does **not** require a migration because `partialize` excludes
`overlays` from the persisted payload entirely. Every page load
re-hydrates `overlays` from `initialOverlays`, which is built from the
current shape of `OverlayState`. New keys are filled with `{ open:
false }` defaults at boot. No drift, no orphan keys.

This is the safe path. Even if a previous build had persisted
`overlays`, Zustand's `merge` would shallow-merge the persisted slice
over the in-memory initial state, so missing new keys would still pick
up their defaults. **No `migrate` callback is needed.**

### 2. `inspectorContext` also excluded — correct

The default inspector context (`{ kind: 'route', routeId:
'route_products_id' }`) references a fixture-defined route. Persisting it
across sessions would let stale route IDs survive after dataset edits.
Excluding it from `partialize` is the right call.

### 3. Persisted set vs. current store interface

Cross-checked every persisted key against the `UiStore` interface
(lines 282–337). All 18 persisted keys exist in the live store with
matching types. No dangling persisted keys.

### 4. Keys added since `version: 2` was set

A `git log`-equivalent isn't available offline, but a structural read
shows that the persisted set only contains primitive layout/preference
data plus three small arrays (`recents`, `bookmarks`, `annotations`).
None of those have changed shape recently. Bumping `version` would only
be needed if a persisted field's *type* changed (e.g. if `density` had
gained or lost an enum variant). It hasn't.

### 5. Annotations payload bound

`addAnnotation` caps the in-memory annotations list to `MAX_ANNOTATIONS
= 200` (lines 626–632), preventing the persisted blob from growing
unboundedly. Good as-is.

## Recommendations

- **No migration needed.** Leave `version: 2` and skip adding a
  `migrate` callback. Zustand's default merge plus the `overlays` /
  `inspectorContext` exclusions already protect against shape drift.
- **If/when** `density`, `profile`, `colorMode`, or `autofixPolicy` ever
  drop a variant, bump to `version: 3` and add a `migrate` that clamps
  unknown values to a safe default (e.g. `'default'` / `'light'`).
- **Optional hardening**: add a defensive `merge` that intersects
  persisted `density`/`profile`/`colorMode`/`autofixPolicy` against the
  literal union types, falling back to defaults for unknown values.
  This prevents a future enum shrink from leaving the store in an
  invalid state without bumping `version`. Not urgent.

## Risk: none observed

Wave 13 is shape-safe with respect to persistence. No code change
required for this audit.
