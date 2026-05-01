import { runtimeFetchSeeds, seededRng } from '@shared/mocks/runtime-flow';

export type CacheCellState =
  | 'hit'
  | 'miss'
  | 'stale-hit'
  | 'revalidate'
  | 'no-store';

export interface CacheCell {
  bucket: number;
  state: CacheCellState;
  ageMs?: number;
}

export interface CacheRow {
  fetchId: string;
  url: string;
  tags: string[];
  revalidate: number | null;
  cells: CacheCell[];
  routes: string[];
}

export const BUCKET_COUNT = 24;
export const BUCKET_MS = 5 * 60_000;

const STATE_ORDER: ReadonlyArray<CacheCellState> = [
  'hit',
  'miss',
  'stale-hit',
  'revalidate',
  'no-store',
];

function pickState(rng: () => number, weights: ReadonlyArray<number>): CacheCellState {
  const total = weights.reduce((acc, w) => acc + w, 0) || 1;
  const target = rng() * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] ?? 0;
    if (target <= acc) {
      return STATE_ORDER[i] ?? 'hit';
    }
  }
  return 'hit';
}

function ageFor(state: CacheCellState, revalidate: number | null, rng: () => number): number | undefined {
  if (state === 'no-store') return undefined;
  if (state === 'miss') return Math.round(rng() * 50);
  const cap = (revalidate ?? 60) * 1000;
  const base = Math.round(rng() * cap);
  if (state === 'stale-hit') return cap + Math.round(rng() * cap);
  if (state === 'revalidate') return cap;
  return base;
}

export const heatmapRows: ReadonlyArray<CacheRow> = runtimeFetchSeeds.map((seed, idx) => {
  const rng = seededRng(0x4321 + idx * 17);
  const cells: CacheCell[] = [];
  for (let b = 0; b < BUCKET_COUNT; b++) {
    const state = pickState(rng, seed.weight);
    const ageMs = ageFor(state, seed.revalidate, rng);
    const cell: CacheCell = ageMs === undefined ? { bucket: b, state } : { bucket: b, state, ageMs };
    cells.push(cell);
  }
  return {
    fetchId: seed.id,
    url: seed.url,
    tags: [...seed.tags],
    revalidate: seed.revalidate,
    routes: [...seed.routes],
    cells,
  };
});

export interface RowStats {
  hits: number;
  misses: number;
  stale: number;
  revalidates: number;
  noStore: number;
  total: number;
  hitRatio: number;
  p50AgeMs: number;
  p95AgeMs: number;
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx] ?? 0;
}

export function rowStats(row: CacheRow): RowStats {
  let hits = 0;
  let misses = 0;
  let stale = 0;
  let rev = 0;
  let nost = 0;
  const ages: number[] = [];
  for (const c of row.cells) {
    if (c.state === 'hit') hits++;
    else if (c.state === 'miss') misses++;
    else if (c.state === 'stale-hit') stale++;
    else if (c.state === 'revalidate') rev++;
    else nost++;
    if (typeof c.ageMs === 'number') ages.push(c.ageMs);
  }
  ages.sort((a, b) => a - b);
  const total = row.cells.length;
  const effective = total - nost;
  const hitRatio = effective === 0 ? 0 : (hits + stale) / effective;
  return {
    hits,
    misses,
    stale,
    revalidates: rev,
    noStore: nost,
    total,
    hitRatio,
    p50AgeMs: pct(ages, 50),
    p95AgeMs: pct(ages, 95),
  };
}

export function aggregateHitRatio(rows: ReadonlyArray<CacheRow>): number {
  let hits = 0;
  let effective = 0;
  for (const r of rows) {
    for (const c of r.cells) {
      if (c.state === 'no-store') continue;
      effective++;
      if (c.state === 'hit' || c.state === 'stale-hit') hits++;
    }
  }
  return effective === 0 ? 0 : hits / effective;
}

export function recommendCachePolicy(row: CacheRow, stats: RowStats): string {
  if (stats.noStore === stats.total) {
    return [
      `// ${row.url}`,
      `// Currently always uncached (no-store).`,
      `// If response is per-user, leave as-is. Otherwise:`,
      `await fetch('${row.url}', {`,
      `  next: { revalidate: 30, tags: ${JSON.stringify(row.tags)} },`,
      `});`,
    ].join('\n');
  }
  if (stats.stale > stats.total * 0.4) {
    return [
      `// ${row.url}`,
      `// High stale-hit rate (${Math.round((stats.stale / stats.total) * 100)}%).`,
      `// Lower revalidate or pair with revalidateTag on writes.`,
      `await fetch('${row.url}', {`,
      `  next: { revalidate: ${Math.max(15, Math.round((row.revalidate ?? 60) / 2))}, tags: ${JSON.stringify(row.tags)} },`,
      `});`,
    ].join('\n');
  }
  if (stats.hitRatio > 0.85) {
    return [
      `// ${row.url}`,
      `// Hit ratio ${(stats.hitRatio * 100).toFixed(1)}% — already efficient.`,
      `// Consider widening revalidate to reduce origin load.`,
      `await fetch('${row.url}', {`,
      `  next: { revalidate: ${(row.revalidate ?? 60) * 2}, tags: ${JSON.stringify(row.tags)} },`,
      `});`,
    ].join('\n');
  }
  return [
    `// ${row.url}`,
    `// Mix of hit/miss — ensure revalidate window is correct.`,
    `await fetch('${row.url}', {`,
    `  next: { revalidate: ${row.revalidate ?? 60}, tags: ${JSON.stringify(row.tags)} },`,
    `});`,
  ].join('\n');
}

export function bucketLabel(bucket: number, sizeMin: number, totalBuckets: number): string {
  // bucket 0 = oldest. last bucket = now.
  const minutesAgo = (totalBuckets - 1 - bucket) * sizeMin;
  if (minutesAgo === 0) return 'now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  return `${Math.round(minutesAgo / 60)}h ago`;
}

export function formatAge(ms: number | undefined): string {
  if (ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

export const ALL_STATES: ReadonlyArray<CacheCellState> = STATE_ORDER;
