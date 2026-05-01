import { create } from 'zustand';
import {
  parsePrismaSchema,
  type SchemaSnapshot,
} from './parser';
import { diffSnapshots, type SchemaChange } from './diff';
import {
  computeRisks,
  overallReason,
  overallRisk,
  type ChangeRisk,
  type RiskSeverity,
} from './risk';
import type { FieldUsage } from './usage-finder';

const BEFORE_SCHEMA = `
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  body      String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  postId    String
  authorId  String
}
`;

const AFTER_SCHEMA = `
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  displayName String
  createdAt   DateTime @default(now())
  posts       Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  publishedAt DateTime
}
`;

const MOCK_USAGES: FieldUsage[] = [
  {
    modelName: 'user',
    fieldName: 'name',
    kind: 'read',
    file: 'app/profile/page.tsx',
    line: 14,
    snippet: '<h1>{user.name}</h1>',
  },
  {
    modelName: 'user',
    fieldName: 'name',
    kind: 'select',
    file: 'app/api/users/route.ts',
    line: 22,
    snippet: 'select: { id: true, name: true, email: true },',
  },
  {
    modelName: 'post',
    fieldName: 'body',
    kind: 'read',
    file: 'app/post/[id]/page.tsx',
    line: 31,
    snippet: '<article>{post.body}</article>',
  },
  {
    modelName: 'post',
    fieldName: 'body',
    kind: 'write',
    file: 'app/post/actions.ts',
    line: 12,
    snippet: 'data: { title, body, authorId },',
  },
  {
    modelName: 'post',
    fieldName: 'publishedAt',
    kind: 'read',
    file: 'app/post/[id]/page.tsx',
    line: 35,
    snippet: 'publishedAt.toISOString()',
  },
  {
    modelName: 'comment',
    fieldName: 'body',
    kind: 'read',
    file: 'app/post/[id]/page.tsx',
    line: 60,
    snippet: 'comment.body',
  },
];

interface SchemaImpactStore {
  before: SchemaSnapshot;
  after: SchemaSnapshot;
  changes: SchemaChange[];
  risks: ChangeRisk[];
  usages: FieldUsage[];
  selectedChangeId: string | null;
  selectedModel: string | null;
  beforeText: string;
  afterText: string;
  setSelectedChange(id: string | null): void;
  setSelectedModel(name: string | null): void;
  setBeforeText(s: string): void;
  setAfterText(s: string): void;
  recompute(): void;
  overall(): { severity: RiskSeverity; reason: string };
}

export const useSchemaImpactStore = create<SchemaImpactStore>((set, get) => {
  const before = parsePrismaSchema(BEFORE_SCHEMA);
  const after = parsePrismaSchema(AFTER_SCHEMA);
  const changes = diffSnapshots(before, after);
  const risks = computeRisks(changes, MOCK_USAGES);
  return {
    before,
    after,
    changes,
    risks,
    usages: MOCK_USAGES,
    selectedChangeId: changes[0]?.id ?? null,
    selectedModel: after.models[0]?.name ?? null,
    beforeText: BEFORE_SCHEMA,
    afterText: AFTER_SCHEMA,
    setSelectedChange: (id) => set({ selectedChangeId: id }),
    setSelectedModel: (name) => set({ selectedModel: name }),
    setBeforeText: (s) => set({ beforeText: s }),
    setAfterText: (s) => set({ afterText: s }),
    recompute: () => {
      const { beforeText, afterText, usages } = get();
      const b = parsePrismaSchema(beforeText);
      const a = parsePrismaSchema(afterText);
      const c = diffSnapshots(b, a);
      const r = computeRisks(c, usages);
      set({
        before: b,
        after: a,
        changes: c,
        risks: r,
        selectedChangeId: c[0]?.id ?? null,
      });
    },
    overall: () => {
      const r = get().risks;
      return { severity: overallRisk(r), reason: overallReason(r) };
    },
  };
});
