export interface ProjectSnapshot {
  id: string;
  label: string;
  /** ms epoch */
  at: number;
  /** git ref or short commit */
  head: string;
  routes: { staticIsr: number; dynamic: number; total: number };
  diagnostics: { err: number; warn: number; hint: number };
  bundleKb: number;
  /** notable changes since previous snapshot */
  highlights: string[];
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * 6 mock snapshots over the past 30 days. Trends:
 *   - routes grow gently
 *   - diagnostics dip mid-stream then climb on a feature push
 *   - bundle has one regression then recovers
 */
export const snapshots: ReadonlyArray<ProjectSnapshot> = [
  {
    id: 'snap_0',
    label: 'Baseline',
    at: Date.now() - 30 * DAY,
    head: 'a1f3c0e',
    routes: { staticIsr: 9, dynamic: 5, total: 14 },
    diagnostics: { err: 4, warn: 11, hint: 8 },
    bundleKb: 312,
    highlights: ['initial inventory'],
  },
  {
    id: 'snap_1',
    label: 'Cache lineage rollout',
    at: Date.now() - 24 * DAY,
    head: 'b27ae1d',
    routes: { staticIsr: 10, dynamic: 5, total: 15 },
    diagnostics: { err: 3, warn: 9, hint: 7 },
    bundleKb: 305,
    highlights: ['+1 ISR route', 'cache tags rebuilt', '−1 error'],
  },
  {
    id: 'snap_2',
    label: 'Auth refactor',
    at: Date.now() - 18 * DAY,
    head: 'c4422af',
    routes: { staticIsr: 10, dynamic: 6, total: 16 },
    diagnostics: { err: 2, warn: 8, hint: 9 },
    bundleKb: 298,
    highlights: ['+1 dynamic admin route', 'requireRole moved to middleware'],
  },
  {
    id: 'snap_3',
    label: 'Commerce feature push',
    at: Date.now() - 12 * DAY,
    head: 'd9e0f12',
    routes: { staticIsr: 11, dynamic: 6, total: 17 },
    diagnostics: { err: 5, warn: 13, hint: 11 },
    bundleKb: 348,
    highlights: ['+1 static checkout step', '+5 client islands', 'bundle +50 KB'],
  },
  {
    id: 'snap_4',
    label: 'Stabilization',
    at: Date.now() - 6 * DAY,
    head: 'e1c8b09',
    routes: { staticIsr: 12, dynamic: 5, total: 17 },
    diagnostics: { err: 1, warn: 7, hint: 9 },
    bundleKb: 318,
    highlights: ['promoted /products to ISR', '−4 errors', 'bundle −30 KB'],
  },
  {
    id: 'snap_5',
    label: 'HEAD',
    at: Date.now() - 1 * DAY,
    head: 'f5b27cd',
    routes: { staticIsr: 12, dynamic: 6, total: 18 },
    diagnostics: { err: 1, warn: 6, hint: 10 },
    bundleKb: 322,
    highlights: ['+1 dynamic api route', 'lighthouse +4 perf'],
  },
];

function fmtSign(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Human-readable diff between two snapshots. Order is `from -> to`.
 */
export function diff(a: ProjectSnapshot, b: ProjectSnapshot): string[] {
  const out: string[] = [];
  const dStatic = b.routes.staticIsr - a.routes.staticIsr;
  const dDyn = b.routes.dynamic - a.routes.dynamic;
  const dTotal = b.routes.total - a.routes.total;
  if (dTotal !== 0) out.push(`routes total ${fmtSign(dTotal)} (${a.routes.total} → ${b.routes.total})`);
  if (dStatic !== 0) out.push(`static/ISR ${fmtSign(dStatic)}`);
  if (dDyn !== 0) out.push(`dynamic ${fmtSign(dDyn)}`);

  const dErr = b.diagnostics.err - a.diagnostics.err;
  const dWarn = b.diagnostics.warn - a.diagnostics.warn;
  const dHint = b.diagnostics.hint - a.diagnostics.hint;
  if (dErr !== 0) out.push(`errors ${fmtSign(dErr)}`);
  if (dWarn !== 0) out.push(`warnings ${fmtSign(dWarn)}`);
  if (dHint !== 0) out.push(`hints ${fmtSign(dHint)}`);

  const dKb = b.bundleKb - a.bundleKb;
  if (dKb !== 0) out.push(`bundle ${fmtSign(dKb)} KB (${a.bundleKb} → ${b.bundleKb})`);

  if (out.length === 0) out.push('no measurable changes');
  return out;
}

export function formatRelative(at: number, now: number = Date.now()): string {
  const ms = now - at;
  const days = Math.round(ms / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}
