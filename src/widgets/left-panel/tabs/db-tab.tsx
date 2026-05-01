import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useDatabaseStore } from '@entities/database';
import type { DbQuery, DbQueryKind, PrismaModel } from '@shared/types';
import {
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Icon,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { SearchInput } from '../parts/search-input';

type DbView = 'models' | 'queries' | 'transactions';
type RiskFilter = 'all' | 'n+1' | 'no-idx' | 'unbounded';

const VIEW_OPTIONS: ReadonlyArray<FilterChipOption<DbView>> = [
  { value: 'models', label: 'Models' },
  { value: 'queries', label: 'Queries' },
  { value: 'transactions', label: 'Tx' },
];

const RISK_OPTIONS: ReadonlyArray<FilterChipOption<RiskFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'n+1', label: 'N+1' },
  { value: 'no-idx', label: 'No-Idx' },
  { value: 'unbounded', label: 'Unbnd' },
];

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

// ── Models view ─────────────────────────────────────────────────────────
function ModelRow({ model, queriesUsing }: { model: PrismaModel; queriesUsing: number }) {
  const [open, setOpen] = useState(false);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const setSelectedModel = useDatabaseStore((s) => s.setSelectedModel);
  return (
    <div className="hairline-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onDoubleClick={() => {
          setSelectedModel(model.id);
          setInspectorContext({ kind: 'db', modelId: model.id });
        }}
        className="flex h-7 w-full items-center gap-2 px-2 text-xs hover:bg-bg-hover"
      >
        {open ? (
          <Icon.ChevDown className="h-3 w-3 text-ink-3" />
        ) : (
          <Icon.ChevRight className="h-3 w-3 text-ink-3" />
        )}
        <Icon.Database className="h-3 w-3 text-accent" />
        <span className="font-medium text-ink-1">{model.name}</span>
        {model.tableName ? (
          <span className="font-mono text-[10px] text-ink-3">@{model.tableName}</span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Tooltip content="rows estimated">
            <Chip tone="muted" size="xs" className="font-mono">
              {model.rowCountEst.toLocaleString()}
            </Chip>
          </Tooltip>
          <Tooltip content="indexes">
            <Chip tone="muted" size="xs" className="font-mono">
              idx {model.indices.length}
            </Chip>
          </Tooltip>
          <Tooltip content="queries using this model">
            <Chip tone={queriesUsing > 0 ? 'info' : 'muted'} size="xs" className="font-mono">
              q {queriesUsing}
            </Chip>
          </Tooltip>
          {model.warnings.length > 0 ? (
            <Tooltip content={model.warnings.join(' • ')}>
              <Chip tone="warn" size="xs">
                <Icon.Alert className="h-2.5 w-2.5" /> {model.warnings.length}
              </Chip>
            </Tooltip>
          ) : null}
        </span>
      </button>
      {open ? (
        <div className="bg-bg-subtle/40 px-3 py-2 text-xs">
          {/* Fields */}
          <div className="mb-1.5 text-caps text-[10px] uppercase text-ink-3">Fields</div>
          <div className="space-y-0.5">
            {model.fields.map((f) => (
              <div key={f.name} className="flex items-center gap-1.5">
                {f.isId ? (
                  <Tooltip content="primary key">
                    <Icon.Hash className="h-3 w-3 text-accent" />
                  </Tooltip>
                ) : f.relation ? (
                  <Tooltip content={`relation → ${f.relation}`}>
                    <Icon.Link className="h-3 w-3 text-sem-isr" />
                  </Tooltip>
                ) : (
                  <span className="inline-block h-3 w-3" />
                )}
                <span className="font-mono text-ink-1">{f.name}</span>
                {!f.nullable && !f.isId ? (
                  <span className="font-bold text-sev-warn" title="required">!</span>
                ) : null}
                {f.isUnique && !f.isId ? (
                  <Chip tone="muted" size="xs" className="font-mono">
                    @unique
                  </Chip>
                ) : null}
                <span className="ml-auto font-mono text-ink-3">{f.type}</span>
              </div>
            ))}
          </div>
          {/* Indices */}
          <div className="mt-3 mb-1.5 text-caps text-[10px] uppercase text-ink-3">
            Indices ({model.indices.length})
          </div>
          {model.indices.length === 0 ? (
            <div className="text-ink-3">No indexes declared.</div>
          ) : (
            <div className="space-y-0.5">
              {model.indices.map((idx) => (
                <div
                  key={idx.fields.join(',')}
                  className="flex items-center gap-1.5 font-mono text-ink-2"
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
          {/* Hot paths */}
          <div className="mt-3 mb-1.5 text-caps text-[10px] uppercase text-ink-3">
            Hot routes ({model.hotPaths.length})
          </div>
          {model.hotPaths.length === 0 ? (
            <div className="text-ink-3">No traffic detected.</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {model.hotPaths.map((rid) => (
                <Chip key={rid} tone="info" size="xs" className="font-mono">
                  {rid.replace(/^route_/, '/')}
                </Chip>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedModel(model.id);
                setInspectorContext({ kind: 'db', modelId: model.id });
              }}
              className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[11px] text-ink-1 hover:bg-bg-hover"
            >
              Open in inspector →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Queries view ────────────────────────────────────────────────────────
function QueryContextMenu({ query, children }: { query: DbQuery; children: React.ReactNode }) {
  const fire = (label: string) => () => toast(label, { description: query.id });
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Query: {query.id}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={fire('Add take()')}>Add take()</ContextMenuItem>
        <ContextMenuItem onSelect={fire('Wrap in transaction')}>
          Wrap in transaction
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Add suggested index')}>
          Add suggested index
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={fire('Show in editor')}>Show in editor</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function QueryRow({ query, modelName }: { query: DbQuery; modelName: string }) {
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const setSelectedQuery = useDatabaseStore((s) => s.setSelectedQuery);
  return (
    <QueryContextMenu query={query}>
      <button
        type="button"
        onClick={() => {
          setSelectedQuery(query.id);
          setInspectorContext({ kind: 'query', queryId: query.id });
        }}
        className="grid w-full grid-cols-[1fr_72px_88px_1fr_56px] items-center gap-2 px-2 py-1 text-left text-xs hover:bg-bg-hover"
      >
        <span className="min-w-0 truncate font-mono text-ink-2">
          {query.site.file}
          <span className="text-ink-3">:{query.site.line}</span>
        </span>
        <Chip tone={queryKindTone(query.kind)} size="xs" className="font-mono">
          {query.kind}
        </Chip>
        <span className="truncate font-mono text-ink-1">{modelName}</span>
        <span className="flex flex-wrap items-center gap-0.5">
          {query.nPlusOne && (
            <Chip tone="err" size="xs" title="N+1 query">
              N+1
            </Chip>
          )}
          {query.missingIndex && (
            <Chip tone="warn" size="xs" title="Missing index">
              no-idx
            </Chip>
          )}
          {query.unbounded && (
            <Chip tone="warn" size="xs" title="Unbounded query">
              unbnd
            </Chip>
          )}
          {!query.inTransaction && (query.kind === 'create' || query.kind === 'update' || query.kind === 'delete' || query.kind === 'upsert') && (
            <Chip tone="hint" size="xs" title="Mutation outside transaction">
              no-tx
            </Chip>
          )}
          {query.kind === 'raw' && (
            <Chip tone="warn" size="xs" title="Raw SQL">
              raw
            </Chip>
          )}
        </span>
        <span className="text-right text-ink-3">
          {query.routeIds.length} route{query.routeIds.length === 1 ? '' : 's'}
        </span>
      </button>
    </QueryContextMenu>
  );
}

// ── Tab body ────────────────────────────────────────────────────────────
export function DbTab() {
  const models = useDatabaseStore((s) => s.models);
  const queries = useDatabaseStore((s) => s.queries);
  const transactions = useDatabaseStore((s) => s.transactions);
  const [view, setView] = useState<DbView>('models');
  const [risk, setRisk] = useState<RiskFilter>('all');
  const [search, setSearch] = useState('');

  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m] as const)), [models]);

  const filteredQueries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queries.filter((qq) => {
      const passRisk = match(risk)
        .with('all', () => true)
        .with('n+1', () => qq.nPlusOne)
        .with('no-idx', () => qq.missingIndex)
        .with('unbounded', () => qq.unbounded)
        .exhaustive();
      if (!passRisk) return false;
      if (!q) return true;
      const m = modelById.get(qq.modelId);
      return (
        qq.site.file.toLowerCase().includes(q) ||
        qq.kind.toLowerCase().includes(q) ||
        qq.id.toLowerCase().includes(q) ||
        (m?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [queries, search, risk, modelById]);

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.tableName ?? '').toLowerCase().includes(q),
    );
  }, [models, search]);

  const queriesPerModel = useMemo(() => {
    const m = new Map<string, number>();
    queries.forEach((q) => m.set(q.modelId, (m.get(q.modelId) ?? 0) + 1));
    return m;
  }, [queries]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup<DbView>
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
        {view === 'queries' ? (
          <FilterChipGroup<RiskFilter>
            options={RISK_OPTIONS}
            value={risk}
            onChange={setRisk}
            className="ml-1"
          />
        ) : null}
        <SearchInput value={search} onChange={setSearch} placeholder="search…" />
        <span className="ml-1 text-[10px] text-ink-3">
          {match(view)
            .with('models', () => `${filteredModels.length} models`)
            .with('queries', () => `${filteredQueries.length} queries`)
            .with('transactions', () => `${transactions.length} tx`)
            .exhaustive()}
        </span>
      </TabHeader>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {match(view)
          .with('models', () => (
            <div>
              {filteredModels.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-xs text-ink-3">
                  No models match.
                </div>
              ) : (
                filteredModels.map((m) => (
                  <ModelRow
                    key={m.id}
                    model={m}
                    queriesUsing={queriesPerModel.get(m.id) ?? 0}
                  />
                ))
              )}
            </div>
          ))
          .with('queries', () => (
            <div className="divide-y divide-line/60">
              {filteredQueries.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-xs text-ink-3">
                  No queries match.
                </div>
              ) : (
                filteredQueries.map((q) => (
                  <QueryRow
                    key={q.id}
                    query={q}
                    modelName={modelById.get(q.modelId)?.name ?? '—'}
                  />
                ))
              )}
            </div>
          ))
          .with('transactions', () => (
            <div className="divide-y divide-line/60">
              {transactions.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-xs text-ink-3">
                  No transactions.
                </div>
              ) : (
                transactions.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toast(`Open transaction ${t.id}`, { description: `${t.site.file}:${t.site.line}` })}
                    className="grid w-full grid-cols-[1fr_auto] items-start gap-2 px-2 py-2 text-left text-xs hover:bg-bg-hover"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon.Branch className="h-3 w-3 text-server" />
                        <span className="font-mono text-ink-1">{t.id}</span>
                        {!t.hasRollbackPath && (
                          <Chip tone="warn" size="xs">
                            no rollback
                          </Chip>
                        )}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-ink-3">
                        {t.site.file}:{t.site.line}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {t.steps.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] text-ink-3"
                          >
                            <Chip tone={queryKindTone(s.kind)} size="xs" className="font-mono">
                              {s.kind}
                            </Chip>
                            {idx < t.steps.length - 1 ? (
                              <span className="text-ink-3">→</span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={cn('text-ink-3 text-[10px]')}>{t.steps.length} steps</span>
                  </button>
                ))
              )}
            </div>
          ))
          .exhaustive()}
      </div>
    </div>
  );
}
