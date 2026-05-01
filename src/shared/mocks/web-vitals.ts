import type { RouteVitals, WebVitalsScore } from '@shared/types';

const STANDARD_BUDGET: WebVitalsScore = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
  fcp: 1800,
  inp: 200,
};

const TIGHT_BUDGET: WebVitalsScore = {
  lcp: 2000,
  fid: 75,
  cls: 0.08,
  ttfb: 500,
  fcp: 1500,
  inp: 150,
};

const score = (s: WebVitalsScore): WebVitalsScore => s;

export const mockRouteVitals: RouteVitals[] = [
  {
    routeId: 'route_home',
    estimated: score({ lcp: 1820, fid: 32, cls: 0.04, ttfb: 240, fcp: 980, inp: 90 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_products',
    estimated: score({ lcp: 2210, fid: 48, cls: 0.06, ttfb: 320, fcp: 1180, inp: 140 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_products_id',
    estimated: score({ lcp: 2640, fid: 72, cls: 0.09, ttfb: 410, fcp: 1320, inp: 180 }),
    budget: STANDARD_BUDGET,
    confidence: 'medium',
  },
  {
    routeId: 'route_cart',
    estimated: score({ lcp: 2020, fid: 64, cls: 0.05, ttfb: 380, fcp: 1240, inp: 220 }),
    budget: STANDARD_BUDGET,
    confidence: 'medium',
  },
  {
    routeId: 'route_checkout',
    // Checkout: heavy bundle + Stripe.js → high INP, modest LCP.
    estimated: score({ lcp: 2380, fid: 110, cls: 0.07, ttfb: 460, fcp: 1380, inp: 540 }),
    budget: STANDARD_BUDGET,
    confidence: 'medium',
  },
  {
    routeId: 'route_account',
    estimated: score({ lcp: 2160, fid: 52, cls: 0.06, ttfb: 380, fcp: 1140, inp: 170 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_login',
    estimated: score({ lcp: 1340, fid: 18, cls: 0.02, ttfb: 180, fcp: 720, inp: 70 }),
    budget: TIGHT_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_register',
    estimated: score({ lcp: 1280, fid: 18, cls: 0.02, ttfb: 180, fcp: 720, inp: 70 }),
    budget: TIGHT_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_dashboard',
    // Dashboard: recharts + lots of islands → high LCP and CLS.
    estimated: score({ lcp: 4280, fid: 96, cls: 0.28, ttfb: 540, fcp: 1840, inp: 320 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_admin_users',
    estimated: score({ lcp: 2860, fid: 84, cls: 0.12, ttfb: 510, fcp: 1480, inp: 240 }),
    budget: STANDARD_BUDGET,
    confidence: 'medium',
  },
  {
    routeId: 'route_admin_users_delete',
    estimated: score({ lcp: 2480, fid: 64, cls: 0.08, ttfb: 460, fcp: 1380, inp: 210 }),
    budget: STANDARD_BUDGET,
    confidence: 'medium',
  },
  {
    routeId: 'route_admin_products',
    // Heavy due to monaco-editor.
    estimated: score({ lcp: 3620, fid: 134, cls: 0.18, ttfb: 540, fcp: 1620, inp: 480 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_blog',
    estimated: score({ lcp: 1640, fid: 22, cls: 0.04, ttfb: 220, fcp: 840, inp: 80 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_blog_slug',
    estimated: score({ lcp: 1820, fid: 28, cls: 0.05, ttfb: 240, fcp: 960, inp: 90 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_modal_product',
    estimated: score({ lcp: 2140, fid: 58, cls: 0.08, ttfb: 320, fcp: 1080, inp: 160 }),
    budget: STANDARD_BUDGET,
    confidence: 'low',
  },
  {
    routeId: 'route_api_products',
    estimated: score({ lcp: 0, fid: 0, cls: 0, ttfb: 240, fcp: 0, inp: 0 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
  {
    routeId: 'route_api_webhook_stripe',
    estimated: score({ lcp: 0, fid: 0, cls: 0, ttfb: 320, fcp: 0, inp: 0 }),
    budget: STANDARD_BUDGET,
    confidence: 'high',
  },
];

// -----------------------------------------------------------------------------
// Threshold helpers (Web Vitals 2024 standards).
// -----------------------------------------------------------------------------

export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export function rateLcp(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 2500) return 'good';
  if (ms <= 4000) return 'needs-improvement';
  return 'poor';
}

export function rateInp(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 200) return 'good';
  if (ms <= 500) return 'needs-improvement';
  return 'poor';
}

export function rateCls(value: number): VitalRating {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

export function rateTtfb(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 800) return 'good';
  if (ms <= 1800) return 'needs-improvement';
  return 'poor';
}
