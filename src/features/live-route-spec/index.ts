/**
 * Phase 16 — Live Route Spec
 *
 * Public surface:
 *   <LiveRouteSpec editor={...} file={...} />
 *   aggregateRouteSpec(input) — pure helper for tests/storybook.
 */

export { LiveRouteSpec } from './integration';
export { aggregateRouteSpec, findRouteForFile } from './aggregator';
export { RouteSpecCard } from './card';
export type {
  RouteSpec,
  RouteSpecMode,
  RouteSpecCache,
  RouteSpecCacheTag,
  RouteSpecAuth,
  RouteSpecActionSummary,
  RouteSpecDataSummary,
  RouteSpecRisk,
  RouteSpecSection,
  ShippingStatus,
  ModeFamily,
  AdmissionVerdictTone,
} from './types';
