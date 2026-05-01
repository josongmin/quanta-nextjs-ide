import { mockLhReports } from '@shared/mocks/lighthouse';
import type { LhAudit, LhCategory, LhRouteReport } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/lighthouse/helpers` consumers keep working.
export type { LhCategory, LhScore, LhAudit, LhRouteReport } from '@shared/types';

export const lhReports: ReadonlyArray<LhRouteReport> = mockLhReports;

export function reportFor(routeId: string): LhRouteReport | undefined {
  return lhReports.find((r) => r.routeId === routeId);
}

export const LH_CATEGORY_LABEL: Record<LhCategory, string> = {
  perf: 'Performance',
  a11y: 'Accessibility',
  best: 'Best Practices',
  seo: 'SEO',
  pwa: 'PWA',
};

export const LH_CATEGORY_ABBR: Record<LhCategory, string> = {
  perf: 'PERF',
  a11y: 'A11Y',
  best: 'BEST',
  seo: 'SEO',
  pwa: 'PWA',
};

export type ScoreBand = 'good' | 'avg' | 'poor';

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return 'good';
  if (score >= 50) return 'avg';
  return 'poor';
}

export function rankAudits(audits: ReadonlyArray<LhAudit>): LhAudit[] {
  const order: Record<LhAudit['impact'], number> = { high: 0, med: 1, low: 2 };
  return [...audits].sort((x, y) => order[x.impact] - order[y.impact]);
}

export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export function rateLcp(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 2500) return 'good';
  if (ms <= 4000) return 'needs-improvement';
  return 'poor';
}

export function rateTbt(ms: number): VitalRating {
  if (ms <= 200) return 'good';
  if (ms <= 600) return 'needs-improvement';
  return 'poor';
}

export function rateCls(value: number): VitalRating {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

export function rateTtfb(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 800) return 'good';
  if (ms <= 1800) return 'needs-improvement';
  return 'poor';
}

export function rateFcp(ms: number): VitalRating {
  if (ms <= 0) return 'good';
  if (ms <= 1800) return 'good';
  if (ms <= 3000) return 'needs-improvement';
  return 'poor';
}
