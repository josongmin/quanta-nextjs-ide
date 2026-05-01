// Shared mock data for runtime flow visualizers.
// Used by cache-heatmap, action-replay, request-waterfall, and edge-cold-warm features.

export interface RuntimeFetchSeed {
  id: string;
  url: string;
  tags: ReadonlyArray<string>;
  revalidate: number | null;
  routes: ReadonlyArray<string>;
  // synthetic distribution weights used by the heatmap rng:
  weight: ReadonlyArray<number>;
}

export const runtimeFetchSeeds: ReadonlyArray<RuntimeFetchSeed> = [
  {
    id: 'fx_products_list',
    url: '/api/products',
    tags: ['products'],
    revalidate: 60,
    routes: ['/products', '/'],
    weight: [82, 6, 4, 8, 0],
  },
  {
    id: 'fx_products_featured',
    url: '/api/products?featured=true',
    tags: ['products'],
    revalidate: 60,
    routes: ['/'],
    weight: [78, 8, 4, 10, 0],
  },
  {
    id: 'fx_product_detail',
    url: '/api/products/[id]',
    tags: ['product:{id}'],
    revalidate: 60,
    routes: ['/products/[id]'],
    weight: [70, 10, 6, 14, 0],
  },
  {
    id: 'fx_reviews',
    url: '/api/reviews?productId={id}',
    tags: ['reviews'],
    revalidate: 300,
    routes: ['/products/[id]'],
    weight: [80, 6, 4, 10, 0],
  },
  {
    id: 'fx_users_admin',
    url: '/api/users',
    tags: ['users'],
    revalidate: null,
    routes: ['/admin/users'],
    weight: [0, 0, 0, 0, 100],
  },
  {
    id: 'fx_user_session',
    url: '/api/user',
    tags: ['user'],
    revalidate: null,
    routes: ['/dashboard', '/account'],
    weight: [0, 0, 0, 0, 100],
  },
  {
    id: 'fx_orders_list',
    url: '/api/orders',
    tags: ['orders'],
    revalidate: 30,
    routes: ['/dashboard', '/account'],
    weight: [55, 18, 8, 19, 0],
  },
  {
    id: 'fx_orders_recent',
    url: '/api/orders?limit=5',
    tags: ['orders'],
    revalidate: 30,
    routes: ['/dashboard'],
    weight: [60, 14, 8, 18, 0],
  },
  {
    id: 'fx_legacy_product',
    url: 'lib/legacy.getProduct()',
    tags: ['Product'],
    revalidate: null,
    routes: ['/admin/products'],
    weight: [25, 4, 65, 6, 0],
  },
  {
    id: 'fx_legacy_catalog',
    url: 'lib/legacy.catalog()',
    tags: ['product'],
    revalidate: null,
    routes: ['/admin/products'],
    weight: [22, 5, 68, 5, 0],
  },
  {
    id: 'fx_inventory',
    url: '/api/inventory',
    tags: ['products'],
    revalidate: 120,
    routes: ['/products', '/products/[id]'],
    weight: [72, 8, 4, 16, 0],
  },
  {
    id: 'fx_promotions',
    url: '/api/promotions',
    tags: ['products'],
    revalidate: 600,
    routes: ['/', '/products'],
    weight: [88, 4, 2, 6, 0],
  },
];

// Seeded PRNG so the same heatmap is reproduced every render.
export function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export const ALL_TAGS: ReadonlyArray<string> = [
  'products',
  'product:{id}',
  'reviews',
  'users',
  'user',
  'orders',
  'Product',
  'product',
];
