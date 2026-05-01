# Architecture Audit — Integrated Summary (2026-05-01)

5 parallel audit agents covered: **FSD layering**, **SOLID principles**, **Domain modeling**, **UI primitives + tokens**, and **Cleanup hygiene** (intervals, persist, orphans, unused vars, store slice plan).

Detailed reports:
- [AUDIT-FSD.md](./AUDIT-FSD.md)
- [AUDIT-SOLID.md](./AUDIT-SOLID.md)
- [AUDIT-DOMAIN.md](./AUDIT-DOMAIN.md)
- [AUDIT-UI.md](./AUDIT-UI.md)
- [AUDIT-STORE-SLICE-PLAN.md](./AUDIT-STORE-SLICE-PLAN.md)
- [AUDIT-ORPHANS.md](./AUDIT-ORPHANS.md)
- [AUDIT-PERSIST.md](./AUDIT-PERSIST.md)
- [AUDIT-INTERVALS.md](./AUDIT-INTERVALS.md)
- [AUDIT-UNUSED.md](./AUDIT-UNUSED.md)

## TL;DR

The codebase is **healthy in hygiene** (zero `setInterval` leaks, zero unused imports, persist v2 safe, build green) but has **structural debt** in three places:

1. **Monolithic `ui.store.ts`** — 662 LOC, 12 concerns mixed, ~190 overlay slots, imported by 234 files. Touching it triggers wide recompiles.
2. **FSD layering breaks** — 545 cross-layer violations, mostly upward hops (`features → widgets`, `features → app`, `shared → features`). Three structural moves collapse ~520 of them.
3. **Domain model is anemic + has drift** — 10 of 11 entities are CRUD-on-mocks; `code-symbol` enum redefined 4 times; `module/import-graph` entity missing despite 5 features inventing their own.

## Severity-ranked findings (cross-cutting)

### P0 — High leverage, structural

**1. Split `src/app/store/ui.store.ts` into 7 slices.**
- Why: SRP violation; one file owns layout, prefs, overlays, recents, bookmarks, focus, annotations.
- Plan: `app/store/ui/{layout,prefs,overlays,recents,bookmarks,focus,annotations}.slice.ts` composed by a thin facade keeping `useUiStore` API stable.
- Effort: medium (carefully migrate persist `partialize` and 234 import sites).
- Plan doc: [AUDIT-STORE-SLICE-PLAN.md](./AUDIT-STORE-SLICE-PLAN.md).

**2. Move 4 toolbar primitives to `shared/ui/`.**
- Files to move: `widgets/bottom-panel/parts/{panel-header, search-input, select-control, toggle-chip}.tsx` → `shared/ui/`.
- Why: 190 features import them upward through `widgets`. They are generic primitives.
- Effort: small (~190 import path rewrites). Codemod-friendly.

**3. Introduce `entities/module/` (or `entities/import-graph/`).**
- Why: 5 features (`turbopack-graph`, `architecture-map`, `dead-code-finder`, `boundary-inspector`, `performance`) re-invent module/edge graph types.
- Plan: Define `Module`, `ModuleEdge`, `ImportGraph` once; let consumers operate on them.

**4. Introduce `entities/code-symbol/`.**
- Why: `SymbolKind` defined in `peek-definition`, `go-to-symbol`, `symbol-popularity`, `ai-inline-explain`, `type-flow` independently.
- Plan: One `CodeSymbol` type; one zod schema; one `kind` enum.

### P1 — Medium leverage, locality refactors

**5. Move `ApiEndpoint[]` out of `entities/database`.**
- It owns endpoints alongside Prisma models, which is a category mistake. Move to `entities/server-action` or new `entities/api-surface`.

**6. Introduce overlay registry (OCP).**
- Replace `OverlayState` enumerated 190 keys + `overlays-host` 184-entry registry with `import.meta.glob` self-registering features.
- Adding a feature becomes "drop a folder, export `*Overlay`", no central edits.

**7. Add `index.ts` barrels to 10 of 11 entities.**
- Currently 93 deep imports past entity barrier (`@entities/X/store`).

**8. Relocate `shared/mocks/*` that import `@features/*` or `@entities/*`.**
- Mocks importing upward is a contradiction. Either: (a) move per-entity mocks under `entities/<n>/mocks.ts`, or (b) hoist to top-level `mocks/`.

### P2 — Low risk, paint cuts

**9. Delete empty `src/features/ai-pane/`** — 0 refs, empty directory.
- Safe but destructive; awaits user approval.

**10. Refactor 20 oversized feature `index.tsx` files (400-718 LOC).**
- Pattern: extract `parts/<sub>.tsx` and richer `helpers.ts`. Target: `index.tsx ≤ 200 LOC`.
- High effort spread across 20 files; tackle per-wave on revisit.

**11. `react-hooks/exhaustive-deps` warnings** in `critical-css`, `live-preview`, `og-image-generator`, `typed-routing-graph` — 4 warnings, trivial fix.

**12. `Severity` / `Runtime` / `RenderingClass` re-declared inline** in 3-4 places despite zod enums existing in `shared/types/`.

**13. `ClientIsland` vs `ClientIslandRef` near-duplicate** — drift risk.

**14. `Notification.action.onClick` is a `() => void` inside domain data** — UI leak. Move action to a UI layer.

## Hygiene status (✅ already healthy)

- Zero `setInterval` leaks (10 sites, all with cleanup).
- Zero unused imports / vars (`tsc --noEmit` and `eslint` clean).
- Persist v2 safe — `partialize` excludes `overlays`, so Wave-13 shape change has no migration risk.
- Build green: main 528KB / gzip 134KB after audit-1 lazy-mount fix.

## Open destructive actions (require user approval)

- Delete `src/features/ai-pane/` (empty orphan).
- Begin store slice migration (P0 #1) — touches 234 import sites, codemod recommended.
- Begin toolbar primitive move (P0 #2) — touches 190 import sites.

## Recommended next steps (sequential)

1. **Approve safe deletions** (`ai-pane/`).
2. **Codemod toolbar primitives** to `shared/ui/` (P0 #2). One PR, 190 import path rewrites, no logic change.
3. **Introduce `entities/code-symbol/`** (P0 #4). Single zod schema; consumers migrate over time.
4. **Introduce `entities/module/`** (P0 #3). Same approach.
5. **Plan ui.store slice** as a separate dedicated PR (P0 #1) — biggest ROI but needs careful migration.
