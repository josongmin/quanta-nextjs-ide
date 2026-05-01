import type { Route } from '@shared/types';

export type A11yRule =
  | 'missing-alt'
  | 'form-label'
  | 'heading-order'
  | 'button-name'
  | 'color-contrast'
  | 'focus-order'
  | 'aria-misuse'
  | 'tabindex-abuse';

export interface A11yRuleMeta {
  id: A11yRule;
  short: string;
  label: string;
  description: string;
}

export const a11yRules: readonly A11yRuleMeta[] = [
  {
    id: 'missing-alt',
    short: 'alt',
    label: 'missing-alt',
    description: '<img>/<Image/> without an alt attribute',
  },
  {
    id: 'form-label',
    short: 'label',
    label: 'form-label',
    description: 'Inputs missing an associated <label> or aria-label',
  },
  {
    id: 'heading-order',
    short: 'h‑order',
    label: 'heading-order',
    description: 'Heading levels skip (e.g. h1 → h3)',
  },
  {
    id: 'button-name',
    short: 'btn‑name',
    label: 'button-name',
    description: 'Buttons without accessible name (icon only)',
  },
  {
    id: 'color-contrast',
    short: 'contrast',
    label: 'color-contrast',
    description: 'Text fails WCAG AA contrast against its background',
  },
  {
    id: 'focus-order',
    short: 'focus',
    label: 'focus-order',
    description: 'DOM order does not match visual order',
  },
  {
    id: 'aria-misuse',
    short: 'aria',
    label: 'aria-misuse',
    description: 'Invalid ARIA roles, attributes, or values',
  },
  {
    id: 'tabindex-abuse',
    short: 'tabindex',
    label: 'tabindex-abuse',
    description: 'Positive tabindex disrupts natural focus order',
  },
];

export interface HeatmapRow {
  routeId: string;
  path: string;
  counts: Record<A11yRule, number>;
  total: number;
}

// Hash-based pseudo-random — stable per route id + rule.
function pseudo(routeId: string, rule: A11yRule, max: number): number {
  let h = 0;
  const input = `${routeId}:${rule}`;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % (max + 1);
}

const RISK_BIAS: Record<string, number> = {
  marketing: 1,
  'commerce.list': 2,
  'commerce.product-detail': 3,
  'commerce.cart': 2,
  'commerce.checkout': 4,
  admin: 3,
  account: 2,
  dashboard: 3,
  auth: 1,
  blog: 1,
  docs: 0,
  api: 0,
  webhook: 0,
  unknown: 1,
};

export function buildHeatmap(routes: readonly Route[]): HeatmapRow[] {
  return routes
    .filter((r) => r.archetype !== 'api' && r.archetype !== 'webhook')
    .map((r) => {
      const bias = RISK_BIAS[r.archetype] ?? 1;
      const counts: Record<A11yRule, number> = {
        'missing-alt': 0,
        'form-label': 0,
        'heading-order': 0,
        'button-name': 0,
        'color-contrast': 0,
        'focus-order': 0,
        'aria-misuse': 0,
        'tabindex-abuse': 0,
      };
      let total = 0;
      for (const rule of a11yRules) {
        const max = Math.max(0, bias + (rule.id === 'color-contrast' ? 1 : 0));
        const v = pseudo(r.id, rule.id, max);
        counts[rule.id] = v;
        total += v;
      }
      return { routeId: r.id, path: r.path, counts, total };
    });
}

export function cellTone(count: number): 'static' | 'warn' | 'err' {
  if (count === 0) return 'static';
  if (count <= 2) return 'warn';
  return 'err';
}

export function severityLabel(count: number): string {
  if (count === 0) return 'no issues';
  if (count <= 2) return 'minor';
  return 'severe';
}

export function totalIssues(rows: readonly HeatmapRow[]): number {
  return rows.reduce((sum, r) => sum + r.total, 0);
}

export function topRoute(rows: readonly HeatmapRow[]): HeatmapRow | undefined {
  return [...rows].sort((a, b) => b.total - a.total)[0];
}

export function topRule(rows: readonly HeatmapRow[]): {
  rule: A11yRule;
  count: number;
} {
  const tally: Record<A11yRule, number> = {
    'missing-alt': 0,
    'form-label': 0,
    'heading-order': 0,
    'button-name': 0,
    'color-contrast': 0,
    'focus-order': 0,
    'aria-misuse': 0,
    'tabindex-abuse': 0,
  };
  for (const row of rows) {
    for (const rule of a11yRules) {
      tally[rule.id] += row.counts[rule.id];
    }
  }
  let bestRule: A11yRule = 'missing-alt';
  let bestCount = 0;
  for (const rule of a11yRules) {
    if (tally[rule.id] > bestCount) {
      bestCount = tally[rule.id];
      bestRule = rule.id;
    }
  }
  return { rule: bestRule, count: bestCount };
}
