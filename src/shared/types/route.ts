import { z } from 'zod';
import { archetypeZ, costClassZ, renderingClassZ } from './severity';

export const boundaryStateZ = z.enum(['present', 'missing', 'na']);
export type BoundaryState = z.infer<typeof boundaryStateZ>;

export const routeBoundariesZ = z.object({
  loading: boundaryStateZ,
  error: boundaryStateZ,
  notFound: boundaryStateZ,
  default: boundaryStateZ,
  template: boundaryStateZ,
});
export type RouteBoundaries = z.infer<typeof routeBoundariesZ>;

export const routeMetadataCoverageZ = z.object({
  title: z.boolean(),
  description: z.boolean(),
  canonical: z.boolean(),
  openGraph: z.boolean(),
  robots: z.boolean(),
  isGenerated: z.boolean(),
});
export type RouteMetadataCoverage = z.infer<typeof routeMetadataCoverageZ>;

export const routeAuthZ = z.object({
  guard: z.enum(['none', 'requireUser', 'requireRole', 'middleware']),
  archetypeExpected: z.enum(['public', 'user', 'admin']),
});
export type RouteAuth = z.infer<typeof routeAuthZ>;

export const dataSourceZ = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['fetch', 'db', 'helper', 'cache']),
  cacheTags: z.array(z.string()).default([]),
  revalidate: z.number().int().nullable().optional(),
  cacheMode: z.enum(['default', 'force-cache', 'no-store', 'unset']).default('unset'),
});
export type DataSource = z.infer<typeof dataSourceZ>;

export const clientIslandRefZ = z.object({
  id: z.string(),
  name: z.string(),
  estimatedKb: z.number().nonnegative(),
});
export type ClientIslandRef = z.infer<typeof clientIslandRefZ>;

export const routeZ = z.object({
  id: z.string(),
  path: z.string(),
  segments: z.array(z.string()),
  archetype: archetypeZ,
  rendering: renderingClassZ,
  renderingConfidence: z.enum(['high', 'medium', 'low']),
  renderingCause: z.string().optional(),
  costClass: costClassZ,
  clientKb: z.number().nonnegative(),
  isParallel: z.boolean().default(false),
  isIntercepting: z.boolean().default(false),
  isGroup: z.boolean().default(false),
  parallelSlot: z.string().optional(),
  cacheTags: z.array(z.string()).default([]),
  boundaries: routeBoundariesZ,
  metadata: routeMetadataCoverageZ,
  auth: routeAuthZ,
  dataSources: z.array(dataSourceZ).default([]),
  islands: z.array(clientIslandRefZ).default([]),
  files: z.object({
    page: z.string().optional(),
    layout: z.string().optional(),
    loading: z.string().optional(),
    error: z.string().optional(),
    notFound: z.string().optional(),
    default: z.string().optional(),
    template: z.string().optional(),
  }),
  riskCount: z.number().int().nonnegative().default(0),
  parentRouteId: z.string().nullable().optional(),
});
export type Route = z.infer<typeof routeZ>;

export interface RouteTreeNode {
  id: string;
  label: string;
  kind: 'segment' | 'group' | 'parallel' | 'intercepting' | 'dynamic' | 'route' | 'file';
  routeId?: string;
  children: RouteTreeNode[];
}

const baseRouteTreeNodeZ = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum([
    'segment',
    'group',
    'parallel',
    'intercepting',
    'dynamic',
    'route',
    'file',
  ]),
  routeId: z.string().optional(),
});

export const routeTreeNodeZ: z.ZodType<RouteTreeNode> = baseRouteTreeNodeZ.extend(
  {
    children: z.lazy(() => z.array(routeTreeNodeZ)),
  },
);
