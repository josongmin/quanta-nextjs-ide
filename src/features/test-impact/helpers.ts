export type TestKind = 'unit' | 'integration' | 'e2e';
export type TestResult = 'pass' | 'fail' | 'flaky' | 'skipped';

export interface TestCase {
  id: string;
  name: string;
  file: string;
  kind: TestKind;
  deps: ReadonlyArray<string>;
  avgRuntimeMs: number;
  lastResult: TestResult;
}

export const changedFiles = [
  'src/lib/cart.ts',
  'src/components/ProductCard.tsx',
  'src/server/checkout.ts',
  'src/utils/format.ts',
  'src/pages/api/orders.ts',
] as const;

export type ChangedFile = (typeof changedFiles)[number];

export const tests: ReadonlyArray<TestCase> = [
  // cart.test.ts
  {
    id: 't_cart_add',
    name: 'adds item to cart',
    file: 'src/lib/__tests__/cart.test.ts',
    kind: 'unit',
    deps: ['src/lib/cart.ts'],
    avgRuntimeMs: 42,
    lastResult: 'pass',
  },
  {
    id: 't_cart_remove',
    name: 'removes item by id',
    file: 'src/lib/__tests__/cart.test.ts',
    kind: 'unit',
    deps: ['src/lib/cart.ts'],
    avgRuntimeMs: 38,
    lastResult: 'pass',
  },
  {
    id: 't_cart_total',
    name: 'computes total with format',
    file: 'src/lib/__tests__/cart.test.ts',
    kind: 'unit',
    deps: ['src/lib/cart.ts', 'src/utils/format.ts'],
    avgRuntimeMs: 51,
    lastResult: 'fail',
  },
  // product-card.test.tsx
  {
    id: 't_pc_render',
    name: 'renders title + price',
    file: 'src/components/__tests__/product-card.test.tsx',
    kind: 'unit',
    deps: ['src/components/ProductCard.tsx', 'src/utils/format.ts'],
    avgRuntimeMs: 96,
    lastResult: 'pass',
  },
  {
    id: 't_pc_addbtn',
    name: 'add-to-cart button calls handler',
    file: 'src/components/__tests__/product-card.test.tsx',
    kind: 'unit',
    deps: ['src/components/ProductCard.tsx', 'src/lib/cart.ts'],
    avgRuntimeMs: 110,
    lastResult: 'pass',
  },
  // checkout.test.ts
  {
    id: 't_co_validate',
    name: 'validates address',
    file: 'src/server/__tests__/checkout.test.ts',
    kind: 'unit',
    deps: ['src/server/checkout.ts'],
    avgRuntimeMs: 64,
    lastResult: 'pass',
  },
  {
    id: 't_co_charge',
    name: 'charges card and writes order',
    file: 'src/server/__tests__/checkout.test.ts',
    kind: 'integration',
    deps: ['src/server/checkout.ts', 'src/lib/cart.ts'],
    avgRuntimeMs: 280,
    lastResult: 'flaky',
  },
  {
    id: 't_co_idem',
    name: 'idempotent on retry',
    file: 'src/server/__tests__/checkout.test.ts',
    kind: 'integration',
    deps: ['src/server/checkout.ts'],
    avgRuntimeMs: 320,
    lastResult: 'pass',
  },
  // format.test.ts
  {
    id: 't_fmt_money',
    name: 'formats money',
    file: 'src/utils/__tests__/format.test.ts',
    kind: 'unit',
    deps: ['src/utils/format.ts'],
    avgRuntimeMs: 12,
    lastResult: 'pass',
  },
  {
    id: 't_fmt_date',
    name: 'formats relative date',
    file: 'src/utils/__tests__/format.test.ts',
    kind: 'unit',
    deps: ['src/utils/format.ts'],
    avgRuntimeMs: 14,
    lastResult: 'pass',
  },
  {
    id: 't_fmt_pct',
    name: 'formats percent',
    file: 'src/utils/__tests__/format.test.ts',
    kind: 'unit',
    deps: ['src/utils/format.ts'],
    avgRuntimeMs: 9,
    lastResult: 'pass',
  },
  // orders-api.test.ts
  {
    id: 't_oapi_post',
    name: 'POST /api/orders creates order',
    file: 'src/pages/api/__tests__/orders.test.ts',
    kind: 'integration',
    deps: ['src/pages/api/orders.ts', 'src/server/checkout.ts'],
    avgRuntimeMs: 410,
    lastResult: 'pass',
  },
  {
    id: 't_oapi_auth',
    name: 'requires auth header',
    file: 'src/pages/api/__tests__/orders.test.ts',
    kind: 'integration',
    deps: ['src/pages/api/orders.ts'],
    avgRuntimeMs: 220,
    lastResult: 'pass',
  },
  // checkout.e2e.ts
  {
    id: 't_e2e_buy',
    name: 'buy flow happy path',
    file: 'e2e/checkout.e2e.ts',
    kind: 'e2e',
    deps: [
      'src/components/ProductCard.tsx',
      'src/lib/cart.ts',
      'src/server/checkout.ts',
      'src/pages/api/orders.ts',
    ],
    avgRuntimeMs: 8400,
    lastResult: 'pass',
  },
  {
    id: 't_e2e_guest',
    name: 'guest checkout',
    file: 'e2e/checkout.e2e.ts',
    kind: 'e2e',
    deps: ['src/server/checkout.ts', 'src/pages/api/orders.ts'],
    avgRuntimeMs: 7600,
    lastResult: 'flaky',
  },
  // products-list.test.tsx
  {
    id: 't_pl_grid',
    name: 'renders product grid',
    file: 'src/pages/__tests__/products-list.test.tsx',
    kind: 'unit',
    deps: ['src/components/ProductCard.tsx'],
    avgRuntimeMs: 130,
    lastResult: 'pass',
  },
  {
    id: 't_pl_empty',
    name: 'renders empty state',
    file: 'src/pages/__tests__/products-list.test.tsx',
    kind: 'unit',
    deps: ['src/components/ProductCard.tsx'],
    avgRuntimeMs: 90,
    lastResult: 'pass',
  },
  {
    id: 't_pl_search',
    name: 'filters by query',
    file: 'src/pages/__tests__/products-list.test.tsx',
    kind: 'integration',
    deps: ['src/components/ProductCard.tsx', 'src/utils/format.ts'],
    avgRuntimeMs: 210,
    lastResult: 'pass',
  },
  // auth.test.ts (unrelated)
  {
    id: 't_auth_login',
    name: 'logs in user',
    file: 'src/server/__tests__/auth.test.ts',
    kind: 'unit',
    deps: ['src/server/auth.ts'],
    avgRuntimeMs: 70,
    lastResult: 'pass',
  },
  {
    id: 't_auth_session',
    name: 'creates session token',
    file: 'src/server/__tests__/auth.test.ts',
    kind: 'unit',
    deps: ['src/server/auth.ts'],
    avgRuntimeMs: 88,
    lastResult: 'pass',
  },
  {
    id: 't_auth_expire',
    name: 'rejects expired token',
    file: 'src/server/__tests__/auth.test.ts',
    kind: 'unit',
    deps: ['src/server/auth.ts'],
    avgRuntimeMs: 62,
    lastResult: 'pass',
  },
  // orders-list.test.tsx
  {
    id: 't_ol_render',
    name: 'orders list renders rows',
    file: 'src/pages/__tests__/orders-list.test.tsx',
    kind: 'unit',
    deps: ['src/utils/format.ts'],
    avgRuntimeMs: 88,
    lastResult: 'pass',
  },
  {
    id: 't_ol_money',
    name: 'orders list totals match',
    file: 'src/pages/__tests__/orders-list.test.tsx',
    kind: 'unit',
    deps: ['src/utils/format.ts', 'src/lib/cart.ts'],
    avgRuntimeMs: 102,
    lastResult: 'pass',
  },
  {
    id: 't_ol_paginate',
    name: 'paginates 100+ rows',
    file: 'src/pages/__tests__/orders-list.test.tsx',
    kind: 'integration',
    deps: ['src/pages/api/orders.ts'],
    avgRuntimeMs: 240,
    lastResult: 'pass',
  },
  {
    id: 't_smoke_render',
    name: 'smoke: app boots',
    file: 'src/__tests__/smoke.test.ts',
    kind: 'unit',
    deps: ['src/server/auth.ts'],
    avgRuntimeMs: 24,
    lastResult: 'pass',
  },
];

export interface ImpactResult {
  test: TestCase;
  reasons: ReadonlyArray<string>;
  impactScore: number;
}

export function affectedTests(
  changed: ReadonlyArray<string>,
  pool: ReadonlyArray<TestCase>,
): ReadonlyArray<ImpactResult> {
  const results: Array<ImpactResult> = [];
  for (const t of pool) {
    const reasons: Array<string> = [];
    for (const d of t.deps) {
      if (changed.includes(d)) {
        reasons.push(`${t.file.split('/').pop() ?? t.file} → ${d}`);
      }
    }
    if (reasons.length > 0) {
      results.push({ test: t, reasons, impactScore: reasons.length });
    }
  }
  return results.sort((a, b) => b.impactScore - a.impactScore);
}

export function totalRuntimeMs(pool: ReadonlyArray<TestCase>): number {
  return pool.reduce((acc, t) => acc + t.avgRuntimeMs, 0);
}

export function impactedRuntimeMs(impacts: ReadonlyArray<ImpactResult>): number {
  return impacts.reduce((acc, r) => acc + r.test.avgRuntimeMs, 0);
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${(s / 60).toFixed(1)}m`;
}
