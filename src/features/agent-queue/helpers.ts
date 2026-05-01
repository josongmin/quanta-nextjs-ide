export type AgentKind =
  | 'refactor'
  | 'test'
  | 'review'
  | 'migrate'
  | 'security';

export type TaskStatus = 'queued' | 'running' | 'paused' | 'done' | 'failed';

export interface ActivityLogEntry {
  ts: number; // ms relative to start of session
  text: string;
  level: 'info' | 'warn' | 'error' | 'ok';
}

export interface AgentTask {
  id: string;
  parentId: string | null;
  title: string;
  status: TaskStatus;
  agent: AgentKind;
  startedAt: number; // ms epoch
  durationMs: number;
  progress: number; // 0..100
  costUSD: number;
  tokensIn: number;
  tokensOut: number;
  lastSnippet: string;
  log: ReadonlyArray<ActivityLogEntry>;
}

export const AGENT_LABELS: Record<AgentKind, string> = {
  refactor: 'refactor',
  test: 'test',
  review: 'review',
  migrate: 'migrate',
  security: 'security',
};

export const STATUSES: ReadonlyArray<TaskStatus> = [
  'queued',
  'running',
  'paused',
  'done',
  'failed',
];

export const AGENTS: ReadonlyArray<AgentKind> = [
  'refactor',
  'test',
  'review',
  'migrate',
  'security',
];

const NOW = 1_730_000_000_000;

function mkLog(seed: number): ActivityLogEntry[] {
  const lines: ReadonlyArray<[string, ActivityLogEntry['level']]> = [
    ['Read src/lib/cart.ts', 'info'],
    ['Edited src/lib/cart.ts (+34 -12)', 'ok'],
    ['Ran vitest --run cart.test.ts', 'info'],
    ['1 test failed: total includes tax', 'warn'],
    ['Patched format() handling for currency', 'ok'],
    ['Re-ran tests — all green', 'ok'],
    ['Pushed to branch refactor/cart-totals', 'ok'],
    ['Spawn sub-agent: review-changes', 'info'],
    ['Discovered TODO in checkout.ts:188', 'warn'],
    ['Aborted: rate-limit hit on model API', 'error'],
  ];
  const out: ActivityLogEntry[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = (seed + i * 3) % lines.length;
    const entry = lines[idx];
    if (!entry) continue;
    out.push({
      ts: NOW - i * 47_000 - seed * 1_000,
      text: entry[0],
      level: entry[1],
    });
  }
  return out;
}

interface ParentSeed {
  id: string;
  title: string;
  agent: AgentKind;
  status: TaskStatus;
  childTitles: ReadonlyArray<string>;
}

const PARENTS: ReadonlyArray<ParentSeed> = [
  {
    id: 'p1',
    title: 'Refactor checkout flow to typed cart',
    agent: 'refactor',
    status: 'running',
    childTitles: [
      'Inventory cart.ts callers',
      'Introduce CartItem type',
      'Migrate cart.add usage',
      'Update unit tests',
      'Run typecheck',
    ],
  },
  {
    id: 'p2',
    title: 'Backfill missing tests for /api/orders',
    agent: 'test',
    status: 'queued',
    childTitles: [
      'Read existing handler',
      'Generate happy-path test',
      'Generate 4xx test',
      'Generate 5xx test',
    ],
  },
  {
    id: 'p3',
    title: 'Security audit: XSS sinks in admin panel',
    agent: 'security',
    status: 'paused',
    childTitles: [
      'Grep dangerouslySetInnerHTML',
      'Trace user input → render',
      'Identify 3 risky sinks',
      'Draft mitigation plan',
      'Open advisory PR',
      'Notify reviewers',
    ],
  },
  {
    id: 'p4',
    title: 'Migrate from getServerSideProps to App Router',
    agent: 'migrate',
    status: 'done',
    childTitles: [
      'Catalogue pages/* files',
      'Convert dashboard',
      'Convert profile',
      'Update tests',
      'Smoke run',
      'Open PR',
      'Tag release',
    ],
  },
  {
    id: 'p5',
    title: 'Code review: PR #4421 storage rewrite',
    agent: 'review',
    status: 'failed',
    childTitles: [
      'Read diff',
      'Check coverage',
      'Run perf benches',
      'Post review comments',
    ],
  },
];

const STATUS_CYCLE: ReadonlyArray<TaskStatus> = [
  'done',
  'done',
  'running',
  'queued',
  'paused',
  'failed',
  'done',
];

function buildTasks(): AgentTask[] {
  const out: AgentTask[] = [];
  PARENTS.forEach((p, pi) => {
    out.push({
      id: p.id,
      parentId: null,
      title: p.title,
      status: p.status,
      agent: p.agent,
      startedAt: NOW - (pi + 1) * 600_000,
      durationMs: 240_000 + pi * 90_000,
      progress:
        p.status === 'done'
          ? 100
          : p.status === 'failed'
            ? 62
            : p.status === 'queued'
              ? 0
              : 30 + pi * 10,
      costUSD: 0.42 + pi * 0.31,
      tokensIn: 14_500 + pi * 4_200,
      tokensOut: 4_300 + pi * 1_100,
      lastSnippet: 'Spawning sub-tasks…',
      log: mkLog(pi),
    });
    p.childTitles.forEach((title, ci) => {
      const status: TaskStatus =
        p.status === 'queued'
          ? 'queued'
          : (STATUS_CYCLE[(pi + ci) % STATUS_CYCLE.length] ?? 'queued');
      out.push({
        id: `${p.id}_c${ci}`,
        parentId: p.id,
        title,
        status,
        agent: p.agent,
        startedAt: NOW - (pi + 1) * 600_000 + ci * 60_000,
        durationMs: 28_000 + ci * 14_000,
        progress:
          status === 'done'
            ? 100
            : status === 'failed'
              ? 70
              : status === 'queued'
                ? 0
                : status === 'paused'
                  ? 45
                  : 15 + ci * 12,
        costUSD: 0.07 + ci * 0.04,
        tokensIn: 2_400 + ci * 540,
        tokensOut: 700 + ci * 220,
        lastSnippet: title + ' …',
        log: mkLog(pi * 7 + ci),
      });
    });
  });
  return out;
}

export const TASKS: ReadonlyArray<AgentTask> = buildTasks();

export function statusTone(s: TaskStatus): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  switch (s) {
    case 'running':
      return 'accent';
    case 'queued':
      return 'muted';
    case 'paused':
      return 'warn';
    case 'done':
      return 'info';
    case 'failed':
      return 'err';
  }
}

export function agentTone(a: AgentKind): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  switch (a) {
    case 'refactor':
      return 'accent';
    case 'test':
      return 'info';
    case 'review':
      return 'muted';
    case 'migrate':
      return 'warn';
    case 'security':
      return 'err';
  }
}

export function fmtDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

export function fmtClock(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function levelClass(level: ActivityLogEntry['level']): string {
  switch (level) {
    case 'info':
      return 'bg-sev-info';
    case 'warn':
      return 'bg-sev-warn';
    case 'error':
      return 'bg-sev-err';
    case 'ok':
      return 'bg-accent';
  }
}
