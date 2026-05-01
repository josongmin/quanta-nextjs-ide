import { z } from 'zod';
import { codeLocationZ } from './code-location';

export const clientIslandZ = z.object({
  id: z.string(),
  file: z.string(),
  name: z.string(),
  reasons: z.array(z.string()),
  estimatedKb: z.number().nonnegative(),
  affectedRouteIds: z.array(z.string()).default([]),
  isRoot: z.boolean().default(false),
  excessive: z.boolean().default(false),
});
export type ClientIsland = z.infer<typeof clientIslandZ>;

export const layoutInfoZ = z.object({
  id: z.string(),
  file: z.string(),
  affectedRouteCount: z.number().int().nonnegative(),
  isClientBoundary: z.boolean(),
  usesCookies: z.boolean(),
  usesHeaders: z.boolean(),
  pollutionScore: z.number().int().min(0).max(100),
});
export type LayoutInfo = z.infer<typeof layoutInfoZ>;

export const envVarZ = z.object({
  name: z.string(),
  scope: z.enum(['server-only', 'public', 'mixed', 'unknown']),
  fileCount: z.number().int().nonnegative(),
  leakRisk: z.enum(['none', 'low', 'medium', 'high']).default('none'),
});
export type EnvVar = z.infer<typeof envVarZ>;

export const middlewareInfoZ = z.object({
  file: z.string(),
  matcher: z.array(z.string()),
  runtime: z.enum(['node', 'edge']),
  usesAuthCheck: z.boolean(),
  usesRedirect: z.boolean(),
  usesDb: z.boolean(),
  matchesStaticAssets: z.boolean(),
  matchesAllRoutes: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type MiddlewareInfo = z.infer<typeof middlewareInfoZ>;

export const importLeakZ = z.object({
  fromFile: z.string(),
  toFile: z.string(),
  symbol: z.string(),
  location: codeLocationZ,
  reason: z.enum(['server-only-in-client', 'browser-only-in-server', 'secret-in-client']),
});
export type ImportLeak = z.infer<typeof importLeakZ>;
