import type { BundleNode, BundleSide } from '@shared/types';

// Helper for compact mock construction.
const pkg = (
  id: string,
  name: string,
  size: number,
  side: BundleSide,
  routes: string[] = [],
  children?: BundleNode[],
): BundleNode => ({
  id,
  name,
  size,
  kind: 'package',
  side,
  routes,
  children,
});

const mod = (
  id: string,
  name: string,
  size: number,
  side: BundleSide,
  routes: string[] = [],
): BundleNode => ({
  id,
  name,
  size,
  kind: 'module',
  side,
  routes,
});

const chunk = (
  id: string,
  name: string,
  size: number,
  side: BundleSide,
  children: BundleNode[],
  routes: string[] = [],
): BundleNode => ({
  id,
  name,
  size,
  kind: 'chunk',
  side,
  routes,
  children,
});

// -----------------------------------------------------------------------------
// CLIENT bundle — sizes are gzip estimates in BYTES.
// -----------------------------------------------------------------------------

const clientNodeModules: BundleNode[] = [
  pkg('client/react', 'react', 12_000, 'client', [
    'route_home',
    'route_products',
    'route_products_id',
    'route_cart',
    'route_checkout',
    'route_account',
    'route_dashboard',
    'route_admin_users',
    'route_admin_users_delete',
    'route_admin_products',
    'route_blog',
    'route_blog_slug',
  ]),
  pkg('client/react-dom', 'react-dom', 38_000, 'client', [
    'route_home',
    'route_products',
    'route_products_id',
    'route_cart',
    'route_checkout',
    'route_account',
    'route_dashboard',
    'route_admin_users',
    'route_admin_users_delete',
    'route_admin_products',
    'route_blog',
    'route_blog_slug',
  ]),
  pkg('client/next', 'next', 56_000, 'client', [
    'route_home',
    'route_products',
    'route_products_id',
    'route_cart',
    'route_checkout',
    'route_account',
    'route_dashboard',
    'route_admin_users',
    'route_admin_users_delete',
    'route_admin_products',
    'route_blog',
    'route_blog_slug',
  ]),
  pkg('client/scheduler', 'scheduler', 4_200, 'client'),
  pkg('client/recharts', 'recharts', 96_000, 'client', ['route_dashboard']),
  pkg('client/d3-shape', 'd3-shape', 14_000, 'client', ['route_dashboard']),
  pkg('client/d3-array', 'd3-array', 7_400, 'client', ['route_dashboard']),
  pkg('client/d3-scale', 'd3-scale', 12_000, 'client', ['route_dashboard']),
  pkg('client/monaco-editor', 'monaco-editor', 320_000, 'client', [
    'route_admin_products',
  ]),
  pkg('client/lodash', 'lodash', 24_500, 'client', [
    'route_dashboard',
    'route_admin_products',
    'route_admin_users',
  ]),
  pkg('client/lodash.debounce', 'lodash.debounce', 1_900, 'client', [
    'route_products',
    'route_admin_products',
  ]),
  pkg('client/date-fns', 'date-fns', 18_400, 'client', [
    'route_dashboard',
    'route_blog',
    'route_blog_slug',
    'route_account',
  ]),
  pkg('client/zod', 'zod', 12_700, 'client', [
    'route_checkout',
    'route_admin_users_delete',
    'route_admin_products',
  ]),
  pkg('client/zustand', 'zustand', 3_200, 'client', [
    'route_cart',
    'route_dashboard',
  ]),
  pkg('client/clsx', 'clsx', 700, 'client'),
  pkg('client/tailwind-merge', 'tailwind-merge', 6_300, 'client'),
  pkg('client/class-variance-authority', 'class-variance-authority', 2_100, 'client'),
  pkg('client/lucide-react', 'lucide-react', 18_000, 'client', [
    'route_home',
    'route_products',
    'route_products_id',
    'route_dashboard',
    'route_admin_users',
    'route_admin_products',
  ]),
  pkg('client/sonner', 'sonner', 9_400, 'client', [
    'route_admin_products',
    'route_admin_users_delete',
  ]),
  pkg('client/cmdk', 'cmdk', 7_800, 'client'),
  pkg('client/nanoid', 'nanoid', 1_100, 'client'),
  pkg('client/ts-pattern', 'ts-pattern', 4_400, 'client'),
  pkg('client/@floating-ui/react', '@floating-ui/react', 11_500, 'client'),
  pkg('client/@radix-ui/react-tabs', '@radix-ui/react-tabs', 6_200, 'client'),
  pkg(
    'client/@radix-ui/react-tooltip',
    '@radix-ui/react-tooltip',
    7_400,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-dialog',
    '@radix-ui/react-dialog',
    9_100,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-popover',
    '@radix-ui/react-popover',
    8_300,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-scroll-area',
    '@radix-ui/react-scroll-area',
    8_100,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-collapsible',
    '@radix-ui/react-collapsible',
    4_700,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-context-menu',
    '@radix-ui/react-context-menu',
    9_900,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-dropdown-menu',
    '@radix-ui/react-dropdown-menu',
    10_400,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-hover-card',
    '@radix-ui/react-hover-card',
    5_300,
    'client',
  ),
  pkg(
    'client/@radix-ui/react-slot',
    '@radix-ui/react-slot',
    1_400,
    'client',
  ),
  pkg(
    'client/@tanstack/react-virtual',
    '@tanstack/react-virtual',
    11_000,
    'client',
    ['route_admin_users', 'route_admin_products'],
  ),
  pkg('client/react-router', 'react-router', 24_300, 'client'),
];

const clientAppCode: BundleNode[] = [
  mod(
    'client/app/(shop)/products',
    'app/(shop)/products/*',
    9_300,
    'client',
    ['route_products', 'route_products_id'],
  ),
  mod(
    'client/app/(shop)/cart',
    'app/(shop)/cart/*',
    7_100,
    'client',
    ['route_cart'],
  ),
  mod(
    'client/app/(shop)/checkout',
    'app/(shop)/checkout/*',
    14_800,
    'client',
    ['route_checkout'],
  ),
  mod(
    'client/app/dashboard',
    'app/dashboard/*',
    21_400,
    'client',
    ['route_dashboard'],
  ),
  mod(
    'client/app/admin',
    'app/admin/*',
    18_900,
    'client',
    [
      'route_admin_users',
      'route_admin_users_delete',
      'route_admin_products',
    ],
  ),
  mod(
    'client/components/AppShell',
    'components/AppShell.tsx',
    32_000,
    'client',
    [
      'route_home',
      'route_products',
      'route_products_id',
      'route_cart',
      'route_account',
      'route_dashboard',
      'route_blog',
    ],
  ),
];

// -----------------------------------------------------------------------------
// SERVER bundle
// -----------------------------------------------------------------------------

const serverPackages: BundleNode[] = [
  pkg('server/next', 'next', 84_000, 'server'),
  pkg('server/react', 'react', 12_000, 'server'),
  pkg('server/react-dom', 'react-dom/server', 38_000, 'server'),
  pkg('server/zod', 'zod', 12_700, 'server'),
  pkg('server/stripe', 'stripe', 142_000, 'server', [
    'route_checkout',
    'route_api_webhook_stripe',
  ]),
  pkg('server/@vercel/edge', '@vercel/edge', 6_400, 'server'),
  pkg('server/pg', 'pg', 64_000, 'server', [
    'route_admin_users',
    'route_admin_users_delete',
    'route_admin_products',
    'route_dashboard',
  ]),
  pkg('server/drizzle-orm', 'drizzle-orm', 38_000, 'server', [
    'route_admin_users',
    'route_admin_products',
    'route_dashboard',
  ]),
  pkg('server/@upstash/redis', '@upstash/redis', 9_400, 'server', [
    'route_dashboard',
    'route_account',
  ]),
  pkg('server/jsonwebtoken', 'jsonwebtoken', 18_700, 'server', [
    'route_account',
    'route_admin_users',
    'route_admin_users_delete',
    'route_admin_products',
    'route_dashboard',
  ]),
];

const serverAppCode: BundleNode[] = [
  mod('server/app/api', 'app/api/*', 6_700, 'server', [
    'route_api_products',
    'route_api_webhook_stripe',
  ]),
  mod('server/lib', 'lib/*', 22_400, 'server'),
  mod('server/middleware', 'middleware.ts', 4_300, 'server'),
];

// -----------------------------------------------------------------------------
// SHARED bundle
// -----------------------------------------------------------------------------

const sharedPackages: BundleNode[] = [
  pkg('shared/zod', 'zod', 12_700, 'shared'),
  pkg('shared/clsx', 'clsx', 700, 'shared'),
  pkg('shared/ts-pattern', 'ts-pattern', 4_400, 'shared'),
  mod('shared/types', 'types/*', 2_400, 'shared'),
  mod('shared/utils', 'utils/*', 6_800, 'shared'),
];

// -----------------------------------------------------------------------------
// Root tree
// -----------------------------------------------------------------------------

const sumChildren = (nodes: BundleNode[]): number =>
  nodes.reduce((acc, n) => acc + n.size, 0);

const clientNodeModulesGroup: BundleNode = chunk(
  'client/node_modules',
  'node_modules',
  sumChildren(clientNodeModules),
  'client',
  clientNodeModules,
);

const clientAppCodeGroup: BundleNode = chunk(
  'client/app',
  'app/*',
  sumChildren(clientAppCode),
  'client',
  clientAppCode,
);

const clientGroup: BundleNode = {
  id: 'root/client',
  name: 'client',
  kind: 'monorepo',
  side: 'client',
  size: clientNodeModulesGroup.size + clientAppCodeGroup.size,
  children: [clientNodeModulesGroup, clientAppCodeGroup],
};

const serverNodeModulesGroup: BundleNode = chunk(
  'server/node_modules',
  'node_modules',
  sumChildren(serverPackages),
  'server',
  serverPackages,
);

const serverAppCodeGroup: BundleNode = chunk(
  'server/app',
  'app/*',
  sumChildren(serverAppCode),
  'server',
  serverAppCode,
);

const serverGroup: BundleNode = {
  id: 'root/server',
  name: 'server',
  kind: 'monorepo',
  side: 'server',
  size: serverNodeModulesGroup.size + serverAppCodeGroup.size,
  children: [serverNodeModulesGroup, serverAppCodeGroup],
};

const sharedGroup: BundleNode = {
  id: 'root/shared',
  name: 'shared',
  kind: 'monorepo',
  side: 'shared',
  size: sumChildren(sharedPackages),
  children: sharedPackages,
};

export const mockBundleRoot: BundleNode = {
  id: 'root',
  name: 'bundle',
  kind: 'monorepo',
  side: 'shared',
  size: clientGroup.size + serverGroup.size + sharedGroup.size,
  children: [clientGroup, serverGroup, sharedGroup],
};

/**
 * Flat list of every package node, useful for "heaviest packages"
 * and per-route impact computations.
 */
export function flattenBundle(root: BundleNode): BundleNode[] {
  const out: BundleNode[] = [];
  const walk = (n: BundleNode): void => {
    out.push(n);
    n.children?.forEach(walk);
  };
  walk(root);
  return out;
}
