export interface RouteBudget {
  readonly id: string;
  readonly route: string;
  readonly currentKb: number;
  readonly budgetKb: number;
  readonly currentLcpMs: number;
  readonly currentTbtMs: number;
}

export interface Candidate {
  readonly id: string;
  readonly label: string;
  readonly kind: 'lib' | 'asset' | 'route';
  readonly sizeKB: number;
  readonly lcpDeltaMs: number;
  readonly tbtDeltaMs: number;
  readonly note: string;
  /** ids of routes this candidate touches; empty array = all routes */
  readonly affects: ReadonlyArray<string>;
}

export const ROUTES: ReadonlyArray<RouteBudget> = [
  { id: 'home', route: '/', currentKb: 168, budgetKb: 220, currentLcpMs: 1800, currentTbtMs: 110 },
  { id: 'products', route: '/products', currentKb: 196, budgetKb: 240, currentLcpMs: 2050, currentTbtMs: 145 },
  { id: 'product', route: '/products/[id]', currentKb: 211, budgetKb: 260, currentLcpMs: 2180, currentTbtMs: 162 },
  { id: 'pricing', route: '/pricing', currentKb: 132, budgetKb: 200, currentLcpMs: 1620, currentTbtMs: 88 },
  { id: 'blog', route: '/blog', currentKb: 144, budgetKb: 200, currentLcpMs: 1700, currentTbtMs: 95 },
  { id: 'post', route: '/blog/[slug]', currentKb: 178, budgetKb: 240, currentLcpMs: 1980, currentTbtMs: 122 },
  { id: 'dashboard', route: '/dashboard', currentKb: 248, budgetKb: 280, currentLcpMs: 2350, currentTbtMs: 188 },
  { id: 'settings', route: '/settings', currentKb: 154, budgetKb: 220, currentLcpMs: 1750, currentTbtMs: 105 },
];

export const CANDIDATES: ReadonlyArray<Candidate> = [
  { id: 'recharts', label: 'recharts', kind: 'lib', sizeKB: 200, lcpDeltaMs: 180, tbtDeltaMs: 90, note: 'Charting lib', affects: ['dashboard'] },
  { id: 'framer-motion', label: 'framer-motion', kind: 'lib', sizeKB: 60, lcpDeltaMs: 50, tbtDeltaMs: 22, note: 'Animations', affects: [] },
  { id: 'dayjs', label: 'dayjs', kind: 'lib', sizeKB: 8, lcpDeltaMs: 6, tbtDeltaMs: 4, note: 'Date utility', affects: [] },
  { id: 'lodash', label: 'lodash', kind: 'lib', sizeKB: 71, lcpDeltaMs: 38, tbtDeltaMs: 26, note: 'Utility belt', affects: [] },
  { id: 'three', label: 'three', kind: 'lib', sizeKB: 590, lcpDeltaMs: 420, tbtDeltaMs: 220, note: '3D engine', affects: ['home', 'product'] },
  { id: 'monaco', label: 'monaco-editor', kind: 'lib', sizeKB: 880, lcpDeltaMs: 540, tbtDeltaMs: 310, note: 'Code editor', affects: ['settings'] },
  { id: 'sentry', label: '@sentry/react', kind: 'lib', sizeKB: 72, lcpDeltaMs: 30, tbtDeltaMs: 18, note: 'Error reporting', affects: [] },
  { id: 'pdfjs', label: 'pdfjs-dist', kind: 'lib', sizeKB: 320, lcpDeltaMs: 220, tbtDeltaMs: 110, note: 'PDF rendering', affects: ['post'] },
  { id: 'hero-image', label: '3MB hero image', kind: 'asset', sizeKB: 3072, lcpDeltaMs: 600, tbtDeltaMs: 0, note: 'Above-the-fold', affects: ['home'] },
  { id: 'avatar-set', label: '24 avatar PNGs (480KB)', kind: 'asset', sizeKB: 480, lcpDeltaMs: 70, tbtDeltaMs: 0, note: 'Below the fold', affects: ['blog', 'post'] },
  { id: 'video-poster', label: '1.2MB video poster', kind: 'asset', sizeKB: 1228, lcpDeltaMs: 320, tbtDeltaMs: 0, note: 'Hero variant', affects: ['products'] },
  { id: 'reports-route', label: 'New /reports dynamic route', kind: 'route', sizeKB: 240, lcpDeltaMs: 0, tbtDeltaMs: 0, note: 'Adds chunk on hover', affects: ['dashboard'] },
];

export interface SimulatedRoute extends RouteBudget {
  readonly simulatedKb: number;
  readonly simulatedLcpMs: number;
  readonly simulatedTbtMs: number;
  readonly overBudget: boolean;
  readonly deltaKb: number;
}

export function simulate(selectedIds: ReadonlyArray<string>): ReadonlyArray<SimulatedRoute> {
  const selected = CANDIDATES.filter((c) => selectedIds.includes(c.id));
  return ROUTES.map((r) => {
    let kb = 0;
    let lcp = 0;
    let tbt = 0;
    for (const c of selected) {
      const touches = c.affects.length === 0 || c.affects.includes(r.id);
      if (!touches) continue;
      // libs/assets contribute fully when route uses them
      kb += c.sizeKB;
      lcp += c.lcpDeltaMs;
      tbt += c.tbtDeltaMs;
    }
    const simulatedKb = r.currentKb + kb;
    return {
      ...r,
      simulatedKb,
      simulatedLcpMs: r.currentLcpMs + lcp,
      simulatedTbtMs: r.currentTbtMs + tbt,
      overBudget: simulatedKb > r.budgetKb,
      deltaKb: kb,
    };
  });
}

export interface AggregateImpact {
  readonly totalKb: number;
  readonly maxLcpDeltaMs: number;
  readonly blowing: ReadonlyArray<SimulatedRoute>;
}

export function aggregate(sim: ReadonlyArray<SimulatedRoute>): AggregateImpact {
  let totalKb = 0;
  let maxLcp = 0;
  const blowing: SimulatedRoute[] = [];
  for (const r of sim) {
    totalKb += r.deltaKb;
    const dLcp = r.simulatedLcpMs - r.currentLcpMs;
    if (dLcp > maxLcp) maxLcp = dLcp;
    if (r.overBudget) blowing.push(r);
  }
  return { totalKb, maxLcpDeltaMs: maxLcp, blowing };
}

export function formatKb(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(0)} KB`;
}
