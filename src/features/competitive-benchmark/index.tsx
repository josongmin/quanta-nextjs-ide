import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  COLUMNS,
  METRICS,
  OPPORTUNITIES,
  ROUTES,
  cellOf,
  classify,
  leaderFor,
  tertiles,
  valueOf,
  type Competitor,
  type MetricKey,
  type Tier,
} from './helpers';

const TIER_CLASS: Record<Tier, string> = {
  best: 'bg-sev-info-soft text-sev-info',
  mid: 'bg-sev-warn-soft text-sev-warn',
  worst: 'bg-sev-err-soft text-sev-err',
};

export function CompetitiveBenchmarkOverlay() {
  const open = useUiStore((s) => s.overlays.competitiveBenchmark.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [metricKey, setMetricKey] = useState<MetricKey>('lcp');
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0]!;

  const allValues = useMemo(() => {
    const out: number[] = [];
    for (const r of ROUTES) {
      for (const c of COLUMNS) {
        out.push(valueOf(r, c, metric.key));
      }
    }
    return out;
  }, [metric]);

  const t = useMemo(() => tertiles(allValues), [allValues]);

  const leaders = useMemo(
    () => METRICS.map((m) => leaderFor(m, ROUTES)).filter((x): x is NonNullable<typeof x> => x !== null),
    [],
  );

  // SVG heatmap dims
  const COL_W = 130;
  const ROW_H = 36;
  const HEADER_H = 32;
  const LABEL_W = 130;
  const W = LABEL_W + COL_W * COLUMNS.length;
  const H = HEADER_H + ROW_H * ROUTES.length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('competitiveBenchmark')}
      title="Competitive Benchmark"
      subtitle="You vs competitor mocks · per-route heatmap"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">Metric:</span>{' '}
            <span className="font-mono text-ink-1">{metric.label}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Benchmark re-run queued (mock)')}>
              Re-run benchmark
            </Button>
            <Button size="xs" tone="accent" onClick={() => toast('Report exported (mock)')}>
              Export report
            </Button>
          </div>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">metric</span>
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetricKey(m.key)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              metric.key === m.key
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          {/* Heatmap */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label={`Heatmap of ${metric.label}`}
          >
            {/* header row */}
            {COLUMNS.map((col, i) => {
              const x = LABEL_W + i * COL_W;
              const isYou = col === 'you';
              return (
                <g key={col}>
                  <rect
                    x={x}
                    y={0}
                    width={COL_W}
                    height={HEADER_H}
                    className={cn(isYou ? 'fill-accent-soft' : 'fill-bg-subtle')}
                  />
                  <text
                    x={x + COL_W / 2}
                    y={HEADER_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    className={cn(isYou ? 'fill-accent' : 'fill-ink-2')}
                  >
                    {col}
                  </text>
                </g>
              );
            })}
            {/* rows */}
            {ROUTES.map((row, ri) => {
              const y = HEADER_H + ri * ROW_H;
              return (
                <g key={row.id}>
                  <rect
                    x={0}
                    y={y}
                    width={LABEL_W}
                    height={ROW_H}
                    className="fill-bg"
                  />
                  <text
                    x={8}
                    y={y + ROW_H / 2 + 4}
                    fontSize={11}
                    className="fill-ink-1"
                  >
                    {row.route}
                  </text>
                  {COLUMNS.map((col, ci) => {
                    const x = LABEL_W + ci * COL_W;
                    const v = valueOf(row, col, metric.key);
                    const tier = classify(v, t, metric.lowerIsBetter);
                    const isYou = col === 'you';
                    const cell = cellOf(row, col);
                    return (
                      <Tooltip
                        key={`${row.id}-${col}`}
                        content={
                          <div className="text-[11px]">
                            <div className="font-medium text-ink-1">
                              {col} · {row.route}
                            </div>
                            <div className="text-ink-3">
                              LCP {(cell.lcp / 1000).toFixed(2)}s · TTFB {cell.ttfb}ms · {cell.weight}KB · {cell.requests} reqs · A11y {cell.a11y}
                            </div>
                          </div>
                        }
                      >
                        <g>
                          <rect
                            x={x + 2}
                            y={y + 2}
                            width={COL_W - 4}
                            height={ROW_H - 4}
                            rx={3}
                            className={cn(
                              TIER_CLASS[tier].split(' ')[0],
                              isYou && 'stroke-accent',
                            )}
                            strokeWidth={isYou ? 1.5 : 0}
                          />
                          <text
                            x={x + COL_W / 2}
                            y={y + ROW_H / 2 + 4}
                            textAnchor="middle"
                            fontSize={11}
                            className={cn(TIER_CLASS[tier].split(' ')[1])}
                          >
                            {metric.formatter(v)}
                          </text>
                        </g>
                      </Tooltip>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* legend */}
          <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-info-soft" /> best tertile
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-warn-soft" /> mid
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-err-soft" /> worst
            </span>
          </div>

          {/* Leader callouts */}
          <h4 className="text-caps mt-4 text-ink-3">Per-metric leaders</h4>
          <ul className="mt-1 grid grid-cols-2 gap-2">
            {leaders.map((l) => (
              <li
                key={l.metric.key}
                className="rounded-sm border border-line bg-bg-subtle p-2 text-[11px]"
              >
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Best {l.metric.label}
                </div>
                <div className="mt-0.5 text-ink-1">
                  <span className="font-mono">{l.competitor}</span>{' '}
                  <span className="text-ink-3">on</span>{' '}
                  <span className="font-mono">{l.route}</span>
                </div>
                <div className="mt-0.5 font-mono text-md text-accent">
                  {l.metric.formatter(l.value)}
                </div>
              </li>
            ))}
          </ul>
        </main>

        {/* Right rail: opportunities */}
        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-caps text-ink-3">Opportunities</h4>
          <ul className="mt-2 space-y-1.5">
            {OPPORTUNITIES.map((o) => (
              <li
                key={o.id}
                className="rounded-sm border border-line bg-bg p-2 text-[11px]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[12px] text-ink-1">{o.title}</span>
                  <Chip tone="info" size="xs">
                    {o.savings}
                  </Chip>
                </div>
                <div className="mt-0.5 text-[10px] text-ink-3">
                  on <span className="font-mono">{o.route}</span>
                </div>
                <div className="mt-1 flex justify-end">
                  <Button
                    size="xs"
                    tone="default"
                    onClick={() => toast(`Plan drafted: ${o.title} (mock)`)}
                  >
                    Plan
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

// suppress unused — kept for clarity
export type { Competitor };
