import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import type { Route, RouteMetadataCoverage } from '@shared/types';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { SearchInput } from '../parts/search-input';
import { RscTraceSection } from '../parts/rsc-trace-section';

type CoverageFilter = 'all' | 'incomplete' | 'generated';

const COVERAGE_OPTIONS: ReadonlyArray<FilterChipOption<CoverageFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'generated', label: 'Generated' },
];

const COLUMNS: ReadonlyArray<{ key: keyof RouteMetadataCoverage; label: string }> = [
  { key: 'title', label: 'title' },
  { key: 'description', label: 'desc' },
  { key: 'canonical', label: 'canon' },
  { key: 'openGraph', label: 'og' },
  { key: 'robots', label: 'robots' },
];

function MetadataCell({ ok, generated }: { ok: boolean; generated: boolean }) {
  if (!ok) return <span className="text-ink-3">—</span>;
  if (generated)
    return (
      <span className="text-[10px] tracking-caps text-sev-info" title="Generated metadata">
        gen
      </span>
    );
  return <span className="text-sem-static">✓</span>;
}

function isComplete(m: RouteMetadataCoverage): boolean {
  return m.title && m.description && m.canonical && m.openGraph && m.robots;
}

export function MetadataTab() {
  const routes = useRouteStore((s) => s.routes);
  const setSelected = useRouteStore((s) => s.setSelected);
  const setInspector = useUiStore((s) => s.setInspectorContext);
  const selectedRouteId = useRouteStore((s) => s.selectedRouteId);

  const [filter, setFilter] = useState<CoverageFilter>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo<Route[]>(() => {
    return routes.filter((r) => {
      if (search && !r.path.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'incomplete' && isComplete(r.metadata)) return false;
      if (filter === 'generated' && !r.metadata.isGenerated) return false;
      return true;
    });
  }, [routes, filter, search]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={COVERAGE_OPTIONS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by path"
          className="ml-1"
        />
      </TabHeader>
      <div className="flex h-7 items-center gap-1 hairline-b bg-bg-subtle px-2 text-[10px] tracking-caps text-ink-3">
        <span className="flex-1">ROUTE</span>
        {COLUMNS.map((c) => (
          <span key={c.key} className="w-10 text-center">
            {c.label}
          </span>
        ))}
        <span className="w-6 text-center">!</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/70">
        {visible.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No routes match
          </div>
        ) : (
          visible.map((r) => {
            const m = r.metadata;
            const missingCount = COLUMNS.filter((c) => !m[c.key]).length;
            const isSelected = r.id === selectedRouteId;
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelected(r.id);
                  setInspector({ kind: 'route', routeId: r.id });
                }}
                className={cn(
                  'group relative flex h-7 items-center gap-1 px-2 text-xs hover:bg-bg-hover',
                  isSelected && 'bg-bg-selected',
                )}
              >
                {isSelected && (
                  <span aria-hidden className="absolute left-0 top-0 h-full w-0.5 bg-accent" />
                )}
                <span className="flex-1 truncate font-mono text-ink-1">{r.path}</span>
                {COLUMNS.map((c) => (
                  <span key={c.key} className="w-10 text-center">
                    <MetadataCell
                      ok={m[c.key]}
                      generated={m.isGenerated && (c.key === 'title' || c.key === 'description')}
                    />
                  </span>
                ))}
                <span className="w-6 text-center text-[10px] text-sev-warn">
                  {missingCount > 0 ? '⚠'.repeat(Math.min(2, missingCount)) : ''}
                </span>
              </div>
            );
          })
        )}
        <RscTraceSection mode="metadata" />
      </div>
    </div>
  );
}
