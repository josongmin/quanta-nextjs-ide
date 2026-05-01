import { z } from 'zod';
import { codeLocationZ } from './code-location';

export const cacheTagSiteZ = z.object({
  location: codeLocationZ,
  kind: z.enum(['producer', 'invalidator']),
  fetchUrl: z.string().optional(),
  revalidate: z.number().int().nullable().optional(),
});
export type CacheTagSite = z.infer<typeof cacheTagSiteZ>;

export const cacheTagZ = z.object({
  id: z.string(),
  name: z.string(),
  producers: z.array(cacheTagSiteZ).default([]),
  invalidators: z.array(cacheTagSiteZ).default([]),
  affectedRouteIds: z.array(z.string()).default([]),
  inconsistencyGroup: z.string().optional(),
});
export type CacheTag = z.infer<typeof cacheTagZ>;

export const fetchSiteZ = z.object({
  id: z.string(),
  url: z.string(),
  location: codeLocationZ,
  cacheMode: z.enum(['default', 'force-cache', 'no-store', 'unset']),
  revalidate: z.number().int().nullable().optional(),
  tags: z.array(z.string()).default([]),
  inferredKind: z
    .enum([
      'public-static',
      'public-semi-static',
      'user-specific',
      'session-specific',
      'mutation-result',
      'sensitive',
      'realtime',
      'unknown',
    ])
    .default('unknown'),
});
export type FetchSite = z.infer<typeof fetchSiteZ>;
