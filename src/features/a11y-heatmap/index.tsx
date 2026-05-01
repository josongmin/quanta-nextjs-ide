import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  a11yRules,
  buildHeatmap,
  cellTone,
  severityLabel,
  topRoute,
  topRule,
  totalIssues,
  type A11yRule,
} from './helpers';

export function A11yHeatmapOverlay() {
  const open = useUiStore((s) => s.overlays.a11yHeatmap.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const routes = useRouteStore((s) => s.routes);

  const rows = useMemo(() => buildHeatmap(routes), [routes]);
  const total = useMemo(() => totalIssues(rows), [rows]);
  const worst = useMemo(() => topRoute(rows), [rows]);
  const worstRule = useMemo(() => topRule(rows), [rows]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('a11yHeatmap'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Shield className="h-4 w-4 text-ink-3" />
          <span>Accessibility Heatmap</span>
        </span>
      }
      subtitle="issues by route × type"
      size="md"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast('Audit queued', {
                description: `${rows.length} routes · 8 rules — running axe-core mock`,
              })
            }
          >
            <Icon.Refresh className="h-3 w-3" /> Run audit
          </Button>
          <Button size="sm" tone="ghost" onClick={() => close('a11yHeatmap')}>
            Close
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_220px] divide-x divide-line">
        <HeatmapTable
          rows={rows}
          onCellClick={(routeId, rule, count) => {
            if (count === 0) {
              toast('No issues on this cell', {
                description: `${routeId} · ${rule}`,
              });
              return;
            }
            openOverlay('evidenceTracer', {
              diagnosticId: `a11y_${routeId}_${rule}`,
            });
            toast('Open Evidence Tracer', {
              description: `${rule} on ${routeId} (${count} issue${
                count === 1 ? '' : 's'
              })`,
            });
          }}
        />
        <SidePanel total={total} routes={rows.length} worst={worst} worstRule={worstRule} />
      </div>
    </OverlayPanel>
  );
}

interface HeatmapRow {
  routeId: string;
  path: string;
  counts: Record<A11yRule, number>;
  total: number;
}

function HeatmapTable({
  rows,
  onCellClick,
}: {
  rows: readonly HeatmapRow[];
  onCellClick(routeId: string, rule: A11yRule, count: number): void;
}) {
  return (
    <div className="min-w-0 overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-bg-subtle">
          <tr>
            <th className="hairline-b px-2 py-1.5 text-left text-caps font-normal text-ink-3">
              route
            </th>
            {a11yRules.map((r) => (
              <th
                key={r.id}
                className="hairline-b px-1 py-1.5 text-center text-caps font-normal text-ink-3"
                title={r.description}
              >
                <span className="block w-12 truncate">{r.short}</span>
              </th>
            ))}
            <th className="hairline-b px-2 py-1.5 text-right text-caps font-normal text-ink-3">
              tot
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.routeId}>
              <td
                className={cn(
                  'truncate px-2 py-0.5 font-mono text-[11px] text-ink-1',
                  rowIdx !== rows.length - 1 && 'hairline-b',
                )}
                title={row.path}
              >
                {row.path}
              </td>
              {a11yRules.map((rule) => {
                const count = row.counts[rule.id];
                return (
                  <td
                    key={rule.id}
                    className={cn(
                      'p-0',
                      rowIdx !== rows.length - 1 && 'hairline-b',
                    )}
                  >
                    <HeatCell
                      count={count}
                      tooltip={
                        <div className="text-[11px]">
                          <div className="font-medium text-ink-1">{rule.label}</div>
                          <div className="text-ink-3">{rule.description}</div>
                          <div className="mt-1 text-ink-2">
                            {count} {count === 1 ? 'issue' : 'issues'} · {severityLabel(count)}
                          </div>
                        </div>
                      }
                      onClick={() => onCellClick(row.routeId, rule.id, count)}
                    />
                  </td>
                );
              })}
              <td
                className={cn(
                  'px-2 py-0.5 text-right font-mono text-[11px] text-ink-2',
                  rowIdx !== rows.length - 1 && 'hairline-b',
                )}
              >
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeatCell({
  count,
  tooltip,
  onClick,
}: {
  count: number;
  tooltip: React.ReactNode;
  onClick(): void;
}) {
  const tone = cellTone(count);
  const cls = match(tone)
    .with('static', () => 'bg-sem-static/20 text-ink-3')
    .with('warn', () => 'bg-sev-warn/30 text-ink-1')
    .with('err', () => 'bg-sev-err/40 text-ink-1')
    .exhaustive();
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex h-6 w-full items-center justify-center font-mono text-[11px] outline-none transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-accent',
          cls,
        )}
      >
        {count}
      </button>
    </Tooltip>
  );
}

function SidePanel({
  total,
  routes,
  worst,
  worstRule,
}: {
  total: number;
  routes: number;
  worst: HeatmapRow | undefined;
  worstRule: { rule: A11yRule; count: number };
}) {
  return (
    <aside className="min-w-0 px-3 py-3">
      <h3 className="mb-1 text-caps text-ink-3">Legend</h3>
      <ul className="space-y-1 text-[11px]">
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-4 w-6 rounded-sm bg-sem-static/20" />
          <span className="text-ink-2">0 issues</span>
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-4 w-6 rounded-sm bg-sev-warn/30" />
          <span className="text-ink-2">1 – 2 issues</span>
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-4 w-6 rounded-sm bg-sev-err/40" />
          <span className="text-ink-2">3+ issues</span>
        </li>
      </ul>

      <div className="mt-3 hairline-t pt-2">
        <h3 className="mb-1 text-caps text-ink-3">Summary</h3>
        <dl className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-ink-3">total issues</dt>
            <dd className="font-mono text-ink-1">{total}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-ink-3">routes scanned</dt>
            <dd className="font-mono text-ink-1">{routes}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-ink-3">worst route</dt>
            <dd className="font-mono text-ink-1 truncate" title={worst?.path}>
              {worst ? worst.path : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-ink-3">top rule</dt>
            <dd>
              <Chip tone="warn" size="xs" className="font-normal normal-case">
                {worstRule.rule}
              </Chip>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 hairline-t pt-2">
        <h3 className="mb-1 text-caps text-ink-3">Rules</h3>
        <ul className="space-y-1 text-[11px]">
          {a11yRules.map((r) => (
            <li key={r.id} className="text-ink-2">
              <span className="font-mono text-ink-1">{r.short}</span>
              <span className="text-ink-3"> · {r.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[10px] text-ink-3">
        Click any cell to open the Evidence Tracer for that issue category.
      </p>
    </aside>
  );
}
