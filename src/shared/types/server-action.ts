import { z } from 'zod';
import { codeLocationZ } from './code-location';

export const actionChecklistItemZ = z.object({
  key: z.enum([
    'validation',
    'auth',
    'role',
    'mutation',
    'revalidate',
    'audit',
    'idempotency',
    'errorEnvelope',
    'transaction',
  ]),
  label: z.string(),
  state: z.enum(['ok', 'missing', 'partial', 'unknown']),
  hint: z.string().optional(),
});
export type ActionChecklistItem = z.infer<typeof actionChecklistItemZ>;

export const serverActionZ = z.object({
  id: z.string(),
  name: z.string(),
  routeId: z.string().nullable(),
  file: z.string(),
  location: codeLocationZ,
  score: z.number().int().min(0).max(100),
  checklist: z.array(actionChecklistItemZ),
  closureCapture: z.boolean(),
  exposedSurface: z.array(z.string()).default([]),
});
export type ServerAction = z.infer<typeof serverActionZ>;

export const routeHandlerZ = z.object({
  id: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  path: z.string(),
  file: z.string(),
  runtime: z.enum(['node', 'edge']),
  hasAuth: z.boolean(),
  hasCacheHeader: z.boolean(),
  hasRateLimit: z.boolean(),
  hasIdempotency: z.boolean(),
  isWebhook: z.boolean(),
  riskCount: z.number().int().nonnegative().default(0),
});
export type RouteHandler = z.infer<typeof routeHandlerZ>;
