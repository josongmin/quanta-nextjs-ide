import type { CacheTag } from '@shared/types';

export const mockCacheTags: CacheTag[] = [
  {
    id: 'tag_products',
    name: 'products',
    producers: [
      {
        location: { file: 'app/(shop)/products/page.tsx', line: 12 },
        kind: 'producer',
        fetchUrl: '/api/products',
        revalidate: 60,
      },
      {
        location: { file: 'app/page.tsx', line: 30 },
        kind: 'producer',
        fetchUrl: '/api/products?featured=true',
        revalidate: 60,
      },
      {
        location: { file: 'app/admin/products/page.tsx', line: 8 },
        kind: 'producer',
        fetchUrl: '/api/products',
        revalidate: 0,
      },
      {
        location: { file: 'lib/products.ts', line: 8 },
        kind: 'producer',
        fetchUrl: '/api/products',
      },
    ],
    invalidators: [
      {
        location: { file: 'app/admin/products/actions.ts', line: 30 },
        kind: 'invalidator',
      },
    ],
    affectedRouteIds: ['route_products', 'route_products_id', 'route_home', 'route_admin_products'],
  },
  {
    id: 'tag_product_id',
    name: 'product:{id}',
    producers: [
      {
        location: { file: 'app/(shop)/products/[id]/page.tsx', line: 18 },
        kind: 'producer',
        fetchUrl: '/api/products/[id]',
        revalidate: 60,
      },
    ],
    invalidators: [
      {
        location: { file: 'app/admin/products/[id]/actions.ts', line: 24 },
        kind: 'invalidator',
      },
    ],
    affectedRouteIds: ['route_products_id'],
  },
  {
    id: 'tag_reviews',
    name: 'reviews',
    producers: [
      {
        location: { file: 'app/(shop)/products/[id]/page.tsx', line: 19 },
        kind: 'producer',
        fetchUrl: '/api/reviews',
        revalidate: 300,
      },
    ],
    invalidators: [],
    affectedRouteIds: ['route_products_id'],
    inconsistencyGroup: 'reviews',
  },
  {
    id: 'tag_users',
    name: 'users',
    producers: [
      {
        location: { file: 'app/admin/users/page.tsx', line: 8 },
        kind: 'producer',
        fetchUrl: '/api/users',
      },
    ],
    invalidators: [],
    affectedRouteIds: ['route_admin_users'],
  },
  {
    id: 'tag_user',
    name: 'user',
    producers: [
      { location: { file: 'app/dashboard/page.tsx', line: 14 }, kind: 'producer' },
    ],
    invalidators: [],
    affectedRouteIds: ['route_dashboard'],
  },
  {
    id: 'tag_orders',
    name: 'orders',
    producers: [],
    invalidators: [
      { location: { file: 'app/(shop)/checkout/actions.ts', line: 50 }, kind: 'invalidator' },
    ],
    affectedRouteIds: [],
  },
  {
    id: 'tag_Product',
    name: 'Product',
    producers: [{ location: { file: 'lib/legacy.ts', line: 4 }, kind: 'producer' }],
    invalidators: [],
    affectedRouteIds: [],
    inconsistencyGroup: 'products',
  },
  {
    id: 'tag_product',
    name: 'product',
    producers: [{ location: { file: 'lib/legacy.ts', line: 8 }, kind: 'producer' }],
    invalidators: [],
    affectedRouteIds: [],
    inconsistencyGroup: 'products',
  },
];
