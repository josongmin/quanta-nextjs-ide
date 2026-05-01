# Quanta Next.js fixture

Minimal Next.js 15 app used by `e2e/real-nextjs.spec.ts` to verify the IDE
parses **real** RSC Flight payloads (not the synthesised fake server).

## Routes (corpus)

| Route                   | What it exercises                                               |
| ----------------------- | --------------------------------------------------------------- |
| `/`                     | Server Component shell, no client islands                       |
| `/static`               | Pure server component                                           |
| `/island`               | One `'use client'` island (`Counter`) inside a server shell     |
| `/suspense`             | `<Suspense>` + async server component (200ms artificial delay)  |
| `/action`               | Server Action via inline `'use server'` form handler            |
| `/products/[id]`        | Dynamic route with params + reused client island                |

## Running by hand

```bash
cd e2e/fixtures/next-app
npm install            # one time
npm run dev            # serves on :3001
```

Then probe with curl:

```bash
curl -H "RSC: 1" http://localhost:3001/island
```

## Running the e2e suite against this app

```bash
RUN_REAL_NEXTJS=1 npm run test:e2e:real    # from project root
```

Playwright auto-launches:
- This Next dev server on `:3001`
- The IDE's vite dev server on `:5174` with `VITE_NEXT_DEV_URL` pointed at `:3001`

## Why the corpus exists

We discovered that real Next.js Flight streams behave differently from
hand-crafted mocks:
- Same chunk id is emitted multiple times (Suspense follow-ups) — required
  dedupe in our tree-builder + unique React keys in the chunk list.
- Hex chunk ids (`a:`, `f:`, `10:`, `1a:`) are normal.
- Lots of internal Next.js client modules (layout-router, error-boundary,
  metadata-boundary, render-from-template-context) ship in every page.

Each finding here became a regression test in `real-nextjs.spec.ts`.
