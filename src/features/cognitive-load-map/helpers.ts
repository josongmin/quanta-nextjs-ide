export type Area = 'app' | 'features' | 'widgets' | 'shared' | 'entities';

export interface FileMetric {
  file: string;
  area: Area;
  complexity: number; // 1-50 cyclomatic mock
  editFreq30d: number; // 0-25 commits in last 30 days
  authors: number; // 1-5
  ageDays: number; // 0-1500
}

export type RiskTier = 'low' | 'med' | 'high';
export type SuggestedAction = 'split' | 'test more' | 'freeze refactor' | 'monitor';

const RAW: ReadonlyArray<Omit<FileMetric, 'area'> & { area: Area }> = [
  { file: 'app/(shop)/cart/page.tsx', area: 'app', complexity: 32, editFreq30d: 18, authors: 4, ageDays: 412 },
  { file: 'app/(shop)/checkout/page.tsx', area: 'app', complexity: 41, editFreq30d: 22, authors: 5, ageDays: 380 },
  { file: 'app/api/orders/route.ts', area: 'app', complexity: 28, editFreq30d: 14, authors: 3, ageDays: 220 },
  { file: 'app/api/auth/[...nextauth]/route.ts', area: 'app', complexity: 18, editFreq30d: 4, authors: 2, ageDays: 600 },
  { file: 'app/(marketing)/page.tsx', area: 'app', complexity: 8, editFreq30d: 2, authors: 2, ageDays: 720 },
  { file: 'app/layout.tsx', area: 'app', complexity: 12, editFreq30d: 6, authors: 3, ageDays: 900 },
  { file: 'app/(shop)/product/[slug]/page.tsx', area: 'app', complexity: 24, editFreq30d: 11, authors: 3, ageDays: 310 },
  { file: 'app/api/webhooks/stripe/route.ts', area: 'app', complexity: 22, editFreq30d: 7, authors: 2, ageDays: 240 },

  { file: 'features/auth-flow-tracer/index.tsx', area: 'features', complexity: 36, editFreq30d: 15, authors: 4, ageDays: 280 },
  { file: 'features/comment-thread/index.tsx', area: 'features', complexity: 29, editFreq30d: 9, authors: 3, ageDays: 190 },
  { file: 'features/diff-approval/index.tsx', area: 'features', complexity: 33, editFreq30d: 12, authors: 3, ageDays: 320 },
  { file: 'features/api-playground/index.tsx', area: 'features', complexity: 45, editFreq30d: 19, authors: 5, ageDays: 410 },
  { file: 'features/route-flow-editor/index.tsx', area: 'features', complexity: 40, editFreq30d: 21, authors: 4, ageDays: 260 },
  { file: 'features/quick-docs/index.tsx', area: 'features', complexity: 11, editFreq30d: 3, authors: 2, ageDays: 180 },
  { file: 'features/symbol-popularity/index.tsx', area: 'features', complexity: 14, editFreq30d: 5, authors: 2, ageDays: 220 },
  { file: 'features/blast-radius/index.tsx', area: 'features', complexity: 38, editFreq30d: 17, authors: 4, ageDays: 290 },
  { file: 'features/render-reasoner/index.tsx', area: 'features', complexity: 27, editFreq30d: 10, authors: 3, ageDays: 200 },
  { file: 'features/perf-budget-simulator/index.tsx', area: 'features', complexity: 31, editFreq30d: 13, authors: 3, ageDays: 250 },

  { file: 'widgets/bottom-panel/index.tsx', area: 'widgets', complexity: 21, editFreq30d: 8, authors: 3, ageDays: 460 },
  { file: 'widgets/bottom-panel/parts/bundle-treemap.tsx', area: 'widgets', complexity: 26, editFreq30d: 6, authors: 2, ageDays: 360 },
  { file: 'widgets/bottom-panel/parts/web-vitals-dial.tsx', area: 'widgets', complexity: 17, editFreq30d: 4, authors: 2, ageDays: 320 },
  { file: 'widgets/header-bar/index.tsx', area: 'widgets', complexity: 13, editFreq30d: 5, authors: 2, ageDays: 700 },
  { file: 'widgets/sidebar/index.tsx', area: 'widgets', complexity: 19, editFreq30d: 7, authors: 3, ageDays: 540 },
  { file: 'widgets/command-palette/index.tsx', area: 'widgets', complexity: 30, editFreq30d: 11, authors: 3, ageDays: 410 },

  { file: 'shared/ui/overlay-panel.tsx', area: 'shared', complexity: 9, editFreq30d: 3, authors: 2, ageDays: 800 },
  { file: 'shared/ui/button.tsx', area: 'shared', complexity: 6, editFreq30d: 2, authors: 2, ageDays: 1100 },
  { file: 'shared/ui/chip.tsx', area: 'shared', complexity: 7, editFreq30d: 2, authors: 1, ageDays: 980 },
  { file: 'shared/ui/popover.tsx', area: 'shared', complexity: 11, editFreq30d: 3, authors: 1, ageDays: 720 },
  { file: 'shared/ui/code-block.tsx', area: 'shared', complexity: 16, editFreq30d: 5, authors: 2, ageDays: 540 },
  { file: 'shared/lib/cn.ts', area: 'shared', complexity: 3, editFreq30d: 1, authors: 1, ageDays: 1500 },
  { file: 'shared/lib/format.ts', area: 'shared', complexity: 8, editFreq30d: 2, authors: 1, ageDays: 950 },

  { file: 'entities/user/queries.ts', area: 'entities', complexity: 24, editFreq30d: 10, authors: 3, ageDays: 320 },
  { file: 'entities/user/model.ts', area: 'entities', complexity: 14, editFreq30d: 6, authors: 2, ageDays: 410 },
  { file: 'entities/order/queries.ts', area: 'entities', complexity: 31, editFreq30d: 16, authors: 4, ageDays: 290 },
  { file: 'entities/order/model.ts', area: 'entities', complexity: 18, editFreq30d: 8, authors: 3, ageDays: 350 },
  { file: 'entities/product/queries.ts', area: 'entities', complexity: 22, editFreq30d: 9, authors: 3, ageDays: 380 },
  { file: 'entities/product/model.ts', area: 'entities', complexity: 13, editFreq30d: 4, authors: 2, ageDays: 520 },
  { file: 'entities/review/queries.ts', area: 'entities', complexity: 16, editFreq30d: 5, authors: 2, ageDays: 270 },
  { file: 'entities/cart/queries.ts', area: 'entities', complexity: 26, editFreq30d: 12, authors: 3, ageDays: 240 },
  { file: 'entities/payment/queries.ts', area: 'entities', complexity: 35, editFreq30d: 14, authors: 4, ageDays: 230 },
];

export const FILES: ReadonlyArray<FileMetric> = RAW;

export function rawRisk(f: FileMetric): number {
  return f.complexity * f.editFreq30d;
}

export function tierFor(score: number, max: number): RiskTier {
  if (max === 0) return 'low';
  const r = score / max;
  if (r >= 0.66) return 'high';
  if (r >= 0.33) return 'med';
  return 'low';
}

export function suggestedAction(f: FileMetric, tier: RiskTier): SuggestedAction {
  if (tier === 'high' && f.complexity > 30) return 'split';
  if (tier === 'high') return 'freeze refactor';
  if (tier === 'med' && f.authors >= 4) return 'test more';
  if (tier === 'med') return 'test more';
  return 'monitor';
}

export const AREAS: ReadonlyArray<Area> = ['app', 'features', 'widgets', 'shared', 'entities'];

export interface AreaStat {
  area: Area;
  count: number;
  avgComplexity: number;
  avgFreq: number;
  high: number;
}

export function aggregate(files: ReadonlyArray<FileMetric>, max: number): ReadonlyArray<AreaStat> {
  return AREAS.map((a) => {
    const inA = files.filter((f) => f.area === a);
    if (inA.length === 0) {
      return { area: a, count: 0, avgComplexity: 0, avgFreq: 0, high: 0 };
    }
    const totC = inA.reduce((s, f) => s + f.complexity, 0);
    const totF = inA.reduce((s, f) => s + f.editFreq30d, 0);
    const high = inA.filter((f) => tierFor(rawRisk(f), max) === 'high').length;
    return {
      area: a,
      count: inA.length,
      avgComplexity: Math.round((totC / inA.length) * 10) / 10,
      avgFreq: Math.round((totF / inA.length) * 10) / 10,
      high,
    };
  });
}

export const RECOMMENDATIONS: ReadonlyArray<{ id: string; text: string }> = [
  { id: 'rec1', text: 'Split `features/api-playground/index.tsx` — over 40 LOC of branching.' },
  { id: 'rec2', text: 'Add tests around `entities/payment/queries.ts` before next refactor.' },
  { id: 'rec3', text: 'Freeze refactors on `app/(shop)/checkout/page.tsx` until launch.' },
  { id: 'rec4', text: 'Pair-review `features/route-flow-editor/index.tsx` with one widget owner.' },
  { id: 'rec5', text: 'Quarantine churn in `app/api/orders/route.ts` behind a feature flag.' },
];
