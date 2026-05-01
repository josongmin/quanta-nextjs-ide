import { z } from 'zod';

// -----------------------------------------------------------------------------
// Bundle composition
// -----------------------------------------------------------------------------

export const bundleNodeKindZ = z.enum([
  'package',
  'module',
  'chunk',
  'shared',
  'monorepo',
]);
export type BundleNodeKind = z.infer<typeof bundleNodeKindZ>;

export const bundleSideZ = z.enum(['server', 'client', 'shared']);
export type BundleSide = z.infer<typeof bundleSideZ>;

// Recursive shape — declared via interface + lazy schema, mirroring routeTreeNodeZ.
export interface BundleNode {
  id: string;
  name: string;
  /** size in bytes (gzip estimate) */
  size: number;
  kind: BundleNodeKind;
  children?: BundleNode[];
  side: BundleSide;
  /** route ids that include this node */
  routes?: string[];
}

const baseBundleNodeZ = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().nonnegative(),
  kind: bundleNodeKindZ,
  side: bundleSideZ,
  routes: z.array(z.string()).optional(),
});

export const bundleNodeZ: z.ZodType<BundleNode> = baseBundleNodeZ.extend({
  children: z.lazy(() => z.array(bundleNodeZ)).optional(),
});

// -----------------------------------------------------------------------------
// Web vitals
// -----------------------------------------------------------------------------

export const webVitalsScoreZ = z.object({
  /** Largest Contentful Paint, milliseconds */
  lcp: z.number().nonnegative(),
  /** First Input Delay (or INP), milliseconds */
  fid: z.number().nonnegative(),
  /** Cumulative Layout Shift, unitless */
  cls: z.number().nonnegative(),
  /** Time To First Byte, milliseconds */
  ttfb: z.number().nonnegative(),
  /** First Contentful Paint, milliseconds */
  fcp: z.number().nonnegative(),
  /** Interaction to Next Paint, milliseconds */
  inp: z.number().nonnegative(),
});
export type WebVitalsScore = z.infer<typeof webVitalsScoreZ>;

export const routeVitalsZ = z.object({
  routeId: z.string(),
  estimated: webVitalsScoreZ,
  budget: webVitalsScoreZ,
  confidence: z.enum(['high', 'medium', 'low']),
});
export type RouteVitals = z.infer<typeof routeVitalsZ>;

// -----------------------------------------------------------------------------
// Performance budget
// -----------------------------------------------------------------------------

export const renderingAllowanceZ = z.enum(['static', 'isr', 'dynamic']);
export type RenderingAllowance = z.infer<typeof renderingAllowanceZ>;

export const forbiddenApiZ = z.enum([
  'cookies',
  'headers',
  'searchParams',
  'fetch-no-store',
]);
export type ForbiddenApi = z.infer<typeof forbiddenApiZ>;

export const perfBudgetZ = z.object({
  routeId: z.string(),
  maxClientKb: z.number().nonnegative(),
  maxServerMs: z.number().nonnegative(),
  allowedRendering: z.array(renderingAllowanceZ).readonly(),
  forbiddenApis: z.array(forbiddenApiZ).readonly(),
  /** current measurements */
  currentClientKb: z.number().nonnegative(),
  currentServerMs: z.number().nonnegative(),
  violations: z.array(z.string()).readonly(),
});
export type PerfBudget = z.infer<typeof perfBudgetZ>;
