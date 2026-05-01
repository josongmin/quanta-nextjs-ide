import { mockHydrationReports } from '@shared/mocks/runtime';
import type { HydrationNode, HydrationReport } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/hydration-inspector/helpers` consumers keep working.
export type { HydrationMatch, HydrationNode, HydrationReport } from '@shared/types';

export const reports: ReadonlyArray<HydrationReport> = mockHydrationReports;

export function reportFor(routeId: string): HydrationReport | undefined {
  return reports.find((r) => r.routeId === routeId);
}

export function flattenTree(node: HydrationNode): HydrationNode[] {
  const out: HydrationNode[] = [node];
  for (const c of node.children) out.push(...flattenTree(c));
  return out;
}

export function lineDiff(
  a: string,
  b: string,
): Array<{ left: string; right: string; same: boolean }> {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  const out: Array<{ left: string; right: string; same: boolean }> = [];
  for (let i = 0; i < max; i += 1) {
    const left = aLines[i] ?? '';
    const right = bLines[i] ?? '';
    out.push({ left, right, same: left === right });
  }
  return out;
}
