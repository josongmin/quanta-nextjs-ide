# Unused Imports / Variables Audit

Method: ran `npx tsc --noEmit --pretty` and `npx eslint src` against the
project's existing config (TS strict mode + react-hooks plugin).

## TypeScript baseline

`tsc --noEmit --pretty` → exits clean with no diagnostics.
`tsc -b --pretty` → also clean (project references all build).

So no TS-level unused-symbol diagnostics (the `noUnusedLocals` /
`noUnusedParameters` flags would have surfaced them).

## ESLint full project run

```
npx eslint src
```

Result: **0 errors, 4 warnings**. All four warnings are
`react-hooks/exhaustive-deps` advisories, not unused-vars:

| File | Line | Warning |
| --- | --- | --- |
| `src/features/critical-css/index.tsx` | 141 | `entries` logical expression could change deps of `useMemo` on every render — wrap in its own `useMemo`. |
| `src/features/live-preview/index.tsx` | 159 | `useMemo` has unnecessary dependency `reloadKey`. |
| `src/features/og-image-generator/index.tsx` | 248 | `state` object changes deps of `useMemo` on every render — wrap in its own `useMemo`. |
| `src/features/typed-routing-graph/index.tsx` | 75 | `useMemo` missing dependency `ROUTE_X`. |

None of these are unused imports or unused variables. They are hook
deps-array hints. Per the task's "don't auto-fix unless trivial" rule,
they're left as-is — each requires a small judgement call about what the
intended effect/memo dependency was, which is feature-author territory.

## Unused imports / variables found

**None.** TS strict + ESLint flat config catch unused imports
project-wide and report zero issues.

## Recommendation

Leave the four exhaustive-deps warnings to the feature owners. If the
user wants them fixed in a follow-up batch, each is a 1–3 line edit:
- `critical-css`: extract `entries` into its own `useMemo` over the
  source data.
- `live-preview`: drop `reloadKey` from the `useMemo` deps array.
- `og-image-generator`: extract `state` into its own `useMemo`.
- `typed-routing-graph`: add `ROUTE_X` to the `useMemo` deps.

These were not auto-applied because each requires reading the surrounding
hook to confirm the intended dependency semantics.
