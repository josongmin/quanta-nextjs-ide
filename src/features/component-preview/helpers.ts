import type { ReactNode } from 'react';

export type PreviewState =
  | 'normal'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'empty'
  | 'unauthorized';

export type Viewport = {
  id: 'mobile' | 'tablet' | 'desktop' | 'wide';
  label: string;
  width: number;
};

export const VIEWPORTS: ReadonlyArray<Viewport> = [
  { id: 'mobile', label: 'Mobile · 375', width: 375 },
  { id: 'tablet', label: 'Tablet · 768', width: 768 },
  { id: 'desktop', label: 'Desktop · 1280', width: 1280 },
  { id: 'wide', label: 'Wide · 1920', width: 1920 },
];

export interface ComponentEntry {
  id: string;
  name: string;
  kind: 'server' | 'client';
  file: string;
  hooks: string[];
  props: string[];
  description: string;
}

export const COMPONENTS: ReadonlyArray<ComponentEntry> = [
  {
    id: 'product-card',
    name: 'ProductCard',
    kind: 'server',
    file: 'components/ProductCard.tsx',
    hooks: [],
    props: ['product: Product', 'priority?: boolean'],
    description: 'Static product tile, server-rendered. Pure props.',
  },
  {
    id: 'add-to-cart',
    name: 'AddToCart',
    kind: 'client',
    file: 'components/AddToCart.client.tsx',
    hooks: ['useFormStatus', 'useOptimistic'],
    props: ['productId: string'],
    description: 'Client island with optimistic update + server action.',
  },
  {
    id: 'user-menu',
    name: 'UserMenu',
    kind: 'client',
    file: 'components/UserMenu.client.tsx',
    hooks: ['useRouter', 'useState'],
    props: ['user: UserDTO | null'],
    description: 'Top-bar dropdown. Client to react to route changes.',
  },
  {
    id: 'search-box',
    name: 'SearchBox',
    kind: 'client',
    file: 'components/SearchBox.client.tsx',
    hooks: ['useState', 'useDebouncedValue'],
    props: ['placeholder?: string'],
    description: 'Client island for typing + debounced query.',
  },
  {
    id: 'order-summary',
    name: 'OrderSummary',
    kind: 'server',
    file: 'components/OrderSummary.tsx',
    hooks: [],
    props: ['order: OrderDTO'],
    description: 'Pure server component for order receipt.',
  },
  {
    id: 'chart-panel',
    name: 'ChartPanel',
    kind: 'client',
    file: 'components/ChartPanel.client.tsx',
    hooks: ['useEffect'],
    props: ['data: Series[]'],
    description: 'Heavy client island (recharts). 96KB estimated.',
  },
];

export const STATES: ReadonlyArray<{ id: PreviewState; label: string }> = [
  { id: 'normal', label: 'Normal' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
  { id: 'not-found', label: 'Not Found' },
  { id: 'empty', label: 'Empty' },
  { id: 'unauthorized', label: 'Unauthorized' },
];

export function describeState(s: PreviewState): string {
  switch (s) {
    case 'normal':
      return 'Component renders with mock data';
    case 'loading':
      return 'Skeleton placeholder';
    case 'error':
      return 'Error boundary fallback';
    case 'not-found':
      return 'Not-found segment';
    case 'empty':
      return 'Empty data state';
    case 'unauthorized':
      return 'Auth required overlay';
  }
}

export interface MockComponentVisualProps {
  componentId: string;
  state: PreviewState;
  width: number;
}
export type { ReactNode };
