# Mocks migration — `shared/mocks/*` upward-import cleanup

**Date:** 2026-05-01
**Trigger:** FSD audit found `shared/mocks/*.ts` importing from `@features/*` and `@entities/*` — illegal hops since `shared` sits at the bottom of the FSD layer stack.

## Summary of decisions

The unified strategy is:

1. **Shape types** for each mock now live in `src/shared/types/` (e.g. `auth-flow.ts`, `form-flow.ts`, `i18n.ts`, `image-format.ts`, `render-path.ts`, `lighthouse.ts`, `hydration.ts`, `streaming.ts`, `rsc-component.ts`, `notification.ts`, `rsc-payload.ts`).
2. **Mock data literals** live in `src/shared/mocks/` and import their shape types from `@shared/types`.
3. **Feature `helpers.ts`** files re-export the shape types from `@shared/types` (so existing `@features/*/helpers` consumers keep working) and import their seed data from `@shared/mocks/*`.
4. **Entity stores** (e.g. `entities/notification/store.ts`) import shape types from `@shared/types` and re-export them so `@entities/notification` and `@entities/notification/store` consumers keep working.

This inverts the dependency: the type definitions are now owned by `shared`, mock data references those types, and feature/entity code re-exports them. No upward hops, no circular deps, no consumer changes required.

## Per-offender resolution

| Mock file | Offending import | Resolution |
|-----------|------------------|------------|
| `auth-flow.ts` | `flows`, `AuthFlow` from `@features/auth-flow-tracer/helpers` | **Inverted.** Type moved to `shared/types/auth-flow.ts`. Data literal moved into `shared/mocks/auth-flow.ts` (now exposes `mockAuthFlows`). `features/auth-flow-tracer/helpers.ts` imports both back. |
| `forms.ts` | `forms`, `FormFlow` from `@features/form-pipeline/helpers` | **Inverted.** Type → `shared/types/form-flow.ts`. Data → `shared/mocks/forms.ts` (`mockFormFlows`). Helper re-imports. |
| `i18n.ts` | `keys`, `locales`, `namespaces`, `I18nKey`, `Locale`, `Namespace` from `@features/i18n-coverage/helpers` | **Inverted.** Types → `shared/types/i18n.ts`. Data → `shared/mocks/i18n.ts` (`mockI18nKeys`, `mockI18nLocales`, `mockI18nNamespaces`). Helper re-imports. |
| `images.ts` | `ImageEntry` from `@features/image-format-audit/helpers` | **Type lifted.** `ImageEntry`, `ImageFmt` → `shared/types/image-format.ts`. Mock data already lived here. Helper re-exports the type. |
| `render-path.ts` | `CriticalCssBundle`, `RenderPathEntry` from `@features/critical-css/helpers` | **Type lifted.** Both types → `shared/types/render-path.ts`. Helper re-exports. |
| `lighthouse.ts` | `LhAudit`, `LhRouteReport`, `LhScore` from `@features/lighthouse/helpers` | **Type lifted.** `LhAudit`, `LhRouteReport`, `LhScore`, `LhCategory` → `shared/types/lighthouse.ts`. Helper re-exports. |
| `runtime.ts` (1) | `HydrationReport` from `@features/hydration-inspector/helpers` | **Type lifted.** `HydrationReport`, `HydrationNode`, `HydrationMatch` → `shared/types/hydration.ts`. Helper re-exports. |
| `runtime.ts` (2) | `StreamingTrace` from `@features/streaming-visualizer/helpers` | **Type lifted.** `StreamingTrace` and the inner chunk shape → `shared/types/streaming.ts` as `StreamingRscChunk` (renamed to avoid colliding with the entity's `RscChunk`). The feature's historical `RscChunk` export is preserved as a local alias. |
| `runtime.ts` (3) | `RscComponent` from `@features/rsc-profiler/helpers` | **Type lifted.** `RscComponent` → `shared/types/rsc-component.ts`. Helper re-exports. |
| `notifications.ts` | `Notification` from `@entities/notification/store` | **Type lifted.** `Notification`, `NotificationKind`, `NotificationAction` → `shared/types/notification.ts`. The entity store re-exports them so `@entities/notification` consumers (incl. the `index.ts` barrel) keep working. |
| `rsc-payload.ts` | `detectEnvironment`, `RscChunk` from `@entities/rsc-payload` | **Type lifted + behaviour inlined.** `RscChunk`, `ChunkKind`, `ModuleEnvironment`, `TreeNode` → `shared/types/rsc-payload.ts`. The entity's `model/types.ts` now re-exports those types from shared. The runtime call to `detectEnvironment(payload)` was replaced by a hardcoded `MODULE_ENV: 'client'` — the heuristic always returns `'client'` for these mock payloads (none reference `runtime` or `rsc` chunk paths), so observable behaviour is unchanged. |

## Notes

- All consumers of `@features/*/helpers` and `@entities/notification[/store]` continue to work via the same export names (re-exports through the helper / store).
- The `runtime.ts` mock kept its three former `import type` lines positioned at their original section breaks; only the source path changed (`@features/...` → `@shared/types`).
- For `rsc-payload`, the hard-coded `'client'` constant is documented at the top of `shared/mocks/rsc-payload.ts` with a pointer to the heuristic in `entities/rsc-payload/model/parser.ts` so the link is discoverable.
- `shared/types/index.ts` now barrel-exports the ten new modules.

## Verification

- `npx tsc -b` — clean.
- `npm run build` — green (Vite build completes).
- `grep -rn "from '@features/\|from '@entities/" src/shared/mocks/` — empty.
