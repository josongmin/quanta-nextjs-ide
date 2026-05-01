export type Region = 'iad1' | 'sfo1' | 'fra1' | 'syd1' | 'icn1';

export interface EdgeFn {
  id: string;
  routePath: string;
  runtime: 'edge' | 'node';
  regions: Region[];
  coldP50: number;
  coldP95: number;
  warmP50: number;
  warmP95: number;
  warmRatio: number;
  bundleKb: number;
}

export const ALL_REGIONS: ReadonlyArray<Region> = ['iad1', 'sfo1', 'fra1', 'syd1', 'icn1'];

export const edgeFns: ReadonlyArray<EdgeFn> = [
  {
    id: 'fn_products',
    routePath: '/api/products',
    runtime: 'edge',
    regions: ['iad1', 'sfo1', 'fra1', 'syd1', 'icn1'],
    coldP50: 84,
    coldP95: 142,
    warmP50: 9,
    warmP95: 22,
    warmRatio: 0.92,
    bundleKb: 38,
  },
  {
    id: 'fn_product_detail',
    routePath: '/api/products/[id]',
    runtime: 'edge',
    regions: ['iad1', 'sfo1', 'fra1', 'icn1'],
    coldP50: 96,
    coldP95: 168,
    warmP50: 12,
    warmP95: 28,
    warmRatio: 0.85,
    bundleKb: 44,
  },
  {
    id: 'fn_checkout',
    routePath: '/api/checkout',
    runtime: 'node',
    regions: ['iad1', 'fra1'],
    coldP50: 280,
    coldP95: 480,
    warmP50: 38,
    warmP95: 88,
    warmRatio: 0.7,
    bundleKb: 312,
  },
  {
    id: 'fn_webhook_stripe',
    routePath: '/api/webhooks/stripe',
    runtime: 'node',
    regions: ['iad1'],
    coldP50: 360,
    coldP95: 580,
    warmP50: 42,
    warmP95: 96,
    warmRatio: 0.45,
    bundleKb: 428,
  },
  {
    id: 'fn_admin_users',
    routePath: '/admin/users/route',
    runtime: 'node',
    regions: ['iad1', 'fra1'],
    coldP50: 240,
    coldP95: 410,
    warmP50: 32,
    warmP95: 78,
    warmRatio: 0.6,
    bundleKb: 264,
  },
  {
    id: 'fn_orders',
    routePath: '/api/orders',
    runtime: 'edge',
    regions: ['iad1', 'sfo1', 'fra1', 'syd1', 'icn1'],
    coldP50: 92,
    coldP95: 156,
    warmP50: 11,
    warmP95: 26,
    warmRatio: 0.88,
    bundleKb: 52,
  },
  {
    id: 'fn_search',
    routePath: '/api/search',
    runtime: 'edge',
    regions: ['iad1', 'fra1', 'icn1'],
    coldP50: 110,
    coldP95: 188,
    warmP50: 16,
    warmP95: 36,
    warmRatio: 0.78,
    bundleKb: 86,
  },
  {
    id: 'fn_image_optimize',
    routePath: '/_next/image',
    runtime: 'node',
    regions: ['iad1', 'sfo1', 'fra1'],
    coldP50: 220,
    coldP95: 380,
    warmP50: 34,
    warmP95: 70,
    warmRatio: 0.82,
    bundleKb: 196,
  },
];

export function regionLatencies(fn: EdgeFn): Record<Region, number> {
  // mock per-region p50 derived from base coldP50
  const base = fn.coldP50;
  const result: Partial<Record<Region, number>> = {};
  ALL_REGIONS.forEach((r, idx) => {
    if (!fn.regions.includes(r)) return;
    const drift = ((idx * 13) % 17) - 8;
    result[r] = Math.max(20, base + drift);
  });
  return result as Record<Region, number>;
}

export function ratioColor(r: number): { bg: string; fg: string } {
  if (r >= 0.85) return { bg: 'bg-sem-static-soft', fg: 'text-sem-static' };
  if (r >= 0.7) return { bg: 'bg-sev-info-soft', fg: 'text-sev-info' };
  if (r >= 0.55) return { bg: 'bg-sev-warn-soft', fg: 'text-sev-warn' };
  return { bg: 'bg-sev-err-soft', fg: 'text-sev-err' };
}

export function suggestionsFor(fn: EdgeFn): string[] {
  const out: string[] = [];
  if (fn.runtime === 'node' && fn.bundleKb > 300) {
    out.push('Bundle is heavy — split helpers and dynamic-import the rare paths.');
  }
  if (fn.runtime === 'node' && fn.warmRatio < 0.6) {
    out.push('Low warm ratio: consider scheduled pre-warm pings or moving to edge runtime.');
  }
  if (fn.runtime === 'edge' && fn.warmRatio < 0.85) {
    out.push('Edge cold starts are cheap but prefer single primary region for hot paths.');
  }
  if (fn.coldP95 > 400) {
    out.push('Cold p95 > 400ms — review init imports (db drivers, sdks).');
  }
  if (out.length === 0) out.push('Within healthy thresholds.');
  return out;
}
