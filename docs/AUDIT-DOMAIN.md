# Domain Modeling Audit — 2026-05-01

Scope: `src/entities/*` (11 stores), `src/shared/types/*` (12 modules),
`src/shared/mocks/*` (35 modules). Sampled 12 features for usage patterns
(`runtime-logs`, `find-references`, `rule-manager`, `blast-radius`,
`evidence-tracer`, `pr-summary`, `patch-preview`, `architecture-map`,
`turbopack-graph`, `dead-code-finder`, `peek-definition`, `rsc-profiler`,
`go-to-symbol`, `symbol-popularity`, `component-preview`).

## Domain map

| Entity            | File                                       | Purpose (1-line)                                                                       |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `boundary`        | `src/entities/boundary/store.ts`           | Client islands, layouts, env vars, middleware — the server/client RSC boundary.        |
| `cache-tag`       | `src/entities/cache-tag/store.ts`          | `revalidateTag` graph: producers vs invalidators, list/graph view.                     |
| `database`        | `src/entities/database/store.ts`           | Prisma models, query call sites, transactions — also owns `ApiEndpoint[]` (!).         |
| `diagnostic`      | `src/entities/diagnostic/store.ts`         | All 116 ruleId findings with filters, mutes, severity overrides, selection.            |
| `notification`    | `src/entities/notification/store.ts`       | In-app notifications (risk/pr/build/analysis/tip), unread count, push.                 |
| `performance`     | `src/entities/performance/store.ts`        | Bundle tree, web vitals per route, perf budgets per route.                             |
| `route`           | `src/entities/route/store.ts`              | Next.js routes (App Router segments), route tree, filter & search.                     |
| `rsc-payload`     | `src/entities/rsc-payload/{model,index}`   | Wire-format chunk parser + tree builder + snapshot diff (the only "rich" entity).      |
| `runtime`         | `src/entities/runtime/store.ts`            | Live runtime log entries (capped 400, pause/resume).                                   |
| `semantic-diff`   | `src/entities/semantic-diff/store.ts`      | Cross-commit diff entries by category (rendering/cache/boundary/auth/contract/cost).   |
| `server-action`   | `src/entities/server-action/store.ts`      | Server Actions + Route Handlers with safety checklist, score, exposure.                |

## Findings

### Missing entities

#### 1. `module` / `import-graph` (HIGH priority)

- **Rationale**: The IDE's domain is *static analysis* of a Next.js app, but
  there is no first-class entity representing source modules and their import
  edges. Every feature that needs this concept reinvents it locally:
  - `src/features/turbopack-graph/helpers.ts:1-20` — `ModuleNode`, `ModuleEdge`,
    `ModuleKind = 'server'|'client'|'shared'`, `Bundler`.
  - `src/features/architecture-map/helpers.ts:1-30` — `Layer`, `Edge` (FSD-layer
    flavoured graph).
  - `src/features/dead-code-finder/helpers.ts:1-17` — `DeadEntry` (file/export
    granularity reachability).
  - `src/widgets/right-panel/inspectors/boundary-inspector.tsx:16` —
    private `BoundaryImport`.
  - `src/shared/mocks/file-tree.ts` — flat `FileNode[]` with no link to
    semantic content.
  - The `BundleNode` recursive shape in `performance.ts` overlaps with
    "module" but is rendered through a bundler lens (sized chunks/packages),
    not source modules.
- **Proposed home**: `src/entities/module/` with `Module`, `ImportEdge`, kind
  ∈ `{server-only, client-only, shared, unknown}`, plus `byFile`, `importers`,
  `importees`, `reach(from, to)`, `subgraphForRoute(routeId)`.
- **What plugs in**: `architecture-map`, `turbopack-graph`,
  `dead-code-finder`, `find-references`, `call-hierarchy`, `blast-radius`,
  `boundary-inspector`, `convert-to-client/server`, `extract-component`,
  `bundle-evolution`. Today these features all hand-roll their own
  micro-graph.

#### 2. `code-symbol` (HIGH priority)

- **Rationale**: At least four parallel `Symbol*` types model the same
  concept (a named declaration with a file/line and a kind):
  - `src/features/peek-definition/helpers.ts:22` — `PeekSymbol` +
    `PeekKind = 'function'|'class'|'interface'|'type'|'const'|'component'|'hook'`.
  - `src/features/go-to-symbol/helpers.ts:22` — `SymbolEntry` +
    `SymbolKind = 'fn'|'class'|'hook'|'const'|'component'|'type'|'prop'`.
  - `src/features/symbol-popularity/helpers.ts:3` — `SymbolEntry` +
    `SymbolKind = 'fn'|'type'|'component'|'hook'|'const'`.
  - `src/features/ai-inline-explain/helpers.ts:3` — `MockSymbol`.
  - `src/features/type-flow/helpers.ts:24` — `SymbolFlow`.
  - `src/features/variables-scope/helpers.ts` — `ScopeKind`.
  - `EvidenceItem` in `shared/types/diagnostic.ts:5` is yet another
    location-bearing reference.
- **Proposed home**: `src/entities/code-symbol/` with a single
  `CodeSymbol { id, name, kind, file, line, signature?, declaredIn,
  parentId?, deprecated?, exported?, usedCount? }` and behaviours
  `byId`, `byFile`, `referencesOf`, `definitionOf`. Three different
  `SymbolKind` enums collapsing into one is the headline win here.
- **What plugs in**: `go-to-symbol`, `peek-definition`, `find-references`,
  `symbol-popularity`, `call-hierarchy`, `type-flow`, `ai-inline-explain`,
  `inline-symbol`, `evidence-tracer`.

#### 3. `component` (split out of `boundary`) (MEDIUM priority)

- **Rationale**: "React component" exists under at least four shapes that
  all describe a render-tree node with server/client classification:
  - `ClientIsland` (`shared/types/boundary.ts:4`) — boundary lens.
  - `RscComponent` (`features/rsc-profiler/helpers.ts:3`) — runtime lens.
  - `ComponentEntry` (`features/component-preview/helpers.ts:24`,
    `kind: 'server'|'client'`) — preview lens.
  - `CQComponent` (`features/container-query-inspector/helpers.ts:8`),
    `ComponentMock` (`features/rtl-preview/helpers.ts:21`) — UI lenses.
- **Proposed home**: `src/entities/component/` with `Component {
  id, name, file, environment: 'server'|'client'|'shared', isIsland,
  estimatedKb, hooks, props, parentId, routeIds }`. `boundary.islands`
  becomes a *projection* (where `environment === 'client' && isIsland`)
  rather than its own primary type.

#### 4. Smaller gaps worth noting

- **`bundle-chunk` / `package`**: today live as `kind` discriminants on a
  recursive `BundleNode` inside `performance.ts`. Workable, but means
  `performance` owns three distinct concepts: bundle composition, web
  vitals, and budgets. Splitting `bundle` (or merging into a future
  `module`) would lighten that store.
- **`workspace` / `file-tree`**: `FileNode[]` lives only in
  `shared/mocks/file-tree.ts` with no entity. Anything that needs to
  navigate the source tree (editor, recent-files, workspace-search,
  command-palette) reaches through mocks directly.
- **`commit` / `pr` / `review`**: `semantic-diff` knows `base`/`head`
  strings and `pr-summary` plus `git-blame`/`patch-stack` features all
  reinvent commit/PR notions ad-hoc.

### Anemic entities

Most entities are CRUD-on-mock stores. The only one with real domain
operations is `rsc-payload` (parser, kind detector, tree builder, snapshot
differ) — and notably it is *the only entity not using zustand*.

| Entity            | Anemic? | Notes / proposed operations                                                                              |
| ----------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `boundary`        | YES     | No `islandsForRoute(id)`, no `excessiveIslands()`, no `envVarsLeaking()`, no `middlewareCovers(path)`.   |
| `cache-tag`       | YES     | No `inconsistencies()`, `producersOf(name)`, `affectedRoutes(tagId)`, `tagsForRoute(routeId)`.           |
| `database`        | partial | Has `queriesForModel`, `endpointsByKind`. Missing `nPlusOneQueries()`, `unboundedQueries()`, `hotModels()`. |
| `diagnostic`      | RICH    | Filters/mutes/overrides/selection are real domain ops (the gold standard here).                          |
| `notification`    | OK      | `markRead`, `markAllRead`, `push`, `unreadCount` cover the lifecycle.                                    |
| `performance`     | partial | `flatBundle`, `heaviestPackages`, `byRoute`. Missing `budgetViolations()`, `vitalsBelowBudget()`.        |
| `route`           | YES     | `byId` only. No `applyFilter()`, `staticRoutes()`, `clientHeavy()`, `descendantsOf(id)`. Filter state set but never applied inside the store. |
| `rsc-payload`     | RICH    | The model layer (parser, tree-builder, snapshot diff) is the strongest entity in the codebase.           |
| `runtime`         | OK      | Push/pause/resume/clear is appropriate for a log buffer.                                                 |
| `semantic-diff`   | YES     | Just `setSelected`. Missing `byCategory()`, `byRoute()`, `bySeverity()`, `summary()`.                    |
| `server-action`   | YES     | `byActionId`, `byHandlerId` only. Missing `unsafeActions()`, `webhookHandlers()`, `forRoute(id)`, `riskScore()`. |

Every feature that does any of the missing operations reimplements them as
inline `.filter(...)` chains over a store-derived array.

### Overlap / duplication

1. **`database` smuggles `ApiEndpoint[]`** (`store.ts:17,32`,
   `endpointsByKind`). This collides with `server-action` (which owns
   `RouteHandler[]`) and with the `api-surface` mocks. `ApiEndpoint`
   genuinely covers `'handler' | 'action' | 'trpc' | 'graphql'`, three of
   which belong with `server-action`. Recommendation: move
   `endpoints`/`endpointsByKind` into `server-action` (rename to
   `api-surface`), or hoist to a new `api-surface` entity. `database`
   should own only Prisma/queries/transactions.

2. **`boundary` is a portmanteau**. It bundles four loosely related
   concepts: client islands, layouts, env vars, middleware. Each is its
   own analysis surface in the UI (different inspectors, different
   features). Either rename the entity to `server-client-boundary` and
   accept the grouping, or split into `island`, `layout`, `env-var`,
   `middleware` (and lift `island` into the proposed `component` entity).

3. **`ClientIsland` vs `ClientIslandRef`** (`shared/types/boundary.ts:14`
   vs `shared/types/route.ts:47`). Two near-identical shapes, joined only
   by id. The `ref` form re-declares `id`, `name`, `estimatedKb`. A single
   `Island` with optional projection helpers would prevent drift if
   `name` ever leaves `Island` and a stale `ClientIslandRef` retains it.

4. **`Route.dataSources` vs `CacheTag.producers/invalidators` vs
   `FetchSite`** all describe overlapping facets of "where data is fetched
   and how it caches". `route.ts:32` (DataSource), `cache.ts:4` (CacheTagSite),
   `cache.ts:22` (FetchSite). Some duplicate fields: `cacheMode`,
   `revalidate`, `tags`. A `data-source` entity that all three project
   from would let the cache-tag, route, and (missing) fetch-site features
   share evidence chains.

5. **`runtime` log vs `notification`**. Both timestamp-ordered streams of
   events the user reads. Fine to keep separate, but they share UX
   patterns (filter, mark-read, push) that aren't shared in code.

6. **`mocks` and `entities` parallel layout**. Every entity loads its
   mocks via per-domain modules in `src/shared/mocks/<domain>.ts`. There
   is no `src/entities/<x>/mocks.ts`, so the entity package is not
   self-contained — replacing mocks with a real loader requires editing
   *both* `src/shared/mocks/*` *and* the import in `src/entities/<x>/
   store.ts`. Recommendation: per-entity `mocks.ts` (re-export from
   shared mocks today; later swap to a `loader` interface).

### Type drift

| Type / concept | Defined at | Drift? |
| --- | --- | --- |
| `Diagnostic`   | `src/shared/types/diagnostic.ts:240` | **No drift** — every feature/widget imports from `@shared/types`. Healthy. |
| `Severity`     | `src/shared/types/severity.ts:4` (`'err'\|'warn'\|'info'\|'hint'`) | Inconsistent: `LogEntry.level` (`shared/mocks/runtime.ts:9`) is `Extract<Severity, 'info'\|'warn'\|'err'>`, but `SemanticDiffEntry.severity` (`shared/types/semantic-diff.ts:19`) re-declares its own enum `'err'\|'warn'\|'info'` instead of reusing `severityZ`. |
| `Runtime` (`'node'\|'edge'`) | `src/shared/types/severity.ts:15` | Re-declared inline in `boundary.ts:39`, `server-action.ts:40`, `api-surface.ts:26`. The exported `runtimeZ` is **never imported**. |
| `RenderingClass` (`'static'\|'isr'\|'dynamic'\|'unknown'`) | `severity.ts:9` | Different enum `RenderingAllowance = 'static'\|'isr'\|'dynamic'` in `performance.ts:77` — same axis, different name, missing `'unknown'`. |
| `ClientIsland` shape | `boundary.ts:4` vs `ClientIslandRef` `route.ts:42` | Drift risk. See overlap #3. |
| `SymbolKind` | `peek-definition`, `go-to-symbol`, `symbol-popularity` | **3 different enums** for the same concept. See missing-entity #2. |
| `ModuleKind` | `turbopack-graph` (`'server'\|'client'\|'shared'`), `boundary.ModuleEnvironment` in `rsc-payload/model/types.ts` (`'server'\|'client'\|'unknown'`), `BundleSide` in `performance.ts:16` (`'server'\|'client'\|'shared'`) | 3 names, 2 closed sets. Should be one. |
| `LogEntry` | `src/shared/mocks/runtime.ts:5` | Lives in **mocks**, not in `shared/types`. The `runtime` entity imports its type from a mock module (`store.ts:2`) — mock and real types are not separated. |
| `Notification` | `src/entities/notification/store.ts:6` | Domain type defined **inside the store**, not in `shared/types`. The only entity that does this. |

### Zod usage

- All `shared/types/*.ts` files (severity, code-location, route, server-action,
  cache, boundary, diagnostic, semantic-diff, performance, database,
  api-surface) define `*Z` schemas and infer types from them — consistent.
- `shared/mocks/*` and `entities/*/store.ts` *never* call `parse`/`safeParse`.
  Mock data flows into stores untyped-at-runtime; the schemas exist but
  nothing validates against them.
- `Notification` and `LogEntry` skip zod entirely. Inconsistency.
- `rsc-payload` uses neither zod nor `@shared/types` — its own `types.ts`
  is plain TS interfaces.

### UI leak into domain

1. **`Notification.action.onClick`** (`entities/notification/store.ts:13`).
   A `() => void` callback embedded in domain data is the textbook UI leak.
   Mock notifications can't carry this across a serialization boundary
   (e.g. server-pushed notifications). Replace with
   `action: { kind: 'open-overlay'\|'navigate'\|'apply-fix', target: string }`
   and resolve to a handler at the UI layer.
2. **`KIND_TONE` and `KIND_LABEL`** in `entities/rsc-payload/model/types.ts:26-43`.
   `'accent'|'static'|'edge'|'info'|'muted'` is a UI tone palette baked
   into a domain type module. Move to `widgets/.../rsc-payload-step` or
   to `shared/ui` constants.
3. **`PerformanceStore.unit` / `sideFilter`** (`performance/store.ts:16-17`).
   View state (`'gzip'|'raw'`, `'client'|'server'|'shared'`) lives in the
   domain store. Fine if used everywhere; questionable when only one
   feature reads it. Same pattern in `cache-tag.view: 'list'|'graph'`,
   `route.filter`, `diagnostic.groupBy`. Stores conflate "what is the
   data" with "how is the user looking at it right now".
4. **Selection state across all stores** (`selectedIslandId`,
   `selectedRouteId`, `selectedTagId`, `selectedActionId`,
   `selectedHandlerId`, `selectedQueryId`, `selectedModelId`,
   `selectedNodeId`, `selectedEntryId`, `selectedDiagnosticIds`).
   Selection is a UI concern. When two features need different
   selections of the same entity (e.g. left-panel route vs editor route)
   they collide. Consider a per-feature `useSelection<T>()` slice
   instead of single global selection per entity.
5. **`reasons: ['useRouter', 'onClick']`** in `shared/mocks/boundary.ts:23`
   — UI/React-API names baked into mock domain data. Fine for a static
   IDE, but a plug-in real analyser would emit symbolic reasons.

### Naming inconsistency

| Concept | Names used | Where |
| --- | --- | --- |
| Client component instance | `ClientIsland`, `ClientIslandRef`, `client-component`, `RscComponent (kind=client)`, `ComponentEntry (kind: 'client')` | `boundary.ts`, `route.ts`, `learn-more/rules-docs.ts`, `rsc-profiler`, `component-preview` |
| Source module + env | `ModuleNode.kind`, `ModuleEnvironment`, `BundleSide` | `turbopack-graph`, `rsc-payload/types`, `performance` |
| Symbol kind | `PeekKind`, `SymbolKind` (×2 different enums) | `peek-definition`, `go-to-symbol`, `symbol-popularity` |
| Severity | `Severity` (`hint` included) vs `SemanticDiffEntry.severity` (no `hint`) vs `LogEntry.level` (subset) | `severity.ts`, `semantic-diff.ts`, `mocks/runtime.ts` |
| Rendering | `RenderingClass` vs `RenderingAllowance` | `severity.ts` vs `performance.ts` |
| Server-side endpoint | `ApiEndpoint`, `RouteHandler`, `ServerAction` | `api-surface.ts`, `server-action.ts`. `ApiEndpoint.kind = 'handler'\|'action'\|'trpc'\|'graphql'` overlaps two of those. |
| Action store hook | Entity dir is `server-action`, hook is `useActionStore`, type is `ServerAction[]`. Mixed singular/plural; abbreviation in hook name only. | `entities/server-action/store.ts:16` |
| Cache mode | `cacheMode: 'default'\|'force-cache'\|'no-store'\|'unset'` declared inline in `route.ts:38` and `cache.ts:26` | should be a shared `cacheModeZ` |

### Mock vs real

- **Location**: All mocks live in `src/shared/mocks/*.ts` (35 files). No
  per-entity `mocks/` folder. Stores import shared mocks directly:
  `entities/boundary/store.ts:3-8` reaches into `@shared/mocks/boundary`.
- **Coupling**: 11 entities + 35 mock files implies ~3 mock modules per
  entity on average. Some misalignments:
  - `database` store loads from **3** mock modules: `database.ts`,
    `db-queries.ts`, `api-surface.ts` — three concepts, one store.
  - `diagnostic` store loads from **9** mock modules (one per category).
  - `runtime` *type* (`LogEntry`) lives in the mock file
    (`shared/mocks/runtime.ts:5`), not in `shared/types`. The store
    imports a type from a mock module.
- **Pluggability**: To swap mocks for real data, you'd touch each
  `entities/*/store.ts` and add a fetcher. There is no fetch/loader
  abstraction. Recommendation: each entity exposes a
  `loadX(): Promise<X[]>` (default impl returns mocks) so a real
  analyser can drop in via DI.
- **`mocks` + `store` redundancy**: No entity has *both* a `mocks/` dir
  and a `store.ts` (mocks are centralised). But the *content* of mocks
  (not the structure) often duplicates types defined in `shared/types`
  with looser shapes — see `LogEntry` and `Notification` above.

## Recommendations (top 10, prioritised)

1. **Create `entities/module/` with `Module` + `ImportEdge`** (HIGH).
   Unblocks `architecture-map`, `turbopack-graph`, `dead-code-finder`,
   `find-references`, `call-hierarchy`, `blast-radius`, `convert-to-*`.
   Currently each ships its own micro-graph.
2. **Create `entities/code-symbol/` with one `CodeSymbol` + one `SymbolKind`** (HIGH).
   Collapses 3 different `SymbolKind` enums and 4 different `Symbol*`
   types from `peek-definition`, `go-to-symbol`, `symbol-popularity`,
   `ai-inline-explain` into one.
3. **Move `ApiEndpoint[]` out of `database` into `server-action`
   (rename to `api-surface`)** (HIGH). Restores conceptual integrity:
   `database` = persistence, `api-surface` = HTTP/RPC endpoints.
4. **Remove `Notification.action.onClick`** (HIGH, easy). Replace with a
   serializable intent (`{ kind, target }`) resolved at UI layer.
   Eliminates the only `onClick` in `src/entities/`.
5. **Promote `LogEntry` and `Notification` into `shared/types/` as
   zod-backed schemas** (MEDIUM). All other domain types are zod-backed
   and live in `shared/types`; these two are outliers.
6. **Unify environment enums under one `ModuleEnvironment` in
   `shared/types/severity.ts`** (`'server'|'client'|'shared'|'unknown'`)
   and have `boundary`, `performance.BundleSide`, `rsc-payload`, and
   `turbopack-graph` consume it (MEDIUM).
7. **Reuse `severityZ` and `runtimeZ` everywhere they're re-declared**
   (`semantic-diff.ts:19`, `boundary.ts:39`, `server-action.ts:40`,
   `api-surface.ts:26`) (MEDIUM, mechanical).
8. **Add domain operations to anemic stores**: `route.staticRoutes()`,
   `route.descendantsOf(id)`, `boundary.islandsForRoute(id)`,
   `boundary.excessiveIslands()`, `cache-tag.inconsistencies()`,
   `server-action.unsafeActions()`, `semantic-diff.byCategory(c)`,
   `performance.budgetViolations()` (MEDIUM). Currently every feature
   redoes the filter inline.
9. **Split UI state out of domain stores** (MEDIUM). At minimum, lift
   `selected*Id` per-feature; consider keeping `view`/`filter`/`groupBy`
   only when a single feature owns the entity.
10. **Per-entity `mocks.ts` + a `load*()` fetcher abstraction** so that
    real data can plug in without editing every `store.ts` (LOW priority,
    LOW risk). Today: `entities/<x>/store.ts` reaches directly into
    `@shared/mocks/<x>` and would need rewiring to swap data sources.

---

## Appendix — file references

- 11 entity stores (read in full): `src/entities/{boundary,cache-tag,database,diagnostic,notification,performance,route,rsc-payload,runtime,semantic-diff,server-action}/`.
- 12 shared types: `src/shared/types/{api-surface,boundary,cache,code-location,database,diagnostic,index,performance,route,semantic-diff,server-action,severity}.ts`.
- 35 shared mocks: `src/shared/mocks/`.
- Sampled features: `runtime-logs`, `find-references`, `rule-manager`,
  `blast-radius`, `evidence-tracer`, `pr-summary`, `patch-preview`,
  `architecture-map`, `turbopack-graph`, `dead-code-finder`,
  `peek-definition`, `rsc-profiler`, `go-to-symbol`,
  `symbol-popularity`, `component-preview`.
