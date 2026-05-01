export const CHUNKS = [
  'index',
  'react',
  'radix',
  'monaco',
  'floating',
  'sonner',
  'icons',
  'app-sonders',
] as const;

export type ChunkId = (typeof CHUNKS)[number];

export const ROUTES = [
  '/',
  '/products/[id]',
  '/dashboard',
  '/checkout',
  '/blog/[slug]',
  '/admin',
  '/account/settings',
  '/login',
] as const;

export type RouteId = (typeof ROUTES)[number];

export const WEEKS = 12;

// Per-chunk size series across 12 weeks (KB).
const CHUNK_SERIES: Record<ChunkId, ReadonlyArray<number>> = {
  index: [42, 44, 44, 46, 48, 48, 49, 50, 51, 52, 53, 54],
  react: [128, 128, 128, 128, 128, 128, 130, 130, 130, 132, 132, 132],
  radix: [62, 62, 64, 66, 66, 68, 68, 70, 70, 72, 74, 74],
  monaco: [180, 180, 184, 184, 188, 188, 192, 312, 318, 320, 324, 326],
  floating: [18, 18, 18, 20, 22, 22, 22, 22, 24, 24, 24, 24],
  sonner: [10, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12],
  icons: [44, 44, 46, 48, 50, 52, 54, 56, 58, 62, 66, 68],
  'app-sonders': [54, 56, 60, 62, 66, 70, 74, 78, 82, 86, 90, 94],
};

export interface ChunkPoint {
  chunk: ChunkId;
  week: number; // 0..11
  sizeKb: number;
}

export const CHUNK_POINTS: ReadonlyArray<ChunkPoint> = CHUNKS.flatMap((c) =>
  CHUNK_SERIES[c].map((sz, w) => ({ chunk: c, week: w, sizeKb: sz })),
);

// Per-route weight (sum of relevant chunks) — pre-computed per week.
const ROUTE_FACTOR: Record<RouteId, number> = {
  '/': 0.4,
  '/products/[id]': 0.55,
  '/dashboard': 0.85,
  '/checkout': 0.5,
  '/blog/[slug]': 0.35,
  '/admin': 0.95,
  '/account/settings': 0.45,
  '/login': 0.22,
};

export const ROUTE_BUDGETS: Record<RouteId, number> = {
  '/': 220,
  '/products/[id]': 280,
  '/dashboard': 380,
  '/checkout': 250,
  '/blog/[slug]': 200,
  '/admin': 420,
  '/account/settings': 240,
  '/login': 140,
};

export interface RouteWeekly {
  route: RouteId;
  series: ReadonlyArray<number>; // length 12
}

export const ROUTE_SERIES: ReadonlyArray<RouteWeekly> = ROUTES.map((r) => {
  const series: number[] = [];
  for (let w = 0; w < WEEKS; w += 1) {
    let sum = 0;
    for (const c of CHUNKS) sum += CHUNK_SERIES[c][w] ?? 0;
    series.push(Math.round(sum * ROUTE_FACTOR[r]));
  }
  return { route: r, series };
});

export interface ChangeCallout {
  week: number;
  chunk: ChunkId;
  deltaKb: number;
  message: string;
  commit: string;
}

export const CALLOUTS: ReadonlyArray<ChangeCallout> = [
  {
    week: 7,
    chunk: 'monaco',
    deltaKb: 120,
    message: 'monaco upgraded to 0.45 — added language workers',
    commit: 'abc123',
  },
  {
    week: 4,
    chunk: 'icons',
    deltaKb: 8,
    message: 'switched lucide barrel import → tree-shake fix',
    commit: 'd9e2f1',
  },
  {
    week: 8,
    chunk: 'app-sonders',
    deltaKb: 8,
    message: 'route /admin gained two new dashboards',
    commit: 'b2a4c0',
  },
  {
    week: 5,
    chunk: 'radix',
    deltaKb: 6,
    message: '@radix-ui/react-dialog v1 → v2',
    commit: '1f3a7b',
  },
];

export function totalKb(week: number): number {
  let sum = 0;
  for (const c of CHUNKS) sum += CHUNK_SERIES[c][week] ?? 0;
  return sum;
}

export function chunkSeries(chunk: ChunkId): ReadonlyArray<number> {
  return CHUNK_SERIES[chunk];
}

export function chunkColor(chunk: ChunkId): string {
  switch (chunk) {
    case 'index':
      return 'fill-accent-soft stroke-accent';
    case 'react':
      return 'fill-sem-static-soft stroke-sem-static';
    case 'radix':
      return 'fill-sem-isr-soft stroke-sem-isr';
    case 'monaco':
      return 'fill-sev-warn-soft stroke-sev-warn';
    case 'floating':
      return 'fill-sem-edge-soft stroke-sem-edge';
    case 'sonner':
      return 'fill-sev-info-soft stroke-sev-info';
    case 'icons':
      return 'fill-sem-dynamic-soft stroke-sem-dynamic';
    case 'app-sonders':
      return 'fill-sem-server-soft stroke-sem-server';
  }
}

export function chunkChipTone(
  chunk: ChunkId,
):
  | 'accent'
  | 'static'
  | 'isr'
  | 'warn'
  | 'edge'
  | 'info'
  | 'dynamic'
  | 'server' {
  switch (chunk) {
    case 'index':
      return 'accent';
    case 'react':
      return 'static';
    case 'radix':
      return 'isr';
    case 'monaco':
      return 'warn';
    case 'floating':
      return 'edge';
    case 'sonner':
      return 'info';
    case 'icons':
      return 'dynamic';
    case 'app-sonders':
      return 'server';
  }
}
