export type BpKind = 'line' | 'log' | 'trace' | 'condition';

export interface Breakpoint {
  id: string;
  kind: BpKind;
  file: string;
  line: number;
  condition?: string;
  logMessage?: string;
  hitCount: number;
  enabled: boolean;
}

export const initialBreakpoints: ReadonlyArray<Breakpoint> = [
  {
    id: 'bp_01',
    kind: 'line',
    file: 'src/app/(commerce)/products/[id]/page.tsx',
    line: 42,
    hitCount: 17,
    enabled: true,
  },
  {
    id: 'bp_02',
    kind: 'condition',
    file: 'src/features/cart/add-to-cart.tsx',
    line: 88,
    condition: 'qty > 5',
    hitCount: 3,
    enabled: true,
  },
  {
    id: 'bp_03',
    kind: 'log',
    file: 'src/app/(checkout)/checkout/page.tsx',
    line: 124,
    logMessage: 'checkout submit · cart={cart.id} total={total}',
    hitCount: 8,
    enabled: true,
  },
  {
    id: 'bp_04',
    kind: 'trace',
    file: 'src/features/auth-flow-tracer/index.tsx',
    line: 56,
    hitCount: 0,
    enabled: false,
  },
  {
    id: 'bp_05',
    kind: 'log',
    file: 'src/app/dashboard/page.tsx',
    line: 18,
    logMessage: 'dashboard mount · user={user.id}',
    hitCount: 12,
    enabled: true,
  },
  {
    id: 'bp_06',
    kind: 'condition',
    file: 'src/features/render-reasoner/index.tsx',
    line: 102,
    condition: 'event.durationMs > 16',
    hitCount: 21,
    enabled: true,
  },
  {
    id: 'bp_07',
    kind: 'line',
    file: 'src/middleware.ts',
    line: 31,
    hitCount: 245,
    enabled: false,
  },
  {
    id: 'bp_08',
    kind: 'log',
    file: 'src/app/api/products/route.ts',
    line: 14,
    logMessage: 'GET /api/products ?page={page}',
    hitCount: 73,
    enabled: true,
  },
];

export const KIND_TONE: Record<
  BpKind,
  | 'accent'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'warn'
  | 'err'
  | 'neutral'
> = {
  line: 'accent',
  condition: 'warn',
  log: 'isr',
  trace: 'static',
};

export const KIND_LABELS: Record<BpKind, string> = {
  line: 'Line',
  condition: 'Condition',
  log: 'Logpoint',
  trace: 'Tracepoint',
};
