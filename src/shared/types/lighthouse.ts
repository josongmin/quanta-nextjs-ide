/**
 * Lighthouse audit shape types.
 *
 * Lives in `shared/types` so the `lighthouse` feature and the
 * `shared/mocks/lighthouse.ts` mock data can both reference these
 * without a shared-to-feature import.
 */

export type LhCategory = 'perf' | 'a11y' | 'best' | 'seo' | 'pwa';

export interface LhScore {
  perf: number;
  a11y: number;
  best: number;
  seo: number;
  pwa: number;
}

export interface LhAudit {
  id: string;
  title: string;
  impact: 'high' | 'med' | 'low';
  category: LhCategory;
  saving?: string;
  suggestion?: string;
}

export interface LhRouteReport {
  routeId: string;
  score: LhScore;
  audits: LhAudit[];
  lcp: number;
  tbt: number;
  cls: number;
  ttfb: number;
  fcp: number;
}
