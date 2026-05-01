/**
 * Duplicate-fetch store.
 *
 * Holds the latest scan + UI state. Initial fetch-call corpus is mocked from
 * the request-waterfall fixtures so the panel renders meaningfully in demo.
 */

import { create } from 'zustand';
import { detectDuplicates } from './detector';
import type { DuplicateGroup, FetchCall } from './types';

const FIXTURE_CALLS: FetchCall[] = [
  {
    id: 'df_1',
    file: 'app/products/[id]/page.tsx',
    line: 12,
    method: 'GET',
    url: '/api/products/p_4521',
    cache: { cache: 'force-cache', tags: ['products'] },
    routeId: 'route_products_id',
  },
  {
    id: 'df_2',
    file: 'app/products/[id]/related.tsx',
    line: 7,
    method: 'GET',
    url: '/api/products/p_4521',
    cache: { cache: 'force-cache', tags: ['products'] },
    routeId: 'route_products_id',
  },
  {
    id: 'df_3',
    file: 'app/products/[id]/breadcrumbs.tsx',
    line: 5,
    method: 'GET',
    url: '/api/products/p_4521',
    cache: { cache: 'force-cache', tags: ['products'] },
    routeId: 'route_products_id',
  },
  {
    id: 'df_4',
    file: 'app/dashboard/orders.tsx',
    line: 9,
    method: 'GET',
    url: '/api/orders?limit=5',
    cache: { revalidate: 30 },
    routeId: 'route_dashboard',
  },
  {
    id: 'df_5',
    file: 'app/dashboard/orders-summary.tsx',
    line: 11,
    method: 'GET',
    url: '/api/orders?limit=5',
    cache: { revalidate: 30 },
    routeId: 'route_dashboard',
  },
  {
    id: 'df_6',
    file: 'app/checkout/page.tsx',
    line: 22,
    method: 'GET',
    url: '/api/cart',
    cache: { cache: 'no-store' },
    routeId: 'route_checkout',
  },
  {
    id: 'df_7',
    file: 'app/checkout/summary.tsx',
    line: 14,
    method: 'GET',
    url: '/api/cart',
    cache: { cache: 'no-store' },
    routeId: 'route_checkout',
  },
];

interface DuplicateFetchState {
  calls: ReadonlyArray<FetchCall>;
  groups: ReadonlyArray<DuplicateGroup>;
  selectedKey: string | null;
  setCalls(calls: ReadonlyArray<FetchCall>): void;
  setSelected(key: string | null): void;
  rescan(): void;
}

export const useDuplicateFetchStore = create<DuplicateFetchState>(
  (set, get) => ({
    calls: FIXTURE_CALLS,
    groups: detectDuplicates(FIXTURE_CALLS),
    selectedKey: null,
    setCalls: (calls) =>
      set({ calls, groups: detectDuplicates(calls) }),
    setSelected: (key) => set({ selectedKey: key }),
    rescan: () => set({ groups: detectDuplicates(get().calls) }),
  }),
);
