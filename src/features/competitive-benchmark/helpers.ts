export type MetricKey = 'lcp' | 'ttfb' | 'weight' | 'a11y';

export interface MetricMeta {
  readonly key: MetricKey;
  readonly label: string;
  readonly unit: string;
  /** lower is better? */
  readonly lowerIsBetter: boolean;
  readonly formatter: (n: number) => string;
}

export const METRICS: ReadonlyArray<MetricMeta> = [
  {
    key: 'lcp',
    label: 'LCP',
    unit: 's',
    lowerIsBetter: true,
    formatter: (n) => `${(n / 1000).toFixed(2)}s`,
  },
  {
    key: 'ttfb',
    label: 'TTFB',
    unit: 'ms',
    lowerIsBetter: true,
    formatter: (n) => `${Math.round(n)}ms`,
  },
  {
    key: 'weight',
    label: 'Page weight',
    unit: 'KB',
    lowerIsBetter: true,
    formatter: (n) => `${Math.round(n)}KB`,
  },
  {
    key: 'a11y',
    label: 'A11y score',
    unit: '%',
    lowerIsBetter: false,
    formatter: (n) => `${Math.round(n)}`,
  },
];

export interface Cell {
  readonly lcp: number;
  readonly ttfb: number;
  readonly weight: number;
  readonly imageBytes: number;
  readonly requests: number;
  readonly a11y: number;
}

export interface RouteRow {
  readonly id: string;
  readonly route: string;
  readonly you: Cell;
  readonly competitorA: Cell;
  readonly competitorB: Cell;
  readonly competitorC: Cell;
}

export const COMPETITORS = ['you', 'competitor-a.com', 'competitor-b.com', 'competitor-c.com'] as const;
export type Competitor = (typeof COMPETITORS)[number];

export const ROUTES: ReadonlyArray<RouteRow> = [
  {
    id: 'home',
    route: '/',
    you: { lcp: 1800, ttfb: 220, weight: 168, imageBytes: 480, requests: 38, a11y: 92 },
    competitorA: { lcp: 2100, ttfb: 280, weight: 220, imageBytes: 620, requests: 44, a11y: 88 },
    competitorB: { lcp: 1600, ttfb: 180, weight: 144, imageBytes: 380, requests: 32, a11y: 95 },
    competitorC: { lcp: 2500, ttfb: 320, weight: 280, imageBytes: 720, requests: 51, a11y: 84 },
  },
  {
    id: 'products',
    route: '/products',
    you: { lcp: 2050, ttfb: 240, weight: 196, imageBytes: 540, requests: 41, a11y: 90 },
    competitorA: { lcp: 1900, ttfb: 210, weight: 188, imageBytes: 480, requests: 39, a11y: 91 },
    competitorB: { lcp: 1700, ttfb: 200, weight: 160, imageBytes: 420, requests: 35, a11y: 94 },
    competitorC: { lcp: 2800, ttfb: 360, weight: 312, imageBytes: 880, requests: 56, a11y: 82 },
  },
  {
    id: 'product',
    route: '/products/[id]',
    you: { lcp: 2180, ttfb: 260, weight: 211, imageBytes: 600, requests: 45, a11y: 89 },
    competitorA: { lcp: 2240, ttfb: 280, weight: 232, imageBytes: 640, requests: 47, a11y: 87 },
    competitorB: { lcp: 1850, ttfb: 220, weight: 178, imageBytes: 480, requests: 38, a11y: 92 },
    competitorC: { lcp: 2700, ttfb: 350, weight: 298, imageBytes: 760, requests: 53, a11y: 83 },
  },
  {
    id: 'pricing',
    route: '/pricing',
    you: { lcp: 1620, ttfb: 200, weight: 132, imageBytes: 240, requests: 28, a11y: 96 },
    competitorA: { lcp: 1880, ttfb: 230, weight: 158, imageBytes: 320, requests: 33, a11y: 90 },
    competitorB: { lcp: 1400, ttfb: 170, weight: 112, imageBytes: 180, requests: 24, a11y: 97 },
    competitorC: { lcp: 2200, ttfb: 290, weight: 220, imageBytes: 540, requests: 44, a11y: 86 },
  },
  {
    id: 'blog',
    route: '/blog',
    you: { lcp: 1700, ttfb: 210, weight: 144, imageBytes: 320, requests: 30, a11y: 93 },
    competitorA: { lcp: 2000, ttfb: 240, weight: 188, imageBytes: 460, requests: 38, a11y: 89 },
    competitorB: { lcp: 1750, ttfb: 220, weight: 168, imageBytes: 380, requests: 34, a11y: 91 },
    competitorC: { lcp: 2400, ttfb: 310, weight: 244, imageBytes: 580, requests: 46, a11y: 85 },
  },
  {
    id: 'post',
    route: '/blog/[slug]',
    you: { lcp: 1980, ttfb: 240, weight: 178, imageBytes: 420, requests: 36, a11y: 91 },
    competitorA: { lcp: 2150, ttfb: 270, weight: 198, imageBytes: 500, requests: 40, a11y: 88 },
    competitorB: { lcp: 1650, ttfb: 190, weight: 142, imageBytes: 320, requests: 30, a11y: 95 },
    competitorC: { lcp: 2900, ttfb: 380, weight: 320, imageBytes: 880, requests: 58, a11y: 80 },
  },
];

export const COLUMNS: ReadonlyArray<Competitor> = COMPETITORS;

export function valueOf(row: RouteRow, col: Competitor, key: MetricKey): number {
  const cell =
    col === 'you'
      ? row.you
      : col === 'competitor-a.com'
        ? row.competitorA
        : col === 'competitor-b.com'
          ? row.competitorB
          : row.competitorC;
  if (key === 'lcp') return cell.lcp;
  if (key === 'ttfb') return cell.ttfb;
  if (key === 'weight') return cell.weight;
  return cell.a11y;
}

export function cellOf(row: RouteRow, col: Competitor): Cell {
  return col === 'you'
    ? row.you
    : col === 'competitor-a.com'
      ? row.competitorA
      : col === 'competitor-b.com'
        ? row.competitorB
        : row.competitorC;
}

export interface Tertile {
  readonly low: number;
  readonly high: number;
}

export function tertiles(values: ReadonlyArray<number>): Tertile {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const low = sorted[Math.floor(n / 3)] ?? 0;
  const high = sorted[Math.floor((n * 2) / 3)] ?? 0;
  return { low, high };
}

export type Tier = 'best' | 'mid' | 'worst';

export function classify(v: number, t: Tertile, lowerIsBetter: boolean): Tier {
  if (lowerIsBetter) {
    if (v <= t.low) return 'best';
    if (v <= t.high) return 'mid';
    return 'worst';
  }
  if (v >= t.high) return 'best';
  if (v >= t.low) return 'mid';
  return 'worst';
}

export interface Leader {
  readonly metric: MetricMeta;
  readonly competitor: Competitor;
  readonly route: string;
  readonly value: number;
}

export function leaderFor(metric: MetricMeta, rows: ReadonlyArray<RouteRow>): Leader | null {
  let best: Leader | null = null;
  for (const r of rows) {
    for (const c of COMPETITORS) {
      const v = valueOf(r, c, metric.key);
      if (
        best === null ||
        (metric.lowerIsBetter ? v < best.value : v > best.value)
      ) {
        best = { metric, competitor: c, route: r.route, value: v };
      }
    }
  }
  return best;
}

export interface Opportunity {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  readonly savings: string;
}

export const OPPORTUNITIES: ReadonlyArray<Opportunity> = [
  { id: 'avif', title: 'Adopt AVIF', route: '/products', savings: 'save 380KB' },
  { id: 'lazy', title: 'Lazy-load below-fold imgs', route: '/blog/[slug]', savings: 'save 220KB' },
  { id: 'preconnect', title: 'Preconnect to Stripe', route: '/pricing', savings: '−110ms TTFB' },
  { id: 'fonts', title: 'Subset display fonts', route: '/', savings: 'save 96KB' },
  { id: 'http3', title: 'Enable HTTP/3 on edge', route: 'all routes', savings: '−40ms RTT' },
];
