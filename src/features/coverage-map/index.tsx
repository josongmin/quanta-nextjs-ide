import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { MOCK_COVERAGE, aggregate, coverageTone } from './helpers';

type Filter = 'all' | 'critical' | 'untested';

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'untested', label: 'Untested' },
];

export function CoverageMapOverlay() {
  const open = useUiStore((s) => s.overlays.coverageMap.open);
  const close = useUiStore((s) => s.closeOverlay);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const routes = useRouteStore((s) => s.routes);
  const routesById = useMemo(
    () => new Map(routes.map((r) => [r.id, r] as const)),
    [routes],
  );

  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () =>
      MOCK_COVERAGE.filter((c) => {
        if (filter === 'critical') return c.critical;
        if (filter === 'untested')
          return c.unit + c.integration + c.e2e === 0;
        return true;
      }),
    [filter],
  );

  const agg = useMemo(() => aggregate(visible), [visible]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('coverageMap'))}
      title="Test Coverage Map"
      subtitle={`${visible.length} route${visible.length === 1 ? '' : 's'} · unit ${agg.unit}% · integration ${agg.integration}% · e2e ${agg.e2e}%`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Open coverage report (preview)')}>
            <Icon.Doc className="h-3 w-3" />
            Open coverage report
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Run tests (mock)')}>
            <Icon.Refresh className="h-3 w-3" />
            Run tests
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-selected={filter === f.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                filter === f.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid h-7 grid-cols-[1fr_60px_60px_60px] items-center gap-2 hairline-b bg-bg-subtle px-3 text-[10px] uppercase tracking-caps text-ink-3">
        <span>Route</span>
        <span className="text-center">Unit</span>
        <span className="text-center">Integ</span>
        <span className="text-center">E2E</span>
      </div>

      <ul className="divide-y divide-line/60">
        {visible.map((c) => {
          const r = routesById.get(c.routeId);
          if (!r) return null;
          return (
            <li
              key={c.routeId}
              role="button"
              tabIndex={0}
              onClick={() => {
                setInspectorContext({ kind: 'route', routeId: c.routeId });
                close('coverageMap');
              }}
              className={cn(
                'group relative grid h-9 grid-cols-[1fr_60px_60px_60px] items-center gap-2 px-3 text-xs hover:bg-bg-hover',
              )}
            >
              {c.critical && (
                <span aria-hidden className="absolute left-0 top-0 h-full w-0.5 bg-sev-warn" />
              )}
              <span className="flex items-center gap-1.5 truncate">
                {c.critical ? (
                  <Chip tone="warn" size="xs">
                    critical
                  </Chip>
                ) : null}
                <span className="font-mono text-ink-1">{r.path}</span>
              </span>
              <span className={cn('rounded-sm px-1 text-center font-mono', coverageTone(c.unit))}>
                {c.unit}%
              </span>
              <span
                className={cn('rounded-sm px-1 text-center font-mono', coverageTone(c.integration))}
              >
                {c.integration}%
              </span>
              <span className={cn('rounded-sm px-1 text-center font-mono', coverageTone(c.e2e))}>
                {c.e2e}%
              </span>
            </li>
          );
        })}
      </ul>
    </OverlayPanel>
  );
}
