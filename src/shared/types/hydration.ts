/**
 * Hydration-inspector shape types.
 *
 * Lives in `shared/types` so the `hydration-inspector` feature and the
 * `shared/mocks/runtime.ts` mock data can both reference these without
 * a shared-to-feature import.
 */

export type HydrationMatch = 'ok' | 'mismatch' | 'missing-server' | 'missing-client';

export interface HydrationNode {
  id: string;
  tag: string;
  kind: 'server' | 'client';
  serverHtml: string;
  clientHtml: string;
  match: HydrationMatch;
  reason?: string;
  children: HydrationNode[];
}

export interface HydrationReport {
  routeId: string;
  root: HydrationNode;
  mismatches: number;
  ms: number;
}
