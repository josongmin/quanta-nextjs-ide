export type ToolKind = 'Read' | 'Edit' | 'Bash' | 'Grep' | 'Write' | 'Agent';
export type CallStatus = 'ok' | 'error' | 'cancelled';

export interface ToolCall {
  id: string;
  ts: number; // ms relative to start
  tool: ToolKind;
  args: string;
  durationMs: number;
  status: CallStatus;
  output: string;
}

export const TOOL_KINDS: ReadonlyArray<ToolKind> = [
  'Read',
  'Edit',
  'Bash',
  'Grep',
  'Write',
  'Agent',
];

interface Seed {
  ts: number;
  tool: ToolKind;
  args: string;
  durationMs: number;
  status?: CallStatus;
  output: string;
}

const SEEDS: ReadonlyArray<Seed> = [
  { ts: 0, tool: 'Grep', args: 'rg "useCart" src', durationMs: 320, output: 'src/lib/cart.ts:14\nsrc/components/Cart.tsx:9\nsrc/pages/checkout.tsx:21' },
  { ts: 410, tool: 'Read', args: 'src/lib/cart.ts', durationMs: 110, output: 'export function useCart() { ... }\n128 lines read' },
  { ts: 540, tool: 'Read', args: 'src/components/Cart.tsx', durationMs: 95, output: '94 lines read' },
  { ts: 720, tool: 'Agent', args: 'plan: refactor totals', durationMs: 1820, output: '1) Introduce CartItem\n2) Move format()\n3) Update tests' },
  { ts: 2620, tool: 'Edit', args: 'src/lib/cart.ts:totals', durationMs: 280, output: '+12 -7 lines' },
  { ts: 2940, tool: 'Bash', args: 'npx tsc --noEmit', durationMs: 4180, output: '0 errors' },
  { ts: 7180, tool: 'Read', args: 'src/utils/format.ts', durationMs: 80, output: '34 lines read' },
  { ts: 7280, tool: 'Edit', args: 'src/utils/format.ts:fmtUSD', durationMs: 210, output: '+6 -2 lines' },
  { ts: 7530, tool: 'Bash', args: 'vitest run --reporter=dot', durationMs: 6250, status: 'error', output: '1 failed:\n  cart.test.ts > total includes tax' },
  { ts: 13830, tool: 'Read', args: 'src/lib/__tests__/cart.test.ts', durationMs: 90, output: '212 lines read' },
  { ts: 13940, tool: 'Edit', args: 'cart.test.ts:total-includes-tax', durationMs: 320, output: '+5 -1 lines' },
  { ts: 14290, tool: 'Bash', args: 'vitest run cart.test.ts', durationMs: 3120, output: 'Tests: 12 passed' },
  { ts: 17440, tool: 'Grep', args: 'rg "TODO" src/server', durationMs: 280, output: '3 matches' },
  { ts: 17750, tool: 'Read', args: 'src/server/checkout.ts', durationMs: 130, output: '188 lines' },
  { ts: 17910, tool: 'Edit', args: 'checkout.ts:resolveTax', durationMs: 240, output: '+9 -3' },
  { ts: 18180, tool: 'Bash', args: 'npx tsc --noEmit', durationMs: 4020, output: '0 errors' },
  { ts: 22240, tool: 'Write', args: 'docs/CART_NOTES.md', durationMs: 110, output: 'wrote 28 lines' },
  { ts: 22380, tool: 'Agent', args: 'review-changes', durationMs: 2840, output: 'Review: 2 nits, no blockers' },
  { ts: 25260, tool: 'Edit', args: 'src/lib/cart.ts:nit', durationMs: 90, output: '+1 -1' },
  { ts: 25380, tool: 'Bash', args: 'pnpm lint', durationMs: 2210, output: '0 problems' },
  { ts: 27620, tool: 'Bash', args: 'pnpm test', durationMs: 5380, output: '174 passed' },
  { ts: 33040, tool: 'Grep', args: 'rg "any" src/lib/cart', durationMs: 60, status: 'cancelled', output: 'cancelled' },
  { ts: 33140, tool: 'Write', args: 'CHANGELOG.md', durationMs: 80, output: 'wrote 4 lines' },
  { ts: 33260, tool: 'Bash', args: 'git add -A && git commit -m "refactor cart"', durationMs: 480, output: '[main 8a3c1f2] refactor cart' },
];

export const TOOL_CALLS: ReadonlyArray<ToolCall> = SEEDS.map((s, i) => ({
  id: `tc_${i}`,
  ts: s.ts,
  tool: s.tool,
  args: s.args,
  durationMs: s.durationMs,
  status: s.status ?? 'ok',
  output: s.output,
}));

export function totalWallMs(calls: ReadonlyArray<ToolCall>): number {
  if (calls.length === 0) return 0;
  let max = 0;
  for (const c of calls) {
    const end = c.ts + c.durationMs;
    if (end > max) max = end;
  }
  return max;
}

export function totalToolMs(calls: ReadonlyArray<ToolCall>): number {
  return calls.reduce((acc, c) => acc + c.durationMs, 0);
}

export function toolColor(tool: ToolKind): string {
  switch (tool) {
    case 'Read':
      return 'fill-sev-info text-sev-info';
    case 'Edit':
      return 'fill-accent text-accent';
    case 'Bash':
      return 'fill-sev-warn text-sev-warn';
    case 'Grep':
      return 'fill-sem-static text-sem-static';
    case 'Write':
      return 'fill-sem-isr text-sem-isr';
    case 'Agent':
      return 'fill-sem-edge text-sem-edge';
  }
}

export function statusTone(s: CallStatus): 'info' | 'err' | 'muted' {
  switch (s) {
    case 'ok':
      return 'info';
    case 'error':
      return 'err';
    case 'cancelled':
      return 'muted';
  }
}
