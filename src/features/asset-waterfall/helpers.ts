export type AssetKind =
  | 'html'
  | 'css'
  | 'js'
  | 'font'
  | 'img'
  | 'json'
  | 'svg';

export function kindFill(kind: AssetKind): string {
  switch (kind) {
    case 'html':
      return 'fill-sem-server';
    case 'css':
      return 'fill-sev-info';
    case 'js':
      return 'fill-accent';
    case 'font':
      return 'fill-sem-static';
    case 'img':
      return 'fill-sem-isr';
    case 'json':
      return 'fill-sem-edge';
    case 'svg':
      return 'fill-sem-dynamic';
  }
}

export function kindLight(kind: AssetKind): string {
  switch (kind) {
    case 'html':
      return 'fill-sem-server-soft';
    case 'css':
      return 'fill-sev-info-soft';
    case 'js':
      return 'fill-accent-soft';
    case 'font':
      return 'fill-sem-static-soft';
    case 'img':
      return 'fill-sem-isr-soft';
    case 'json':
      return 'fill-sem-edge-soft';
    case 'svg':
      return 'fill-sem-dynamic-soft';
  }
}

export function kindTone(
  kind: AssetKind,
):
  | 'server'
  | 'info'
  | 'accent'
  | 'static'
  | 'isr'
  | 'edge'
  | 'dynamic' {
  switch (kind) {
    case 'html':
      return 'server';
    case 'css':
      return 'info';
    case 'js':
      return 'accent';
    case 'font':
      return 'static';
    case 'img':
      return 'isr';
    case 'json':
      return 'edge';
    case 'svg':
      return 'dynamic';
  }
}

export type AssetOrigin = 'own' | '3p' | 'cdn';
export type AssetPriority = 'high' | 'low';

export interface Asset {
  id: string;
  url: string;
  kind: AssetKind;
  sizeKb: number;
  ttfbMs: number;
  downloadMs: number;
  startMs: number;
  blocking: boolean;
  cached: boolean;
  priority: AssetPriority;
  origin: AssetOrigin;
  suggestion?: 'preload' | 'defer' | 'use AVIF' | 'self-host' | 'compress';
}

export interface AssetRoute {
  routeId: string;
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  assets: ReadonlyArray<Asset>;
}

export const ROUTES: ReadonlyArray<string> = [
  '/',
  '/products/[id]',
  '/dashboard',
  '/checkout',
  '/blog/[slug]',
  '/login',
];

export const ALL_KINDS: ReadonlyArray<AssetKind> = [
  'html',
  'css',
  'js',
  'font',
  'img',
  'json',
  'svg',
];

interface DraftAsset {
  url: string;
  kind: AssetKind;
  sizeKb: number;
  ttfbMs: number;
  downloadMs: number;
  startMs: number;
  blocking?: boolean;
  cached?: boolean;
  priority?: AssetPriority;
  origin?: AssetOrigin;
  suggestion?: Asset['suggestion'];
}

function build(prefix: string, drafts: ReadonlyArray<DraftAsset>): Asset[] {
  return drafts.map((d, i) => ({
    id: `${prefix}_${i}`,
    url: d.url,
    kind: d.kind,
    sizeKb: d.sizeKb,
    ttfbMs: d.ttfbMs,
    downloadMs: d.downloadMs,
    startMs: d.startMs,
    blocking: d.blocking ?? false,
    cached: d.cached ?? false,
    priority: d.priority ?? 'low',
    origin: d.origin ?? 'own',
    ...(d.suggestion ? { suggestion: d.suggestion } : {}),
  }));
}

const home: Asset[] = build('home', [
  { url: '/', kind: 'html', sizeKb: 28, ttfbMs: 38, downloadMs: 18, startMs: 0, blocking: true, priority: 'high' },
  { url: '/_next/static/css/app.css', kind: 'css', sizeKb: 24, ttfbMs: 14, downloadMs: 12, startMs: 60, blocking: true, priority: 'high' },
  { url: '/_next/static/chunks/main.js', kind: 'js', sizeKb: 88, ttfbMs: 18, downloadMs: 32, startMs: 60, blocking: true, priority: 'high' },
  { url: '/_next/static/chunks/framework.js', kind: 'js', sizeKb: 132, ttfbMs: 16, downloadMs: 28, startMs: 60, priority: 'high' },
  { url: '/_next/static/chunks/page-home.js', kind: 'js', sizeKb: 56, ttfbMs: 12, downloadMs: 22, startMs: 96, priority: 'high', suggestion: 'defer' },
  { url: '/fonts/inter-var.woff2', kind: 'font', sizeKb: 64, ttfbMs: 14, downloadMs: 26, startMs: 70, priority: 'high', suggestion: 'preload' },
  { url: '/_next/image?src=hero.jpg', kind: 'img', sizeKb: 142, ttfbMs: 22, downloadMs: 80, startMs: 100, priority: 'high', suggestion: 'use AVIF' },
  { url: '/_next/image?src=card-1.jpg', kind: 'img', sizeKb: 86, ttfbMs: 22, downloadMs: 60, startMs: 220 },
  { url: '/_next/image?src=card-2.jpg', kind: 'img', sizeKb: 84, ttfbMs: 22, downloadMs: 58, startMs: 220 },
  { url: '/_next/image?src=card-3.jpg', kind: 'img', sizeKb: 82, ttfbMs: 22, downloadMs: 56, startMs: 240 },
  { url: '/icons/logo.svg', kind: 'svg', sizeKb: 4, ttfbMs: 8, downloadMs: 4, startMs: 80 },
  { url: '/icons/cart.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 80 },
  { url: '/icons/menu.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 80 },
  { url: '/api/products?featured=true', kind: 'json', sizeKb: 4, ttfbMs: 36, downloadMs: 18, startMs: 110, cached: true },
  { url: '/api/me', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 130 },
  { url: 'https://gtm.example.com/gtag/js', kind: 'js', sizeKb: 88, ttfbMs: 80, downloadMs: 64, startMs: 130, origin: '3p', suggestion: 'defer' },
  { url: 'https://plausible.io/api/event', kind: 'json', sizeKb: 0.2, ttfbMs: 90, downloadMs: 8, startMs: 220, origin: '3p' },
  { url: 'https://cdn.example.com/edge-pixel.gif', kind: 'img', sizeKb: 0.5, ttfbMs: 60, downloadMs: 6, startMs: 280, origin: '3p' },
  { url: '/_next/static/chunks/icons-lucide.js', kind: 'js', sizeKb: 64, ttfbMs: 18, downloadMs: 36, startMs: 220 },
  { url: '/_next/static/chunks/sonner.js', kind: 'js', sizeKb: 12, ttfbMs: 12, downloadMs: 4, startMs: 240 },
  { url: '/_next/static/chunks/floating-ui.js', kind: 'js', sizeKb: 24, ttfbMs: 12, downloadMs: 8, startMs: 240 },
  { url: '/fonts/icomoon.woff2', kind: 'font', sizeKb: 28, ttfbMs: 22, downloadMs: 12, startMs: 320 },
  { url: '/api/featured-images', kind: 'json', sizeKb: 6, ttfbMs: 28, downloadMs: 8, startMs: 360 },
  { url: '/sw.js', kind: 'js', sizeKb: 8, ttfbMs: 12, downloadMs: 4, startMs: 380 },
  { url: '/_next/static/chunks/page-products.js', kind: 'js', sizeKb: 48, ttfbMs: 16, downloadMs: 18, startMs: 460 },
  { url: '/_next/image?src=card-4.jpg', kind: 'img', sizeKb: 80, ttfbMs: 22, downloadMs: 56, startMs: 480, suggestion: 'use AVIF' },
  { url: '/_next/image?src=card-5.jpg', kind: 'img', sizeKb: 78, ttfbMs: 22, downloadMs: 54, startMs: 500, suggestion: 'use AVIF' },
  { url: '/manifest.json', kind: 'json', sizeKb: 1, ttfbMs: 8, downloadMs: 2, startMs: 120 },
  { url: '/favicon.ico', kind: 'img', sizeKb: 4, ttfbMs: 8, downloadMs: 4, startMs: 60 },
  { url: '/api/banner', kind: 'json', sizeKb: 2, ttfbMs: 22, downloadMs: 4, startMs: 220, cached: true },
]);

const productDetail: Asset[] = build('pd', [
  { url: '/products/p_4521', kind: 'html', sizeKb: 32, ttfbMs: 64, downloadMs: 22, startMs: 0, blocking: true, priority: 'high' },
  { url: '/_next/static/css/app.css', kind: 'css', sizeKb: 24, ttfbMs: 6, downloadMs: 4, startMs: 88, cached: true, blocking: true, priority: 'high' },
  { url: '/_next/static/chunks/main.js', kind: 'js', sizeKb: 88, ttfbMs: 6, downloadMs: 4, startMs: 88, cached: true, blocking: true, priority: 'high' },
  { url: '/_next/static/chunks/page-products.js', kind: 'js', sizeKb: 56, ttfbMs: 18, downloadMs: 36, startMs: 92, priority: 'high' },
  { url: '/fonts/inter-var.woff2', kind: 'font', sizeKb: 64, ttfbMs: 4, downloadMs: 2, startMs: 90, cached: true, priority: 'high' },
  { url: '/api/products/p_4521', kind: 'json', sizeKb: 6, ttfbMs: 42, downloadMs: 18, startMs: 92, priority: 'high' },
  { url: '/api/products/p_4521/recommendations', kind: 'json', sizeKb: 12, ttfbMs: 58, downloadMs: 22, startMs: 110, suggestion: 'defer' },
  { url: '/_next/image?src=p_4521-hero.jpg', kind: 'img', sizeKb: 220, ttfbMs: 22, downloadMs: 124, startMs: 130, priority: 'high', suggestion: 'use AVIF' },
  { url: '/_next/image?src=p_4521-1.jpg', kind: 'img', sizeKb: 90, ttfbMs: 22, downloadMs: 64, startMs: 170, suggestion: 'use AVIF' },
  { url: '/_next/image?src=p_4521-2.jpg', kind: 'img', sizeKb: 88, ttfbMs: 22, downloadMs: 62, startMs: 190 },
  { url: '/_next/image?src=p_4521-3.jpg', kind: 'img', sizeKb: 86, ttfbMs: 22, downloadMs: 60, startMs: 210 },
  { url: '/_next/image?src=p_4521-4.jpg', kind: 'img', sizeKb: 84, ttfbMs: 22, downloadMs: 58, startMs: 230 },
  { url: 'https://reviews.example.com/widget.js', kind: 'js', sizeKb: 64, ttfbMs: 88, downloadMs: 56, startMs: 240, origin: '3p', suggestion: 'defer' },
  { url: 'https://reviews.example.com/data.json', kind: 'json', sizeKb: 14, ttfbMs: 92, downloadMs: 18, startMs: 360, origin: '3p' },
  { url: '/_next/static/chunks/icons-lucide.js', kind: 'js', sizeKb: 64, ttfbMs: 6, downloadMs: 8, startMs: 96, cached: true },
  { url: '/icons/star.svg', kind: 'svg', sizeKb: 1, ttfbMs: 8, downloadMs: 2, startMs: 100 },
  { url: '/icons/cart.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 100 },
  { url: '/api/me', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 132 },
  { url: '/api/products/p_4521/stock', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 6, startMs: 230 },
  { url: '/_next/static/chunks/sonner.js', kind: 'js', sizeKb: 12, ttfbMs: 4, downloadMs: 2, startMs: 96, cached: true },
  { url: '/_next/static/chunks/floating-ui.js', kind: 'js', sizeKb: 24, ttfbMs: 4, downloadMs: 2, startMs: 96, cached: true },
  { url: 'https://cdn.example.com/sizing-guide.png', kind: 'img', sizeKb: 80, ttfbMs: 64, downloadMs: 60, startMs: 360, origin: 'cdn' },
  { url: '/_next/image?src=p_4521-5.jpg', kind: 'img', sizeKb: 78, ttfbMs: 22, downloadMs: 56, startMs: 300 },
  { url: '/_next/image?src=p_4521-6.jpg', kind: 'img', sizeKb: 76, ttfbMs: 22, downloadMs: 54, startMs: 320 },
  { url: '/api/products/p_4521/qa', kind: 'json', sizeKb: 8, ttfbMs: 42, downloadMs: 12, startMs: 280 },
  { url: '/icons/share.svg', kind: 'svg', sizeKb: 1, ttfbMs: 8, downloadMs: 2, startMs: 200 },
  { url: '/manifest.json', kind: 'json', sizeKb: 1, ttfbMs: 4, downloadMs: 2, startMs: 90, cached: true },
  { url: '/favicon.ico', kind: 'img', sizeKb: 4, ttfbMs: 4, downloadMs: 2, startMs: 60, cached: true },
  { url: '/api/cart-count', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 132 },
  { url: '/_next/image?src=brand-logo.png', kind: 'img', sizeKb: 12, ttfbMs: 22, downloadMs: 12, startMs: 140 },
  { url: '/_next/image?src=cert-1.png', kind: 'img', sizeKb: 14, ttfbMs: 22, downloadMs: 14, startMs: 360 },
  { url: '/_next/image?src=cert-2.png', kind: 'img', sizeKb: 14, ttfbMs: 22, downloadMs: 14, startMs: 380 },
]);

const dashboard: Asset[] = build('db', [
  { url: '/dashboard', kind: 'html', sizeKb: 30, ttfbMs: 84, downloadMs: 22, startMs: 0, blocking: true, priority: 'high' },
  { url: '/_next/static/css/app.css', kind: 'css', sizeKb: 24, ttfbMs: 6, downloadMs: 4, startMs: 108, cached: true, blocking: true },
  { url: '/_next/static/chunks/main.js', kind: 'js', sizeKb: 88, ttfbMs: 6, downloadMs: 4, startMs: 108, cached: true, blocking: true },
  { url: '/_next/static/chunks/page-dashboard.js', kind: 'js', sizeKb: 92, ttfbMs: 18, downloadMs: 56, startMs: 112, priority: 'high' },
  { url: '/_next/static/chunks/charts.js', kind: 'js', sizeKb: 184, ttfbMs: 22, downloadMs: 92, startMs: 116, priority: 'high', suggestion: 'defer' },
  { url: '/api/me', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 134 },
  { url: '/api/dashboard/summary', kind: 'json', sizeKb: 22, ttfbMs: 88, downloadMs: 32, startMs: 134, priority: 'high' },
  { url: '/api/dashboard/series-1', kind: 'json', sizeKb: 64, ttfbMs: 92, downloadMs: 56, startMs: 150 },
  { url: '/api/dashboard/series-2', kind: 'json', sizeKb: 58, ttfbMs: 92, downloadMs: 52, startMs: 170 },
  { url: '/api/dashboard/series-3', kind: 'json', sizeKb: 54, ttfbMs: 92, downloadMs: 50, startMs: 190 },
  { url: '/_next/static/chunks/icons-lucide.js', kind: 'js', sizeKb: 64, ttfbMs: 6, downloadMs: 8, startMs: 110, cached: true },
  { url: '/_next/static/chunks/sonner.js', kind: 'js', sizeKb: 12, ttfbMs: 4, downloadMs: 2, startMs: 110, cached: true },
  { url: '/fonts/inter-var.woff2', kind: 'font', sizeKb: 64, ttfbMs: 4, downloadMs: 2, startMs: 108, cached: true, priority: 'high' },
  { url: 'https://reports.example.com/embed.js', kind: 'js', sizeKb: 88, ttfbMs: 92, downloadMs: 64, startMs: 220, origin: '3p', suggestion: 'defer' },
  { url: '/api/dashboard/users', kind: 'json', sizeKb: 22, ttfbMs: 88, downloadMs: 18, startMs: 240 },
  { url: '/api/dashboard/sessions', kind: 'json', sizeKb: 18, ttfbMs: 88, downloadMs: 18, startMs: 260 },
  { url: '/icons/down.svg', kind: 'svg', sizeKb: 1, ttfbMs: 6, downloadMs: 1, startMs: 132 },
  { url: '/icons/up.svg', kind: 'svg', sizeKb: 1, ttfbMs: 6, downloadMs: 1, startMs: 132 },
  { url: '/icons/info.svg', kind: 'svg', sizeKb: 1, ttfbMs: 6, downloadMs: 1, startMs: 132 },
  { url: '/_next/image?src=avatar-1.jpg', kind: 'img', sizeKb: 8, ttfbMs: 22, downloadMs: 8, startMs: 280 },
  { url: '/_next/image?src=avatar-2.jpg', kind: 'img', sizeKb: 8, ttfbMs: 22, downloadMs: 8, startMs: 280 },
  { url: '/_next/image?src=avatar-3.jpg', kind: 'img', sizeKb: 8, ttfbMs: 22, downloadMs: 8, startMs: 300 },
  { url: '/api/dashboard/notifications', kind: 'json', sizeKb: 6, ttfbMs: 32, downloadMs: 8, startMs: 320 },
  { url: '/api/dashboard/widgets', kind: 'json', sizeKb: 12, ttfbMs: 32, downloadMs: 12, startMs: 340 },
  { url: '/api/dashboard/billing', kind: 'json', sizeKb: 8, ttfbMs: 32, downloadMs: 8, startMs: 360 },
  { url: '/manifest.json', kind: 'json', sizeKb: 1, ttfbMs: 4, downloadMs: 2, startMs: 110, cached: true },
  { url: '/favicon.ico', kind: 'img', sizeKb: 4, ttfbMs: 4, downloadMs: 2, startMs: 60, cached: true },
  { url: '/api/dashboard/heartbeat', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 540 },
  { url: '/api/dashboard/tasks', kind: 'json', sizeKb: 14, ttfbMs: 32, downloadMs: 18, startMs: 380 },
  { url: '/_next/image?src=chart-bg.png', kind: 'img', sizeKb: 18, ttfbMs: 22, downloadMs: 18, startMs: 400 },
  { url: 'https://cdn.example.com/embedded-chart-skin.css', kind: 'css', sizeKb: 8, ttfbMs: 64, downloadMs: 8, startMs: 280, origin: 'cdn' },
]);

function genericRoute(prefix: string, label: string): Asset[] {
  return build(prefix, [
    { url: label, kind: 'html', sizeKb: 26, ttfbMs: 56, downloadMs: 18, startMs: 0, blocking: true, priority: 'high' },
    { url: '/_next/static/css/app.css', kind: 'css', sizeKb: 24, ttfbMs: 6, downloadMs: 4, startMs: 80, cached: true, blocking: true },
    { url: '/_next/static/chunks/main.js', kind: 'js', sizeKb: 88, ttfbMs: 6, downloadMs: 4, startMs: 80, cached: true, blocking: true },
    { url: `/_next/static/chunks/page${prefix}.js`, kind: 'js', sizeKb: 48, ttfbMs: 16, downloadMs: 22, startMs: 84, priority: 'high' },
    { url: '/fonts/inter-var.woff2', kind: 'font', sizeKb: 64, ttfbMs: 4, downloadMs: 2, startMs: 80, cached: true, priority: 'high' },
    { url: '/_next/image?src=hero.jpg', kind: 'img', sizeKb: 132, ttfbMs: 22, downloadMs: 78, startMs: 110, priority: 'high', suggestion: 'use AVIF' },
    { url: '/api/me', kind: 'json', sizeKb: 1, ttfbMs: 22, downloadMs: 4, startMs: 132 },
    { url: '/_next/image?src=fold-1.jpg', kind: 'img', sizeKb: 80, ttfbMs: 22, downloadMs: 56, startMs: 200 },
    { url: '/_next/image?src=fold-2.jpg', kind: 'img', sizeKb: 78, ttfbMs: 22, downloadMs: 54, startMs: 200 },
    { url: '/_next/image?src=fold-3.jpg', kind: 'img', sizeKb: 76, ttfbMs: 22, downloadMs: 52, startMs: 220 },
    { url: '/icons/menu.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 88 },
    { url: '/icons/cart.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 88 },
    { url: '/icons/user.svg', kind: 'svg', sizeKb: 2, ttfbMs: 8, downloadMs: 2, startMs: 88 },
    { url: '/api/banner', kind: 'json', sizeKb: 2, ttfbMs: 22, downloadMs: 4, startMs: 130, cached: true },
    { url: '/api/footer', kind: 'json', sizeKb: 4, ttfbMs: 22, downloadMs: 6, startMs: 130, cached: true },
    { url: 'https://gtm.example.com/gtag/js', kind: 'js', sizeKb: 88, ttfbMs: 80, downloadMs: 64, startMs: 130, origin: '3p', suggestion: 'defer' },
    { url: '/_next/static/chunks/icons-lucide.js', kind: 'js', sizeKb: 64, ttfbMs: 6, downloadMs: 8, startMs: 84, cached: true },
    { url: '/_next/static/chunks/sonner.js', kind: 'js', sizeKb: 12, ttfbMs: 4, downloadMs: 2, startMs: 84, cached: true },
    { url: '/_next/static/chunks/floating-ui.js', kind: 'js', sizeKb: 24, ttfbMs: 4, downloadMs: 2, startMs: 84, cached: true },
    { url: '/manifest.json', kind: 'json', sizeKb: 1, ttfbMs: 4, downloadMs: 2, startMs: 80, cached: true },
    { url: '/favicon.ico', kind: 'img', sizeKb: 4, ttfbMs: 4, downloadMs: 2, startMs: 60, cached: true },
    { url: '/_next/image?src=secondary-1.jpg', kind: 'img', sizeKb: 64, ttfbMs: 22, downloadMs: 48, startMs: 280 },
    { url: '/_next/image?src=secondary-2.jpg', kind: 'img', sizeKb: 62, ttfbMs: 22, downloadMs: 46, startMs: 300 },
    { url: '/_next/image?src=secondary-3.jpg', kind: 'img', sizeKb: 60, ttfbMs: 22, downloadMs: 44, startMs: 320 },
    { url: '/api/recommendations', kind: 'json', sizeKb: 12, ttfbMs: 32, downloadMs: 16, startMs: 220 },
    { url: '/api/personalize', kind: 'json', sizeKb: 8, ttfbMs: 32, downloadMs: 12, startMs: 240 },
    { url: '/icons/heart.svg', kind: 'svg', sizeKb: 1, ttfbMs: 8, downloadMs: 1, startMs: 200 },
    { url: '/icons/share.svg', kind: 'svg', sizeKb: 1, ttfbMs: 8, downloadMs: 1, startMs: 200 },
    { url: '/icons/bookmark.svg', kind: 'svg', sizeKb: 1, ttfbMs: 8, downloadMs: 1, startMs: 200 },
    { url: '/sw.js', kind: 'js', sizeKb: 8, ttfbMs: 12, downloadMs: 4, startMs: 380 },
    { url: 'https://plausible.io/api/event', kind: 'json', sizeKb: 0.2, ttfbMs: 90, downloadMs: 8, startMs: 380, origin: '3p' },
  ]);
}

export const ROUTE_DATA: ReadonlyArray<AssetRoute> = [
  { routeId: '/', fcpMs: 320, lcpMs: 540, ttiMs: 760, assets: home },
  {
    routeId: '/products/[id]',
    fcpMs: 360,
    lcpMs: 620,
    ttiMs: 880,
    assets: productDetail,
  },
  { routeId: '/dashboard', fcpMs: 410, lcpMs: 740, ttiMs: 1_180, assets: dashboard },
  {
    routeId: '/checkout',
    fcpMs: 290,
    lcpMs: 480,
    ttiMs: 720,
    assets: genericRoute('co', '/checkout'),
  },
  {
    routeId: '/blog/[slug]',
    fcpMs: 240,
    lcpMs: 420,
    ttiMs: 660,
    assets: genericRoute('bl', '/blog/[slug]'),
  },
  {
    routeId: '/login',
    fcpMs: 220,
    lcpMs: 380,
    ttiMs: 560,
    assets: genericRoute('lg', '/login'),
  },
];

export function totalsFor(route: AssetRoute): {
  totalKb: number;
  blocking: number;
  thirdParty: number;
} {
  let totalKb = 0;
  let blocking = 0;
  let thirdParty = 0;
  for (const a of route.assets) {
    totalKb += a.sizeKb;
    if (a.blocking) blocking += 1;
    if (a.origin === '3p') thirdParty += 1;
  }
  return { totalKb, blocking, thirdParty };
}

export function lcpAttribution(route: AssetRoute): Asset | undefined {
  return [...route.assets]
    .filter((a) => a.kind === 'img' && a.priority === 'high')
    .sort((a, b) => b.sizeKb - a.sizeKb)[0];
}
