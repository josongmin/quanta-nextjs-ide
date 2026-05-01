import type { ClientIsland } from '@shared/types';

export interface ImportNode {
  file: string;
  label: string;
  imports: number;
  reasons: string[];
  estimatedKb: number;
  flag?: 'root' | 'heavy' | 'leaf';
}

export interface IslandSuggestion {
  id: string;
  name: string;
  file: string;
  estimatedKb: number;
  reason: string;
}

const fallbackIsland: ClientIsland = {
  id: 'isl_appshell',
  file: 'components/AppShell.tsx',
  name: 'AppShell',
  reasons: ['theme provider', 'analytics', 'auth context'],
  estimatedKb: 260,
  affectedRouteIds: [
    'route_home',
    'route_products',
    'route_products_id',
    'route_cart',
    'route_account',
    'route_dashboard',
    'route_blog',
  ],
  isRoot: true,
  excessive: true,
};

export function resolveIsland(
  islands: readonly ClientIsland[],
  sourceFile: string | undefined,
): ClientIsland {
  if (sourceFile) {
    const found = islands.find((i) => i.file === sourceFile);
    if (found) return found;
  }
  const root = islands.find((i) => i.isRoot);
  return root ?? fallbackIsland;
}

const dependencyTemplate: Omit<ImportNode, 'flag'>[] = [
  {
    file: 'components/Header.tsx',
    label: 'Header.tsx',
    imports: 12,
    reasons: ['contains <SearchBox/>', '<UserMenu/>', '<ThemeToggle/>'],
    estimatedKb: 38,
  },
  {
    file: 'components/SearchBox.tsx',
    label: 'SearchBox.tsx',
    imports: 4,
    reasons: ['useState (search query)', 'onChange handler'],
    estimatedKb: 12,
  },
  {
    file: 'components/UserMenu.tsx',
    label: 'UserMenu.tsx',
    imports: 3,
    reasons: ['useRouter', 'onClick (sign out)'],
    estimatedKb: 8,
  },
  {
    file: 'components/ThemeToggle.tsx',
    label: 'ThemeToggle.tsx',
    imports: 1,
    reasons: ['useContext(ThemeProvider)'],
    estimatedKb: 4,
  },
  {
    file: 'components/AnalyticsProvider.tsx',
    label: 'AnalyticsProvider.tsx',
    imports: 2,
    reasons: ['mount-effect: posthog.init()'],
    estimatedKb: 24,
  },
  {
    file: 'components/CartIndicator.tsx',
    label: 'CartIndicator.tsx',
    imports: 2,
    reasons: ['subscribes to cart store'],
    estimatedKb: 6,
  },
  {
    file: 'components/Footer.tsx',
    label: 'Footer.tsx',
    imports: 2,
    reasons: ['Date.now() in render path'],
    estimatedKb: 5,
  },
  {
    file: 'lib/use-analytics.ts',
    label: 'use-analytics.ts',
    imports: 1,
    reasons: ['custom hook — pulled to client'],
    estimatedKb: 3,
  },
];

/**
 * Build an "imports" tree for the given island. We synthesise dependents and
 * cap by the island's blast budget so it scales with the data.
 */
export function buildDependencyTree(island: ClientIsland): ImportNode[] {
  const budget = Math.max(5, Math.min(8, island.affectedRouteIds.length + 2));
  return dependencyTemplate.slice(0, budget).map((node, idx) => ({
    ...node,
    flag: idx === 0 ? 'heavy' : undefined,
  }));
}

export function suggestIslands(island: ClientIsland): IslandSuggestion[] {
  return [
    {
      id: 'sg_searchbox',
      name: 'SearchBox',
      file: 'components/SearchBox.client.tsx',
      estimatedKb: 12,
      reason: 'state + handler — true client need',
    },
    {
      id: 'sg_usermenu',
      name: 'UserMenu',
      file: 'components/UserMenu.client.tsx',
      estimatedKb: 8,
      reason: 'router + onClick',
    },
    {
      id: 'sg_themetoggle',
      name: 'ThemeToggle',
      file: 'components/ThemeToggle.client.tsx',
      estimatedKb: 4,
      reason: 'isolated UI control',
    },
  ].filter((s) => island.estimatedKb > s.estimatedKb);
}

export function totalSuggestedKb(suggestions: readonly IslandSuggestion[]): number {
  return suggestions.reduce((sum, s) => sum + s.estimatedKb, 0);
}

export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}

export function jumpTabId(file: string): string {
  return `tab-${file}`;
}
