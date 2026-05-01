export interface DayMetric {
  readonly day: number;
  readonly lcp: { p50: number; p75: number; p95: number };
  readonly inp: { p50: number; p75: number; p95: number };
  readonly cls: { p50: number; p75: number; p95: number };
  readonly samples: number;
}

export interface RouteRum {
  readonly id: string;
  readonly route: string;
  readonly devices: { mobile: number; desktop: number };
  readonly countries: ReadonlyArray<{ flag: string; name: string; pct: number }>;
  readonly browsers: ReadonlyArray<{ name: string; pct: number }>;
  readonly daily: ReadonlyArray<DayMetric>;
  readonly slowSessions: ReadonlyArray<SlowSession>;
}

export interface SlowSession {
  readonly id: string;
  readonly when: string;
  readonly device: string;
  readonly country: string;
  readonly lcpMs: number;
}

const ROUTE_DEFS: ReadonlyArray<{ id: string; route: string; lcpBase: number; inpBase: number; clsBase: number }> = [
  { id: 'home', route: '/', lcpBase: 1800, inpBase: 140, clsBase: 0.06 },
  { id: 'products', route: '/products', lcpBase: 2050, inpBase: 180, clsBase: 0.09 },
  { id: 'product', route: '/products/[id]', lcpBase: 2200, inpBase: 200, clsBase: 0.11 },
  { id: 'pricing', route: '/pricing', lcpBase: 1600, inpBase: 120, clsBase: 0.04 },
  { id: 'blog', route: '/blog', lcpBase: 1700, inpBase: 130, clsBase: 0.05 },
  { id: 'post', route: '/blog/[slug]', lcpBase: 1980, inpBase: 160, clsBase: 0.07 },
  { id: 'dashboard', route: '/dashboard', lcpBase: 2350, inpBase: 220, clsBase: 0.09 },
  { id: 'settings', route: '/settings', lcpBase: 1750, inpBase: 150, clsBase: 0.05 },
];

function genDays(base: number, jitter: number, n: number, scale: number): DayMetric[] {
  const out: DayMetric[] = [];
  for (let i = 0; i < n; i++) {
    const wave = Math.sin(i * 0.6) * jitter + Math.cos(i * 0.3) * jitter * 0.6;
    const p50 = (base + wave) * scale;
    const p75 = p50 * 1.25;
    const p95 = p50 * 1.75;
    out.push({
      day: i,
      lcp: { p50: Math.round(p50), p75: Math.round(p75), p95: Math.round(p95) },
      inp: {
        p50: Math.round(p50 * 0.08),
        p75: Math.round(p50 * 0.11),
        p95: Math.round(p50 * 0.15),
      },
      cls: {
        p50: +(0.05 + Math.abs(wave) * 0.001).toFixed(3),
        p75: +(0.07 + Math.abs(wave) * 0.0015).toFixed(3),
        p95: +(0.12 + Math.abs(wave) * 0.002).toFixed(3),
      },
      samples: 800 + Math.round(wave * 40 + i * 10),
    });
  }
  return out;
}

function genCountries(seed: number): ReadonlyArray<{ flag: string; name: string; pct: number }> {
  const all = [
    { flag: '🇺🇸', name: 'US', pct: 42 },
    { flag: '🇬🇧', name: 'UK', pct: 18 },
    { flag: '🇩🇪', name: 'DE', pct: 14 },
    { flag: '🇯🇵', name: 'JP', pct: 12 },
    { flag: '🇧🇷', name: 'BR', pct: 8 },
    { flag: '🇮🇳', name: 'IN', pct: 6 },
  ];
  const start = seed % 3;
  return all.slice(start, start + 4);
}

export const ROUTES: ReadonlyArray<RouteRum> = ROUTE_DEFS.map((r, i) => ({
  id: r.id,
  route: r.route,
  devices: { mobile: 58 + i, desktop: 42 - i },
  countries: genCountries(i),
  browsers: [
    { name: 'Chrome', pct: 62 - (i % 3) },
    { name: 'Safari', pct: 22 + (i % 2) },
    { name: 'Firefox', pct: 9 },
    { name: 'Edge', pct: 7 },
  ],
  daily: genDays(r.lcpBase, 120, 14, 1),
  slowSessions: [
    { id: `s-${r.id}-1`, when: '14:02', device: 'iPhone 12 · 4G', country: 'US', lcpMs: r.lcpBase + 1400 },
    { id: `s-${r.id}-2`, when: '13:48', device: 'Pixel 7 · 3G', country: 'BR', lcpMs: r.lcpBase + 1200 },
    { id: `s-${r.id}-3`, when: '13:20', device: 'Mac Safari', country: 'DE', lcpMs: r.lcpBase + 900 },
    { id: `s-${r.id}-4`, when: '12:55', device: 'Galaxy S22', country: 'IN', lcpMs: r.lcpBase + 800 },
    { id: `s-${r.id}-5`, when: '12:31', device: 'Win Chrome', country: 'UK', lcpMs: r.lcpBase + 660 },
  ],
}));

export type RangeKey = '7d' | '14d' | '30d';
export const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '14d': 14, '30d': 30 };

export type DeviceFilter = 'all' | 'mobile' | 'desktop';

export interface Threshold {
  readonly good: number;
  readonly poor: number;
}

export const THRESHOLDS: { lcp: Threshold; inp: Threshold; cls: Threshold } = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
};
