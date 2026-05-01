export type MigrationKind =
  | 'add-table'
  | 'drop-column'
  | 'rename-column'
  | 'add-index'
  | 'change-type'
  | 'add-column'
  | 'drop-table'
  | 'add-fk';

export type RiskLevel = 'low' | 'medium' | 'high';
export type MigrationStage = 'shadow' | 'dual-write' | 'cutover' | 'backfill';

export interface MigrationOp {
  id: string;
  kind: MigrationKind;
  label: string;
  table: string;
  riskLevel: RiskLevel;
  affectedRows: number;
  blocksWrites: boolean;
  stage: MigrationStage;
  downtimeSec: number;
  sql: string;
  impact: ReadonlyArray<{ k: string; v: string }>;
}

export interface MigrationBranch {
  id: string;
  label: string;
  diffSummary: string;
}

export const migrationBranches: ReadonlyArray<MigrationBranch> = [
  { id: 'main', label: 'main', diffSummary: 'no pending diff' },
  { id: 'feat/audit-log', label: 'feat/audit-log', diffSummary: '8 ops · 2 high-risk' },
];

export const migrationOps: ReadonlyArray<MigrationOp> = [
  {
    id: 'op-1',
    kind: 'add-table',
    label: 'Create AuditLog table',
    table: 'AuditLog',
    riskLevel: 'low',
    affectedRows: 0,
    blocksWrites: false,
    stage: 'shadow',
    downtimeSec: 0,
    sql: `CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY,
  "actorId" UUID NULL,
  "action" VARCHAR(64) NOT NULL,
  "payload" JSONB NOT NULL,
  "at" TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    impact: [
      { k: 'rows', v: '0 (new)' },
      { k: 'locks', v: 'none' },
      { k: 'reversible', v: 'yes' },
    ],
  },
  {
    id: 'op-2',
    kind: 'add-index',
    label: 'Add index AuditLog_at_idx',
    table: 'AuditLog',
    riskLevel: 'low',
    affectedRows: 0,
    blocksWrites: false,
    stage: 'shadow',
    downtimeSec: 0,
    sql: `CREATE INDEX CONCURRENTLY "AuditLog_at_idx" ON "AuditLog" ("at");`,
    impact: [
      { k: 'rows', v: '0' },
      { k: 'locks', v: 'SHARE UPDATE EXCLUSIVE' },
      { k: 'reversible', v: 'yes' },
    ],
  },
  {
    id: 'op-3',
    kind: 'add-column',
    label: 'Add User.deletedAt',
    table: 'User',
    riskLevel: 'low',
    affectedRows: 12_482,
    blocksWrites: false,
    stage: 'dual-write',
    downtimeSec: 0,
    sql: `ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMPTZ NULL;`,
    impact: [
      { k: 'rows', v: '12.5k (default null)' },
      { k: 'locks', v: 'ACCESS EXCLUSIVE (brief)' },
      { k: 'reversible', v: 'yes' },
    ],
  },
  {
    id: 'op-4',
    kind: 'rename-column',
    label: 'Rename Post.body → content',
    table: 'Post',
    riskLevel: 'medium',
    affectedRows: 48_209,
    blocksWrites: true,
    stage: 'dual-write',
    downtimeSec: 4,
    sql: `ALTER TABLE "Post" RENAME COLUMN "body" TO "content";`,
    impact: [
      { k: 'rows', v: '48.2k' },
      { k: 'locks', v: 'ACCESS EXCLUSIVE' },
      { k: 'reversible', v: 'yes' },
      { k: 'app changes', v: 'required (read+write)' },
    ],
  },
  {
    id: 'op-5',
    kind: 'change-type',
    label: 'Change Comment.body to TEXT',
    table: 'Comment',
    riskLevel: 'high',
    affectedRows: 122_980,
    blocksWrites: true,
    stage: 'cutover',
    downtimeSec: 22,
    sql: `ALTER TABLE "Comment" ALTER COLUMN "body" TYPE TEXT USING ("body"::TEXT);`,
    impact: [
      { k: 'rows', v: '122.9k' },
      { k: 'locks', v: 'ACCESS EXCLUSIVE' },
      { k: 'reversible', v: 'partial' },
      { k: 'rewrite', v: 'full table' },
    ],
  },
  {
    id: 'op-6',
    kind: 'add-fk',
    label: 'Add FK AuditLog.actorId → User',
    table: 'AuditLog',
    riskLevel: 'medium',
    affectedRows: 0,
    blocksWrites: false,
    stage: 'cutover',
    downtimeSec: 1,
    sql: `ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL;`,
    impact: [
      { k: 'rows', v: '0 (validate skipped)' },
      { k: 'locks', v: 'SHARE ROW EXCLUSIVE' },
      { k: 'reversible', v: 'yes' },
    ],
  },
  {
    id: 'op-7',
    kind: 'drop-column',
    label: 'Drop User.legacyToken',
    table: 'User',
    riskLevel: 'high',
    affectedRows: 12_482,
    blocksWrites: false,
    stage: 'backfill',
    downtimeSec: 0,
    sql: `ALTER TABLE "User" DROP COLUMN "legacyToken";`,
    impact: [
      { k: 'rows', v: '12.5k' },
      { k: 'locks', v: 'ACCESS EXCLUSIVE' },
      { k: 'reversible', v: 'NO (data lost)' },
    ],
  },
  {
    id: 'op-8',
    kind: 'add-index',
    label: 'Add unique index Tag.slug',
    table: 'Tag',
    riskLevel: 'medium',
    affectedRows: 320,
    blocksWrites: false,
    stage: 'backfill',
    downtimeSec: 0,
    sql: `CREATE UNIQUE INDEX CONCURRENTLY "Tag_slug_key" ON "Tag" ("slug");`,
    impact: [
      { k: 'rows', v: '320' },
      { k: 'locks', v: 'SHARE UPDATE EXCLUSIVE' },
      { k: 'reversible', v: 'yes' },
      { k: 'pre-check', v: 'duplicates must be cleaned' },
    ],
  },
];

export const stageOrder: ReadonlyArray<MigrationStage> = [
  'shadow',
  'dual-write',
  'cutover',
  'backfill',
];

export function stageLabel(s: MigrationStage): string {
  switch (s) {
    case 'shadow':
      return 'Shadow';
    case 'dual-write':
      return 'Dual-write';
    case 'cutover':
      return 'Cutover';
    case 'backfill':
      return 'Backfill';
  }
}

export function riskScore(level: RiskLevel): number {
  return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
}

export function kindLabel(k: MigrationKind): string {
  switch (k) {
    case 'add-table':
      return 'add table';
    case 'drop-table':
      return 'drop table';
    case 'add-column':
      return 'add column';
    case 'drop-column':
      return 'drop column';
    case 'rename-column':
      return 'rename';
    case 'change-type':
      return 'change type';
    case 'add-index':
      return 'add index';
    case 'add-fk':
      return 'add fk';
  }
}
