import { z } from 'zod';

export const apiEndpointKindZ = z.enum(['handler', 'action', 'trpc', 'graphql']);
export type ApiEndpointKind = z.infer<typeof apiEndpointKindZ>;

export const apiHttpMethodZ = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
export type ApiHttpMethod = z.infer<typeof apiHttpMethodZ>;

export const apiEndpointZ = z.object({
  id: z.string(),
  kind: apiEndpointKindZ,
  name: z.string(),
  path: z.string().optional(),
  method: apiHttpMethodZ.optional(),
  file: z.string(),
  line: z.number().int().positive(),
  inputType: z.string().optional(),
  outputType: z.string().optional(),
  hasZodSchema: z.boolean().default(false),
  hasOpenApi: z.boolean().default(false),
  authRequired: z.boolean().default(false),
  consumers: z.array(z.string()).default([]),
  driftedFromConsumer: z.boolean().default(false),
  versionTag: z.string().optional(),
  cacheable: z.boolean().default(false),
  runtime: z.enum(['node', 'edge']).optional(),
  inputShape: z.string().optional(),
  outputShape: z.string().optional(),
});
export type ApiEndpoint = z.infer<typeof apiEndpointZ>;
