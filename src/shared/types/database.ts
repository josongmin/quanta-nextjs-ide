import { z } from 'zod';
import { codeLocationZ } from './code-location';

// ── Prisma model description ─────────────────────────────────────────────
export const prismaFieldZ = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().default(false),
  isId: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  relation: z.string().optional(),
});
export type PrismaField = z.infer<typeof prismaFieldZ>;

export const prismaIndexZ = z.object({
  fields: z.array(z.string()),
  unique: z.boolean().default(false),
  name: z.string().optional(),
});
export type PrismaIndex = z.infer<typeof prismaIndexZ>;

export const prismaModelZ = z.object({
  id: z.string(),
  name: z.string(),
  tableName: z.string().optional(),
  fields: z.array(prismaFieldZ),
  indices: z.array(prismaIndexZ).default([]),
  rowCountEst: z.number().int().nonnegative().default(0),
  hotPaths: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});
export type PrismaModel = z.infer<typeof prismaModelZ>;

// ── DB query call site ───────────────────────────────────────────────────
export const dbQueryKindZ = z.enum([
  'findMany',
  'findUnique',
  'findFirst',
  'create',
  'update',
  'upsert',
  'delete',
  'aggregate',
  'raw',
  'transaction',
]);
export type DbQueryKind = z.infer<typeof dbQueryKindZ>;

export const dbQuerySiteZ = z.object({
  file: z.string(),
  line: z.number().int().positive(),
});
export type DbQuerySite = z.infer<typeof dbQuerySiteZ>;

export const dbQueryZ = z.object({
  id: z.string(),
  modelId: z.string(),
  site: dbQuerySiteZ,
  kind: dbQueryKindZ,
  shape: z.string(),
  fanout: z.number().int().nonnegative().default(1),
  nPlusOne: z.boolean().default(false),
  missingIndex: z.boolean().default(false),
  unbounded: z.boolean().default(false),
  inTransaction: z.boolean().default(false),
  routeIds: z.array(z.string()).default([]),
});
export type DbQuery = z.infer<typeof dbQueryZ>;

// ── DB transaction ───────────────────────────────────────────────────────
export const dbTransactionStepZ = z.object({
  queryId: z.string(),
  kind: dbQueryKindZ,
});
export type DbTransactionStep = z.infer<typeof dbTransactionStepZ>;

export const dbTransactionZ = z.object({
  id: z.string(),
  site: dbQuerySiteZ,
  steps: z.array(dbTransactionStepZ),
  hasRollbackPath: z.boolean().default(true),
});
export type DbTransaction = z.infer<typeof dbTransactionZ>;

// silence unused codeLocationZ import — keep symmetry with peers; export alias
export const dbCodeLocationZ = codeLocationZ;
