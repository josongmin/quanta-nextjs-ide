export type LayerId = 'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared';

export interface Layer {
  readonly id: LayerId;
  readonly label: string;
  readonly modules: number;
  /** rank 0 = top */
  readonly rank: number;
}

export const LAYERS: ReadonlyArray<Layer> = [
  { id: 'app', label: 'app', modules: 8, rank: 0 },
  { id: 'pages', label: 'pages', modules: 22, rank: 1 },
  { id: 'widgets', label: 'widgets', modules: 18, rank: 2 },
  { id: 'features', label: 'features', modules: 64, rank: 3 },
  { id: 'entities', label: 'entities', modules: 14, rank: 4 },
  { id: 'shared', label: 'shared', modules: 31, rank: 5 },
];

export interface Edge {
  readonly id: string;
  readonly from: LayerId;
  readonly to: LayerId;
  readonly count: number;
  /** top importing files (mocked) */
  readonly topImporters: ReadonlyArray<string>;
  readonly suggestedFix: string;
}

export const EDGES: ReadonlyArray<Edge> = [
  {
    id: 'app-pages',
    from: 'app',
    to: 'pages',
    count: 18,
    topImporters: [
      'src/app/router.tsx',
      'src/app/App.tsx',
      'src/app/store/ui.store.ts',
    ],
    suggestedFix: 'No fix needed — boundary is clean.',
  },
  {
    id: 'pages-widgets',
    from: 'pages',
    to: 'widgets',
    count: 36,
    topImporters: [
      'src/pages/home.tsx',
      'src/pages/products.tsx',
      'src/pages/checkout.tsx',
      'src/pages/blog.tsx',
      'src/pages/account.tsx',
    ],
    suggestedFix: 'Consider barrel export from widgets to reduce churn.',
  },
  {
    id: 'pages-features',
    from: 'pages',
    to: 'features',
    count: 22,
    topImporters: [
      'src/pages/checkout.tsx',
      'src/pages/products/[id].tsx',
      'src/pages/account.tsx',
    ],
    suggestedFix: 'OK — pages are allowed to compose features.',
  },
  {
    id: 'widgets-features',
    from: 'widgets',
    to: 'features',
    count: 48,
    topImporters: [
      'src/widgets/header/site-header.tsx',
      'src/widgets/footer/site-footer.tsx',
      'src/widgets/cart/cart-drawer.tsx',
      'src/widgets/search/search-bar.tsx',
      'src/widgets/account/account-menu.tsx',
    ],
    suggestedFix: 'OK — widgets compose features.',
  },
  {
    id: 'features-entities',
    from: 'features',
    to: 'entities',
    count: 31,
    topImporters: [
      'src/features/cart/use-cart.ts',
      'src/features/products/product-card.tsx',
      'src/features/auth/session.ts',
    ],
    suggestedFix: 'OK.',
  },
  {
    id: 'features-shared',
    from: 'features',
    to: 'shared',
    count: 84,
    topImporters: [
      'src/features/cart/cart-api.ts',
      'src/features/products/product-list.tsx',
      'src/features/billing/billing-api.ts',
      'src/features/auth/sign-in.action.ts',
      'src/features/search/use-search.ts',
    ],
    suggestedFix: 'High fanout — consider splitting shared into focused packages.',
  },
  {
    id: 'entities-shared',
    from: 'entities',
    to: 'shared',
    count: 12,
    topImporters: [
      'src/entities/user/user.model.ts',
      'src/entities/order/order.model.ts',
    ],
    suggestedFix: 'OK.',
  },
  {
    id: 'widgets-entities',
    from: 'widgets',
    to: 'entities',
    count: 9,
    topImporters: [
      'src/widgets/cart/cart-drawer.tsx',
      'src/widgets/header/cart-button.tsx',
    ],
    suggestedFix: 'Borderline — widgets reaching entities should usually go via features.',
  },
  // Circular flag pairs (encoded as forbidden direction)
  {
    id: 'shared-features-circ',
    from: 'shared',
    to: 'features',
    count: 3,
    topImporters: [
      'src/shared/lib/__circular__/cart-bridge.ts',
      'src/shared/lib/__circular__/product-helper.ts',
    ],
    suggestedFix: 'CIRCULAR — invert dependency: move shared/lib/__circular__/* into the consuming feature.',
  },
  {
    id: 'entities-features-circ',
    from: 'entities',
    to: 'features',
    count: 2,
    topImporters: [
      'src/entities/order/__circular__/checkout-call.ts',
    ],
    suggestedFix: 'CIRCULAR — entities should not import features. Inject via a port.',
  },
];

export interface CircularPair {
  readonly id: string;
  readonly a: LayerId;
  readonly b: LayerId;
  readonly hint: string;
}

export const CIRCULAR_PAIRS: ReadonlyArray<CircularPair> = [
  {
    id: 'c1',
    a: 'features',
    b: 'shared',
    hint: 'shared/lib/__circular__/cart-bridge.ts ↔ features/cart',
  },
  {
    id: 'c2',
    a: 'features',
    b: 'entities',
    hint: 'entities/order/__circular__/checkout-call.ts ↔ features/billing',
  },
];

export function isCircular(edge: Edge): boolean {
  return CIRCULAR_PAIRS.some(
    (p) =>
      (p.a === edge.from && p.b === edge.to) || (p.a === edge.to && p.b === edge.from),
  );
}

export function thicknessFor(count: number): number {
  return Math.max(1, Math.min(8, Math.round(Math.log(count + 1) * 2)));
}
