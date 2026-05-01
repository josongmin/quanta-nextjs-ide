import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useActionStore } from '@entities/server-action';
import type { ActionChecklistItem, ServerAction } from '@shared/types';
import { Chip, Icon, SeverityDot, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { RscTraceSection } from '../parts/rsc-trace-section';

type SeverityFilter = 'all' | 'low' | 'med' | 'high';

const SEVERITY_OPTIONS: ReadonlyArray<FilterChipOption<SeverityFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'med', label: 'Med' },
  { value: 'low', label: 'Low' },
];

function severityForScore(score: number): 'low' | 'med' | 'high' {
  if (score < 40) return 'high';
  if (score < 70) return 'med';
  return 'low';
}

function scoreTone(score: number) {
  return match(severityForScore(score))
    .with('low', () => 'static' as const)
    .with('med', () => 'warn' as const)
    .with('high', () => 'err' as const)
    .exhaustive();
}

function riskCount(checklist: ReadonlyArray<ActionChecklistItem>): number {
  return checklist.filter((c) => c.state === 'missing' || c.state === 'partial').length;
}

function topRiskHints(checklist: ReadonlyArray<ActionChecklistItem>): string {
  return checklist
    .filter((c) => c.state === 'missing' || c.state === 'partial')
    .slice(0, 3)
    .map((c) => `no ${c.label.toLowerCase()}`)
    .join(' · ');
}

export function ActionsTab() {
  const actions = useActionStore((s) => s.actions);
  const selectedActionId = useActionStore((s) => s.selectedActionId);
  const setSelected = useActionStore((s) => s.setSelectedAction);
  const setInspector = useUiStore((s) => s.setInspectorContext);
  const routes = useRouteStore((s) => s.routes);
  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [closureOnly, setClosureOnly] = useState(false);

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      if (closureOnly && !a.closureCapture) return false;
      if (filter === 'all') return true;
      return severityForScore(a.score) === filter;
    });
  }, [actions, filter, closureOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, ServerAction[]>();
    for (const a of filtered) {
      const key = a.routeId ?? '_orphan';
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleClick = (a: ServerAction) => {
    setSelected(a.id);
    setInspector({ kind: 'action', actionId: a.id });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={SEVERITY_OPTIONS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
        <button
          onClick={() => setClosureOnly((v) => !v)}
          aria-pressed={closureOnly}
          className={cn(
            'ml-1 inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-[11px]',
            closureOnly
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:text-ink-1',
          )}
          title="Show only actions that capture closure variables"
        >
          <Icon.Link className="h-3 w-3" />
          closure
        </button>
        <span className="ml-auto text-[10px] text-ink-3">{filtered.length} actions</span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No actions match
          </div>
        ) : (
          grouped.map(([routeKey, items]) => {
            const route = routeKey === '_orphan' ? undefined : routesById.get(routeKey);
            const path = route?.path ?? '(no route)';
            return (
              <div key={routeKey} className="hairline-b last:border-b-0">
                <div className="flex h-7 items-center gap-1.5 bg-bg-subtle px-2 text-xs text-ink-2">
                  <Icon.Folder className="h-3 w-3 text-ink-3" />
                  <span className="font-mono">{path}</span>
                  <span className="ml-auto text-[10px] text-ink-3">{items.length}</span>
                </div>
                <div className="divide-y divide-line/70">
                  {items.map((a) => {
                    const risks = riskCount(a.checklist);
                    const sev = severityForScore(a.score);
                    const isSelected = selectedActionId === a.id;
                    return (
                      <div
                        key={a.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleClick(a)}
                        className={cn(
                          'group relative flex h-8 items-center gap-2 px-2 text-xs hover:bg-bg-hover',
                          isSelected && 'bg-bg-selected',
                        )}
                      >
                        {isSelected && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-0 h-full w-0.5 bg-accent"
                          />
                        )}
                        <SeverityDot
                          severity={sev === 'high' ? 'err' : sev === 'med' ? 'warn' : 'info'}
                        />
                        <span className="font-mono text-ink-1">{a.name}</span>
                        <Chip tone={scoreTone(a.score)} size="xs" className="font-semibold">
                          {a.score}
                        </Chip>
                        {a.closureCapture && (
                          <Tooltip content="Closure capture: function references outer-scope variables">
                            <span className="inline-flex items-center text-sev-warn">
                              <Icon.Link className="h-3 w-3" />
                            </span>
                          </Tooltip>
                        )}
                        {risks > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-sev-warn">
                            <Icon.Alert className="h-3 w-3" />
                            {risks} {risks === 1 ? 'risk' : 'risks'}
                          </span>
                        )}
                        <span className="ml-1 truncate text-ink-3" title={topRiskHints(a.checklist)}>
                          {topRiskHints(a.checklist) || 'no issues detected'}
                        </span>
                        <span className="ml-auto truncate font-mono text-[10px] text-ink-3">
                          {a.file.split('/').slice(-2).join('/')}:{a.location.line}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        <RscTraceSection mode="actions" />
      </div>
    </div>
  );
}
