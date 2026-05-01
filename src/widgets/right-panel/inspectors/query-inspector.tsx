import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useDatabaseStore } from '@entities/database';
import type { DbQuery, DbQueryKind } from '@shared/types';
import {
  Button,
  Chip,
  CodeBlock,
  Icon,
  Inspector,
  Section,
} from '@shared/ui';
import { EmptyState, KvRow } from '../parts';

interface Props {
  queryId: string;
}

const queryKindTone = (kind: DbQueryKind) =>
  match(kind)
    .with('findMany', () => 'info' as const)
    .with('findUnique', () => 'static' as const)
    .with('findFirst', () => 'static' as const)
    .with('create', () => 'isr' as const)
    .with('update', () => 'isr' as const)
    .with('upsert', () => 'isr' as const)
    .with('delete', () => 'err' as const)
    .with('aggregate', () => 'accent' as const)
    .with('raw', () => 'warn' as const)
    .with('transaction', () => 'server' as const)
    .exhaustive();

interface Risk {
  key: string;
  label: string;
  description: string;
  fix: string;
  tone: 'err' | 'warn' | 'hint';
}

function risksFor(query: DbQuery): Risk[] {
  const out: Risk[] = [];
  if (query.nPlusOne) {
    out.push({
      key: 'n+1',
      label: 'N+1 query',
      description: 'Loop performs an extra round-trip per row — group with `include` or `where in`.',
      fix: 'Replace inner loop with `include`',
      tone: 'err',
    });
  }
  if (query.missingIndex) {
    out.push({
      key: 'no-idx',
      label: 'Missing index',
      description: 'Filter columns not covered by an index — leads to seq scans.',
      fix: 'Add @@index([col])',
      tone: 'warn',
    });
  }
  if (query.unbounded) {
    out.push({
      key: 'unbounded',
      label: 'Unbounded query',
      description: 'No `take` / `skip` clause — entire table is loaded.',
      fix: 'Add take: 50 + cursor pagination',
      tone: 'warn',
    });
  }
  const isMutation =
    query.kind === 'create' ||
    query.kind === 'update' ||
    query.kind === 'delete' ||
    query.kind === 'upsert';
  if (isMutation && !query.inTransaction) {
    out.push({
      key: 'no-tx',
      label: 'No transaction',
      description: 'Mutation without $transaction — partial failure may corrupt data.',
      fix: 'Wrap in prisma.$transaction',
      tone: 'hint',
    });
  }
  if (query.kind === 'raw') {
    out.push({
      key: 'raw',
      label: 'Raw SQL',
      description: 'Raw query bypasses Prisma type-safety — verify parameterization.',
      fix: 'Switch to prisma client API where possible',
      tone: 'warn',
    });
  }
  return out;
}

function suggestedRewrite(query: DbQuery): string {
  if (query.nPlusOne) {
    return [
      '// flatten the n+1 by including the relation up-front',
      'const orders = await prisma.order.findMany({',
      '  where: { userId },',
      '  include: { items: { include: { product: true } } },',
      '  take: 24,',
      '});',
    ].join('\n');
  }
  if (query.unbounded) {
    return [
      'prisma.user.findMany({',
      '  orderBy: { createdAt: \'desc\' },',
      '  take: 50,',
      '  cursor: cursor ? { id: cursor } : undefined,',
      '});',
    ].join('\n');
  }
  if (query.missingIndex) {
    return [
      '// add @@index in schema.prisma:',
      `// model ${query.modelId.replace(/^m_/, '')} {`,
      '//   ...',
      '//   @@index([productId])',
      '// }',
      'await prisma.$migrate dev   # run after schema change',
    ].join('\n');
  }
  if (query.kind === 'raw') {
    return [
      '// Prefer parameterized $queryRaw template:',
      'prisma.$queryRaw`SELECT * FROM products WHERE name ILIKE ${`%${q}%`} LIMIT 50`;',
    ].join('\n');
  }
  return [
    '// Existing query is already in good shape.',
    '// Consider extracting the where-clause into a reusable helper.',
  ].join('\n');
}

export function QueryInspector({ queryId }: Props) {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);
  const query = useDatabaseStore((s) => s.byQuery(queryId));
  const model = useDatabaseStore((s) =>
    query ? s.byModel(query.modelId) : undefined,
  );

  const risks = useMemo(() => (query ? risksFor(query) : []), [query]);

  if (!query) {
    return (
      <Inspector
        title="QUERY"
        meta={queryId}
        pinned={inspectorPinned}
        onTogglePin={togglePin}
      >
        <EmptyState>Query not found.</EmptyState>
      </Inspector>
    );
  }

  // crude index-match heuristic
  const indexMatches = (() => {
    if (!model) return [] as string[];
    return model.indices
      .filter((idx) => {
        // Pretend the where-clause uses the first key field; matches if it appears
        return idx.fields.some((f) => query.shape.includes(f));
      })
      .map((idx) => `[${idx.fields.join(', ')}]${idx.unique ? ' unique' : ''}`);
  })();

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">QUERY</span>
          <Chip tone={queryKindTone(query.kind)} size="xs" className="font-mono">
            {query.kind}
          </Chip>
          <span className="font-mono text-sm text-ink-1">{model?.name ?? '—'}</span>
        </span>
      }
      meta={
        <span className="font-mono text-xs">
          {query.site.file}:<span className="text-ink-2">{query.site.line}</span>
        </span>
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
      rightActions={
        <Button
          size="xs"
          tone="soft"
          onClick={() => {
            const file = query.site.file;
            openTab({ id: `tab-${file}`, file, label: file.split('/').pop() ?? file });
            toast(`Open ${file}:${query.site.line}`);
          }}
        >
          Open
        </Button>
      }
    >
      {/* Query summary */}
      <Section title="Query" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Kind">
            <Chip tone={queryKindTone(query.kind)} size="xs" className="font-mono">
              {query.kind}
            </Chip>
          </KvRow>
          <KvRow label="Model">
            <button
              type="button"
              onClick={() =>
                setInspectorContext({ kind: 'db', modelId: query.modelId })
              }
              className="font-mono text-xs text-accent hover:underline"
            >
              {model?.name ?? query.modelId}
            </button>
          </KvRow>
          <KvRow label="Site" mono>
            {query.site.file}:{query.site.line}
          </KvRow>
          <KvRow label="Fanout">
            <span className="font-mono text-xs text-ink-2">~{query.fanout}</span>
          </KvRow>
          <KvRow label="In tx">
            <span className="font-mono text-xs text-ink-2">
              {query.inTransaction ? 'yes' : 'no'}
            </span>
          </KvRow>
        </div>
      </Section>

      {/* Shape */}
      <Section title="Shape" defaultOpen>
        <CodeBlock
          code={query.shape}
          language="ts"
          showLineNumbers
          maxHeight={220}
        />
      </Section>

      {/* Risks */}
      <Section title={`Risks (${risks.length})`} defaultOpen>
        {risks.length === 0 ? (
          <EmptyState>No risks detected.</EmptyState>
        ) : (
          <div className="space-y-1.5">
            {risks.map((r) => (
              <div
                key={r.key}
                className="flex items-start gap-2 rounded-sm border border-line bg-bg-subtle/40 px-2 py-1.5"
              >
                <Chip tone={r.tone} size="xs">
                  {r.label}
                </Chip>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-ink-2">{r.description}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                    fix: {r.fix}
                  </div>
                </div>
                <Button
                  size="xs"
                  tone="soft"
                  onClick={() => toast(`Apply fix: ${r.fix}`)}
                >
                  Fix
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Reachability */}
      <Section title={`Reachability (${query.routeIds.length})`} defaultOpen={false}>
        {query.routeIds.length === 0 ? (
          <EmptyState>No routes reach this query.</EmptyState>
        ) : (
          <div className="flex flex-wrap gap-1">
            {query.routeIds.map((rid) => (
              <Chip key={rid} tone="info" size="xs" className="font-mono">
                <Icon.Globe className="h-2.5 w-2.5" /> {rid}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      {/* Suggested rewrite */}
      <Section title="Suggested rewrite" defaultOpen={false}>
        <CodeBlock
          code={suggestedRewrite(query)}
          language="ts"
          diff="after"
          showLineNumbers
          maxHeight={200}
        />
        <div className="mt-2 flex justify-end">
          <Button size="xs" tone="soft" onClick={() => toast('Apply rewrite (preview)')}>
            Apply rewrite
          </Button>
        </div>
      </Section>

      {/* Indexes used */}
      <Section title={`Indexes used (${indexMatches.length})`} defaultOpen={false}>
        {indexMatches.length === 0 ? (
          <EmptyState>No matching indexes — likely a sequential scan.</EmptyState>
        ) : (
          <div className="space-y-0.5">
            {indexMatches.map((idx, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 font-mono text-xs text-ink-2"
              >
                <Icon.Layers className="h-3 w-3 text-ink-3" />
                <span>{idx}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Inspector>
  );
}
