export type CellKind = 'markdown' | 'code';

export type CodeLang = 'typescript' | 'python' | 'sql';

export type OutputKind = 'text' | 'table' | 'error' | 'none';

export interface OutputTable {
  columns: ReadonlyArray<string>;
  rows: ReadonlyArray<ReadonlyArray<string>>;
}

export interface CellOutput {
  kind: OutputKind;
  text?: string;
  table?: OutputTable;
  error?: string;
  durationMs: number;
}

export interface NotebookCell {
  id: string;
  kind: CellKind;
  language?: CodeLang;
  source: string;
  output?: CellOutput;
  executionCount?: number;
}

export interface KernelInfo {
  id: string;
  label: string;
  language: CodeLang | 'mixed';
}

export const KERNELS: ReadonlyArray<KernelInfo> = [
  { id: 'k-ts', label: 'TypeScript (deno)', language: 'typescript' },
  { id: 'k-py', label: 'Python 3.12', language: 'python' },
  { id: 'k-sql', label: 'DuckDB SQL', language: 'sql' },
  { id: 'k-mixed', label: 'Polyglot', language: 'mixed' },
];

const MD_INTRO = `# Q3 Conversion Funnel

This notebook explores the **checkout funnel** drop-off observed in the last
release window. We pull events from \`events.checkout\` and join against
\`users.dim\` to bucket by experiment cohort.

> Source: prod-snapshot 2026-04-29
`;

const MD_HYPOTHESIS = `## Hypothesis

> The new \`/cart\` route under-renders for low-bandwidth clients
> because the streaming boundary leaks an *empty* payment widget.

We compare:
1. baseline (control)
2. v2 streaming variant
3. v2 + skeleton fallback
`;

const MD_FINDINGS = `## Findings

The skeleton-fallback variant recovered \`-2.1pp\` of conversion.
This matches the bundle-size delta in build #4421.
`;

const TS_FETCH = `import { db } from '@app/db';

export async function pullCheckout(window: '7d' | '30d') {
  const rows = await db.query<CheckoutRow>(\`
    select cohort, count(*) as n, avg(time_to_pay) as ttp
    from events.checkout
    where ts > now() - interval $1
    group by cohort
  \`, [window]);
  return rows.sort((a, b) => b.n - a.n);
}`;

const PY_DF = `import pandas as pd
import numpy as np

df = pd.read_parquet("/data/checkout.parquet")
df["ttp_s"] = df["time_to_pay"].dt.total_seconds()
agg = df.groupby("cohort").agg(n=("id", "count"), ttp=("ttp_s", "mean"))
agg.sort_values("n", ascending=False)`;

const SQL_FUNNEL = `with funnel as (
  select user_id, max(step) as last_step
  from events.checkout
  where ts > now() - interval '7 days'
  group by 1
)
select last_step, count(*) as users
from funnel
group by 1
order by last_step;`;

const PY_PLOT = `import matplotlib.pyplot as plt
plt.figure(figsize=(6, 3))
plt.bar(agg.index, agg["n"])
plt.title("Checkout cohorts (7d)")
plt.tight_layout()
plt.savefig("/out/cohorts.png")`;

export const INITIAL_CELLS: ReadonlyArray<NotebookCell> = [
  { id: 'c1', kind: 'markdown', source: MD_INTRO },
  {
    id: 'c2',
    kind: 'code',
    language: 'typescript',
    source: TS_FETCH,
    executionCount: 1,
    output: {
      kind: 'text',
      durationMs: 412,
      text: 'Loaded 12,481 rows · 4 cohorts · cache MISS\n→ ts pulled from snapshot at 2026-04-29T08:14Z',
    },
  },
  { id: 'c3', kind: 'markdown', source: MD_HYPOTHESIS },
  {
    id: 'c4',
    kind: 'code',
    language: 'sql',
    source: SQL_FUNNEL,
    executionCount: 2,
    output: {
      kind: 'table',
      durationMs: 87,
      table: {
        columns: ['last_step', 'users'],
        rows: [
          ['view_cart', '14,209'],
          ['add_address', '11,884'],
          ['add_payment', '9,012'],
          ['confirm', '7,203'],
          ['paid', '6,418'],
        ],
      },
    },
  },
  {
    id: 'c5',
    kind: 'code',
    language: 'python',
    source: PY_DF,
    executionCount: 3,
    output: {
      kind: 'table',
      durationMs: 244,
      table: {
        columns: ['cohort', 'n', 'ttp'],
        rows: [
          ['control', '4,201', '38.4'],
          ['v2_stream', '4,177', '41.9'],
          ['v2_skeleton', '4,103', '37.1'],
        ],
      },
    },
  },
  {
    id: 'c6',
    kind: 'code',
    language: 'python',
    source: PY_PLOT,
    executionCount: 4,
    output: {
      kind: 'text',
      durationMs: 1102,
      text: 'Saved /out/cohorts.png (412×201, 14KB)',
    },
  },
  { id: 'c7', kind: 'markdown', source: MD_FINDINGS },
  {
    id: 'c8',
    kind: 'code',
    language: 'typescript',
    source: `await pullCheckout('30d')`,
    executionCount: 5,
    output: {
      kind: 'error',
      durationMs: 31,
      error:
        "TypeError: Cannot read properties of undefined (reading 'sort')\n    at pullCheckout (events.ts:14:30)\n    at <anonymous>:1:7",
    },
  },
  {
    id: 'c9',
    kind: 'code',
    language: 'sql',
    source: `select cohort, count(*) from events.checkout group by 1;`,
    executionCount: 6,
    output: {
      kind: 'table',
      durationMs: 64,
      table: {
        columns: ['cohort', 'count'],
        rows: [
          ['control', '4,201'],
          ['v2_stream', '4,177'],
          ['v2_skeleton', '4,103'],
        ],
      },
    },
  },
  {
    id: 'c10',
    kind: 'markdown',
    source:
      '### Next steps\n\n- File JIRA `CKO-1142` for streaming boundary leak\n- Roll skeleton variant to 50% of traffic\n- Add `lighthouse` budget for `/cart`',
  },
];

export function langTone(l: CodeLang): 'accent' | 'info' | 'static' {
  switch (l) {
    case 'typescript':
      return 'accent';
    case 'python':
      return 'info';
    case 'sql':
      return 'static';
  }
}

export function fmtMs(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  return `${(ms / 1_000).toFixed(2)}s`;
}

export function totalRuntime(
  cells: ReadonlyArray<NotebookCell>,
): number {
  return cells.reduce(
    (acc, c) => acc + (c.output?.durationMs ?? 0),
    0,
  );
}
