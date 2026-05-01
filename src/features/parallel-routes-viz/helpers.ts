export type SlotKind = 'segment' | 'parallel' | 'intercept' | 'page';

export interface RouteNode {
  id: string;
  name: string;
  path: string;
  kind: SlotKind;
  children?: ReadonlyArray<RouteNode>;
  hasDefault?: boolean;
  caveats?: ReadonlyArray<string>;
  fallbackText?: string;
  intercepts?: string;
}

export interface RouteArchetype {
  id: string;
  label: string;
  description: string;
  root: RouteNode;
  pitfalls: ReadonlyArray<string>;
  transitions: ReadonlyArray<TransitionStep>;
}

export interface TransitionStep {
  url: string;
  label: string;
  rendered: ReadonlyArray<{
    slot: string;
    component: string;
    tone: 'main' | 'modal' | 'tab' | 'drawer' | 'fallback';
  }>;
  note?: string;
}

export const ARCHETYPES: ReadonlyArray<RouteArchetype> = [
  {
    id: 'product',
    label: 'app/products/[id]',
    description: 'PDP with parallel @photos, @reviews, @modal + (.) intercept',
    root: {
      id: 'p-root',
      name: 'app',
      path: 'app',
      kind: 'segment',
      children: [
        {
          id: 'p-products',
          name: 'products',
          path: 'app/products',
          kind: 'segment',
          children: [
            {
              id: 'p-id',
              name: '[id]',
              path: 'app/products/[id]',
              kind: 'segment',
              hasDefault: true,
              children: [
                {
                  id: 'p-page',
                  name: 'page.tsx',
                  path: 'app/products/[id]/page.tsx',
                  kind: 'page',
                },
                {
                  id: 'p-photos',
                  name: '@photos',
                  path: 'app/products/[id]/@photos',
                  kind: 'parallel',
                  hasDefault: true,
                  fallbackText: 'default.tsx (skeleton grid)',
                  caveats: [
                    'Renders alongside main',
                    'Independent loading state',
                    'Has default.tsx fallback',
                  ],
                },
                {
                  id: 'p-reviews',
                  name: '@reviews',
                  path: 'app/products/[id]/@reviews',
                  kind: 'parallel',
                  hasDefault: false,
                  fallbackText: 'no default.tsx — renders null on miss',
                  caveats: [
                    'Missing default.tsx',
                    '404 on hard reload of nested route',
                    'Independent error boundary',
                  ],
                },
                {
                  id: 'p-modal',
                  name: '@modal',
                  path: 'app/products/[id]/@modal',
                  kind: 'parallel',
                  hasDefault: true,
                  fallbackText: 'default.tsx returns null',
                  caveats: [
                    'Default returns null on direct nav',
                    'Filled by intercepting route',
                    'Soft-nav only',
                  ],
                  children: [
                    {
                      id: 'p-modal-intercept',
                      name: '(.)photo/[pid]',
                      path: 'app/products/[id]/@modal/(.)photo/[pid]',
                      kind: 'intercept',
                      intercepts: '/photo/[pid]',
                      caveats: [
                        'Soft-nav-only intercepting',
                        'Hard reload breaks back nav',
                        'Modal will not show without parallel default',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'p-photo',
          name: 'photo',
          path: 'app/photo',
          kind: 'segment',
          children: [
            {
              id: 'p-photo-pid',
              name: '[pid]',
              path: 'app/photo/[pid]',
              kind: 'segment',
              children: [
                {
                  id: 'p-photo-page',
                  name: 'page.tsx',
                  path: 'app/photo/[pid]/page.tsx',
                  kind: 'page',
                },
              ],
            },
          ],
        },
      ],
    },
    pitfalls: [
      'Modal will not show on hard reload without a parallel default.tsx.',
      'Intercepting routes (.)x are soft-nav only — clicking <a href> bypasses them.',
      'Slots without default.tsx 404 the entire layout on direct hit.',
    ],
    transitions: [
      {
        url: '/products/123',
        label: '1. Direct nav',
        rendered: [
          { slot: 'main', component: 'page.tsx', tone: 'main' },
          { slot: '@photos', component: 'photos/page.tsx', tone: 'tab' },
          { slot: '@reviews', component: 'reviews/page.tsx', tone: 'tab' },
          { slot: '@modal', component: 'default.tsx (null)', tone: 'fallback' },
        ],
      },
      {
        url: '/products/123 → /photo/abc (soft)',
        label: '2. Click photo (soft)',
        rendered: [
          { slot: 'main', component: 'page.tsx', tone: 'main' },
          { slot: '@photos', component: 'photos/page.tsx', tone: 'tab' },
          { slot: '@reviews', component: 'reviews/page.tsx', tone: 'tab' },
          { slot: '@modal', component: '(.)photo/[pid]/page.tsx', tone: 'modal' },
        ],
        note: 'Intercept matched: (.)photo overlays modal.',
      },
      {
        url: '/photo/abc (hard reload)',
        label: '3. Hard reload',
        rendered: [
          { slot: 'main', component: 'photo/[pid]/page.tsx', tone: 'main' },
        ],
        note: 'No intercept — full page wins.',
      },
      {
        url: '/products/123',
        label: '4. Back to PDP',
        rendered: [
          { slot: 'main', component: 'page.tsx', tone: 'main' },
          { slot: '@photos', component: 'photos/page.tsx', tone: 'tab' },
          { slot: '@reviews', component: 'reviews/page.tsx', tone: 'tab' },
          { slot: '@modal', component: 'default.tsx (null)', tone: 'fallback' },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    label: 'app/dashboard',
    description: 'Dashboard with @tabs and @drawer parallel slots',
    root: {
      id: 'd-root',
      name: 'app',
      path: 'app',
      kind: 'segment',
      children: [
        {
          id: 'd-dash',
          name: 'dashboard',
          path: 'app/dashboard',
          kind: 'segment',
          hasDefault: true,
          children: [
            {
              id: 'd-page',
              name: 'page.tsx',
              path: 'app/dashboard/page.tsx',
              kind: 'page',
            },
            {
              id: 'd-tabs',
              name: '@tabs',
              path: 'app/dashboard/@tabs',
              kind: 'parallel',
              hasDefault: true,
              fallbackText: 'default.tsx (Overview tab)',
              caveats: [
                'Renders next to main',
                'Has Overview default',
                'Tracks its own URL state',
              ],
            },
            {
              id: 'd-drawer',
              name: '@drawer',
              path: 'app/dashboard/@drawer',
              kind: 'parallel',
              hasDefault: true,
              fallbackText: 'default.tsx returns null',
              caveats: [
                'Hidden by default',
                'Opens via intercept',
                'Independent loading state',
              ],
              children: [
                {
                  id: 'd-drawer-int',
                  name: '(.)settings',
                  path: 'app/dashboard/@drawer/(.)settings',
                  kind: 'intercept',
                  intercepts: '/settings',
                  caveats: [
                    'Soft-nav only',
                    'Hard reload routes to /settings',
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    pitfalls: [
      '@drawer needs default.tsx → null to avoid 404 on direct nav.',
      'Soft-nav-only intercepts: refresh sends user to /settings full page.',
      '@tabs default.tsx must remain layout-stable to avoid CLS.',
    ],
    transitions: [
      {
        url: '/dashboard',
        label: '1. Land on dashboard',
        rendered: [
          { slot: 'main', component: 'dashboard/page.tsx', tone: 'main' },
          { slot: '@tabs', component: 'tabs/default.tsx', tone: 'tab' },
          { slot: '@drawer', component: 'default.tsx (null)', tone: 'fallback' },
        ],
      },
      {
        url: '/dashboard → /settings (soft)',
        label: '2. Open settings',
        rendered: [
          { slot: 'main', component: 'dashboard/page.tsx', tone: 'main' },
          { slot: '@tabs', component: 'tabs/default.tsx', tone: 'tab' },
          { slot: '@drawer', component: '(.)settings/page.tsx', tone: 'drawer' },
        ],
        note: 'Intercept matched: drawer rendered alongside main.',
      },
      {
        url: '/settings (hard)',
        label: '3. Hard reload settings',
        rendered: [
          { slot: 'main', component: 'settings/page.tsx', tone: 'main' },
        ],
        note: 'No drawer — bare settings page.',
      },
    ],
  },
];

export function flattenForTree(root: RouteNode): RouteNode[] {
  const out: RouteNode[] = [];
  const walk = (n: RouteNode) => {
    out.push(n);
    if (n.children) for (const c of n.children) walk(c);
  };
  walk(root);
  return out;
}

export function findNode(root: RouteNode, id: string): RouteNode | undefined {
  if (root.id === id) return root;
  if (!root.children) return undefined;
  for (const c of root.children) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return undefined;
}
