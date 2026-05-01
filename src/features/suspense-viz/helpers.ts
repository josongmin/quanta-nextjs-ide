export type SuspenseStatus = 'pending' | 'resolved' | 'fallback' | 'error';

export interface SuspenseNode {
  id: string;
  tag: string;
  status: SuspenseStatus;
  routeId: string;
  awaitedFor?: string;
  ms: number;
  fallback?: string;
  suggestion?: string;
  children: SuspenseNode[];
}

export const trees: Record<string, SuspenseNode> = {
  route_dashboard: {
    id: 'n_dash_root',
    tag: 'DashboardLayout',
    status: 'resolved',
    routeId: 'route_dashboard',
    ms: 38,
    children: [
      {
        id: 'n_dash_header',
        tag: 'Header',
        status: 'resolved',
        routeId: 'route_dashboard',
        ms: 12,
        children: [],
      },
      {
        id: 'n_dash_main',
        tag: 'MainPanel',
        status: 'pending',
        routeId: 'route_dashboard',
        ms: 220,
        awaitedFor: 'getMetrics()',
        fallback: '<MainPanelSkeleton />',
        suggestion: 'Move await up to parent layout to overlap with header.',
        children: [
          {
            id: 'n_dash_kpis',
            tag: 'KpiGrid',
            status: 'resolved',
            routeId: 'route_dashboard',
            ms: 96,
            children: [
              {
                id: 'n_dash_kpi1',
                tag: 'Kpi[revenue]',
                status: 'resolved',
                routeId: 'route_dashboard',
                ms: 80,
                children: [],
              },
              {
                id: 'n_dash_kpi2',
                tag: 'Kpi[orders]',
                status: 'resolved',
                routeId: 'route_dashboard',
                ms: 84,
                children: [],
              },
              {
                id: 'n_dash_kpi3',
                tag: 'Kpi[users]',
                status: 'fallback',
                routeId: 'route_dashboard',
                ms: 90,
                fallback: '<KpiSkeleton />',
                suggestion: 'Add 2s timeout fallback — slow query suspected.',
                children: [],
              },
            ],
          },
          {
            id: 'n_dash_chart',
            tag: 'RevenueChart',
            status: 'pending',
            routeId: 'route_dashboard',
            ms: 320,
            awaitedFor: 'getDailySeries(window=30d)',
            fallback: '<ChartSkeleton width=720 />',
            suggestion: 'Add Suspense boundary around RevenueChart so KpiGrid is not blocked.',
            children: [
              {
                id: 'n_dash_chart_legend',
                tag: 'Legend',
                status: 'pending',
                routeId: 'route_dashboard',
                ms: 320,
                awaitedFor: 'parent: RevenueChart',
                children: [],
              },
            ],
          },
          {
            id: 'n_dash_alerts',
            tag: 'AlertsPanel',
            status: 'error',
            routeId: 'route_dashboard',
            ms: 142,
            awaitedFor: 'getAlerts()',
            fallback: '<AlertsErrorBoundary />',
            suggestion: 'Wrap in <ErrorBoundary> — suppressing error currently.',
            children: [],
          },
        ],
      },
      {
        id: 'n_dash_side',
        tag: 'Sidebar',
        status: 'resolved',
        routeId: 'route_dashboard',
        ms: 24,
        children: [
          {
            id: 'n_dash_recent',
            tag: 'RecentActivity',
            status: 'resolved',
            routeId: 'route_dashboard',
            ms: 60,
            children: [],
          },
        ],
      },
    ],
  },
  route_products_id: {
    id: 'n_pdp_root',
    tag: 'ProductPage',
    status: 'resolved',
    routeId: 'route_products_id',
    ms: 28,
    children: [
      {
        id: 'n_pdp_hero',
        tag: 'ProductHero',
        status: 'resolved',
        routeId: 'route_products_id',
        ms: 80,
        children: [],
      },
      {
        id: 'n_pdp_reviews',
        tag: 'Reviews',
        status: 'pending',
        routeId: 'route_products_id',
        ms: 180,
        awaitedFor: 'getReviews(productId)',
        fallback: '<ReviewSkeleton ×3 />',
        suggestion: 'Defer reviews below the fold — wrap in Suspense boundary.',
        children: [],
      },
      {
        id: 'n_pdp_recs',
        tag: 'Recommendations',
        status: 'fallback',
        routeId: 'route_products_id',
        ms: 240,
        awaitedFor: 'getRecs(productId)',
        fallback: '<Skeleton ×6 />',
        suggestion: 'OK — fallback intentionally rendered while user scrolls.',
        children: [],
      },
    ],
  },
  route_checkout: {
    id: 'n_co_root',
    tag: 'CheckoutPage',
    status: 'resolved',
    routeId: 'route_checkout',
    ms: 22,
    children: [
      {
        id: 'n_co_summary',
        tag: 'OrderSummary',
        status: 'resolved',
        routeId: 'route_checkout',
        ms: 110,
        children: [],
      },
      {
        id: 'n_co_payment',
        tag: 'PaymentForm',
        status: 'pending',
        routeId: 'route_checkout',
        ms: 280,
        awaitedFor: 'loadStripe()',
        fallback: '<PaymentSkeleton />',
        suggestion: 'Preload Stripe script in layout to overlap with summary.',
        children: [],
      },
    ],
  },
};

export const ROUTE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'route_dashboard', label: '/dashboard' },
  { value: 'route_products_id', label: '/products/[id]' },
  { value: 'route_checkout', label: '/checkout' },
];

export function flatten(node: SuspenseNode): SuspenseNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

export function statusTone(
  s: SuspenseStatus,
):
  | 'accent'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'warn'
  | 'err' {
  switch (s) {
    case 'pending':
      return 'warn';
    case 'resolved':
      return 'static';
    case 'fallback':
      return 'accent';
    case 'error':
      return 'err';
  }
}

export function maxMs(node: SuspenseNode): number {
  let m = node.ms;
  node.children.forEach((c) => {
    const cm = maxMs(c);
    if (cm > m) m = cm;
  });
  return m;
}

// Resolve status at scrub time t — pending/fallback/error become "resolved" once t >= ms.
export function statusAt(node: SuspenseNode, t: number): SuspenseStatus {
  if (t >= node.ms && node.status !== 'error') return 'resolved';
  return node.status;
}
