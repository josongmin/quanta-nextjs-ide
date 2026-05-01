export type ReasonKind =
  | 'props'
  | 'state'
  | 'context'
  | 'parent'
  | 'hook-deps'
  | 'force';

export interface Delta {
  key: string;
  before: string;
  after: string;
}

export interface RenderEvent {
  id: string;
  at: number;
  component: string;
  reason: ReasonKind;
  durationMs: number;
  deltaProps?: Delta[];
  deltaState?: Delta[];
}

const T0 = 0;

interface Spec {
  delta: number;
  component: string;
  reason: ReasonKind;
  durationMs: number;
  deltaProps?: Delta[];
  deltaState?: Delta[];
}

const specs: ReadonlyArray<Spec> = [
  { delta: 0, component: 'AppShell', reason: 'parent', durationMs: 4.2 },
  {
    delta: 12,
    component: 'UserMenu',
    reason: 'context',
    durationMs: 1.4,
    deltaProps: [{ key: 'user', before: 'null', after: '"u_8821"' }],
  },
  { delta: 24, component: 'AppShell', reason: 'state', durationMs: 3.6 },
  {
    delta: 48,
    component: 'ProductDetail',
    reason: 'props',
    durationMs: 7.8,
    deltaProps: [
      { key: 'productId', before: '"p_22"', after: '"p_42"' },
      { key: 'currency', before: '"USD"', after: '"USD"' },
    ],
  },
  {
    delta: 70,
    component: 'AddToCart',
    reason: 'props',
    durationMs: 1.1,
    deltaProps: [{ key: 'productId', before: '"p_22"', after: '"p_42"' }],
  },
  { delta: 110, component: 'ProductDetail', reason: 'hook-deps', durationMs: 5.6 },
  {
    delta: 142,
    component: 'AddToCart',
    reason: 'state',
    durationMs: 0.9,
    deltaState: [{ key: 'qty', before: '1', after: '2' }],
  },
  {
    delta: 188,
    component: 'AddToCart',
    reason: 'state',
    durationMs: 0.8,
    deltaState: [{ key: 'qty', before: '2', after: '3' }],
  },
  { delta: 230, component: 'AppShell', reason: 'parent', durationMs: 3.4 },
  { delta: 280, component: 'ChartPanel', reason: 'parent', durationMs: 12.6 },
  {
    delta: 320,
    component: 'ChartPanel',
    reason: 'props',
    durationMs: 14.2,
    deltaProps: [
      { key: 'series', before: '[…14 items]', after: '[…15 items]' },
      { key: 'window', before: '"7d"', after: '"7d"' },
    ],
  },
  {
    delta: 360,
    component: 'ChartPanel',
    reason: 'hook-deps',
    durationMs: 9.4,
  },
  { delta: 410, component: 'UserMenu', reason: 'context', durationMs: 1.2 },
  {
    delta: 460,
    component: 'ProductDetail',
    reason: 'props',
    durationMs: 6.2,
    deltaProps: [{ key: 'reviews', before: '[…11]', after: '[…12]' }],
  },
  { delta: 510, component: 'AppShell', reason: 'state', durationMs: 2.8 },
  { delta: 562, component: 'ChartPanel', reason: 'force', durationMs: 11.0 },
  {
    delta: 610,
    component: 'AddToCart',
    reason: 'props',
    durationMs: 1.0,
    deltaProps: [{ key: 'inStock', before: 'true', after: 'false' }],
  },
  { delta: 670, component: 'UserMenu', reason: 'parent', durationMs: 1.4 },
  {
    delta: 720,
    component: 'ProductDetail',
    reason: 'hook-deps',
    durationMs: 6.0,
  },
  { delta: 780, component: 'AppShell', reason: 'parent', durationMs: 3.6 },
  {
    delta: 830,
    component: 'ChartPanel',
    reason: 'props',
    durationMs: 13.4,
    deltaProps: [{ key: 'series', before: '[…15]', after: '[…16]' }],
  },
  { delta: 880, component: 'UserMenu', reason: 'context', durationMs: 1.5 },
  { delta: 920, component: 'ProductDetail', reason: 'parent', durationMs: 5.6 },
  {
    delta: 980,
    component: 'AddToCart',
    reason: 'state',
    durationMs: 1.1,
    deltaState: [{ key: 'qty', before: '3', after: '1' }],
  },
  {
    delta: 1020,
    component: 'ChartPanel',
    reason: 'hook-deps',
    durationMs: 10.0,
  },
  { delta: 1080, component: 'AppShell', reason: 'state', durationMs: 3.0 },
  { delta: 1140, component: 'UserMenu', reason: 'parent', durationMs: 1.0 },
  { delta: 1200, component: 'ProductDetail', reason: 'parent', durationMs: 5.0 },
  {
    delta: 1260,
    component: 'AddToCart',
    reason: 'props',
    durationMs: 1.0,
    deltaProps: [{ key: 'inStock', before: 'false', after: 'true' }],
  },
  { delta: 1320, component: 'ChartPanel', reason: 'force', durationMs: 11.8 },
  {
    delta: 1380,
    component: 'ProductDetail',
    reason: 'props',
    durationMs: 6.4,
    deltaProps: [{ key: 'productId', before: '"p_42"', after: '"p_99"' }],
  },
  { delta: 1440, component: 'AppShell', reason: 'parent', durationMs: 3.4 },
];

export const events: ReadonlyArray<RenderEvent> = specs.map((s, i) => ({
  id: `re_${String(i).padStart(2, '0')}`,
  at: T0 + s.delta,
  component: s.component,
  reason: s.reason,
  durationMs: s.durationMs,
  deltaProps: s.deltaProps,
  deltaState: s.deltaState,
}));

export const COMPONENTS: ReadonlyArray<string> = Array.from(
  new Set(events.map((e) => e.component)),
);
export const REASONS: ReadonlyArray<ReasonKind> = [
  'props',
  'state',
  'context',
  'parent',
  'hook-deps',
  'force',
];

export function reasonTone(
  r: ReasonKind,
):
  | 'accent'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'warn'
  | 'err' {
  switch (r) {
    case 'props':
      return 'accent';
    case 'state':
      return 'dynamic';
    case 'context':
      return 'isr';
    case 'parent':
      return 'static';
    case 'hook-deps':
      return 'warn';
    case 'force':
      return 'err';
  }
}

export function countByComponent(es: ReadonlyArray<RenderEvent>): Map<string, number> {
  const m = new Map<string, number>();
  es.forEach((e) => m.set(e.component, (m.get(e.component) ?? 0) + 1));
  return m;
}

export function topReason(es: ReadonlyArray<RenderEvent>): ReasonKind | null {
  if (es.length === 0) return null;
  const m = new Map<ReasonKind, number>();
  es.forEach((e) => m.set(e.reason, (m.get(e.reason) ?? 0) + 1));
  let best: { k: ReasonKind; n: number } | null = null;
  m.forEach((n, k) => {
    if (!best || n > best.n) best = { k, n };
  });
  return best ? (best as { k: ReasonKind; n: number }).k : null;
}
