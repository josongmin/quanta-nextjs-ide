import type { Severity } from '@shared/types';

export type LogSource = 'next-server' | 'next-router' | 'cache' | 'auth' | 'db' | 'build' | 'monaco';

export interface LogEntry {
  id: string;
  ts: number;          // epoch ms
  source: LogSource;
  level: Extract<Severity, 'info' | 'warn' | 'err'>;
  message: string;
  routeId?: string;
  requestId?: string;
  latencyMs?: number;
  cookie?: string;
  header?: string;
  payload?: string;
}

const NOW = Date.now();

const entry = (
  offsetMs: number,
  partial: Omit<LogEntry, 'id' | 'ts'>,
  i: number,
): LogEntry => ({
  id: `log_${i.toString().padStart(3, '0')}`,
  ts: NOW - offsetMs,
  ...partial,
});

export const mockRuntimeLogs: LogEntry[] = [
  entry(820, {
    source: 'next-server',
    level: 'info',
    message: "GET /products/[id] 200 · cache MISS",
    routeId: 'route_products_id',
    requestId: 'req_a91f02',
    latencyMs: 84,
    cookie: 'session=abc123; theme=light',
    header: 'x-forwarded-for: 203.0.113.5',
    payload: '{ "params": { "id": "p_001" } }',
  }, 1),
  entry(1520, {
    source: 'cache',
    level: 'info',
    message: "revalidateTag('products') · invalidated 7 entries",
    requestId: 'req_a91f02',
    latencyMs: 3,
  }, 2),
  entry(2210, {
    source: 'auth',
    level: 'info',
    message: 'requireUser passed · uid=usr_0042',
    routeId: 'route_dashboard',
    requestId: 'req_b00d11',
    latencyMs: 9,
    cookie: '__Secure-next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  }, 3),
  entry(3010, {
    source: 'db',
    level: 'info',
    message: 'prisma.product.findUnique() · 4ms',
    routeId: 'route_products_id',
    requestId: 'req_a91f02',
    latencyMs: 4,
    payload: 'where: { id: "p_001" }',
  }, 4),
  entry(3850, {
    source: 'next-router',
    level: 'info',
    message: 'hard-nav /checkout · prefetch HIT',
    routeId: 'route_checkout',
    requestId: 'req_c33a01',
    latencyMs: 12,
  }, 5),
  entry(4720, {
    source: 'next-server',
    level: 'info',
    message: 'action createOrder · 2 mutations · 32ms',
    routeId: 'route_checkout',
    requestId: 'req_c33a01',
    latencyMs: 32,
    payload: '{ "items": 3, "totalCents": 8400 }',
  }, 6),
  entry(5590, {
    source: 'build',
    level: 'info',
    message: 'route /admin/products · ISR regenerated',
    routeId: 'route_admin_products',
    latencyMs: 612,
  }, 7),
  entry(6480, {
    source: 'next-server',
    level: 'warn',
    message: 'streaming chunk delayed 220ms (Reviews Suspense)',
    routeId: 'route_products_id',
    requestId: 'req_a91f02',
    latencyMs: 220,
  }, 8),
  entry(7340, {
    source: 'next-server',
    level: 'err',
    message: '/api/webhooks/stripe · signature missing',
    routeId: 'route_api_webhook_stripe',
    requestId: 'req_d77e12',
    latencyMs: 8,
    header: "stripe-signature: <missing>",
  }, 9),
  entry(8120, {
    source: 'next-server',
    level: 'info',
    message: 'GET / 200 · cache HIT (CDN)',
    routeId: 'route_home',
    requestId: 'req_e9001a',
    latencyMs: 11,
  }, 10),
  entry(9020, {
    source: 'next-router',
    level: 'info',
    message: 'soft-nav /products · RSC',
    routeId: 'route_products',
    requestId: 'req_e9001a',
    latencyMs: 42,
  }, 11),
  entry(10110, {
    source: 'db',
    level: 'warn',
    message: 'prisma.order.findMany() · N+1 detected (12 queries)',
    routeId: 'route_admin_users',
    requestId: 'req_f12abc',
    latencyMs: 184,
  }, 12),
  entry(11050, {
    source: 'cache',
    level: 'info',
    message: "unstable_cache hit 'product-recommendations' · ttl=58s",
    routeId: 'route_products_id',
    requestId: 'req_a91f02',
    latencyMs: 1,
  }, 13),
  entry(12320, {
    source: 'auth',
    level: 'err',
    message: 'requireRole(admin) failed · redirected /login',
    routeId: 'route_admin_users',
    requestId: 'req_g4501f',
    latencyMs: 6,
  }, 14),
  entry(13190, {
    source: 'next-server',
    level: 'info',
    message: 'GET /dashboard 200 · partial prerender',
    routeId: 'route_dashboard',
    requestId: 'req_h7711a',
    latencyMs: 71,
  }, 15),
  entry(14080, {
    source: 'next-server',
    level: 'warn',
    message: 'cookies() called outside request scope (will throw in prod)',
    routeId: 'route_dashboard',
    requestId: 'req_h7711a',
    latencyMs: 2,
  }, 16),
  entry(15010, {
    source: 'db',
    level: 'info',
    message: 'prisma.user.findFirst() · 1ms',
    routeId: 'route_dashboard',
    requestId: 'req_h7711a',
    latencyMs: 1,
  }, 17),
  entry(16100, {
    source: 'next-server',
    level: 'info',
    message: 'GET /blog/[slug] 200 · SSG',
    routeId: 'route_blog_slug',
    requestId: 'req_i9012a',
    latencyMs: 6,
  }, 18),
  entry(17220, {
    source: 'cache',
    level: 'warn',
    message: "fetch('/api/products') no-store · forces dynamic",
    routeId: 'route_products',
    requestId: 'req_j1023f',
    latencyMs: 92,
  }, 19),
  entry(18280, {
    source: 'monaco',
    level: 'info',
    message: 'editor opened app/(shop)/products/page.tsx',
    latencyMs: 18,
  }, 20),
  entry(19450, {
    source: 'next-router',
    level: 'info',
    message: 'prefetch /checkout · RSC payload 18kb',
    routeId: 'route_checkout',
    requestId: 'req_k4502a',
    latencyMs: 33,
  }, 21),
  entry(20560, {
    source: 'next-server',
    level: 'err',
    message: 'unhandled error in app/blog/[slug]/page.tsx · TypeError: undefined is not a function',
    routeId: 'route_blog_slug',
    requestId: 'req_l8801b',
    latencyMs: 27,
    payload: 'stack: at Page (app/blog/[slug]/page.tsx:42:12)',
  }, 22),
  entry(21410, {
    source: 'auth',
    level: 'info',
    message: 'session refreshed · ttl extended +30m',
    requestId: 'req_l8801b',
    latencyMs: 14,
  }, 23),
  entry(22550, {
    source: 'cache',
    level: 'info',
    message: "tag 'orders' touched · 0 entries to invalidate",
    latencyMs: 1,
  }, 24),
  entry(23700, {
    source: 'next-server',
    level: 'info',
    message: 'POST /products/[id] (action addToCart) 200',
    routeId: 'route_products_id',
    requestId: 'req_m9912c',
    latencyMs: 56,
    payload: 'qty=1; variant="small"',
  }, 25),
  entry(24890, {
    source: 'build',
    level: 'warn',
    message: 'middleware.ts · size 41.2kb (limit 50kb)',
    latencyMs: 0,
  }, 26),
  entry(26010, {
    source: 'next-server',
    level: 'info',
    message: 'GET /account 200 · ssr',
    routeId: 'route_account',
    requestId: 'req_n1101e',
    latencyMs: 64,
  }, 27),
  entry(27220, {
    source: 'db',
    level: 'info',
    message: 'prisma.session.findMany() · 3ms',
    routeId: 'route_account',
    requestId: 'req_n1101e',
    latencyMs: 3,
  }, 28),
  entry(28330, {
    source: 'next-router',
    level: 'warn',
    message: 'Link prefetch throttled (data saver mode)',
    latencyMs: 1,
  }, 29),
  entry(29480, {
    source: 'next-server',
    level: 'info',
    message: 'GET /login 200 · static',
    routeId: 'route_login',
    requestId: 'req_o2204f',
    latencyMs: 5,
  }, 30),
  entry(30640, {
    source: 'next-server',
    level: 'err',
    message: 'image optimizer failed · upstream 502',
    routeId: 'route_products',
    requestId: 'req_p3309a',
    latencyMs: 412,
    header: 'x-vercel-image-cache: BYPASS',
  }, 31),
  entry(31790, {
    source: 'cache',
    level: 'info',
    message: "revalidatePath('/products') · segments rebuilt",
    latencyMs: 188,
  }, 32),
];

// ─────────────────────────────────────────────────────────────────
// Synth templates for Live mode
// ─────────────────────────────────────────────────────────────────

interface SynthTemplate {
  source: LogSource;
  level: 'info' | 'warn' | 'err';
  message: string;
  routeId?: string;
  latencyRange: [number, number];
}

export const synthTemplates: ReadonlyArray<SynthTemplate> = [
  { source: 'next-server', level: 'info', message: 'GET /products 200 · cache HIT', routeId: 'route_products', latencyRange: [8, 30] },
  { source: 'next-server', level: 'info', message: 'GET / 200 · cache HIT (CDN)', routeId: 'route_home', latencyRange: [4, 14] },
  { source: 'db', level: 'info', message: 'prisma.product.findMany() · ok', routeId: 'route_products', latencyRange: [3, 18] },
  { source: 'cache', level: 'info', message: "tag 'products' touched", latencyRange: [1, 4] },
  { source: 'next-router', level: 'info', message: 'soft-nav /dashboard · RSC', routeId: 'route_dashboard', latencyRange: [22, 70] },
  { source: 'auth', level: 'info', message: 'requireUser passed', routeId: 'route_dashboard', latencyRange: [3, 12] },
  { source: 'next-server', level: 'warn', message: 'streaming chunk delayed (Reviews)', routeId: 'route_products_id', latencyRange: [180, 320] },
  { source: 'db', level: 'warn', message: 'slow query · SELECT FROM orders', routeId: 'route_admin_users', latencyRange: [120, 260] },
  { source: 'next-server', level: 'err', message: '/api/webhooks/stripe · signature missing', routeId: 'route_api_webhook_stripe', latencyRange: [4, 11] },
  { source: 'build', level: 'info', message: 'route /admin/products · ISR regenerated', routeId: 'route_admin_products', latencyRange: [380, 820] },
];

let __synthCounter = 1000;
export function synthEntry(): LogEntry {
  const tpl = synthTemplates[Math.floor(Math.random() * synthTemplates.length)]!;
  const [lo, hi] = tpl.latencyRange;
  const latencyMs = Math.round(lo + Math.random() * (hi - lo));
  __synthCounter += 1;
  return {
    id: `log_live_${__synthCounter}`,
    ts: Date.now(),
    source: tpl.source,
    level: tpl.level,
    message: tpl.message,
    routeId: tpl.routeId,
    requestId: `req_${Math.random().toString(36).slice(2, 8)}`,
    latencyMs,
  };
}

// ─────────────────────────────────────────────────────────────────
// Hydration trees
// ─────────────────────────────────────────────────────────────────

import type { HydrationReport } from '@shared/types';

export const mockHydrationReports: ReadonlyArray<HydrationReport> = [
  {
    routeId: 'route_home',
    ms: 124,
    mismatches: 0,
    root: {
      id: 'h_home_root',
      tag: 'html',
      kind: 'server',
      serverHtml: '<html lang="en">',
      clientHtml: '<html lang="en">',
      match: 'ok',
      children: [
        {
          id: 'h_home_body',
          tag: 'body',
          kind: 'server',
          serverHtml: '<body class="font-sans">',
          clientHtml: '<body class="font-sans">',
          match: 'ok',
          children: [
            {
              id: 'h_home_layout',
              tag: 'RootLayout',
              kind: 'server',
              serverHtml: '<div id="layout-root">',
              clientHtml: '<div id="layout-root">',
              match: 'ok',
              children: [
                {
                  id: 'h_home_hero',
                  tag: 'Hero',
                  kind: 'server',
                  serverHtml: '<section class="hero"><h1>Welcome</h1></section>',
                  clientHtml: '<section class="hero"><h1>Welcome</h1></section>',
                  match: 'ok',
                  children: [],
                },
                {
                  id: 'h_home_cta',
                  tag: 'CTAButton',
                  kind: 'client',
                  serverHtml: '<button class="btn">Sign up</button>',
                  clientHtml: '<button class="btn">Sign up</button>',
                  match: 'ok',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    routeId: 'route_dashboard',
    ms: 318,
    mismatches: 2,
    root: {
      id: 'h_dash_root',
      tag: 'html',
      kind: 'server',
      serverHtml: '<html lang="en">',
      clientHtml: '<html lang="en">',
      match: 'ok',
      children: [
        {
          id: 'h_dash_body',
          tag: 'body',
          kind: 'server',
          serverHtml: '<body class="font-sans">',
          clientHtml: '<body class="font-sans">',
          match: 'ok',
          children: [
            {
              id: 'h_dash_shell',
              tag: 'DashboardShell',
              kind: 'server',
              serverHtml: '<div class="shell">',
              clientHtml: '<div class="shell">',
              match: 'ok',
              children: [
                {
                  id: 'h_dash_nav',
                  tag: 'SideNav',
                  kind: 'client',
                  serverHtml: '<nav class="side"><a href="/dashboard">Home</a></nav>',
                  clientHtml: '<nav class="side"><a href="/dashboard">Home</a></nav>',
                  match: 'ok',
                  children: [],
                },
                {
                  id: 'h_dash_kpis',
                  tag: 'KpiGrid',
                  kind: 'server',
                  serverHtml: '<div class="grid"><span>$1,200.00</span></div>',
                  clientHtml: '<div class="grid"><span>$1,200</span></div>',
                  match: 'mismatch',
                  reason: "Intl.NumberFormat differs between server (en-US fixed) and client (locale en-GB)",
                  children: [],
                },
                {
                  id: 'h_dash_chart',
                  tag: 'RevenueChart',
                  kind: 'client',
                  serverHtml: '<div class="chart-skeleton" />',
                  clientHtml: '<canvas class="chart" width="640" height="240" />',
                  match: 'missing-server',
                  reason: 'Client-only canvas component (lazy loaded)',
                  children: [],
                },
                {
                  id: 'h_dash_footer',
                  tag: 'Footer',
                  kind: 'server',
                  serverHtml: '<footer><time>2026-04-30T11:00:00.123Z</time></footer>',
                  clientHtml: '<footer><time>2026-04-30T11:00:00.456Z</time></footer>',
                  match: 'mismatch',
                  reason: 'Date.now() in render — non-deterministic between SSR and hydrate',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    routeId: 'route_products_id',
    ms: 217,
    mismatches: 1,
    root: {
      id: 'h_prod_root',
      tag: 'html',
      kind: 'server',
      serverHtml: '<html lang="en">',
      clientHtml: '<html lang="en">',
      match: 'ok',
      children: [
        {
          id: 'h_prod_body',
          tag: 'body',
          kind: 'server',
          serverHtml: '<body class="font-sans">',
          clientHtml: '<body class="font-sans">',
          match: 'ok',
          children: [
            {
              id: 'h_prod_detail',
              tag: 'ProductDetail',
              kind: 'server',
              serverHtml: '<article class="product">',
              clientHtml: '<article class="product">',
              match: 'ok',
              children: [
                {
                  id: 'h_prod_gallery',
                  tag: 'Gallery',
                  kind: 'client',
                  serverHtml: '<img src="/p1.jpg" loading="lazy" />',
                  clientHtml: '<img src="/p1.jpg" />',
                  match: 'mismatch',
                  reason: "loading='lazy' attr differs (client framework strips for above-the-fold)",
                  children: [],
                },
                {
                  id: 'h_prod_cta',
                  tag: 'AddToCart',
                  kind: 'client',
                  serverHtml: '<button>Add to cart</button>',
                  clientHtml: '<button>Add to cart</button>',
                  match: 'ok',
                  children: [],
                },
                {
                  id: 'h_prod_reviews',
                  tag: 'Reviews',
                  kind: 'server',
                  serverHtml: '<section class="reviews">',
                  clientHtml: '<section class="reviews">',
                  match: 'ok',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Streaming traces
// ─────────────────────────────────────────────────────────────────

import type { StreamingTrace } from '@shared/types';

export const mockStreamingTraces: ReadonlyArray<StreamingTrace> = [
  {
    routeId: 'route_home',
    htmlMs: 240,
    chunks: [
      { id: '$L1', componentName: 'Page', startMs: 0, endMs: 80, bytes: 4200 },
      { id: '$L2', componentName: 'Hero', startMs: 40, endMs: 140, bytes: 2400, parentId: '$L1' },
      { id: '$L3', componentName: 'CTAButton', startMs: 80, endMs: 180, bytes: 1200, parentId: '$L1' },
      { id: '$L4', componentName: 'Suspense:Footer', startMs: 100, endMs: 240, bytes: 1800, parentId: '$L1', pendingFallback: '<FooterSkeleton />' },
    ],
  },
  {
    routeId: 'route_products_id',
    htmlMs: 1280,
    chunks: [
      { id: '$L1', componentName: 'Page', startMs: 0, endMs: 90, bytes: 5200 },
      { id: '$L2', componentName: 'ProductDetail', startMs: 60, endMs: 220, bytes: 6400, parentId: '$L1' },
      { id: '$L3', componentName: 'Gallery', startMs: 110, endMs: 320, bytes: 3200, parentId: '$L2' },
      { id: '$L4', componentName: 'AddToCart', startMs: 110, endMs: 240, bytes: 1100, parentId: '$L2' },
      { id: '$L5', componentName: 'Suspense:Reviews', startMs: 200, endMs: 980, bytes: 8200, parentId: '$L2', pendingFallback: '<ReviewsSkeleton />' },
      { id: '$L6', componentName: 'Suspense:Recommended', startMs: 220, endMs: 1280, bytes: 5400, parentId: '$L1', pendingFallback: '<RecommendedSkeleton />' },
    ],
  },
  {
    routeId: 'route_dashboard',
    htmlMs: 2020,
    chunks: [
      { id: '$L1', componentName: 'Page', startMs: 0, endMs: 100, bytes: 4800 },
      { id: '$L2', componentName: 'DashboardShell', startMs: 60, endMs: 200, bytes: 3200, parentId: '$L1' },
      { id: '$L3', componentName: 'SideNav', startMs: 110, endMs: 260, bytes: 2200, parentId: '$L2' },
      { id: '$L4', componentName: 'KpiGrid', startMs: 200, endMs: 720, bytes: 4400, parentId: '$L2' },
      { id: '$L5', componentName: 'Suspense:RevenueChart', startMs: 260, endMs: 1840, bytes: 12800, parentId: '$L2', pendingFallback: '<ChartSkeleton />' },
      { id: '$L6', componentName: 'Suspense:RecentOrders', startMs: 280, endMs: 2020, bytes: 9600, parentId: '$L2', pendingFallback: '<TableSkeleton />' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// RSC components
// ─────────────────────────────────────────────────────────────────

import type { RscComponent } from '@shared/types';

export const mockRscComponents: ReadonlyArray<RscComponent> = [
  // /
  { id: 'rsc_home_page', name: 'Page', routeId: 'route_home', renderMs: 18, payloadBytes: 4200, awaitsCount: 0, blockedBy: [], cacheHit: true, serializationCost: 1100 },
  { id: 'rsc_home_hero', name: 'Hero', routeId: 'route_home', renderMs: 9, payloadBytes: 2400, awaitsCount: 0, blockedBy: ['rsc_home_page'], cacheHit: true, serializationCost: 700 },
  { id: 'rsc_home_features', name: 'Features', routeId: 'route_home', renderMs: 14, payloadBytes: 3200, awaitsCount: 1, blockedBy: ['rsc_home_page'], cacheHit: true, serializationCost: 880 },
  { id: 'rsc_home_footer', name: 'Footer', routeId: 'route_home', renderMs: 6, payloadBytes: 1800, awaitsCount: 0, blockedBy: ['rsc_home_page'], cacheHit: false, serializationCost: 540 },

  // /products/[id]
  { id: 'rsc_prod_page', name: 'Page', routeId: 'route_products_id', renderMs: 28, payloadBytes: 5200, awaitsCount: 1, blockedBy: [], cacheHit: false, serializationCost: 1400 },
  { id: 'rsc_prod_detail', name: 'ProductDetail', routeId: 'route_products_id', renderMs: 86, payloadBytes: 6400, awaitsCount: 2, blockedBy: ['rsc_prod_page'], cacheHit: false, serializationCost: 1880 },
  { id: 'rsc_prod_gallery', name: 'Gallery', routeId: 'route_products_id', renderMs: 32, payloadBytes: 3200, awaitsCount: 1, blockedBy: ['rsc_prod_detail'], cacheHit: true, serializationCost: 940 },
  { id: 'rsc_prod_reviews', name: 'Reviews', routeId: 'route_products_id', renderMs: 412, payloadBytes: 8200, awaitsCount: 3, blockedBy: ['rsc_prod_detail'], cacheHit: false, serializationCost: 2400 },
  { id: 'rsc_prod_recommended', name: 'Recommended', routeId: 'route_products_id', renderMs: 188, payloadBytes: 5400, awaitsCount: 2, blockedBy: ['rsc_prod_page'], cacheHit: false, serializationCost: 1620 },

  // /dashboard
  { id: 'rsc_dash_page', name: 'Page', routeId: 'route_dashboard', renderMs: 22, payloadBytes: 4800, awaitsCount: 1, blockedBy: [], cacheHit: false, serializationCost: 1300 },
  { id: 'rsc_dash_shell', name: 'DashboardShell', routeId: 'route_dashboard', renderMs: 41, payloadBytes: 3200, awaitsCount: 1, blockedBy: ['rsc_dash_page'], cacheHit: true, serializationCost: 980 },
  { id: 'rsc_dash_kpis', name: 'KpiGrid', routeId: 'route_dashboard', renderMs: 220, payloadBytes: 4400, awaitsCount: 4, blockedBy: ['rsc_dash_shell'], cacheHit: false, serializationCost: 1320 },
  { id: 'rsc_dash_chart', name: 'RevenueChart', routeId: 'route_dashboard', renderMs: 612, payloadBytes: 12800, awaitsCount: 2, blockedBy: ['rsc_dash_shell'], cacheHit: false, serializationCost: 3600 },
  { id: 'rsc_dash_orders', name: 'RecentOrders', routeId: 'route_dashboard', renderMs: 482, payloadBytes: 9600, awaitsCount: 3, blockedBy: ['rsc_dash_shell'], cacheHit: false, serializationCost: 2700 },
];
