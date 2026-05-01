/**
 * RSC-profiler shape types.
 *
 * Lives in `shared/types` so the `rsc-profiler` feature and the
 * `shared/mocks/runtime.ts` mock data can both reference these without
 * a shared-to-feature import.
 */

export interface RscComponent {
  id: string;
  name: string;
  routeId: string;
  renderMs: number;
  payloadBytes: number;
  awaitsCount: number;
  blockedBy: string[];
  cacheHit: boolean;
  serializationCost: number;
}
