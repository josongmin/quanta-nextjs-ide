export type TaskKind = 'npm' | 'custom';

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed';

export interface LastRun {
  status: TaskStatus;
  durationMs: number;
  exit: number;
}

export interface Task {
  id: string;
  name: string;
  command: string;
  kind: TaskKind;
  kbd: string;
  lastRun: LastRun;
  runningPid: number | null;
}

export const TASKS_INITIAL: ReadonlyArray<Task> = [
  {
    id: 't-dev',
    name: 'dev',
    command: 'next dev --turbo',
    kind: 'npm',
    kbd: '⌘D',
    lastRun: { status: 'running', durationMs: 0, exit: 0 },
    runningPid: 81204,
  },
  {
    id: 't-build',
    name: 'build',
    command: 'next build',
    kind: 'npm',
    kbd: '⌘B',
    lastRun: { status: 'success', durationMs: 38_900, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-start',
    name: 'start',
    command: 'next start -p 4000',
    kind: 'npm',
    kbd: '⌘⇧S',
    lastRun: { status: 'idle', durationMs: 0, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-lint',
    name: 'lint',
    command: 'eslint . --max-warnings=0',
    kind: 'npm',
    kbd: '⌘L',
    lastRun: { status: 'failed', durationMs: 5_211, exit: 1 },
    runningPid: null,
  },
  {
    id: 't-lint-fix',
    name: 'lint:fix',
    command: 'eslint . --fix',
    kind: 'npm',
    kbd: '⌘⇧L',
    lastRun: { status: 'success', durationMs: 4_804, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-format',
    name: 'format',
    command: 'prettier --write .',
    kind: 'npm',
    kbd: '⌘F',
    lastRun: { status: 'success', durationMs: 1_320, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-typecheck',
    name: 'typecheck',
    command: 'tsc -b --pretty',
    kind: 'npm',
    kbd: '⌘T',
    lastRun: { status: 'success', durationMs: 9_711, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-test',
    name: 'test',
    command: 'vitest run',
    kind: 'npm',
    kbd: '⌘⇧T',
    lastRun: { status: 'success', durationMs: 12_402, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-test-watch',
    name: 'test:watch',
    command: 'vitest',
    kind: 'npm',
    kbd: '⌘⇧W',
    lastRun: { status: 'idle', durationMs: 0, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-e2e',
    name: 'e2e',
    command: 'playwright test',
    kind: 'custom',
    kbd: '⌘E',
    lastRun: { status: 'failed', durationMs: 87_311, exit: 1 },
    runningPid: null,
  },
  {
    id: 't-analyze',
    name: 'analyze',
    command: 'ANALYZE=true next build',
    kind: 'custom',
    kbd: '⌘A',
    lastRun: { status: 'success', durationMs: 41_092, exit: 0 },
    runningPid: null,
  },
  {
    id: 't-clean',
    name: 'clean',
    command: 'rm -rf .next dist node_modules/.cache',
    kind: 'custom',
    kbd: '⌘K',
    lastRun: { status: 'success', durationMs: 412, exit: 0 },
    runningPid: null,
  },
];

export const TASK_KINDS: ReadonlyArray<TaskKind> = ['npm', 'custom'];

export function statusTone(
  s: TaskStatus,
): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  switch (s) {
    case 'running':
      return 'accent';
    case 'success':
      return 'info';
    case 'failed':
      return 'err';
    case 'idle':
      return 'muted';
  }
}

export function fmtDuration(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1_000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

interface OutputSeed {
  prefix: string;
  lines: ReadonlyArray<string>;
}

const TASK_OUTPUTS: Record<string, OutputSeed> = {
  't-dev': {
    prefix: 'next',
    lines: [
      '▲ Next.js 15.0.3 (turbo)',
      '- Local:        http://localhost:3000',
      '- Network:      http://192.168.1.42:3000',
      '✓ Starting...',
      '✓ Ready in 1.2s',
      '○ Compiling /page ...',
      '✓ Compiled /page in 312ms (2421 modules)',
      'GET / 200 in 41ms',
      'GET /favicon.ico 200 in 4ms',
      '○ Compiling /dashboard ...',
      '✓ Compiled /dashboard in 187ms',
      'GET /dashboard 200 in 22ms',
    ],
  },
  't-build': {
    prefix: 'next',
    lines: [
      '▲ Next.js 15.0.3 (production build)',
      'Linting and checking validity of types ...',
      'Compiled successfully in 32.1s',
      'Collecting page data ...',
      'Generating static pages (24/24)',
      'Finalizing page optimization ...',
      '┌─ /              static  3.21kB    98.4kB',
      '├─ /dashboard     ssr     1.40kB   122.0kB',
      '└─ /api/orders    edge    412B      0.0kB',
      'Build completed in 38.9s',
    ],
  },
  't-typecheck': {
    prefix: 'tsc',
    lines: [
      'Building project tsconfig.app.json',
      'Checking source files ...',
      'Found 0 errors. Watching for file changes.',
      '— elapsed 9.7s',
    ],
  },
  't-lint': {
    prefix: 'eslint',
    lines: [
      'src/app/page.tsx',
      '  41:9   error  React Hook useEffect has missing dependency',
      'src/lib/cart.ts',
      '   8:1   warn   Unused import: pluck',
      '✖ 1 problem (1 error, 1 warning)',
      'exit code 1',
    ],
  },
  't-test': {
    prefix: 'vitest',
    lines: [
      ' RUN  v1.6.0 /Users/songmin/quanta-nextjs-ide',
      ' ✓ src/lib/cart.test.ts (4 tests) 12ms',
      ' ✓ src/lib/format.test.ts (8 tests) 9ms',
      ' ✓ src/widgets/sidebar.test.ts (6 tests) 23ms',
      ' Test Files  3 passed (3)',
      '      Tests  18 passed (18)',
      '   Start at  09:11:42',
      '   Duration  12.4s',
    ],
  },
  't-e2e': {
    prefix: 'playwright',
    lines: [
      'Running 16 tests using 4 workers',
      '  ✓  checkout.spec.ts:14 › guest checkout',
      '  ✓  auth.spec.ts:8 › sign-in',
      '  ✘  cart.spec.ts:22 › quantity bug → expected 3, got 2',
      '  ✓  search.spec.ts:5 › typeahead',
      '  ...',
      '  3 failed, 13 passed',
      'exit code 1',
    ],
  },
};

export function outputFor(task: Task): string {
  const seed = TASK_OUTPUTS[task.id];
  const ts = new Date(1_730_000_000_000).toISOString().slice(11, 19);
  const lines = seed
    ? seed.lines
    : [
        `$ ${task.command}`,
        '...',
        `[${task.lastRun.status}] exit ${task.lastRun.exit}`,
      ];
  return lines.map((l, i) => `${ts}.${String(i).padStart(3, '0')}  ${l}`).join('\n');
}
