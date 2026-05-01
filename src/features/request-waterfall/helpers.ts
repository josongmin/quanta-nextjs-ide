export type ReqKind =
  | 'html'
  | 'rsc'
  | 'js'
  | 'css'
  | 'font'
  | 'image'
  | 'xhr'
  | 'preflight';

export interface ReqEntry {
  id: string;
  url: string;
  kind: ReqKind;
  startMs: number;
  ttfbMs: number;
  durMs: number;
  bytes: number;
  cached: boolean;
  thirdParty: boolean;
  renderBlocking: boolean;
  status: number;
}

export interface RouteWaterfall {
  routeId: string;
  entries: ReqEntry[];
  lcpMs: number;
  tbtMs: number;
}

interface DraftReq {
  url: string;
  kind: ReqKind;
  startMs: number;
  ttfbMs: number;
  durMs: number;
  bytes: number;
  cached?: boolean;
  thirdParty?: boolean;
  renderBlocking?: boolean;
  status?: number;
}

function build(prefix: string, drafts: ReadonlyArray<DraftReq>): ReqEntry[] {
  return drafts.map((d, i) => ({
    id: `${prefix}_${i}`,
    url: d.url,
    kind: d.kind,
    startMs: d.startMs,
    ttfbMs: d.ttfbMs,
    durMs: d.durMs,
    bytes: d.bytes,
    cached: d.cached ?? false,
    thirdParty: d.thirdParty ?? false,
    renderBlocking: d.renderBlocking ?? false,
    status: d.status ?? 200,
  }));
}

const home: ReqEntry[] = build('home', [
  { url: '/', kind: 'html', startMs: 0, ttfbMs: 38, durMs: 18, bytes: 28_400, renderBlocking: true },
  { url: '/_next/static/css/app.css', kind: 'css', startMs: 60, ttfbMs: 14, durMs: 12, bytes: 24_900, renderBlocking: true },
  { url: '/_next/static/chunks/main.js', kind: 'js', startMs: 60, ttfbMs: 18, durMs: 32, bytes: 88_300, renderBlocking: true },
  { url: '/_next/static/chunks/framework.js', kind: 'js', startMs: 60, ttfbMs: 16, durMs: 28, bytes: 132_700 },
  { url: '/_next/static/chunks/page.js', kind: 'js', startMs: 92, ttfbMs: 12, durMs: 22, bytes: 41_200 },
  { url: '/fonts/inter-var.woff2', kind: 'font', startMs: 70, ttfbMs: 14, durMs: 26, bytes: 64_400 },
  { url: '/_next/image?src=hero.jpg', kind: 'image', startMs: 100, ttfbMs: 22, durMs: 80, bytes: 142_900 },
  { url: '/api/products?featured=true', kind: 'rsc', startMs: 110, ttfbMs: 36, durMs: 18, bytes: 4_800, cached: true },
  { url: 'https://www.googletagmanager.com/gtag/js', kind: 'js', startMs: 130, ttfbMs: 80, durMs: 64, bytes: 88_400, thirdParty: true },
  { url: 'https://plausible.io/api/event', kind: 'xhr', startMs: 220, ttfbMs: 90, durMs: 8, bytes: 240, thirdParty: true },
]);

const productDetail: ReqEntry[] = build('pd', [
  { url: '/products/p_4521', kind: 'html', startMs: 0, ttfbMs: 64, durMs: 22, bytes: 32_100, renderBlocking: true },
  { url: '/_next/static/css/app.css', kind: 'css', startMs: 88, ttfbMs: 6, durMs: 4, bytes: 24_900, cached: true, renderBlocking: true },
  { url: '/_next/static/chunks/main.js', kind: 'js', startMs: 88, ttfbMs: 6, durMs: 4, bytes: 88_300, cached: true, renderBlocking: true },
  { url: '/_next/static/chunks/page-products.js', kind: 'js', startMs: 92, ttfbMs: 18, durMs: 36, bytes: 56_700 },
  { url: '/fonts/inter-var.woff2', kind: 'font', startMs: 90, ttfbMs: 4, durMs: 2, bytes: 64_400, cached: true },
  { url: '/api/products/p_4521', kind: 'rsc', startMs: 92, ttfbMs: 42, durMs: 18, bytes: 6_300 },
  { url: '/api/reviews?productId=p_4521', kind: 'rsc', startMs: 110, ttfbMs: 56, durMs: 22, bytes: 9_400 },
  { url: '/_next/image?src=p_4521_main.jpg', kind: 'image', startMs: 132, ttfbMs: 24, durMs: 92, bytes: 188_200 },
  { url: '/_next/image?src=p_4521_alt1.jpg', kind: 'image', startMs: 140, ttfbMs: 26, durMs: 88, bytes: 162_400 },
  { url: '/api/cart', kind: 'xhr', startMs: 220, ttfbMs: 18, durMs: 6, bytes: 320 },
  { url: 'https://js.stripe.com/v3', kind: 'js', startMs: 250, ttfbMs: 80, durMs: 60, bytes: 96_000, thirdParty: true },
]);

// Dashboard: heavy 30+ entries
function dashboard(): ReqEntry[] {
  const drafts: DraftReq[] = [
    { url: '/dashboard', kind: 'html', startMs: 0, ttfbMs: 120, durMs: 26, bytes: 38_900, renderBlocking: true },
    { url: '/_next/static/css/app.css', kind: 'css', startMs: 146, ttfbMs: 8, durMs: 6, bytes: 24_900, cached: true, renderBlocking: true },
    { url: '/_next/static/css/dashboard.css', kind: 'css', startMs: 150, ttfbMs: 18, durMs: 10, bytes: 12_400, renderBlocking: true },
    { url: '/_next/static/chunks/main.js', kind: 'js', startMs: 150, ttfbMs: 6, durMs: 4, bytes: 88_300, cached: true, renderBlocking: true },
    { url: '/_next/static/chunks/framework.js', kind: 'js', startMs: 150, ttfbMs: 6, durMs: 4, bytes: 132_700, cached: true },
    { url: '/_next/static/chunks/dashboard.js', kind: 'js', startMs: 152, ttfbMs: 28, durMs: 60, bytes: 184_200, renderBlocking: true },
    { url: '/_next/static/chunks/charts.js', kind: 'js', startMs: 154, ttfbMs: 32, durMs: 96, bytes: 312_800 },
    { url: '/_next/static/chunks/grid.js', kind: 'js', startMs: 156, ttfbMs: 34, durMs: 78, bytes: 158_300 },
    { url: '/fonts/inter-var.woff2', kind: 'font', startMs: 152, ttfbMs: 4, durMs: 2, bytes: 64_400, cached: true },
    { url: '/fonts/jetbrains-mono.woff2', kind: 'font', startMs: 158, ttfbMs: 22, durMs: 32, bytes: 58_700 },
    { url: '/api/user', kind: 'rsc', startMs: 152, ttfbMs: 64, durMs: 18, bytes: 1_200 },
    { url: '/api/orders?limit=5', kind: 'rsc', startMs: 170, ttfbMs: 88, durMs: 24, bytes: 11_400 },
    { url: '/api/orders/stats', kind: 'rsc', startMs: 172, ttfbMs: 102, durMs: 28, bytes: 4_300 },
    { url: '/api/orders/timeseries?range=30d', kind: 'rsc', startMs: 174, ttfbMs: 138, durMs: 56, bytes: 28_800 },
    { url: '/api/products?limit=10', kind: 'rsc', startMs: 176, ttfbMs: 76, durMs: 22, bytes: 18_400 },
    { url: '/api/notifications?unread=true', kind: 'rsc', startMs: 178, ttfbMs: 44, durMs: 14, bytes: 2_900 },
    { url: '/_next/image?src=avatar.jpg', kind: 'image', startMs: 220, ttfbMs: 24, durMs: 60, bytes: 14_200 },
    { url: '/_next/image?src=chart-bg.svg', kind: 'image', startMs: 240, ttfbMs: 12, durMs: 14, bytes: 4_800 },
    { url: '/_next/image?src=widget1.png', kind: 'image', startMs: 260, ttfbMs: 28, durMs: 70, bytes: 86_200 },
    { url: '/_next/image?src=widget2.png', kind: 'image', startMs: 268, ttfbMs: 30, durMs: 72, bytes: 92_300 },
    { url: '/_next/image?src=widget3.png', kind: 'image', startMs: 276, ttfbMs: 32, durMs: 74, bytes: 88_400 },
    { url: '/_next/image?src=widget4.png', kind: 'image', startMs: 284, ttfbMs: 34, durMs: 76, bytes: 90_100 },
    { url: '/api/feed?after=0', kind: 'xhr', startMs: 320, ttfbMs: 64, durMs: 18, bytes: 22_400 },
    { url: '/api/cart', kind: 'xhr', startMs: 340, ttfbMs: 18, durMs: 6, bytes: 320, cached: true },
    { url: '/api/preferences', kind: 'xhr', startMs: 360, ttfbMs: 22, durMs: 8, bytes: 1_100 },
    { url: 'https://www.googletagmanager.com/gtag/js', kind: 'js', startMs: 380, ttfbMs: 96, durMs: 80, bytes: 88_400, thirdParty: true },
    { url: 'https://www.google-analytics.com/g/collect', kind: 'xhr', startMs: 460, ttfbMs: 120, durMs: 12, bytes: 320, thirdParty: true },
    { url: 'https://plausible.io/api/event', kind: 'xhr', startMs: 480, ttfbMs: 90, durMs: 10, bytes: 280, thirdParty: true },
    { url: 'https://js.intercomcdn.com/sdk.js', kind: 'js', startMs: 500, ttfbMs: 140, durMs: 110, bytes: 198_000, thirdParty: true },
    { url: 'https://api.intercom.io/messenger/web/ping', kind: 'xhr', startMs: 620, ttfbMs: 80, durMs: 14, bytes: 2_400, thirdParty: true },
    { url: 'https://cdn.segment.io/analytics.js', kind: 'js', startMs: 540, ttfbMs: 110, durMs: 90, bytes: 140_000, thirdParty: true },
    { url: '/api/preflight', kind: 'preflight', startMs: 320, ttfbMs: 8, durMs: 2, bytes: 80, status: 204 },
  ];
  return build('dash', drafts);
}

const checkout: ReqEntry[] = build('co', [
  { url: '/checkout', kind: 'html', startMs: 0, ttfbMs: 88, durMs: 22, bytes: 36_400, renderBlocking: true },
  { url: '/_next/static/css/app.css', kind: 'css', startMs: 110, ttfbMs: 8, durMs: 4, bytes: 24_900, cached: true, renderBlocking: true },
  { url: '/_next/static/chunks/main.js', kind: 'js', startMs: 110, ttfbMs: 6, durMs: 4, bytes: 88_300, cached: true, renderBlocking: true },
  { url: '/_next/static/chunks/checkout.js', kind: 'js', startMs: 116, ttfbMs: 22, durMs: 38, bytes: 96_400 },
  { url: '/api/cart', kind: 'rsc', startMs: 118, ttfbMs: 32, durMs: 14, bytes: 2_800 },
  { url: '/api/user', kind: 'rsc', startMs: 118, ttfbMs: 38, durMs: 16, bytes: 1_200 },
  { url: '/api/payment-methods', kind: 'rsc', startMs: 134, ttfbMs: 48, durMs: 22, bytes: 3_400 },
  { url: '/_next/image?src=cart-thumb.jpg', kind: 'image', startMs: 160, ttfbMs: 22, durMs: 42, bytes: 18_800 },
  { url: 'https://js.stripe.com/v3', kind: 'js', startMs: 180, ttfbMs: 80, durMs: 60, bytes: 96_000, thirdParty: true },
  { url: 'https://api.stripe.com/v1/payment_intents', kind: 'xhr', startMs: 240, ttfbMs: 110, durMs: 22, bytes: 1_800, thirdParty: true },
  { url: 'https://m.stripe.network/inner.html', kind: 'html', startMs: 260, ttfbMs: 100, durMs: 30, bytes: 12_400, thirdParty: true },
]);

export const waterfalls: Record<string, RouteWaterfall> = {
  '/': { routeId: 'route_home', entries: home, lcpMs: 196, tbtMs: 84 },
  '/products/[id]': {
    routeId: 'route_products_id',
    entries: productDetail,
    lcpMs: 240,
    tbtMs: 92,
  },
  '/dashboard': { routeId: 'route_dashboard', entries: dashboard(), lcpMs: 380, tbtMs: 320 },
  '/checkout': { routeId: 'route_checkout', entries: checkout, lcpMs: 220, tbtMs: 120 },
};

export const ALL_KINDS: ReadonlyArray<ReqKind> = [
  'html',
  'rsc',
  'js',
  'css',
  'font',
  'image',
  'xhr',
  'preflight',
];

export function totalsFor(wf: RouteWaterfall): {
  totalBytes: number;
  count: number;
  thirdParty: number;
  duration: number;
} {
  let bytes = 0;
  let third = 0;
  let max = 0;
  for (const e of wf.entries) {
    bytes += e.bytes;
    if (e.thirdParty) third++;
    if (e.startMs + e.ttfbMs + e.durMs > max) max = e.startMs + e.ttfbMs + e.durMs;
  }
  return { totalBytes: bytes, count: wf.entries.length, thirdParty: third, duration: max };
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(2)}MB`;
}

export function mockHeaders(entry: ReqEntry): Record<string, string> {
  const headers: Record<string, string> = {
    status: String(entry.status),
    'content-type': mimeFor(entry.kind),
    'content-length': String(entry.bytes),
  };
  if (entry.cached) {
    headers['x-cache'] = 'HIT';
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['cache-control'] = entry.kind === 'rsc' ? 'private, no-store' : 'public, max-age=60';
  }
  if (entry.kind === 'rsc') headers['rsc'] = '1';
  return headers;
}

function mimeFor(kind: ReqKind): string {
  switch (kind) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'rsc':
      return 'text/x-component';
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'font':
      return 'font/woff2';
    case 'image':
      return 'image/webp';
    case 'xhr':
      return 'application/json';
    case 'preflight':
      return 'text/plain';
  }
}

export function mockInitiator(entry: ReqEntry): string[] {
  if (entry.kind === 'html') return ['(navigation)'];
  if (entry.kind === 'rsc') return ['app/layout.tsx', '<Suspense>', 'fetch(...)'];
  if (entry.kind === 'js' && !entry.thirdParty) return ['<script>', 'next/dist/client/app-router'];
  if (entry.kind === 'css') return ['<link rel="stylesheet">'];
  if (entry.kind === 'font') return ['css @font-face', 'preload'];
  if (entry.kind === 'image') return ['next/image', '<Image>'];
  if (entry.thirdParty) return ['third-party-loader.js', 'document'];
  return ['fetch(...)'];
}
