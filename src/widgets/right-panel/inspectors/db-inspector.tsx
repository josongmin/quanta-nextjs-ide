import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDatabaseStore } from '@entities/database';
import type { DbQuery, DbQueryKind, PrismaModel } from '@shared/types';
import { Button, Chip, Icon, Inspector, Section, Tooltip } from '@shared/ui';
import { EmptyState, KvRow } from '../parts';

interface Props {
  modelId?: string;
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

interface SuggestedIndex {
  modelName: string;
  fields: string[];
  reason: string;
  queryId: string;
}

function deriveSuggestedIndices(
  queries: DbQuery[],
  models: PrismaModel[],
): SuggestedIndex[] {
  const out: SuggestedIndex[] = [];
  const modelById = new Map(models.map((m) => [m.id, m] as const));
  const seen = new Set<string>();
  for (const q of queries) {
    if (!q.missingIndex) continue;
    const m = modelById.get(q.modelId);
    if (!m) continue;
    // Heuristic field guess
    const fields = match(q.kind)
      .with('aggregate', () => ['productId'])
      .with('raw', () => ['name'])
      .otherwise(() => ['createdAt']);
    const key = `${m.name}-${fields.join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      modelName: m.name,
      fields,
      reason: `flagged by ${q.id}`,
      queryId: q.id,
    });
  }
  return out;
}

export function DbInspector({ modelId }: Props) {
  const inspectorPinned = useUiStore((s) => s.inspectorPinned);
  const togglePin = useUiStore((s) => s.toggleInspectorPinned);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const models = useDatabaseStore((s) => s.models);
  const queries = useDatabaseStore((s) => s.queries);
  const selected = useDatabaseStore((s) => (modelId ? s.byModel(modelId) : undefined));

  const stats = useMemo(() => {
    return {
      modelCount: models.length,
      queryCount: queries.length,
      nPlusOne: queries.filter((q) => q.nPlusOne).length,
      missingIdx: queries.filter((q) => q.missingIndex).length,
      unbounded: queries.filter((q) => q.unbounded).length,
      raw: queries.filter((q) => q.kind === 'raw').length,
    };
  }, [models, queries]);

  const suggestedIndices = useMemo(
    () => deriveSuggestedIndices(queries, models),
    [queries, models],
  );

  const queriesForModel = useMemo(
    () => (selected ? queries.filter((q) => q.modelId === selected.id) : []),
    [selected, queries],
  );

  // route impact ranking for selected model
  const routeImpact = useMemo(() => {
    if (!selected) return [];
    const counts = new Map<string, number>();
    for (const q of queriesForModel) {
      for (const r of q.routeIds) counts.set(r, (counts.get(r) ?? 0) + q.fanout);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([routeId, weight]) => ({ routeId, weight }));
  }, [selected, queriesForModel]);

  return (
    <Inspector
      title={
        <span className="flex items-center gap-2">
          <span className="text-caps text-[11px] uppercase text-ink-3">DATABASE</span>
          <span className="font-mono text-sm text-ink-1">
            {selected?.name ?? 'project models'}
          </span>
        </span>
      }
      meta={
        selected ? (
          <span className="font-mono text-xs">
            table: <span className="text-ink-2">{selected.tableName ?? selected.name}</span>
            {' · '}
            ~<span className="text-ink-2">{selected.rowCountEst.toLocaleString()}</span> rows
          </span>
        ) : (
          <span className="text-xs text-ink-3">project-wide DB analysis</span>
        )
      }
      pinned={inspectorPinned}
      onTogglePin={togglePin}
    >
      {/* Health snapshot */}
      <Section title="Health snapshot" defaultOpen>
        <div className="space-y-0">
          <KvRow label="Models">
            <span className="font-mono text-xs text-ink-2">{stats.modelCount}</span>
          </KvRow>
          <KvRow label="Queries">
            <span className="font-mono text-xs text-ink-2">{stats.queryCount}</span>
          </KvRow>
          <KvRow label="N+1">
            <span className={stats.nPlusOne > 0 ? 'text-sev-err' : 'text-sem-static'}>
              {stats.nPlusOne}
            </span>
          </KvRow>
          <KvRow label="Missing idx">
            <span className={stats.missingIdx > 0 ? 'text-sev-warn' : 'text-sem-static'}>
              {stats.missingIdx}
            </span>
          </KvRow>
          <KvRow label="Unbounded">
            <span className={stats.unbounded > 0 ? 'text-sev-warn' : 'text-sem-static'}>
              {stats.unbounded}
            </span>
          </KvRow>
          <KvRow label="Raw SQL">
            <span className={stats.raw > 0 ? 'text-sev-warn' : 'text-sem-static'}>
              {stats.raw}
            </span>
          </KvRow>
        </div>
      </Section>

      {/* Model schema (if selected) */}
      {selected ? (
        <Section title={`Schema · ${selected.name}`} defaultOpen>
          <div className="mb-1 text-caps text-[10px] uppercase text-ink-3">Fields</div>
          <div className="space-y-0">
            {selected.fields.map((f) => (
              <div
                key={f.name}
                className="grid min-h-[24px] grid-cols-[1fr_auto] items-center gap-2 py-0.5 text-xs"
              >
                <span className="inline-flex items-center gap-1.5">
                  {f.isId ? (
                    <Icon.Hash className="h-3 w-3 text-accent" />
                  ) : f.relation ? (
                    <Icon.Link className="h-3 w-3 text-sem-isr" />
                  ) : (
                    <span className="inline-block h-3 w-3" />
                  )}
                  <span className="font-mono text-ink-1">{f.name}</span>
                  {!f.nullable && !f.isId ? (
                    <span className="text-sev-warn" title="required">!</span>
                  ) : null}
                  {f.isUnique && !f.isId ? (
                    <Chip tone="muted" size="xs" className="font-mono">
                      unique
                    </Chip>
                  ) : null}
                </span>
                <span className="font-mono text-ink-3">{f.type}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 mb-1 text-caps text-[10px] uppercase text-ink-3">
            Indices ({selected.indices.length})
          </div>
          {selected.indices.length === 0 ? (
            <EmptyState>No indexes declared.</EmptyState>
          ) : (
            <div className="space-y-0.5">
              {selected.indices.map((idx) => (
                <div
                  key={idx.fields.join(',')}
                  className="flex items-center gap-1.5 font-mono text-xs text-ink-2"
                >
                  <Icon.Layers className="h-3 w-3 text-ink-3" />
                  <span>[{idx.fields.join(', ')}]</span>
                  {idx.unique ? (
                    <Chip tone="static" size="xs">
                      unique
                    </Chip>
                  ) : null}
                  {idx.name ? (
                    <span className="ml-auto text-ink-3">{idx.name}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {selected.warnings.length > 0 ? (
            <div className="mt-3 space-y-1">
              {selected.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-sm bg-sev-warn-soft/50 px-2 py-1 text-xs text-sev-warn"
                >
                  <Icon.Alert className="h-3 w-3" />
                  {w}
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* Query callers (per model) */}
      {selected ? (
        <Section title={`Callers (${queriesForModel.length})`} defaultOpen={false}>
          {queriesForModel.length === 0 ? (
            <EmptyState>No queries reference this model.</EmptyState>
          ) : (
            <div className="space-y-0">
              {queriesForModel.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() =>
                    setInspectorContext({ kind: 'query', queryId: q.id })
                  }
                  className="grid w-full grid-cols-[88px_1fr_auto] items-center gap-2 px-1 py-1 text-left text-xs hover:bg-bg-hover"
                >
                  <Chip tone={queryKindTone(q.kind)} size="xs" className="font-mono">
                    {q.kind}
                  </Chip>
                  <span className="min-w-0 truncate font-mono text-ink-2">
                    {q.site.file}
                    <span className="text-ink-3">:{q.site.line}</span>
                  </span>
                  <span className="flex gap-0.5">
                    {q.nPlusOne && <Chip tone="err" size="xs">N+1</Chip>}
                    {q.missingIndex && <Chip tone="warn" size="xs">no-idx</Chip>}
                    {q.unbounded && <Chip tone="warn" size="xs">unbnd</Chip>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>
      ) : null}

      {/* Suggested indices */}
      <Section
        title={`Suggested indexes (${suggestedIndices.length})`}
        defaultOpen={!selected}
      >
        {suggestedIndices.length === 0 ? (
          <EmptyState>No index suggestions.</EmptyState>
        ) : (
          <div className="space-y-1.5">
            {suggestedIndices.slice(0, 4).map((s) => (
              <div
                key={`${s.modelName}-${s.fields.join('-')}`}
                className="flex items-center justify-between gap-2 rounded-sm border border-line bg-bg-subtle/40 px-2 py-1.5"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs text-ink-1">
                    @@index([{s.fields.join(', ')}]) on {s.modelName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-3">{s.reason}</div>
                </div>
                <Button
                  size="xs"
                  tone="soft"
                  onClick={() =>
                    toast(`Apply @@index([${s.fields.join(', ')}]) on ${s.modelName}`)
                  }
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Hot paths (when model selected) */}
      {selected ? (
        <Section title={`Hot paths (${routeImpact.length})`} defaultOpen={false}>
          {routeImpact.length === 0 ? (
            <EmptyState>Not used by any analyzed route.</EmptyState>
          ) : (
            <div className="space-y-0.5">
              {routeImpact.map((r) => (
                <div
                  key={r.routeId}
                  className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon.Globe className="h-3 w-3 text-ink-3" />
                    <span className="font-mono text-ink-2">{r.routeId}</span>
                  </span>
                  <Tooltip content="weight = sum of fanout">
                    <Chip tone="muted" size="xs" className="font-mono">
                      w {r.weight}
                    </Chip>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </Section>
      ) : (
        <Section title="Models" defaultOpen={false}>
          <div className="space-y-0.5">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setInspectorContext({ kind: 'db', modelId: m.id })}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2 px-1 py-1 text-left text-xs hover:bg-bg-hover"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon.Database className="h-3 w-3 text-accent" />
                  <span className="font-mono text-ink-1">{m.name}</span>
                </span>
                <span className="text-[11px] text-ink-3">
                  {m.fields.length}f · {m.indices.length}idx
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}
    </Inspector>
  );
}
