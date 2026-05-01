export interface CoverageEntry {
  routeId: string;
  unit: number;
  integration: number;
  e2e: number;
  critical: boolean;
}

export const MOCK_COVERAGE: ReadonlyArray<CoverageEntry> = [
  { routeId: 'route_home', unit: 84, integration: 60, e2e: 30, critical: false },
  { routeId: 'route_products', unit: 72, integration: 40, e2e: 0, critical: false },
  { routeId: 'route_products_id', unit: 40, integration: 20, e2e: 0, critical: false },
  { routeId: 'route_cart', unit: 30, integration: 10, e2e: 0, critical: true },
  { routeId: 'route_checkout', unit: 0, integration: 0, e2e: 0, critical: true },
  { routeId: 'route_account', unit: 50, integration: 30, e2e: 0, critical: false },
  { routeId: 'route_login', unit: 88, integration: 70, e2e: 50, critical: false },
  { routeId: 'route_register', unit: 70, integration: 40, e2e: 30, critical: false },
  { routeId: 'route_dashboard', unit: 70, integration: 40, e2e: 20, critical: false },
  { routeId: 'route_admin_users', unit: 30, integration: 0, e2e: 0, critical: true },
  { routeId: 'route_admin_users_delete', unit: 0, integration: 0, e2e: 0, critical: true },
  { routeId: 'route_admin_products', unit: 40, integration: 10, e2e: 0, critical: true },
  { routeId: 'route_blog', unit: 60, integration: 30, e2e: 0, critical: false },
  { routeId: 'route_blog_slug', unit: 50, integration: 30, e2e: 0, critical: false },
  { routeId: 'route_modal_product', unit: 0, integration: 0, e2e: 0, critical: false },
  { routeId: 'route_api_products', unit: 80, integration: 50, e2e: 0, critical: false },
  { routeId: 'route_api_webhook_stripe', unit: 0, integration: 0, e2e: 0, critical: true },
];

export function coverageTone(pct: number): string {
  if (pct === 0) return 'bg-sev-err-soft text-sev-err';
  if (pct < 50) return 'bg-sev-warn-soft text-sev-warn';
  if (pct < 80) return 'text-ink-2';
  return 'bg-sem-static-soft text-sem-static';
}

export function aggregate(coverage: ReadonlyArray<CoverageEntry>) {
  if (coverage.length === 0) return { unit: 0, integration: 0, e2e: 0 };
  const sum = coverage.reduce(
    (acc, c) => ({
      unit: acc.unit + c.unit,
      integration: acc.integration + c.integration,
      e2e: acc.e2e + c.e2e,
    }),
    { unit: 0, integration: 0, e2e: 0 },
  );
  const n = coverage.length;
  return {
    unit: Math.round(sum.unit / n),
    integration: Math.round(sum.integration / n),
    e2e: Math.round(sum.e2e / n),
  };
}
