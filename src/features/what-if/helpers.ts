import type { RenderingClass } from '@shared/types';

export type ScenarioId =
  | 'move-use-client'
  | 'products-dynamic'
  | 'blog-force-static'
  | 'remove-cookies-layout';

export interface MetricRow {
  id: string;
  label: string;
  before: string;
  after: string;
  delta: 'unchanged' | 'better' | 'worse' | 'neutral';
  tone?: RenderingClass | 'neutral';
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  metrics: MetricRow[];
}

export const scenarios: readonly Scenario[] = [
  {
    id: 'move-use-client',
    title: "Move 'use client' from AppShell to SearchBox/UserMenu",
    description:
      'Push the boundary down. AppShell becomes a Server Component; only the truly interactive children opt in.',
    metrics: [
      {
        id: 'rendering',
        label: 'rendering',
        before: 'mixed',
        after: 'mixed',
        delta: 'unchanged',
      },
      {
        id: 'boundary',
        label: 'client boundary',
        before: '38 files',
        after: '9 files',
        delta: 'better',
      },
      {
        id: 'bundle',
        label: 'bundle',
        before: '~260KB',
        after: '~46KB',
        delta: 'better',
      },
      {
        id: 'routes',
        label: 'routes affected',
        before: '+0',
        after: '-29',
        delta: 'better',
      },
      {
        id: 'hydration',
        label: 'hydration cost',
        before: 'high',
        after: 'low',
        delta: 'better',
      },
    ],
  },
  {
    id: 'products-dynamic',
    title: 'Convert /products to dynamic',
    description:
      'Force `/products` and its children into dynamic rendering by reading cookies() directly in the segment.',
    metrics: [
      {
        id: 'rendering',
        label: 'rendering',
        before: 'ISR',
        after: 'DYN',
        delta: 'worse',
      },
      {
        id: 'cdn',
        label: 'CDN cache',
        before: 'hit',
        after: 'miss',
        delta: 'worse',
      },
      {
        id: 'cost',
        label: 'cost class',
        before: 'B',
        after: 'D',
        delta: 'worse',
      },
      {
        id: 'routes',
        label: 'routes affected',
        before: '+0',
        after: '+12',
        delta: 'worse',
      },
      {
        id: 'staleness',
        label: 'staleness',
        before: '60s',
        after: '0s',
        delta: 'better',
      },
    ],
  },
  {
    id: 'blog-force-static',
    title: 'Add `force-static` to /blog',
    description:
      'Pin blog routes to static rendering. Build will fail on dynamic data access — surfaced as a diagnostic.',
    metrics: [
      {
        id: 'rendering',
        label: 'rendering',
        before: 'STATIC',
        after: 'STATIC*',
        delta: 'unchanged',
      },
      {
        id: 'cdn',
        label: 'CDN cache',
        before: 'hit',
        after: 'hit',
        delta: 'unchanged',
      },
      {
        id: 'build-checks',
        label: 'build checks',
        before: '0',
        after: '+3 strict',
        delta: 'better',
      },
      {
        id: 'risk',
        label: 'breakage risk',
        before: 'low',
        after: 'medium',
        delta: 'worse',
      },
      {
        id: 'cost',
        label: 'cost class',
        before: 'A',
        after: 'A',
        delta: 'unchanged',
      },
    ],
  },
  {
    id: 'remove-cookies-layout',
    title: 'Remove cookies() from root layout',
    description:
      'Lift `cookies()` out of root layout — only routes that actually need auth pay the dynamic cost.',
    metrics: [
      {
        id: 'rendering',
        label: 'rendering',
        before: 'DYN (root)',
        after: 'STATIC (root)',
        delta: 'better',
      },
      {
        id: 'static-routes',
        label: 'static routes',
        before: '4 of 17',
        after: '12 of 17',
        delta: 'better',
      },
      {
        id: 'cost',
        label: 'cost class',
        before: 'D avg.',
        after: 'B avg.',
        delta: 'better',
      },
      {
        id: 'auth-routes',
        label: 'auth-aware routes',
        before: '17',
        after: '5',
        delta: 'better',
      },
      {
        id: 'effort',
        label: 'migration effort',
        before: '—',
        after: '~3 files',
        delta: 'neutral',
      },
    ],
  },
] as const;

export const defaultScenarioId: ScenarioId = 'move-use-client';

export function findScenario(id: ScenarioId | undefined): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]!;
}
