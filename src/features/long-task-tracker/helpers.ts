export type LtKind = 'script' | 'layout' | 'paint' | 'gc' | 'fetch-blocking';

export interface LongTask {
  id: string;
  ts: number; // ms within window
  durationMs: number;
  routeId: string;
  kind: LtKind;
  attribution: string; // file:symbol guess
}

export const WINDOW_MS = 60_000;

export const ROUTES: ReadonlyArray<string> = [
  '/',
  '/products/[id]',
  '/dashboard',
];

export const ALL_KINDS: ReadonlyArray<LtKind> = [
  'script',
  'layout',
  'paint',
  'gc',
  'fetch-blocking',
];

interface Draft {
  ts: number;
  duration: number;
  route: string;
  kind: LtKind;
  attribution: string;
}

const drafts: ReadonlyArray<Draft> = [
  { ts: 320, duration: 88, route: '/', kind: 'script', attribution: 'main.js:hydrateRoot' },
  { ts: 540, duration: 132, route: '/', kind: 'script', attribution: 'page-home.js:initFilters' },
  { ts: 1_080, duration: 240, route: '/', kind: 'layout', attribution: 'layout()  → ProductGrid' },
  { ts: 2_140, duration: 64, route: '/', kind: 'paint', attribution: 'paint() → hero img' },
  { ts: 3_220, duration: 1_280, route: '/', kind: 'fetch-blocking', attribution: 'gtag.js (3p)' },
  { ts: 4_440, duration: 96, route: '/', kind: 'gc', attribution: 'majorGC.markSweep' },
  { ts: 5_900, duration: 412, route: '/', kind: 'script', attribution: 'lodash.sortBy(items)' },
  { ts: 8_120, duration: 72, route: '/', kind: 'layout', attribution: 'reflow → resize observer' },
  { ts: 10_300, duration: 156, route: '/', kind: 'script', attribution: 'tracker.send' },
  { ts: 12_400, duration: 84, route: '/', kind: 'paint', attribution: 'paint → modal' },

  { ts: 14_180, duration: 320, route: '/products/[id]', kind: 'script', attribution: 'page-products.js:hydrate' },
  { ts: 14_780, duration: 880, route: '/products/[id]', kind: 'script', attribution: 'recommend-engine.compute' },
  { ts: 16_220, duration: 192, route: '/products/[id]', kind: 'layout', attribution: 'image-grid measure' },
  { ts: 17_440, duration: 64, route: '/products/[id]', kind: 'paint', attribution: 'paint → gallery' },
  { ts: 18_900, duration: 1_460, route: '/products/[id]', kind: 'fetch-blocking', attribution: 'doubleclick.net pixel' },
  { ts: 21_220, duration: 244, route: '/products/[id]', kind: 'gc', attribution: 'minorGC' },
  { ts: 22_540, duration: 88, route: '/products/[id]', kind: 'script', attribution: 'review-rating.compute' },
  { ts: 24_180, duration: 56, route: '/products/[id]', kind: 'layout', attribution: 'sticky-header reflow' },
  { ts: 25_900, duration: 168, route: '/products/[id]', kind: 'script', attribution: 'analytics.track' },
  { ts: 28_220, duration: 92, route: '/products/[id]', kind: 'paint', attribution: 'paint → scroll' },

  { ts: 30_400, duration: 540, route: '/dashboard', kind: 'script', attribution: 'page-dashboard.js:initCharts' },
  { ts: 31_220, duration: 320, route: '/dashboard', kind: 'script', attribution: 'd3.scaleLinear range' },
  { ts: 32_780, duration: 88, route: '/dashboard', kind: 'layout', attribution: 'grid resize' },
  { ts: 34_220, duration: 760, route: '/dashboard', kind: 'script', attribution: 'json.parse(report.json)' },
  { ts: 36_120, duration: 64, route: '/dashboard', kind: 'paint', attribution: 'paint → charts' },
  { ts: 38_900, duration: 1_180, route: '/dashboard', kind: 'fetch-blocking', attribution: 'auth.token refresh (blocking)' },
  { ts: 41_220, duration: 320, route: '/dashboard', kind: 'gc', attribution: 'majorGC' },
  { ts: 44_500, duration: 196, route: '/dashboard', kind: 'script', attribution: 'tableSort.run' },
  { ts: 48_220, duration: 72, route: '/dashboard', kind: 'layout', attribution: 'tooltip layout' },
  { ts: 52_180, duration: 132, route: '/dashboard', kind: 'script', attribution: 'tableFilter.apply' },
];

export const LONG_TASKS: ReadonlyArray<LongTask> = drafts.map((d, i) => ({
  id: `lt_${i}`,
  ts: d.ts,
  durationMs: d.duration,
  routeId: d.route,
  kind: d.kind,
  attribution: d.attribution,
}));

export function tbtMs(tasks: ReadonlyArray<LongTask>): number {
  // Time-blocking-time = sum(max(0, dur - 50))
  return tasks.reduce((sum, t) => sum + Math.max(0, t.durationMs - 50), 0);
}

export function quantile(
  values: ReadonlyArray<number>,
  q: number,
): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const lv = sorted[lo] ?? 0;
  const hv = sorted[hi] ?? 0;
  return lo === hi ? lv : lv + (hv - lv) * (pos - lo);
}
