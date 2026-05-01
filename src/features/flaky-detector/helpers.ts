export type RunOutcome = 'pass' | 'fail';
export type FlakeClass = 'stable' | 'sus' | 'flaky' | 'broken';
export type FailReason =
  | 'timeout'
  | 'race'
  | 'snapshot drift'
  | 'network'
  | 'ordering'
  | 'memory';

export interface RunRecord {
  ts: number;
  outcome: RunOutcome;
}

export interface FlakyTest {
  id: string;
  name: string;
  file: string;
  runs: ReadonlyArray<RunRecord>;
  avgRuntimeMs: number;
  lastFailReason: FailReason | null;
  errorStacks: ReadonlyArray<{ stack: string; count: number }>;
  suggested: { cause: string; fix: string };
}

const NOW = 1735689600_000; // 2025-01-01 UTC, deterministic
const DAY = 86_400_000;

function buildRuns(pattern: ReadonlyArray<RunOutcome>): ReadonlyArray<RunRecord> {
  return pattern.map((outcome, i) => ({
    ts: NOW - (pattern.length - 1 - i) * DAY,
    outcome,
  }));
}

const stable30: ReadonlyArray<RunOutcome> = Array.from({ length: 30 }, () => 'pass' as const);
const broken30: ReadonlyArray<RunOutcome> = Array.from({ length: 30 }, () => 'fail' as const);

function pattern(seed: number, failRate: number): ReadonlyArray<RunOutcome> {
  // Deterministic pseudo-random
  let s = seed;
  const out: Array<RunOutcome> = [];
  for (let i = 0; i < 30; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    out.push(r < failRate ? 'fail' : 'pass');
  }
  return out;
}

export const flakyTests: ReadonlyArray<FlakyTest> = [
  {
    id: 'fl_co_charge',
    name: 'charges card and writes order',
    file: 'src/server/__tests__/checkout.test.ts',
    runs: buildRuns(pattern(7, 0.45)),
    avgRuntimeMs: 280,
    lastFailReason: 'race',
    errorStacks: [
      { stack: 'TimeoutError: waiting for db lock at chargeCard:42', count: 6 },
      { stack: 'AssertionError: expected order_status to be "paid" at charge.test:88', count: 3 },
    ],
    suggested: {
      cause: 'Charge handler races with order writer; db lock not held long enough.',
      fix: 'Wrap charge + writeOrder in single tx; await transaction commit.',
    },
  },
  {
    id: 'fl_e2e_guest',
    name: 'guest checkout',
    file: 'e2e/checkout.e2e.ts',
    runs: buildRuns(pattern(11, 0.4)),
    avgRuntimeMs: 7600,
    lastFailReason: 'timeout',
    errorStacks: [
      { stack: 'Timeout 30000ms waiting for selector "[data-test=order-confirm]"', count: 8 },
      { stack: 'PageError: net::ERR_TIMED_OUT', count: 2 },
    ],
    suggested: {
      cause: 'Test relies on real network for /api/orders.',
      fix: 'Stub /api/orders with msw at e2e fixture level.',
    },
  },
  {
    id: 'fl_pl_search',
    name: 'filters by query',
    file: 'src/pages/__tests__/products-list.test.tsx',
    runs: buildRuns(pattern(3, 0.35)),
    avgRuntimeMs: 210,
    lastFailReason: 'race',
    errorStacks: [
      { stack: 'expected 4 cards, found 0 (debounce hit)', count: 5 },
    ],
    suggested: {
      cause: 'Debounce in search hook fires after assertion.',
      fix: 'await waitFor(() => expect(...)) instead of getAllBy.',
    },
  },
  {
    id: 'fl_snap_card',
    name: 'ProductCard snapshot',
    file: 'src/components/__tests__/product-card.test.tsx',
    runs: buildRuns(pattern(9, 0.3)),
    avgRuntimeMs: 96,
    lastFailReason: 'snapshot drift',
    errorStacks: [
      { stack: 'Snapshot mismatch: hash class differs by tailwind v4', count: 4 },
    ],
    suggested: {
      cause: 'Snapshot includes generated tailwind hash classes.',
      fix: 'Strip dynamic class names with snapshot serializer.',
    },
  },
  {
    id: 'fl_ord_pag',
    name: 'paginates 100+ rows',
    file: 'src/pages/__tests__/orders-list.test.tsx',
    runs: buildRuns(pattern(13, 0.2)),
    avgRuntimeMs: 240,
    lastFailReason: 'ordering',
    errorStacks: [
      { stack: 'expected order [a,b,c], got [c,a,b]', count: 3 },
    ],
    suggested: {
      cause: 'Sort by created_at without secondary tiebreaker.',
      fix: 'Add id ASC as tiebreaker in orderBy.',
    },
  },
  {
    id: 'fl_oapi_post',
    name: 'POST /api/orders creates order',
    file: 'src/pages/api/__tests__/orders.test.ts',
    runs: buildRuns(pattern(17, 0.15)),
    avgRuntimeMs: 410,
    lastFailReason: 'network',
    errorStacks: [
      { stack: 'fetch failed: ECONNRESET', count: 2 },
    ],
    suggested: {
      cause: 'Test hits real Stripe sandbox.',
      fix: 'Mock Stripe client in test setup.',
    },
  },
  {
    id: 'fl_cart_total',
    name: 'computes total with format',
    file: 'src/lib/__tests__/cart.test.ts',
    runs: buildRuns(pattern(21, 0.5)),
    avgRuntimeMs: 51,
    lastFailReason: 'memory',
    errorStacks: [
      { stack: 'OOM: heap snapshot exceeded 1.5GB', count: 1 },
      { stack: 'expected 19.99, got 19.989999', count: 4 },
    ],
    suggested: {
      cause: 'Floating-point drift in money math.',
      fix: 'Use integer cents internally; format on render.',
    },
  },
  {
    id: 'fl_auth_session',
    name: 'creates session token',
    file: 'src/server/__tests__/auth.test.ts',
    runs: buildRuns(stable30),
    avgRuntimeMs: 88,
    lastFailReason: null,
    errorStacks: [],
    suggested: { cause: 'No recent failures.', fix: 'No action needed.' },
  },
  {
    id: 'fl_fmt_money',
    name: 'formats money',
    file: 'src/utils/__tests__/format.test.ts',
    runs: buildRuns(stable30),
    avgRuntimeMs: 12,
    lastFailReason: null,
    errorStacks: [],
    suggested: { cause: 'No recent failures.', fix: 'No action needed.' },
  },
  {
    id: 'fl_pc_render',
    name: 'renders title + price',
    file: 'src/components/__tests__/product-card.test.tsx',
    runs: buildRuns(stable30),
    avgRuntimeMs: 96,
    lastFailReason: null,
    errorStacks: [],
    suggested: { cause: 'No recent failures.', fix: 'No action needed.' },
  },
  {
    id: 'fl_legacy',
    name: 'legacy migration helper',
    file: 'src/lib/__tests__/legacy.test.ts',
    runs: buildRuns(broken30),
    avgRuntimeMs: 35,
    lastFailReason: 'snapshot drift',
    errorStacks: [
      { stack: 'AssertionError: helper removed in v3', count: 30 },
    ],
    suggested: {
      cause: 'Helper deleted; test should be removed or rewritten.',
      fix: 'Delete this test file or port to new helper.',
    },
  },
  {
    id: 'fl_fl_load',
    name: 'feature flag loads',
    file: 'src/lib/__tests__/flags.test.ts',
    runs: buildRuns(pattern(29, 0.07)),
    avgRuntimeMs: 60,
    lastFailReason: 'network',
    errorStacks: [
      { stack: 'expected flag "ff_x" to exist', count: 1 },
    ],
    suggested: {
      cause: 'Flag fetched lazily; race on cold start.',
      fix: 'Preload flags in test setup.',
    },
  },
];

export function flakeScore(runs: ReadonlyArray<RunRecord>): number {
  if (runs.length === 0) return 0;
  const passes = runs.filter((r) => r.outcome === 'pass').length;
  const p = passes / runs.length;
  if (p === 0 || p === 1) return 0;
  return 1 - Math.abs(p - 0.5) * 2;
}

export function flakyClass(score: number): FlakeClass {
  if (score === 0) return 'stable';
  if (score < 0.4) return 'sus';
  if (score < 0.85) return 'flaky';
  return 'broken';
}

export function classOfTest(t: FlakyTest): FlakeClass {
  const passes = t.runs.filter((r) => r.outcome === 'pass').length;
  if (passes === t.runs.length) return 'stable';
  if (passes === 0) return 'broken';
  return flakyClass(flakeScore(t.runs));
}

export function lastFailureTs(runs: ReadonlyArray<RunRecord>): number {
  for (let i = runs.length - 1; i >= 0; i--) {
    const r = runs[i];
    if (r && r.outcome === 'fail') return r.ts;
  }
  return 0;
}
