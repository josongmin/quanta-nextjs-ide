# SOLID Audit — 2026-05-01

> Auditor: Claude (read-only). Scope: SRP / OCP / LSP / ISP / DIP across the studio's
> features, entity stores, the central `ui.store.ts`, and a sample of widgets.
> Severity legend: **HIGH** (architectural / cross-cutting), **MED** (extensibility
> or shape problem in a hot path), **LOW** (cohesion, naming, mechanical cleanup).

## Sample size

- **Features read (top-N largest `index.tsx` plus spot checks):** 14 of 193
  - `database-tool` (718), `http-client` (534), `asset-waterfall` (532),
    `notebook` (530), `cookie-consent-builder` (519), `design-token-lab` (496),
    `plan-canvas` (484), `streaming-rum` (483), `scheduled-publish` (479),
    `render-graph` (470), `turbopack-graph` (469), `content-model-designer` (468),
    `storage-explorer` (463), `og-image-generator` (463). Top-20 line counts also
    inspected; same patterns recur down to ~420 LOC.
- **Entity stores read:** 10 of 11 (the 11th, `entities/rsc-payload`, has *no*
  store at all — see SRP/asymmetry finding).
- **Widgets read:** 7 (`overlays-host`, `pinned-dock`, `right-panel`,
  `left-panel`, `bottom-panel`, `top-bar`, `editor-surface`). Plus
  `shared/ui/overlay-panel`, `button`, `chip` for OCP/ISP context.
- **Stores read in full:** `app/store/ui.store.ts` (662 LOC),
  `app/store/editor.store.ts` (83), all entity stores listed above.

---

## Findings by principle

### SRP violations

#### HIGH — `src/app/store/ui.store.ts` is a kitchen-sink store (662 LOC, ~12 distinct concerns)

The single `useUiStore` simultaneously owns:

1. **Layout/chrome** (`leftPanelOpen/Width`, `rightPanelOpen/Width`,
   `bottomPanelOpen/Height`, `leftTab`, `bottomTab`).
2. **Inspector context** (`inspectorContext`, `inspectorPinned`,
   `setInspectorContext` with the pin-respecting branch).
3. **User preferences** (`density`, `profile`, `colorMode`, `autofixPolicy`,
   `onboardingComplete`).
4. **Overlay slots × ~190** (`OverlayState` interface with one record per
   feature, and `openOverlay`/`closeOverlay` keyed by `keyof OverlayState`).
5. **Pinned dock items** (`overlays.pinned`, `pin`, `unpin`).
6. **Recents** (capped FIFO).
7. **Bookmarks** (string[] toggle).
8. **Focus mode** (boolean + toggle).
9. **Annotations** (CRUD with capacity cap of 200 — a domain entity, not UI).
10. **Persistence partition** for *all* of the above to a single `nss-ui` key.

The `OverlayState` interface alone is 217 lines; `initialOverlays` is another
~190 lines of boilerplate. Adding any new overlay requires editing **3** places
in the same file (the type union, the initial-value record, optionally a slot in
the persisted partial). A single file change touches every reviewer that cares
about layout, theming, or any of 190 overlays.

**Proposed split (slices, all using zustand `combine`/`subscribeWithSelector` or
separate `create()` calls):**

| New module | Owns |
| --- | --- |
| `src/app/store/layout.store.ts` | left/right/bottom open + width + tabs |
| `src/app/store/inspector.store.ts` | `inspectorContext`, `inspectorPinned` |
| `src/app/store/preferences.store.ts` | density, profile, colorMode, autofixPolicy, onboardingComplete |
| `src/app/store/overlays.store.ts` | a `Map<OverlayKey, OverlayPayload>` (see OCP finding below) plus `open`/`close` |
| `src/app/store/pins.store.ts` | pinned dock |
| `src/app/store/recents.store.ts` | recents FIFO |
| `src/app/store/bookmarks.store.ts` | string[] toggle |
| `src/app/store/focus-mode.store.ts` | boolean + toggle |
| `src/entities/annotation/store.ts` | annotation CRUD (this is a *domain entity*, not UI; should join the entities tier) |

Each slice independently `persist()`-wrapped under its own key
(`nss-layout`, `nss-prefs`, …). This eliminates the giant partialize block on
lines 641–659.

#### HIGH — Top-20 feature `index.tsx` files mix data shaping, presentation, sub-component definition, and store wiring

Pattern observed in every large feature file (e.g. `database-tool/index.tsx`
718 LOC; `http-client/index.tsx` 534; `asset-waterfall/index.tsx` 532;
`notebook/index.tsx` 530; `cookie-consent-builder/index.tsx` 519;
`design-token-lab/index.tsx` 496; `plan-canvas/index.tsx` 484;
`streaming-rum/index.tsx` 483; `scheduled-publish/index.tsx` 479;
`render-graph/index.tsx` 470; `turbopack-graph/index.tsx` 469).

Each file does at least four of:

- **Module-scope helpers** (e.g. `tokenizeSql`, `tokenizeUrl`, `kindFill`,
  `kindLight`, `kindTone`, `diffKindTone`, `diffSign`, `clone(set)`, `colY`)
  — pure shaping that belongs in `helpers.ts` already in the folder.
- **Inner mock sub-components** (e.g. `SqlBlock`, `JoinDiagram`,
  `BannerPreview`, `MarkdownView` inside `notebook/index.tsx`,
  `EnvSelect`/header bars inside `http-client`) — each ~100–250 LOC, declared
  inside `index.tsx` rather than as siblings.
- **Top-level overlay container** with tabbed UX state (`useState<TabKey>`)
  plus `useUiStore`/`useRouteStore` wiring.
- **Local form/edit state** for the feature (`SAVED_QUERIES`, `INITIAL_HISTORY`,
  draft state, sort state, filter state, override maps, etc.).

Concrete examples:

- `src/features/database-tool/index.tsx:34-78` — `tokenizeSql`/`SqlBlock` are a
  language-tokenizer + presentational component; should live in
  `database-tool/parts/sql-block.tsx` (or be replaced by `shared/ui/code-block`).
- `src/features/database-tool/index.tsx:88-265` — `JoinDiagram` is a 180-LOC SVG
  component embedded inside `index.tsx`; should be `parts/join-diagram.tsx`.
- `src/features/notebook/index.tsx:26-…` — `MarkdownView` is an in-file mini
  markdown renderer; belongs in `parts/markdown-view.tsx` (or shared).
- `src/features/cookie-consent-builder/index.tsx:28-…` — `BannerPreview` SVG
  spans dozens of branches per `style`; should be `parts/banner-preview.tsx`.
- `src/features/asset-waterfall/index.tsx:18-79` — three parallel
  `kindFill`/`kindLight`/`kindTone` switch-tables that exhaustively enumerate
  `AssetKind`. Belongs as a single mapping table in `helpers.ts` (see OCP).
- `src/features/http-client/index.tsx:31-52` — `tokenizeUrl`/`UrlSegment` is a
  reusable parsing utility; should live in `helpers.ts`.

**Proposed split (one canonical layout per feature):**

```
features/<name>/
  index.tsx          // <120 LOC: just the OverlayPanel shell + state wiring
  helpers.ts         // pure data + lookup tables + parsers
  parts/
    <thing>-view.tsx // each big sub-component
    <thing>-tab.tsx
```

The **success criterion** is `index.tsx` ≤ 200 LOC across all 193 features.

#### MED — `entities/diagnostic/store.ts` mixes domain data, UI filters, mute lists, and selection

`useDiagnosticStore` (133 LOC) holds:

- The **dataset** (`diagnostics`, populated from 9 different mock modules in the
  module-init constant `allDiagnostics`).
- A **view spec** (`groupBy`, `filters` with severity/confidence/inDiff/autofixOnly).
- **Per-rule policy** (`mutedRuleIds`, `mutedDiagnosticIds`,
  `ruleSeverityOverrides`).
- **Selection** (`selectedDiagnosticIds` + `selectMany`/`clearSelection`).
- **Query helpers** (`forRoute`, `forFile`).

A reasonable split:

- `entities/diagnostic/store.ts` — only `diagnostics`, `byId`, `forRoute`,
  `forFile`.
- `features/problems/view.store.ts` (or under a `widgets/bottom-panel` slice) —
  `groupBy`, `filters`, `selectedDiagnosticIds`.
- `features/diagnostic-policy/store.ts` — `mutedRuleIds`,
  `mutedDiagnosticIds`, `ruleSeverityOverrides`. Persistable.

#### MED — Entity stores asymmetric: `entities/rsc-payload` has no `store.ts`

10 of 11 entity folders match the documented shape `entities/<name>/store.ts`.
`entities/rsc-payload/` instead has `model/` only (`snapshot.ts`,
`parser.ts`, `types.ts`, `tree-builder.ts`, `kind-detector.ts`) and exports via
`index.ts`. Either:

- The architectural rule should be relaxed to "entities own a model; a store is
  optional", which is then documented in `docs/AUDIT.md`/CATALOG; **or**
- a thin `useRscPayloadStore` should be introduced for parity (selected snapshot
  id, hover node id) so that `widgets/right-panel/inspectors` can subscribe
  uniformly.

This is technically an **SRP** asymmetry (one entity disagrees with its peers
about what an entity owns) and a **DIP** issue (consumers can't depend on a
common entity-store interface).

#### LOW — Notification entity owns `unreadCount` derived state

`entities/notification/store.ts` stores `unreadCount` alongside `list` and
recomputes it on every mutation. This is denormalized state masquerading as a
field; either compute via a selector (`useNotificationStore(s => …)`) or expose
it as a `subscribeWithSelector` derived field. Single source of truth violation.

---

### OCP violations

#### HIGH — `OverlayState` requires editing the central type for every new feature

`src/app/store/ui.store.ts:55-273` declares ~190 named, optionally-typed slots
(`evidenceTracer`, `blastRadius`, …). Adding a new feature requires:

1. Adding a new field to `OverlayState`.
2. Adding a default to `initialOverlays`.
3. Adding a registry entry in `widgets/overlays/overlays-host.tsx` (the
   `overlayEntries` array — also a HIGH-tier registry that scales linearly
   with feature count, currently 184 entries).
4. Reading via `useUiStore((s) => s.overlays.<slot>.open)` inside the feature.

The store is therefore **not closed for modification** with respect to the
"add a new overlay" use case — every wave (8/9/10/11/12/13 visible in the
banner comments) edits this one file.

**Proposed refactor:**

- Replace `OverlayState` with `Record<string, { open: boolean; payload?: unknown }>`
  keyed by stable `OverlayKey` strings.
- Each feature self-registers via a side-effecting `registerOverlay` call from
  its own module:
  ```ts
  // features/database-tool/index.tsx
  registerOverlay({ key: 'database-tool', component: DatabaseToolOverlay });
  ```
- Typed payloads live with the feature (`type DatabaseToolPayload = …`) and the
  central store stores them as `unknown` (or a discriminated union built up
  by module augmentation if strict typing is required).
- `widgets/overlays/overlays-host.tsx` then iterates the registry instead of
  the hard-coded 184-entry array.

This makes the system genuinely open/closed: a new feature is a folder + one
`registerOverlay` call, with **zero** edits to `ui.store.ts` or `overlays-host`.

#### HIGH — `widgets/overlays/overlays-host.tsx` is a 226-line hardcoded `lazy()` registry

Same root cause as above: every feature is a hardcoded `lazy(() => import('@features/<x>'))` line plus a default-export remap. Adding a feature edits this file. This is the lazy-loading half of the open/closed problem.

Refactor: a build-time `import.meta.glob('/src/features/*/index.tsx', { eager: false })` (Vite-native) or the runtime `registerOverlay` registry above will replace this file with ~10 LOC.

#### MED — Hardcoded `kind → variant` switch chains in features

`src/features/asset-waterfall/index.tsx:18-79` declares **three parallel
exhaustive switches** (`kindFill`, `kindLight`, `kindTone`) over the same
`AssetKind` enum. Adding a new `AssetKind` requires editing all three (and the
`kind` union). Replace with a single typed lookup map:

```ts
const KIND_STYLE: Record<AssetKind, { fill: string; light: string; tone: ChipTone }> = { … };
```

Same anti-pattern surfaces in:

- `src/features/render-graph/index.tsx` (filter list at `:28`),
- `src/features/turbopack-graph/index.tsx` `KIND_OPTIONS` plus `kindChipTone`/`kindColor` helpers,
- `src/features/scheduled-publish/index.tsx` (parallel `statusFill`/`statusStroke`/`statusTone` helpers),
- `src/features/streaming-rum/index.tsx` (parallel `VITAL_FILL`/`VITAL_STROKE` records — already a map; closer to ideal but still split into two).

#### MED — `widgets/right-panel/right-panel.tsx` `match(ctx)` chain is closed for extension

13 inspector kinds, one big `match(...)` over a discriminated union
(`InspectorContext` defined in `ui.store.ts:30-42`). Adding a new inspector
requires editing the type *and* the dispatcher *and* the store. The dispatcher
should be a registry: `Record<InspectorKind, (ctx) => ReactNode>` (or
`Map<Kind, Component>`) declared in a sibling registry file each inspector
contributes to.

Same shape, lower risk, in `widgets/left-panel/left-panel.tsx` (14 tabs) and
`widgets/bottom-panel/bottom-panel.tsx` (8 tabs); both use `match(...).exhaustive()`. These are smaller scopes (≤14) and exhaustiveness *is* a feature here, so the OCP cost is real but the LSP/safety benefit is real too. **Recommend**: keep as `match` until tab count exceeds ~20, but extract the icon/label tuple arrays (`tabs`) into `parts/tab-defs.ts` so the dispatcher and the tab strip don't drift.

---

### LSP violations

LSP barely applies in idiomatic React; only a couple of structural issues:

#### LOW — `Button` (`shared/ui/button.tsx`) `tone="ghost"` silently changes affordance

The `ghost` variant (`bg-transparent border-transparent text-ink-2`) doesn't
violate substitutability per se, but the `icon` size (`h-6 w-6 p-0`) is a
square button that callers pass with text children in some places (e.g.
`top-bar.tsx:80-99`). This works because Tailwind shrugs, but the `icon` size
implicitly assumes a single-icon child. Tighten with a runtime/`asChild` check
or split the variant: `size="icon"` + a separate `IconButton` wrapper.

#### LOW — `OverlayPanel` width prop pre-set to a fixed pixel default (`width = 720`)

Some features pass `width={1240}` (e.g. `database-tool`); some don't pass
anything. There is no "responsive" or "auto" variant — the prop is a
half-typed escape hatch. Prefer `size: 'sm' | 'md' | 'lg' | 'xl' | 'full'`
matching button/chip variants (and an `unstyled`/`className` pass-through for
the truly bespoke 1240px case). Today the contract is loose enough that
substituting one feature's overlay for another can break layout silently.

---

### ISP violations

#### HIGH — Every overlay subscribes to the union `OverlayState` via `useUiStore((s) => s.overlays.<slot>.open)`

There are **234** files touching `useUiStore`; nearly every feature file does
two pattern-identical reads:

```tsx
const open  = useUiStore((s) => s.overlays.<slot>.open);
const close = useUiStore((s) => s.closeOverlay);
```

Selectors are narrow (`s.overlays.<slot>.open`) so re-render scope is fine in
practice — Zustand selector equality saves us — but the **type-level** ISP
problem is real: every consumer imports the entire `OverlayState` interface
through TS inference. A type-only refactor in any unrelated overlay forces a
recompile of all 234 files.

**Proposed refactor:** introduce a tiny per-feature hook that depends only on
the keys it needs:

```ts
// per overlay
export function useOverlay<K extends OverlayKey>(key: K) {
  return useOverlaysStore(useShallow((s) => ({
    open: s.overlays[key]?.open ?? false,
    payload: s.overlays[key]?.payload as OverlayPayload<K> | undefined,
    open_: s.open,
    close: s.close,
  })));
}
```

Each feature becomes:

```ts
const { open, payload, close } = useOverlay('databaseTool');
```

…and the only "fat" import is the `OverlayKey` literal — the feature no longer
sees `OverlayState`'s shape at all. This realises **DIP** as a side effect.

#### MED — `useDiagnosticStore` exposes 13 actions on one object

`entities/diagnostic/store.ts:34-57` puts grouping, filters, mute, override,
selection, and per-route lookup all on one store interface. Consumers that only
need `diagnostics` or only need `forRoute(id)` still type-import the entire
interface. After the SRP split above, this falls out naturally (each slice has
a small surface).

#### MED — `OverlayPanel` props are an undifferentiated bag

`shared/ui/overlay-panel.tsx:6-15` mixes:

- presentation (`width`, `className`, `title`, `subtitle`, `footer`),
- behaviour (`open`, `onOpenChange`),
- structure (`children`).

Not severe, but features routinely pass identical `footer` JSX (a flex row with
status chips on the left and a Close button on the right; cf.
`database-tool/index.tsx:339-356` and most others). Extract a
`<OverlayFooter status={…}>` part so the prop surface narrows and the common
footer is shared.

---

### DIP violations

#### HIGH — Features import the concrete `useUiStore` directly

234 files import `useUiStore` from `@app/store`. Most of them only need
`{ open, close, payload }` for one overlay key. They are coupled to:

- the location of the store,
- its persistence shape,
- the rest of `OverlayState`'s 190 keys (via the type),
- and Zustand itself (you can't unit-test a feature without booting the global store).

**Proposed refactor:** invert the dependency. Each feature accepts a tiny
controller, either via context or via the `useOverlay` hook above. Concretely:

- `shared/ui/overlay-panel.tsx` already takes `open` and `onOpenChange` props —
  good. The leak happens *outside* `OverlayPanel`, in the feature container
  that hard-binds to `useUiStore`.
- Introduce an `OverlayShell` higher-order component that accepts a key and
  hands the inner overlay `{ payload, close }`:
  ```tsx
  export function asOverlay<K extends OverlayKey>(key: K, Inner: FC<{ payload?: OverlayPayload<K>; close(): void }>) {
    return function Mounted() {
      const { open, payload, close } = useOverlay(key);
      if (!open) return null;
      return <Inner payload={payload} close={close} />;
    };
  }
  ```
- Features then export `asOverlay('databaseTool', DatabaseToolBody)` and
  `DatabaseToolBody` knows nothing about Zustand.

#### MED — Multiple widgets directly import multiple entity stores

Examples:

- `widgets/top-bar/top-bar.tsx:1-3` imports `useUiStore`, `useRouteStore`,
  `useDiagnosticStore` to compute three header counts.
- `widgets/bottom-panel/bottom-panel.tsx:2-4` imports `useUiStore`,
  `useDiagnosticStore`, `useSemanticDiffStore` only for badge counts.
- `widgets/editor/editor-surface.tsx:4-6` reaches for `useEditorStore`,
  `useUiStore`, `useDiagnosticStore`, `useRouteStore` (4 stores in one file).

For top-bar/bottom-panel a cheap fix is a `useTopBarStats()` /
`useBottomPanelBadges()` hook in `widgets/<name>/model.ts` that depends on the
stores — the widget then depends on a hook (interface), not on three concrete
stores.

For `editor-surface` the coupling is real (Monaco lives there) but the four
imports are still fat; each subscription should be wrapped in a thin
`useDiagnosticsForFile(file)` style hook so the editor depends on small, named
queries instead of raw stores.

#### LOW — `widgets/overlays/overlays-host.tsx` imports 184 features by literal path

Discussed under OCP. From a DIP angle: the host depends on every feature
module's *concrete identity*. A registry pattern (`import.meta.glob` or
self-registration) inverts this so the host depends only on the registry
interface.

---

## Hot spots — single largest violators

Ranked by combined SRP + OCP + DIP impact:

1. **`src/app/store/ui.store.ts`** (662 LOC, 12 concerns, 234 importers) —
   the central choke point.
2. **`src/widgets/overlays/overlays-host.tsx`** (226 LOC, 184 hardcoded lazy
   imports) — the lazy-load mirror of #1.
3. **`src/features/database-tool/index.tsx`** (718 LOC, four jobs in one file)
   — exemplar of the feature `index.tsx` bloat pattern.
4. **`src/features/http-client/index.tsx`** (534 LOC), **`asset-waterfall`** (532),
   **`notebook`** (530), **`cookie-consent-builder`** (519),
   **`design-token-lab`** (496), **`plan-canvas`** (484),
   **`streaming-rum`** (483), **`scheduled-publish`** (479) — all the same
   bloat shape; treat as one refactor batch.
5. **`src/entities/diagnostic/store.ts`** (133 LOC) — by far the heaviest of
   the entity stores; mixes domain data, view, policy, and selection.
6. **`src/widgets/right-panel/right-panel.tsx` + `ui.store.ts:30-42`** —
   `InspectorContext` discriminated union + `match` chain; small but
   architecturally significant because the right panel is a high-traffic
   extension surface.
7. **`src/entities/rsc-payload/`** — only entity without a store; symmetry-breaker.

---

## Recommendations (top-10, ranked by leverage)

1. **Slice `ui.store.ts` into 9 stores** (layout, inspector, preferences,
   overlays, pins, recents, bookmarks, focus-mode, annotations). Estimated
   payoff: removes the single biggest source of recompile-blast-radius and
   review-merge conflicts. Touches 234 importers but mechanically (codemod via
   a `useUiStore(s => s.X)` → `useXStore(s => s.X)` map). **Highest leverage.**

2. **Replace the typed `OverlayState` with a registry** (`registerOverlay({ key, component, payloadSchema })`) consumed by `widgets/overlays/overlays-host.tsx`. Eliminates ~400 LOC of boilerplate (interface + initials + lazy registry) and makes adding/removing features a single-folder change. Introduce `useOverlay(key)` as the only public hook features use.

3. **Codify a per-feature folder layout and enforce `index.tsx ≤ 200 LOC`.**
   Move SVG/preview/inner sub-components to `parts/`; move pure helpers and
   lookup tables to `helpers.ts`. Apply first to the 14 outliers >450 LOC; a
   single ESLint `max-lines` rule for `**/features/*/index.tsx` makes the
   regression path automatic.

4. **Adopt a `Record<Enum, Style>` style table convention** for all feature
   files that currently have ≥2 parallel `kind*` switches
   (`asset-waterfall`, `scheduled-publish`, `streaming-rum`,
   `turbopack-graph`, etc.). Trivial mechanical refactor; pays for itself the
   next time a `kind` is added.

5. **Split `entities/diagnostic/store.ts` into entity + view + policy slices**
   (the store conflates domain data with UI filters and rule overrides).

6. **Introduce a thin `asOverlay(key, Body)` HOC and `useOverlay(key)` hook** so
   features stop depending on `useUiStore` directly. Pairs with #2 and unlocks
   feature-level unit tests without booting the global store.

7. **Convert widget store fan-in to small named hooks**: `useTopBarStats()`,
   `useBottomPanelBadges()`, `useEditorContext(file)`. Widgets keep one import
   instead of three+, and the hooks document the actual shape consumed.

8. **Decide and document the entity-store contract.** Either require every
   `entities/<name>/` to expose a `useXStore`, or relax to "entities own a
   model; the store is optional." Make `rsc-payload` either conform or update
   `docs/CATALOG.md` to declare the exception.

9. **Right-panel inspector registry.** Move `InspectorContext`'s `kind` union
   and the `match()` chain into a `registerInspector({ kind, render })`
   pattern that each `inspectors/<x>-inspector.tsx` calls at module load.
   Reuses the same registry pattern as #2.

10. **Tighten `OverlayPanel` and `Button` variant surfaces.** Add
    `size: 'sm' | 'md' | 'lg' | 'xl'` to `OverlayPanel` (replacing free-form
    `width`) and split `Button size="icon"` into a dedicated `IconButton` so
    the `Button` props stay coherent. Lowest risk, but improves substitutability
    everywhere.

---

## Appendix: numeric snapshot

| File | LOC | Distinct concerns |
| --- | ---: | ---: |
| `src/app/store/ui.store.ts` | 662 | 12 |
| `src/widgets/overlays/overlays-host.tsx` | 226 | 1 (registry) but 184 hard imports |
| `src/features/database-tool/index.tsx` | 718 | 4 |
| `src/features/http-client/index.tsx` | 534 | 4 |
| `src/features/asset-waterfall/index.tsx` | 532 | 4 |
| `src/features/notebook/index.tsx` | 530 | 4 |
| `src/features/cookie-consent-builder/index.tsx` | 519 | 4 |
| `src/entities/diagnostic/store.ts` | 133 | 4 |
| `src/entities/route/store.ts` | 29 | 1 (canonical shape) |
| `src/entities/rsc-payload/` | n/a | no store (asymmetric) |

*End of audit.*
