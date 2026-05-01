export type EffectPhase = 'mount' | 'update' | 'unmount';

export interface EffectEntry {
  id: string;
  at: number;
  component: string;
  effectId: string;
  phase: EffectPhase;
  deps: string[];
  depsChanged: string[];
  durationMs: number;
  cleanedUp: boolean;
  cleanupMs?: number;
  fix?: string;
}

interface Spec {
  delta: number;
  component: string;
  effectId: string;
  phase: EffectPhase;
  deps: string[];
  depsChanged: string[];
  durationMs: number;
  cleanedUp: boolean;
  cleanupMs?: number;
  fix?: string;
}

const specs: ReadonlyArray<Spec> = [
  {
    delta: 0,
    component: 'AppShell',
    effectId: 'subscribe-router',
    phase: 'mount',
    deps: [],
    depsChanged: [],
    durationMs: 0.4,
    cleanedUp: false,
  },
  {
    delta: 14,
    component: 'AppShell',
    effectId: 'init-analytics',
    phase: 'mount',
    deps: [],
    depsChanged: [],
    durationMs: 8.2,
    cleanedUp: false,
  },
  {
    delta: 30,
    component: 'UserMenu',
    effectId: 'subscribe-auth',
    phase: 'mount',
    deps: ['session'],
    depsChanged: ['session'],
    durationMs: 0.6,
    cleanedUp: false,
  },
  {
    delta: 64,
    component: 'ProductDetail',
    effectId: 'fetch-product',
    phase: 'mount',
    deps: ['productId'],
    depsChanged: ['productId'],
    durationMs: 1.2,
    cleanedUp: false,
  },
  {
    delta: 110,
    component: 'ProductDetail',
    effectId: 'attach-listener',
    phase: 'mount',
    deps: ['onSearch'],
    depsChanged: ['onSearch'],
    durationMs: 0.5,
    cleanedUp: false,
    fix: 'Wrap `onSearch` in useCallback to avoid re-attaching every render.',
  },
  {
    delta: 142,
    component: 'AddToCart',
    effectId: 'log-mount',
    phase: 'mount',
    deps: [],
    depsChanged: [],
    durationMs: 0.2,
    cleanedUp: false,
  },
  {
    delta: 220,
    component: 'ProductDetail',
    effectId: 'attach-listener',
    phase: 'update',
    deps: ['onSearch'],
    depsChanged: ['onSearch'],
    durationMs: 0.5,
    cleanedUp: true,
    cleanupMs: 0.3,
    fix: 'Wrap `onSearch` in useCallback to avoid re-attaching every render.',
  },
  {
    delta: 280,
    component: 'ChartPanel',
    effectId: 'render-canvas',
    phase: 'mount',
    deps: ['series', 'window'],
    depsChanged: ['series', 'window'],
    durationMs: 14.6,
    cleanedUp: false,
  },
  {
    delta: 320,
    component: 'ChartPanel',
    effectId: 'render-canvas',
    phase: 'update',
    deps: ['series', 'window'],
    depsChanged: ['series'],
    durationMs: 12.8,
    cleanedUp: true,
    cleanupMs: 0.4,
  },
  {
    delta: 410,
    component: 'UserMenu',
    effectId: 'subscribe-auth',
    phase: 'update',
    deps: ['session'],
    depsChanged: [],
    durationMs: 0.4,
    cleanedUp: false,
    fix: 'No deps changed — consider stable selector.',
  },
  {
    delta: 460,
    component: 'ProductDetail',
    effectId: 'fetch-product',
    phase: 'update',
    deps: ['productId'],
    depsChanged: ['productId'],
    durationMs: 1.1,
    cleanedUp: true,
    cleanupMs: 0.2,
  },
  {
    delta: 540,
    component: 'ProductDetail',
    effectId: 'attach-listener',
    phase: 'update',
    deps: ['onSearch'],
    depsChanged: ['onSearch'],
    durationMs: 0.5,
    cleanedUp: true,
    cleanupMs: 0.3,
    fix: 'Wrap `onSearch` in useCallback to avoid re-attaching every render.',
  },
  {
    delta: 600,
    component: 'CartDrawer',
    effectId: 'sync-cart',
    phase: 'mount',
    deps: ['items'],
    depsChanged: ['items'],
    durationMs: 2.4,
    cleanedUp: false,
  },
  {
    delta: 670,
    component: 'CartDrawer',
    effectId: 'persist-cart',
    phase: 'update',
    deps: ['items', 'userId'],
    depsChanged: ['items'],
    durationMs: 4.0,
    cleanedUp: false,
    fix: 'Missing `currency` in deps — silent stale value detected.',
  },
  {
    delta: 720,
    component: 'AddToCart',
    effectId: 'log-mount',
    phase: 'unmount',
    deps: [],
    depsChanged: [],
    durationMs: 0.0,
    cleanedUp: true,
    cleanupMs: 0.2,
  },
  {
    delta: 740,
    component: 'AddToCart',
    effectId: 'log-mount',
    phase: 'mount',
    deps: [],
    depsChanged: [],
    durationMs: 0.3,
    cleanedUp: false,
  },
  {
    delta: 820,
    component: 'ChartPanel',
    effectId: 'render-canvas',
    phase: 'update',
    deps: ['series', 'window'],
    depsChanged: ['series'],
    durationMs: 11.4,
    cleanedUp: true,
    cleanupMs: 0.4,
  },
  {
    delta: 880,
    component: 'ChartPanel',
    effectId: 'resize-observer',
    phase: 'mount',
    deps: ['ref'],
    depsChanged: ['ref'],
    durationMs: 1.6,
    cleanedUp: false,
  },
  {
    delta: 950,
    component: 'ChartPanel',
    effectId: 'resize-observer',
    phase: 'update',
    deps: ['ref'],
    depsChanged: ['ref'],
    durationMs: 1.5,
    cleanedUp: true,
    cleanupMs: 0.4,
    fix: 'Use a ref-stable callback or `useMemo` for `ref`.',
  },
  {
    delta: 1010,
    component: 'AppShell',
    effectId: 'init-analytics',
    phase: 'update',
    deps: [],
    depsChanged: [],
    durationMs: 0.0,
    cleanedUp: false,
  },
  {
    delta: 1080,
    component: 'CartDrawer',
    effectId: 'persist-cart',
    phase: 'update',
    deps: ['items', 'userId'],
    depsChanged: ['userId'],
    durationMs: 3.6,
    cleanedUp: false,
  },
  {
    delta: 1140,
    component: 'ProductDetail',
    effectId: 'fetch-reviews',
    phase: 'mount',
    deps: ['productId', 'page'],
    depsChanged: ['productId', 'page'],
    durationMs: 1.0,
    cleanedUp: false,
  },
  {
    delta: 1220,
    component: 'ProductDetail',
    effectId: 'fetch-reviews',
    phase: 'update',
    deps: ['productId', 'page'],
    depsChanged: ['page'],
    durationMs: 0.9,
    cleanedUp: true,
    cleanupMs: 0.2,
  },
  {
    delta: 1300,
    component: 'CartDrawer',
    effectId: 'sync-cart',
    phase: 'unmount',
    deps: ['items'],
    depsChanged: [],
    durationMs: 0.0,
    cleanedUp: true,
    cleanupMs: 0.4,
  },
  {
    delta: 1360,
    component: 'UserMenu',
    effectId: 'click-outside',
    phase: 'mount',
    deps: ['open'],
    depsChanged: ['open'],
    durationMs: 0.3,
    cleanedUp: false,
    fix: 'Listener attaches on every open toggle — debounce or move outside effect.',
  },
];

export const effectLog: ReadonlyArray<EffectEntry> = specs.map((s, i) => ({
  id: `eff_${String(i).padStart(2, '0')}`,
  at: s.delta,
  component: s.component,
  effectId: s.effectId,
  phase: s.phase,
  deps: s.deps,
  depsChanged: s.depsChanged,
  durationMs: s.durationMs,
  cleanedUp: s.cleanedUp,
  cleanupMs: s.cleanupMs,
  fix: s.fix,
}));

export const EFFECT_COMPONENTS: ReadonlyArray<string> = Array.from(
  new Set(effectLog.map((e) => e.component)),
);

export function phaseTone(
  p: EffectPhase,
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
  switch (p) {
    case 'mount':
      return 'static';
    case 'update':
      return 'accent';
    case 'unmount':
      return 'warn';
  }
}

export function isStaleDeps(e: EffectEntry): boolean {
  // Heuristic: phase=update and no deps changed, or marked fix.
  if (e.fix) return true;
  if (e.phase === 'update' && e.depsChanged.length === 0 && e.deps.length > 0)
    return true;
  return false;
}
