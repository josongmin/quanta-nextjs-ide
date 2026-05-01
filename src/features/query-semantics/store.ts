import { create } from 'zustand';
import type { Diagnostic } from '@shared/types';
import { detectSmells } from './detector';
import { SMELL_LABEL, SMELL_RULE_ID, type QuerySmell, type QuerySmellKind } from './types';

const SAMPLE_FILES = [
  {
    file: 'app/dashboard/page.tsx',
    isListPage: true,
    routeId: 'dashboard',
    source: `
import { prisma } from '@/lib/prisma';
export default async function Page() {
  const orgs = await prisma.organization.findMany();
  const enriched = await Promise.all(
    orgs.map(async (org) => {
      const owner = await prisma.user.findUnique({ where: { id: org.ownerId } });
      return { ...org, owner };
    }),
  );
  return <Table rows={enriched} />;
}
`,
  },
  {
    file: 'app/projects/page.tsx',
    isListPage: true,
    routeId: 'projects',
    source: `
import { prisma } from '@/lib/prisma';
export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { owner: true, members: true, tasks: true, comments: true },
  });
  return <ProjectGrid projects={projects} />;
}
`,
  },
  {
    file: 'app/post/actions.ts',
    routeId: 'post',
    source: `
'use server';
import { prisma } from '@/lib/prisma';
export async function publishPost(id: string) {
  await prisma.post.update({ where: { id }, data: { published: true } });
  await prisma.notification.create({ data: { type: 'post.published', postId: id } });
  await prisma.auditLog.create({ data: { event: 'publish', postId: id } });
}
`,
  },
  {
    file: 'app/users/page.tsx',
    isListPage: true,
    routeId: 'users',
    source: `
import { prisma } from '@/lib/prisma';
export default async function UsersPage() {
  const users = await prisma.user.findMany();
  return <UserList users={users} />;
}
`,
  },
] as const;

interface QuerySemanticsStore {
  smells: QuerySmell[];
  filterKind: QuerySmellKind | 'all';
  expandedId: string | null;
  setFilter(k: QuerySmellKind | 'all'): void;
  setExpanded(id: string | null): void;
  toDiagnostics(): Diagnostic[];
  byKind(): Record<QuerySmellKind, QuerySmell[]>;
}

export const useQuerySemanticsStore = create<QuerySemanticsStore>((set, get) => {
  const smells = detectSmells([...SAMPLE_FILES]);
  return {
    smells,
    filterKind: 'all',
    expandedId: smells[0]?.id ?? null,
    setFilter: (k) => set({ filterKind: k }),
    setExpanded: (id) => set({ expandedId: id }),
    toDiagnostics: () => {
      const out: Diagnostic[] = [];
      for (const s of get().smells) {
        out.push({
          id: `qs-${s.id}`,
          ruleId: SMELL_RULE_ID[s.kind],
          title: SMELL_LABEL[s.kind],
          message: s.message,
          severity: s.severity === 'high' ? 'err' : s.severity === 'medium' ? 'warn' : 'info',
          confidence: 'medium',
          scope: 'query-semantics',
          ...(s.routeId ? { routeId: s.routeId } : {}),
          location: { file: s.file, line: s.line },
          evidence: [],
          impact: [],
          affectedRouteIds: s.routeId ? [s.routeId] : [],
          fixes: [],
          introducedInCurrentDiff: false,
          category: 'db',
        });
      }
      return out;
    },
    byKind: () => {
      const acc: Record<QuerySmellKind, QuerySmell[]> = {
        'n+1': [],
        'no-pagination': [],
        'no-transaction': [],
        'heavy-include': [],
        'select-star': [],
      };
      for (const s of get().smells) acc[s.kind].push(s);
      return acc;
    },
  };
});
