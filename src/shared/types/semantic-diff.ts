import { z } from 'zod';

export const semanticDiffEntryZ = z.object({
  id: z.string(),
  category: z.enum([
    'rendering',
    'cache',
    'boundary',
    'auth',
    'contract',
    'metadata',
    'cost',
  ]),
  routeId: z.string().nullable(),
  scope: z.string(),
  before: z.string(),
  after: z.string(),
  cause: z.string().optional(),
  severity: z.enum(['err', 'warn', 'info']),
});
export type SemanticDiffEntry = z.infer<typeof semanticDiffEntryZ>;

export const semanticDiffZ = z.object({
  base: z.string(),
  head: z.string(),
  entries: z.array(semanticDiffEntryZ),
  generatedAt: z.string().datetime().optional(),
});
export type SemanticDiff = z.infer<typeof semanticDiffZ>;
