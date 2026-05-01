export type RunStatus = 'idle' | 'running' | 'done' | 'failed';

export interface LastRun {
  ts: number;
  durationMs: number;
  status: 'done' | 'failed';
  exit: number;
  output: string;
}

export interface RunConfig {
  id: string;
  name: string;
  command: string;
  env: Record<string, string>;
  history: ReadonlyArray<number>; // last 8 durations
  lastRun: LastRun;
  status: RunStatus;
  favorite: boolean;
}

export const CONFIGS: ReadonlyArray<RunConfig> = [
  {
    id: 'cfg_dev',
    name: 'dev',
    command: 'pnpm dev',
    env: { NODE_ENV: 'development', PORT: '3000' },
    history: [3120, 2980, 3050, 2840, 3210, 2950, 2870, 2780],
    lastRun: {
      ts: 1714499000000,
      durationMs: 2780,
      status: 'done',
      exit: 0,
      output:
        '> next dev\n  ▲ Next.js 15.0.0\n  - Local:    http://localhost:3000\n  ✓ Ready in 2.7s\n  ○ Compiling /\n  ✓ Compiled / in 312ms\n  GET /  200 in 41ms',
    },
    status: 'running',
    favorite: true,
  },
  {
    id: 'cfg_build',
    name: 'build',
    command: 'pnpm build',
    env: { NODE_ENV: 'production' },
    history: [42100, 41200, 43500, 44100, 41800, 42700, 43200, 41500],
    lastRun: {
      ts: 1714498200000,
      durationMs: 41500,
      status: 'done',
      exit: 0,
      output:
        '> next build\n  ✓ Linting and checking types\n  ✓ Creating an optimized production build\n  ✓ Compiled successfully\n  ✓ Generated 142 static pages\n  ƒ /api/checkout    142 B   85 kB\n  ○ /products/[id]  3.2 kB   126 kB',
    },
    status: 'done',
    favorite: true,
  },
  {
    id: 'cfg_typecheck',
    name: 'typecheck',
    command: 'tsc -b --pretty',
    env: {},
    history: [11200, 11100, 11400, 11050, 11300, 11150, 11000, 10900],
    lastRun: {
      ts: 1714497500000,
      durationMs: 10900,
      status: 'done',
      exit: 0,
      output:
        '> tsc -b --pretty\n  src/app/page.tsx ✓\n  src/components/Cart.tsx ✓\n  src/lib/db/schema.ts ✓\n  Found 0 errors.',
    },
    status: 'done',
    favorite: true,
  },
  {
    id: 'cfg_unit',
    name: 'test:unit',
    command: 'vitest run',
    env: { CI: 'true' },
    history: [8200, 8500, 8100, 7900, 8300, 8400, 8050, 8120],
    lastRun: {
      ts: 1714497000000,
      durationMs: 8120,
      status: 'done',
      exit: 0,
      output:
        '> vitest run\n  ✓ src/lib/pricing.test.ts (4 tests) 12ms\n  ✓ src/lib/format.test.ts (8 tests) 21ms\n  Test Files  2 passed (2)\n  Tests       12 passed (12)',
    },
    status: 'done',
    favorite: false,
  },
  {
    id: 'cfg_e2e',
    name: 'test:e2e',
    command: 'playwright test',
    env: { BASE_URL: 'http://localhost:3000' },
    history: [62100, 60500, 64200, 61800, 63500, 60900, 65800, 67200],
    lastRun: {
      ts: 1714496000000,
      durationMs: 67200,
      status: 'failed',
      exit: 1,
      output:
        '> playwright test\n  Running 14 tests using 4 workers\n  ✓  product-list.spec.ts:12\n  ✗  checkout.spec.ts:42 → expected 200, got 500\n  1 failed, 13 passed (1m 7s)',
    },
    status: 'failed',
    favorite: false,
  },
  {
    id: 'cfg_lint',
    name: 'lint',
    command: 'eslint .',
    env: {},
    history: [4200, 4150, 4250, 4180, 4220, 4170, 4140, 4100],
    lastRun: {
      ts: 1714495000000,
      durationMs: 4100,
      status: 'done',
      exit: 0,
      output:
        '> eslint .\n  src/app/page.tsx — clean\n  src/lib/db/schema.ts — clean\n  ✨ no issues',
    },
    status: 'idle',
    favorite: false,
  },
  {
    id: 'cfg_format',
    name: 'format',
    command: 'prettier -w .',
    env: {},
    history: [2200, 2150, 2300, 2240, 2180, 2120, 2090, 2050],
    lastRun: {
      ts: 1714494000000,
      durationMs: 2050,
      status: 'done',
      exit: 0,
      output:
        '> prettier -w .\n  src/app/page.tsx 18ms\n  src/components/Cart.tsx 12ms\n  142 files unchanged',
    },
    status: 'idle',
    favorite: false,
  },
  {
    id: 'cfg_analyze',
    name: 'analyze',
    command: 'pnpm dlx @next/bundle-analyzer',
    env: { ANALYZE: 'true' },
    history: [38000, 39100, 38400, 37800, 38900, 39500, 38200, 37500],
    lastRun: {
      ts: 1714493000000,
      durationMs: 37500,
      status: 'done',
      exit: 0,
      output:
        '> next build (analyze)\n  ▲ writing analysis to .next/analyze/\n  client.html  1.2 mb\n  edge.html    412 kb',
    },
    status: 'idle',
    favorite: true,
  },
];

export function statusTone(s: RunStatus): 'static' | 'info' | 'err' | 'neutral' {
  switch (s) {
    case 'done':
      return 'static';
    case 'running':
      return 'info';
    case 'failed':
      return 'err';
    case 'idle':
      return 'neutral';
  }
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}
