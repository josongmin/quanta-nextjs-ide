import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import type { CostClass, RenderingClass, Route } from '@shared/types';
import { Chip, CostChip, Icon, RenderingChip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';

type SortKey = 'route' | 'class' | 'cost' | 'clientKb' | 'tags' | 'risks';
type SortDir = 'asc' | 'desc';

const COST_RANK: Record<CostClass, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
const RENDERING_RANK: Record<RenderingClass, number> = {
  static: 1,
  isr: 2,
  dynamic: 3,
  unknown: 4,
};

const COLUMNS: ReadonlyArray<{
  key: SortKey;
  label: string;
  className: string;
}> = [
  { key: 'route', label: 'Route', className: 'min-w-0 flex-[3]' },
  { key: 'class', label: 'Class', className: 'w-20 shrink-0' },
  { key: 'cost', label: 'Cost', className: 'w-14 shrink-0' },
  { key: 'clientKb', label: 'Client KB', className: 'w-20 shrink-0 justify-end' },
  { key: 'tags', label: 'Tags', className: 'min-w-0 flex-[2]' },
  { key: 'risks', label: 'Risks', className: 'w-16 shrink-0 justify-end' },
];

function tabIdFor(file: string): string {
  return `tab-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function tabLabelFor(file: string): string {
  return file.split('/').pop() ?? file;
}

function compareRoutes(a: Route, b: Route, key: SortKey, dir: SortDir): number {
  const sign = dir === 'asc' ? 1 : -1;
  const v = match(key)
    .with('route', () => a.path.localeCompare(b.path))
    .with('class', () => RENDERING_RANK[a.rendering] - RENDERING_RANK[b.rendering])
    .with('cost', () => COST_RANK[a.costClass] - COST_RANK[b.costClass])
    .with('clientKb', () => a.clientKb - b.clientKb)
    .with('tags', () => a.cacheTags.length - b.cacheTags.length)
    .with('risks', () => a.riskCount - b.riskCount)
    .exhaustive();
  return v === 0 ? a.path.localeCompare(b.path) : v * sign;
}

export function RoutesTab() {
  const routes = useRouteStore((s) => s.routes);
  const selectedRouteId = useRouteStore((s) => s.selectedRouteId);
  const setSelected = useRouteStore((s) => s.setSelected);

  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);

  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.archetype.toLowerCase().includes(q) ||
        r.cacheTags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [routes, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compareRoutes(a, b, sortKey, sortDir));
  }, [filtered, sortKey, sortDir]);

  const onHeaderClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        key === 'cost' || key === 'risks' || key === 'clientKb' ? 'desc' : 'asc',
      );
    }
  };

  const onRowClick = (r: Route) => {
    setSelected(r.id);
    setInspectorContext({ kind: 'route', routeId: r.id });
    const file = r.files.page;
    if (file) {
      openTab({
        id: tabIdFor(file),
        file,
        label: tabLabelFor(file),
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <PanelHeader>
        <Icon.Globe className="h-3.5 w-3.5 text-ink-3" />
        <span className="text-[11px] text-ink-2">
          {routes.length} routes
          {sorted.length !== routes.length
            ? ` · ${sorted.length} matching`
            : ''}
        </span>
        <span className="text-ink-3">·</span>
        <span className="text-[11px] uppercase tracking-caps text-ink-3">
          sort: {sortKey} {sortDir === 'asc' ? '↑' : '↓'}
        </span>

        <div className="ml-auto w-48">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Filter routes"
          />
        </div>
      </PanelHeader>

      <div className="flex h-7 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
        {COLUMNS.map((c) => {
          const active = c.key === sortKey;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onHeaderClick(c.key)}
              className={cn(
                'inline-flex items-center gap-0.5 hover:text-ink-1',
                c.className,
                active && 'text-ink-1',
              )}
            >
              <span className="truncate">{c.label}</span>
              {active ? (
                sortDir === 'asc' ? (
                  <Icon.Up className="h-2.5 w-2.5" />
                ) : (
                  <Icon.Down className="h-2.5 w-2.5" />
                )
              ) : null}
            </button>
          );
        })}
      </div>

      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-3">
            No routes matching “{search}”.
          </div>
        ) : (
          <div className="text-sm">
            {sorted.map((r) => {
              const selected = r.id === selectedRouteId;
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onRowClick(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(r);
                    }
                  }}
                  className={cn(
                    'flex h-7 cursor-pointer items-center gap-2 hairline-b px-3 text-xs hover:bg-bg-hover',
                    selected && 'bg-bg-selected',
                  )}
                >
                  <span className="min-w-0 flex-[3] truncate font-mono text-ink-1">
                    {r.path}
                  </span>
                  <span className="w-20 shrink-0">
                    <RenderingChip
                      rendering={r.rendering}
                      confidence={r.renderingConfidence}
                    />
                  </span>
                  <span className="w-14 shrink-0">
                    <CostChip cost={r.costClass} />
                  </span>
                  <span
                    className={cn(
                      'w-20 shrink-0 text-right font-mono',
                      r.clientKb === 0 && 'text-ink-3',
                      r.clientKb > 50 && 'text-sev-warn',
                    )}
                  >
                    {r.clientKb}
                  </span>
                  <span className="flex min-w-0 flex-[2] flex-wrap items-center gap-1 overflow-hidden">
                    {r.cacheTags.length === 0 ? (
                      <span className="text-ink-3">—</span>
                    ) : (
                      r.cacheTags.slice(0, 3).map((t) => (
                        <Chip key={t} tone="muted" size="xs">
                          {t}
                        </Chip>
                      ))
                    )}
                    {r.cacheTags.length > 3 ? (
                      <span className="text-[10px] text-ink-3">
                        +{r.cacheTags.length - 3}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'w-16 shrink-0 text-right font-mono',
                      r.riskCount === 0 && 'text-ink-3',
                      r.riskCount > 0 && r.riskCount <= 2 && 'text-sev-info',
                      r.riskCount > 2 && r.riskCount <= 4 && 'text-sev-warn',
                      r.riskCount > 4 && 'text-sev-err',
                    )}
                  >
                    {r.riskCount > 4 ? (
                      <span className="inline-flex items-center gap-0.5">
                        {r.riskCount}
                        <Icon.Alert className="h-3 w-3" />
                      </span>
                    ) : (
                      r.riskCount
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
