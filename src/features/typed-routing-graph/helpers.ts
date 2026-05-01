export interface RouteManifest {
  id: string;
  path: string;
  paramsType: string;
  searchParamsType?: string;
}

export interface LinkUsage {
  id: string;
  sourceFile: string;
  line: number;
  href: string;
  inferredType: string;
  expectedType: string;
  routeId: string;
  errorKind?: 'missing-param' | 'wrong-type' | 'deprecated' | 'unknown-route';
  errorMessage?: string;
}

export const ROUTES: ReadonlyArray<RouteManifest> = [
  { id: 'r-home', path: '/', paramsType: '{}' },
  { id: 'r-products', path: '/products', paramsType: '{}', searchParamsType: '{ q?: string; sort?: "asc" | "desc" }' },
  { id: 'r-product', path: '/products/[id]', paramsType: '{ id: string }' },
  { id: 'r-blog', path: '/blog/[slug]', paramsType: '{ slug: string }' },
  { id: 'r-blog-tag', path: '/blog/tag/[tag]', paramsType: '{ tag: string }' },
  { id: 'r-account', path: '/account', paramsType: '{}' },
  { id: 'r-orders', path: '/account/orders/[orderId]', paramsType: '{ orderId: string }' },
  { id: 'r-search', path: '/search', paramsType: '{}', searchParamsType: '{ q: string }' },
  { id: 'r-old-deals', path: '/deals', paramsType: '{}' },
];

export const LINKS: ReadonlyArray<LinkUsage> = [
  {
    id: 'l1',
    sourceFile: 'components/Nav.tsx',
    line: 22,
    href: '/',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-home',
  },
  {
    id: 'l2',
    sourceFile: 'components/Nav.tsx',
    line: 23,
    href: '/products',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-products',
  },
  {
    id: 'l3',
    sourceFile: 'components/Nav.tsx',
    line: 24,
    href: '/account',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-account',
  },
  {
    id: 'l4',
    sourceFile: 'app/products/page.tsx',
    line: 41,
    href: '/products/[id]',
    inferredType: '{ id: string }',
    expectedType: '{ id: string }',
    routeId: 'r-product',
  },
  {
    id: 'l5',
    sourceFile: 'app/products/page.tsx',
    line: 52,
    href: '/products/[id]',
    inferredType: '{}',
    expectedType: '{ id: string }',
    routeId: 'r-product',
    errorKind: 'missing-param',
    errorMessage: "Property 'id' is missing in type '{}' but required in type '{ id: string }'.",
  },
  {
    id: 'l6',
    sourceFile: 'app/blog/page.tsx',
    line: 18,
    href: '/blog/[slug]',
    inferredType: '{ slug: string }',
    expectedType: '{ slug: string }',
    routeId: 'r-blog',
  },
  {
    id: 'l7',
    sourceFile: 'app/blog/page.tsx',
    line: 30,
    href: '/blog/[slug]',
    inferredType: '{ slug: number }',
    expectedType: '{ slug: string }',
    routeId: 'r-blog',
    errorKind: 'wrong-type',
    errorMessage:
      "Type 'number' is not assignable to type 'string' for parameter 'slug'.",
  },
  {
    id: 'l8',
    sourceFile: 'app/blog/[slug]/page.tsx',
    line: 12,
    href: '/blog/tag/[tag]',
    inferredType: '{ tag: string }',
    expectedType: '{ tag: string }',
    routeId: 'r-blog-tag',
  },
  {
    id: 'l9',
    sourceFile: 'components/UserMenu.client.tsx',
    line: 7,
    href: '/account/orders/[orderId]',
    inferredType: '{ orderId: string }',
    expectedType: '{ orderId: string }',
    routeId: 'r-orders',
  },
  {
    id: 'l10',
    sourceFile: 'components/UserMenu.client.tsx',
    line: 14,
    href: '/account/orders/[orderId]',
    inferredType: '{ id: string }',
    expectedType: '{ orderId: string }',
    routeId: 'r-orders',
    errorKind: 'wrong-type',
    errorMessage:
      "Object literal may only specify known properties, and 'id' does not exist in type '{ orderId: string }'.",
  },
  {
    id: 'l11',
    sourceFile: 'app/page.tsx',
    line: 28,
    href: '/search',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-search',
  },
  {
    id: 'l12',
    sourceFile: 'app/page.tsx',
    line: 35,
    href: '/deals',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-old-deals',
    errorKind: 'deprecated',
    errorMessage:
      "Route '/deals' is deprecated. Use '/products?sort=deal' instead.",
  },
  {
    id: 'l13',
    sourceFile: 'app/footer.tsx',
    line: 9,
    href: '/products',
    inferredType: '{}',
    expectedType: '{}',
    routeId: 'r-products',
  },
  {
    id: 'l14',
    sourceFile: 'app/footer.tsx',
    line: 11,
    href: '/promotions',
    inferredType: '{}',
    expectedType: 'never',
    routeId: '',
    errorKind: 'unknown-route',
    errorMessage:
      "Type '\"/promotions\"' is not assignable to type 'Route'. No matching route exists.",
  },
];

export function uniqueSourceFiles(): ReadonlyArray<string> {
  const set = new Set<string>();
  for (const l of LINKS) set.add(l.sourceFile);
  return Array.from(set);
}

export function errorTone(
  kind: NonNullable<LinkUsage['errorKind']>,
): 'err' | 'warn' | 'info' {
  switch (kind) {
    case 'missing-param':
    case 'wrong-type':
    case 'unknown-route':
      return 'err';
    case 'deprecated':
      return 'warn';
  }
}

export function errorLabel(
  kind: NonNullable<LinkUsage['errorKind']>,
): string {
  switch (kind) {
    case 'missing-param':
      return 'missing param';
    case 'wrong-type':
      return 'wrong type';
    case 'deprecated':
      return 'deprecated';
    case 'unknown-route':
      return 'unknown route';
  }
}
