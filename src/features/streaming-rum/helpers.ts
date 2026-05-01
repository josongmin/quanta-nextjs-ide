export type Vital = 'FCP' | 'LCP' | 'INP' | 'TTI';
export type Percentile = 'p50' | 'p75' | 'p95';
export type DateRange = '7d' | '14d' | '30d';

export const TRACK_W = 760;
export const TRACK_H = 96;
export const HISTORY_H = 96;

export const VITAL_FILL: Record<Vital, string> = {
  FCP: 'fill-sev-info',
  LCP: 'fill-sev-err',
  INP: 'fill-sev-warn',
  TTI: 'fill-sem-static',
};
export const VITAL_STROKE: Record<Vital, string> = {
  FCP: 'stroke-sev-info',
  LCP: 'stroke-sev-err',
  INP: 'stroke-sev-warn',
  TTI: 'stroke-sem-static',
};

export interface ChunkInfo {
  readonly id: string;
  readonly arrivalMs: number;
  readonly bytes: number;
  readonly rendered: string;
  readonly impactedVital?: Vital;
  readonly attribution: string;
  readonly fix?: string;
}

export interface VitalMarker {
  readonly vital: Vital;
  readonly ms: number;
}

export interface RouteStream {
  readonly id: string;
  readonly label: string;
  readonly chunks: ReadonlyArray<ChunkInfo>;
  readonly vitals: ReadonlyArray<VitalMarker>;
  /** History of {p50,p75,p95} per day, oldest → newest, length = 30. */
  readonly history: ReadonlyArray<{ day: number; p50: number; p75: number; p95: number }>;
  readonly sessionsCount: number;
}

function chunk(
  id: string,
  arrival: number,
  bytes: number,
  rendered: string,
  attribution: string,
  impacted?: Vital,
  fix?: string,
): ChunkInfo {
  return {
    id,
    arrivalMs: arrival,
    bytes,
    rendered,
    attribution,
    ...(impacted !== undefined ? { impactedVital: impacted } : {}),
    ...(fix !== undefined ? { fix } : {}),
  };
}

function history(seed: number): ReadonlyArray<{ day: number; p50: number; p75: number; p95: number }> {
  const arr: Array<{ day: number; p50: number; p75: number; p95: number }> = [];
  for (let d = 0; d < 30; d += 1) {
    // pseudo-random deterministic walk
    const t = (Math.sin((d + seed) * 0.7) + Math.cos((d + seed) * 0.31)) * 0.5;
    const p50 = Math.round(900 + seed * 70 + t * 60);
    const p75 = p50 + Math.round(180 + Math.abs(t) * 90);
    const p95 = p75 + Math.round(420 + (1 - Math.abs(t)) * 200);
    arr.push({ day: d, p50, p75, p95 });
  }
  return arr;
}

export const ROUTES: ReadonlyArray<RouteStream> = [
  {
    id: 'home',
    label: '/',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 80, 4200, 'Shell + nav', 'Inline critical CSS'),
      chunk('c2', 240, 8800, 'Hero text', 'Server component flush', 'FCP'),
      chunk('c3', 480, 12400, 'Hero image', 'CDN fetch', 'LCP', 'preload + fetchpriority=high'),
      chunk('c4', 740, 6200, 'Featured grid', 'Suspense boundary'),
      chunk('c5', 980, 5400, 'Newsletter form', 'Hydrate island', 'INP'),
      chunk('c6', 1240, 3200, 'Footer', 'Lazy-render'),
      chunk('c7', 1520, 2800, 'Analytics + recs', 'Idle work', 'TTI'),
      chunk('c8', 1880, 2100, 'Personalized blocks', 'Edge cache miss'),
    ],
    vitals: [
      { vital: 'FCP', ms: 280 },
      { vital: 'LCP', ms: 540 },
      { vital: 'INP', ms: 1020 },
      { vital: 'TTI', ms: 1620 },
    ],
    history: history(2),
  },
  {
    id: 'products',
    label: '/products',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 90, 3800, 'Shell', 'CSS'),
      chunk('c2', 280, 7200, 'Filters', 'Server component'),
      chunk('c3', 460, 14000, 'Product grid (40 items)', 'List render', 'LCP', 'split list into virtualized + above-fold cards'),
      chunk('c4', 720, 5800, 'Pagination', 'Hydrate island', 'INP'),
      chunk('c5', 920, 4200, 'Recently viewed', 'Suspense'),
      chunk('c6', 1100, 3600, 'Footer', 'Lazy'),
      chunk('c7', 1320, 2800, 'Recs', 'Idle', 'TTI'),
      chunk('c8', 1540, 2200, 'Banner', 'A/B fetch'),
      chunk('c9', 1760, 1900, 'Personalized', 'Edge'),
    ],
    vitals: [
      { vital: 'FCP', ms: 310 },
      { vital: 'LCP', ms: 620 },
      { vital: 'INP', ms: 760 },
      { vital: 'TTI', ms: 1420 },
    ],
    history: history(4),
  },
  {
    id: 'product-detail',
    label: '/products/[id]',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 90, 4400, 'Shell', 'CSS'),
      chunk('c2', 260, 7800, 'Title + price', 'Server flush', 'FCP'),
      chunk('c3', 460, 18800, 'Hero image (offscreen)', 'CDN', 'LCP', '<img> outside fold delayed LCP — move above fold'),
      chunk('c4', 720, 9400, 'Gallery thumbnails', 'Suspense'),
      chunk('c5', 980, 6200, 'Description', 'Server component'),
      chunk('c6', 1180, 4800, 'Related products', 'Edge'),
      chunk('c7', 1380, 5400, 'Reviews list', 'Streamed', 'INP'),
      chunk('c8', 1680, 3200, 'Add-to-cart island', 'Hydrate'),
      chunk('c9', 1920, 2800, 'Recs carousel', 'Idle', 'TTI'),
      chunk('c10', 2160, 2200, 'Q&A', 'Lazy'),
    ],
    vitals: [
      { vital: 'FCP', ms: 290 },
      { vital: 'LCP', ms: 720 },
      { vital: 'INP', ms: 1480 },
      { vital: 'TTI', ms: 2020 },
    ],
    history: history(6),
  },
  {
    id: 'checkout',
    label: '/checkout',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 100, 4800, 'Shell + stepper', 'CSS', 'FCP'),
      chunk('c2', 280, 8200, 'Cart summary', 'Server flush'),
      chunk('c3', 540, 10400, 'Address form', 'Hydrate island'),
      chunk('c4', 820, 14800, 'Stripe iframe', 'Third-party', 'LCP', 'preconnect + lazyHydrate'),
      chunk('c5', 1140, 6800, 'Shipping options', 'Server fetch'),
      chunk('c6', 1380, 5200, 'Payment review', 'Hydrate', 'INP'),
      chunk('c7', 1620, 3400, 'Confirm button', 'Hydrate'),
      chunk('c8', 1880, 2800, 'Footer + legal', 'Lazy', 'TTI'),
    ],
    vitals: [
      { vital: 'FCP', ms: 310 },
      { vital: 'LCP', ms: 1140 },
      { vital: 'INP', ms: 1420 },
      { vital: 'TTI', ms: 1840 },
    ],
    history: history(8),
  },
  {
    id: 'blog',
    label: '/blog',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 80, 3600, 'Shell', 'CSS'),
      chunk('c2', 220, 6800, 'Hero post', 'Server flush', 'FCP'),
      chunk('c3', 420, 11200, 'Hero image', 'CDN', 'LCP'),
      chunk('c4', 660, 5400, 'Post grid', 'Suspense'),
      chunk('c5', 880, 4200, 'Sidebar', 'Server'),
      chunk('c6', 1100, 3800, 'Newsletter form', 'Hydrate', 'INP'),
      chunk('c7', 1320, 2600, 'Footer', 'Lazy', 'TTI'),
      chunk('c8', 1540, 2000, 'Recs', 'Idle'),
    ],
    vitals: [
      { vital: 'FCP', ms: 240 },
      { vital: 'LCP', ms: 480 },
      { vital: 'INP', ms: 1140 },
      { vital: 'TTI', ms: 1380 },
    ],
    history: history(3),
  },
  {
    id: 'about',
    label: '/about',
    sessionsCount: 240,
    chunks: [
      chunk('c1', 70, 3200, 'Shell', 'CSS', 'FCP'),
      chunk('c2', 200, 5400, 'Headline + intro', 'Server flush'),
      chunk('c3', 380, 9800, 'Team grid (avatars)', 'CDN', 'LCP'),
      chunk('c4', 600, 4400, 'Values section', 'Server'),
      chunk('c5', 800, 3600, 'Press logos', 'Lazy', 'INP'),
      chunk('c6', 1020, 2400, 'Footer', 'Lazy', 'TTI'),
    ],
    vitals: [
      { vital: 'FCP', ms: 200 },
      { vital: 'LCP', ms: 420 },
      { vital: 'INP', ms: 820 },
      { vital: 'TTI', ms: 1080 },
    ],
    history: history(1),
  },
];

export function routeById(id: string): RouteStream {
  const r = ROUTES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown route ${id}`);
  return r;
}

export function vitalColor(v: Vital): string {
  switch (v) {
    case 'FCP':
      return 'stroke-sev-info';
    case 'LCP':
      return 'stroke-sev-err';
    case 'INP':
      return 'stroke-sev-warn';
    case 'TTI':
      return 'stroke-sem-static';
  }
}

export function vitalChipTone(v: Vital): 'info' | 'err' | 'warn' | 'static' {
  switch (v) {
    case 'FCP':
      return 'info';
    case 'LCP':
      return 'err';
    case 'INP':
      return 'warn';
    case 'TTI':
      return 'static';
  }
}

export function pickPercentile(p: Percentile, h: { p50: number; p75: number; p95: number }): number {
  return p === 'p50' ? h.p50 : p === 'p75' ? h.p75 : h.p95;
}

export function rangeDays(r: DateRange): number {
  return r === '7d' ? 7 : r === '14d' ? 14 : 30;
}

export interface SessionPreview {
  readonly id: string;
  readonly userBucket: string;
  readonly device: 'mobile' | 'desktop' | 'tablet';
  readonly fcpMs: number;
  readonly lcpMs: number;
  readonly slowChunk: string;
}

const DEVICE_CYCLE: ReadonlyArray<'mobile' | 'desktop' | 'tablet'> = [
  'mobile',
  'desktop',
  'mobile',
  'tablet',
  'desktop',
  'mobile',
  'desktop',
  'mobile',
];

export function sampleSessions(routeId: string): ReadonlyArray<SessionPreview> {
  const r = routeById(routeId);
  return Array.from({ length: 8 }).map((_, i) => {
    const device = DEVICE_CYCLE[i % DEVICE_CYCLE.length] ?? 'mobile';
    const fcp = r.vitals.find((v) => v.vital === 'FCP')?.ms ?? 300;
    const lcp = r.vitals.find((v) => v.vital === 'LCP')?.ms ?? 600;
    const jitter = ((i * 53) % 11) * 18;
    const slow = r.chunks[(i * 3) % r.chunks.length]?.id ?? 'c1';
    return {
      id: `s-${routeId}-${i + 1}`,
      userBucket: `bucket-${(i % 4) + 1}`,
      device,
      fcpMs: fcp + jitter,
      lcpMs: lcp + jitter * 2,
      slowChunk: slow,
    };
  });
}
