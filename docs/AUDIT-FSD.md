# FSD Layering Audit — 2026-05-01

Project: Next Static Studio (`/Users/songmin/quanta-nextjs-ide`)
Scope: cross-layer import compliance for `app / pages / widgets / features / entities / shared`.

## Layer summary
- `app`        — 1 store cluster (`@app/store` exposes `useUiStore`, `useEditorStore`, plus shared UI types like `RecentItem`, `OverlayState`, `BottomTab`, etc.)
- `pages`      — 1 slice (`studio`)
- `widgets`    — 8 slices (`bottom-panel`, `editor`, `left-panel`, `overlays`, `resize-handle`, `right-panel`, `status-bar`, `top-bar`)
- `features`   — 193 slices (1 empty: `features/ai-pane`; 1 multi-slice container: `features/wizards/{new-route,route-handler,server-action}`)
- `entities`   — 11 slices (`boundary`, `cache-tag`, `database`, `diagnostic`, `notification`, `performance`, `route`, `rsc-payload`, `runtime`, `semantic-diff`, `server-action`)
- `shared`     — `lib` (2 files: `cn.ts`, `keys.ts`), `ui` (26 files inc. barrel), `mocks`, `rsc-sources`, `types`

Cross-layer import counts (raw):
- `features/*` → `@widgets/*`        : **190 imports across 100 distinct features** (HIGH — upward hop)
- `features/*` → `@app/*`            : **193 imports** (HIGH — upward hop)
- `widgets/*`  → `@app/*`            : **43 imports** (HIGH — upward hop, layer skip)
- `widgets/*`  → `@features/*`       : 11 imports (downward, allowed; but several are deep)
- `pages/*`    → `@app/*`            : 1 (HIGH — upward hop)
- `shared/*`   → `@features/*`       : 9 imports (HIGH — multi-layer upward hop)
- `shared/*`   → `@entities/*`       : 5 imports (HIGH — upward hop)
- `entities/*` → `@features/*`       : 0 (clean)
- `entities/*` → `@entities/*` (sibling): 0 (clean)
- `features/*` → `@features/*` (sibling): 6 imports (HIGH — slice isolation broken)
- `widgets/*`  → `@widgets/*` (sibling): 1 import (MED — sibling widget reach)
- Deep entity imports past barrel (`@entities/X/store`, etc.): **93 imports**
- Deep feature imports past barrel (`@features/X/helpers`): 12 imports
- Deep widget imports past barrel (`@widgets/X/parts/*`, `@widgets/X/tabs/*`, `@widgets/X/inspectors/*`): **191 imports**

---

## Findings (severity-sorted)

### HIGH severity

#### H1 — `shared` upward hops into `@features/*` (multi-layer skip, 9 occurrences)
`shared` is the lowest layer and must not depend on anything above it. Every entry below is a hard violation.

- `src/shared/mocks/lighthouse.ts:1` — `import type { LhAudit, LhRouteReport, LhScore } from '@features/lighthouse/helpers';`
- `src/shared/mocks/runtime.ts:334` — `import type { HydrationReport } from '@features/hydration-inspector/helpers';`
- `src/shared/mocks/runtime.ts:533` — `import type { StreamingTrace } from '@features/streaming-visualizer/helpers';`
- `src/shared/mocks/runtime.ts:576` — `import type { RscComponent } from '@features/rsc-profiler/helpers';`
- `src/shared/mocks/images.ts:1` — `import type { ImageEntry } from '@features/image-format-audit/helpers';`
- `src/shared/mocks/i18n.ts:8` — `} from '@features/i18n-coverage/helpers';`
- `src/shared/mocks/forms.ts:1` — `import { forms, type FormFlow } from '@features/form-pipeline/helpers';`
- `src/shared/mocks/auth-flow.ts:1` — `import { flows, type AuthFlow } from '@features/auth-flow-tracer/helpers';`
- `src/shared/mocks/render-path.ts:4` — `} from '@features/critical-css/helpers';`

Proposed fix (do not apply): the canonical types/data (`LhAudit`, `HydrationReport`, `StreamingTrace`, `RscComponent`, `ImageEntry`, `FormFlow`, `AuthFlow`, `I18nReport`, etc.) are domain models, not feature internals. Lift them into matching `entities/*` slices (`entities/lighthouse`, `entities/hydration`, `entities/streaming`, `entities/rsc-component`, `entities/image-audit`, `entities/form-flow`, `entities/auth-flow`, `entities/i18n`, `entities/critical-css` — or fold into existing entities like `runtime`/`route`). Then `shared/mocks` imports `@entities/*` (still upward — see H2 — so mocks should ultimately move out of `shared` entirely; see R2).

#### H2 — `shared` upward hops into `@entities/*` (5 occurrences)
- `src/shared/mocks/rsc-payload.ts:1` — `import { detectEnvironment, type RscChunk } from '@entities/rsc-payload';`
- `src/shared/mocks/notifications.ts:1` — `import type { Notification } from '@entities/notification/store';`
- `src/shared/rsc-sources/types.ts:1` — `import type { RscChunk } from '@entities/rsc-payload';`
- `src/shared/rsc-sources/mock-source.ts:1` — `import type { RscChunk } from '@entities/rsc-payload';`
- `src/shared/rsc-sources/fetch-source.ts:1` — `import { parseRscLine } from '@entities/rsc-payload';`

Proposed fix: `shared/mocks/*` and `shared/rsc-sources/*` are not "shared" — they consume domain models. Move both directories up into the layer that owns them (e.g., `entities/rsc-payload/sources/*`, `entities/notification/mocks/*`), or co-locate mocks with each entity slice. Alternative: invert the dependency by exposing a registration API in `shared` and have entities populate it.

#### H3 — `features/*` upward hops into `@widgets/*` (190 imports, ~100 features affected)
Features import widget *internals* directly. Top offenders by symbol:
- `ToggleChip` from `@widgets/bottom-panel/parts/toggle-chip` — 78 imports
- `PanelHeader` from `@widgets/bottom-panel/parts/panel-header` — 45 imports
- `SelectControl` from `@widgets/bottom-panel/parts/select-control` — 36 imports
- `SearchInput` from `@widgets/bottom-panel/parts/search-input` — 28 imports
- `KvRow`, `StateIcon` from `@widgets/right-panel/parts` — 3 imports

Examples:
- `src/features/runtime-logs/index.tsx:17-20` — pulls four `@widgets/bottom-panel/parts/*` symbols.
- `src/features/memory-snapshot-diff/index.tsx:5-7`, `src/features/prompt-template-lab/index.tsx:5-6`, `src/features/interactive-rebase/index.tsx:5`, etc.

Proposed fix: these are clearly generic UI primitives that *belong in `shared/ui`*. Move `panel-header.tsx`, `search-input.tsx`, `select-control.tsx`, `toggle-chip.tsx`, `kv-row.tsx`, `state-icon.tsx` from `widgets/{bottom,right}-panel/parts/` into `shared/ui/`. Re-export from `@shared/ui` barrel. Net effect: ~190 violations removed in one move.

#### H4 — `features/*` upward hops into `@app/*` (193 imports)
Features reach into the app store directly. 179 of these are `useUiStore`, others mix in `useEditorStore` and `RecentItem`/`InspectionProfile` types.

- `src/features/interactive-rebase/index.tsx:3` — `import { useUiStore } from '@app/store';`
- `src/features/action-replay/index.tsx:4`
- `src/features/ai-commit-message/index.tsx:3`
- `src/features/ai-refactor-suggest/index.tsx:3`
- `src/features/coverage-inspector/index.tsx:3`
- `src/features/csp-advisor/index.tsx:3`
- `src/features/memory-snapshot-diff/index.tsx:3`
- `src/features/prompt-template-lab/index.tsx:3`
- `src/features/rtl-preview/index.tsx:3`
- `src/features/runtime-logs/index.tsx:3`
- … (~190 more across nearly every feature)

Proposed fix: the "UI shell" store (`useUiStore`) is global session state, not application bootstrap. Demote `app/store/ui.store.ts` and `app/store/editor.store.ts` to `entities/ui-shell/store.ts` and `entities/editor/store.ts` (or `shared/store/*` if you treat them as platform primitives). Type exports (`RecentItem`, `BottomTab`, `OverlayState`, `LeftTab`, `InspectionProfile`) move with their owning store. `app/` should retain only providers/router/global styles.

#### H5 — `widgets/*` upward hops into `@app/*` (43 imports)
Same root cause as H4. Examples:
- `src/widgets/overlays/overlays-host.tsx:3-4` — `useUiStore`, `OverlayState`
- `src/widgets/overlays/pinned-dock.tsx:1`
- `src/widgets/bottom-panel/bottom-panel.tsx:2` — `useUiStore`, `BottomTab`
- `src/widgets/bottom-panel/tabs/{problems,routes,semantic-diff,bundle,cache-lineage}-tab.tsx`
- `src/widgets/left-panel/tabs/routes-tab.tsx:4`
- (43 total)

Proposed fix: identical to H4 — once UI shell stores live in `entities/ui-shell` (or `shared/store`), widgets import from there legally.

#### H6 — `pages/*` upward hop into `@app/*`
- `src/pages/studio/studio-page.tsx:1` — `import { useUiStore } from '@app/store';`

Proposed fix: same as H4/H5.

#### H7 — Sibling-feature direct imports (slice isolation broken, 6 occurrences)
- `src/features/command-palette/index.tsx:15` — `import { GlobalKeybindings } from '@features/keybindings';`
- `src/features/command-palette/keybindings-help.tsx:2` — `import { globalKeybindings } from '@features/keybindings';`
- `src/features/shortcut-help/keymap.ts:1` — `import { globalKeybindings, type KeybindingDescriptor } from '@features/keybindings';`
- `src/features/settings-panel/index.tsx:11` — `import { RuleManagerSection } from '@features/rule-manager';`
- `src/features/ranking-tuner/helpers.ts:1` — `import { SEARCH_INDEX, parseQuery, type SearchDoc } from '@features/search-playground/helpers';`
- (`src/features/peek-definition/helpers.ts:187` is a string literal in mock data — not a real import; ignore.)

Proposed fixes:
- `features/keybindings` is consumed by 3 other features → extract `globalKeybindings`/`KeybindingDescriptor` registry into `entities/keybinding` (model-only) and let each feature register into it.
- `features/search-playground/helpers` (`SEARCH_INDEX`, `parseQuery`, `SearchDoc`) → extract to `entities/search` (data + parser).
- `features/rule-manager` `RuleManagerSection` consumed by `features/settings-panel` → either compose both at the `widgets/right-panel` layer (settings widget assembles the panel from both features) or extract the shared section as a feature exposed via a widget composition.

### MED severity

#### M1 — Missing public API (`index.ts`/`index.tsx`) for slices
- `src/features/ai-pane/` — directory exists but is **empty** (no files at all). Either remove or implement.
- `src/features/wizards/` — has no top-level barrel; instead exposes three sub-slices (`new-route`, `route-handler`, `server-action`) each with their own `index.tsx`. Consumers must import `@features/wizards/new-route` etc., which is technically a deep import past the slice boundary. Decision: either flatten to three top-level slices (`features/wizard-new-route`, etc.) or add an aggregator `features/wizards/index.tsx`.
- Entities **without an `index.ts`** (consumers must use `@entities/X/store`, hence the 93 deep entity imports — see M3):
  - `entities/boundary` (only `store.ts`)
  - `entities/cache-tag`
  - `entities/database`
  - `entities/diagnostic`
  - `entities/notification`
  - `entities/performance`
  - `entities/route`
  - `entities/runtime`
  - `entities/semantic-diff`
  - `entities/server-action`
  - (only `entities/rsc-payload` defines a barrel.)

Proposed fix: add `index.ts` re-exporting `./store` (and any future `model/`, `helpers.ts`) for each entity. Mass-migrate `@entities/X/store` → `@entities/X` afterwards.

#### M2 — Deep imports past widget barrels (191)
Tied to H3. Even after moving the four common parts to `shared/ui`, several deep widget reaches remain:
- `src/widgets/right-panel/inspectors/lighthouse-inspector.tsx:27` — feature helpers consumed by widget (deep into `@features/lighthouse/helpers`).
- `src/widgets/left-panel/tabs/i18n-tab.tsx:9` — `@features/i18n-coverage/helpers`.
- `src/widgets/left-panel/tabs/quality-tab.tsx:21` — `@widgets/right-panel/parts/quality-section` (sibling-widget reach, see M5).

Proposed fix: each widget that needs to expose internals to other widgets should publish them through its own `index.ts` barrel; outside callers go through the barrel only.

#### M3 — Deep imports past entity barrels (93)
Direct effect of M1. All 93 imports look like `@entities/X/store` (e.g., `@entities/route/store`, `@entities/diagnostic/store`, `@entities/server-action/store`). Add barrels and convert.

#### M4 — Deep imports past feature barrels into `helpers` (12)
Even excluding the mock-data string literals in `features/{move-to-file,peek-definition}/helpers.ts`, real consumers reach into feature `helpers.ts`:
- `widgets/right-panel/inspectors/lighthouse-inspector.tsx:27` → `@features/lighthouse/helpers`
- `widgets/left-panel/tabs/i18n-tab.tsx:9` → `@features/i18n-coverage/helpers`
- `features/ranking-tuner/helpers.ts:1` → `@features/search-playground/helpers` (also H7)
- 9 occurrences in `shared/mocks/*` (also H1)

Proposed fix: re-export public types from each feature's `index.tsx`, or extract truly cross-layer types/data to entities (preferred — see H1/H7 fixes).

#### M5 — Sibling-widget reach (1)
- `src/widgets/left-panel/tabs/quality-tab.tsx:21` — `import { ... } from '@widgets/right-panel/parts/quality-section';`

Proposed fix: extract `quality-section` parts into `shared/ui` (it's already generic — a section renderer), or to a feature/entity if it owns domain logic.

### LOW severity

#### L1 — `shared/lib` is anaemic
Only two files exist (`cn.ts`, `keys.ts`), but consumers call out `from '@shared/lib/text'` and `from '@shared/lib/format'` (in mock-data string literals, not real imports). Decide: either keep `shared/lib` minimal (current) and remove the misleading mock-strings, or anticipate growth and pre-create namespace folders.

#### L2 — `shared` over-broad: contains `mocks` and `rsc-sources`
`shared/mocks/*` (~30 files) and `shared/rsc-sources/*` are application-domain fixtures, not platform primitives. Co-locating them in `shared` is the root cause of H1/H2. (Recommendation in R2.)

#### L3 — `app/store` exports domain types
`@app/store` re-exports `RecentItem`, `BottomTab`, `OverlayState`, `LeftTab`, `InspectionProfile`. These are UI-shell domain types and don't belong in the bootstrap layer. (Recommendation in R3.)

#### L4 — Naming inconsistency in entities
Entities use `store.ts` flat-file convention except `entities/rsc-payload`, which uses `model/` + `index.ts`. Pick one convention.

#### L5 — Empty / placeholder slice
`features/ai-pane/` is an empty directory. Remove it or implement.

---

## God modules (top-imported by other slices)

### Top-imported features (by other slices)
| Rank | Feature                | Importers (deduped) |
|------|------------------------|---------------------|
| 1    | `features/keybindings` | 3 (command-palette, command-palette/keybindings-help, shortcut-help) |
| 2    | `features/lighthouse`  | 2 (shared/mocks, widgets/right-panel/inspectors) |
| 3    | `features/i18n-coverage`| 2 (shared/mocks, widgets/left-panel/tabs) |
| 4    | `features/streaming-visualizer` | 1 (shared/mocks/runtime) |
| 5    | `features/search-playground` | 1 (features/ranking-tuner) |
| 6    | `features/runtime-logs` | 1 (widgets/bottom-panel/tabs) |
| 7    | `features/rule-manager` | 1 (features/settings-panel) |
| 8    | `features/rsc-profiler` | 1 (shared/mocks/runtime) |
| 9    | `features/recents`      | 1 (widgets/top-bar) |
| 10   | `features/linked-editing`| 1 (widgets/editor/parts) |
| 11   | `features/inline-blame` | 1 (widgets/editor/parts) |
| 12   | `features/image-preview`| 1 (widgets/editor/parts) |
| 13   | `features/image-format-audit`| 1 (shared/mocks) |
| 14   | `features/hydration-inspector`| 1 (shared/mocks) |
| 15   | `features/form-pipeline`| 1 (shared/mocks) |
| 16   | `features/focus-mode`   | 1 (widgets/top-bar) |
| 17   | `features/critical-css` | 1 (shared/mocks) |
| 18   | `features/color-picker` | 1 (widgets/editor/parts) |
| 19   | `features/auth-flow-tracer`| 1 (shared/mocks) |
| 20   | `features/annotations`  | 1 (widgets/editor/parts) |

(193 features total → 20 are imported by anyone outside themselves; the remaining ~173 are leaves consumed only by `pages/studio` via the router.)

### Top-imported entities (by other slices) — **clear god modules**
| Rank | Entity                  | Imports |
|------|-------------------------|---------|
| 1    | `entities/route`        | **39**  |
| 2    | `entities/diagnostic`   | **20**  |
| 3    | `entities/rsc-payload`  | 11      |
| 4    | `entities/server-action`| 7       |
| 5    | `entities/boundary`     | 7       |
| 6    | `entities/semantic-diff`| 5       |
| 7    | `entities/database`     | 5       |
| 8    | `entities/cache-tag`    | 5       |
| 9    | `entities/performance`  | 2       |
| 10   | `entities/notification` | 2       |
| 11   | `entities/runtime`      | 1       |

### Top-imported shared modules
| Rank | Path                        | Imports |
|------|-----------------------------|---------|
| 1    | `@shared/lib/cn`            | **260** |
| 2    | `@shared/ui` (barrel)       | 257     |
| 3    | `@shared/types`             | 93      |
| 4    | `@shared/mocks/*` (total)   | 49      |
| 5    | `@shared/lib/keys`          | 3       |
| 6    | `@shared/rsc-sources/*`     | 2       |

Top app-layer "module": `@app/store` — **216 imports** (193 from features + 43 from widgets - overlap; in practice 216 import lines). Effectively a god module that every UI slice depends on, which is the heart of H4/H5/H6.

---

## Recommendations (highest-leverage)

**R1 — Promote four widget "parts" into `shared/ui` (one PR, removes ~190 violations).**
Move `widgets/bottom-panel/parts/{panel-header,search-input,select-control,toggle-chip}.tsx` and `widgets/right-panel/parts/{kv-row,state-icon}.tsx` into `shared/ui/` and update imports. This single migration eliminates H3 entirely.

**R2 — Move `shared/mocks` and `shared/rsc-sources` out of `shared`.**
They are domain fixtures, not platform primitives. Two viable options:
- (a) Co-locate each mock with its owning entity: `entities/route/mocks.ts`, `entities/notification/mocks.ts`, `entities/rsc-payload/mocks.ts`, `entities/runtime/mocks.ts`, etc.
- (b) Promote to a new layer-equivalent folder `mocks/` at root, treated as test/fixture material outside FSD.
Either choice resolves H1 and H2 (14 violations) and L2.

**R3 — Demote `@app/store` to entity-layer stores.**
Split `app/store/{ui,editor}.store.ts` into `entities/ui-shell/store.ts` and `entities/editor/store.ts` (or `shared/store/*`). All widget/feature/page imports become legal downward refs. This removes H4 + H5 + H6 (237 violations) and L3.

**R4 — Add `index.ts` barrels to all 10 entities (M1/M3, 93 deep imports).**
Each entity's `index.ts` re-exports `./store` (and `./model` once added). Mass-rewrite `@entities/X/store` → `@entities/X`.

**R5 — Extract three shared registries into entities (resolves H7).**
- `entities/keybinding` ← `globalKeybindings`, `KeybindingDescriptor` (currently in `features/keybindings`).
- `entities/search` ← `SEARCH_INDEX`, `parseQuery`, `SearchDoc` (currently in `features/search-playground/helpers`).
- For `RuleManagerSection`, compose at the `widgets/right-panel` layer instead of cross-importing features.

**R6 — Split `entities/route` (god module, 39 importers).**
39 importers signals an over-stuffed model. Inspect `entities/route/store.ts` and consider splitting into `entities/route` (route definitions) + `entities/route-flow` (transitions/runtime), or extract sub-slices (params, segments, draft-mode) consumed by only a few features.

**R7 — Clean up empties and inconsistencies.**
- Remove or implement `features/ai-pane`.
- Decide on `features/wizards/` (flatten or aggregate).
- Standardise entity layout (`store.ts` flat vs `model/` directory).

**Sequencing suggestion:** R1 → R3 → R4 → R2 → R5 → R6 → R7. R1+R3+R4 alone remove ~520 of the ~545 cross-layer violations.
