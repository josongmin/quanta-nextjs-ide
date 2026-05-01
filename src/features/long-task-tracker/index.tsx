import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ALL_KINDS,
  LONG_TASKS,
  ROUTES,
  WINDOW_MS,
  quantile,
  tbtMs,
  type LongTask,
  type LtKind,
} from './helpers';

function kindFill(kind: LtKind): string {
  switch (kind) {
    case 'script':
      return 'fill-accent';
    case 'layout':
      return 'fill-sev-info';
    case 'paint':
      return 'fill-sem-static';
    case 'gc':
      return 'fill-sev-err';
    case 'fetch-blocking':
      return 'fill-sev-warn';
  }
}

function kindTone(kind: LtKind): 'accent' | 'info' | 'static' | 'err' | 'warn' {
  switch (kind) {
    case 'script':
      return 'accent';
    case 'layout':
      return 'info';
    case 'paint':
      return 'static';
    case 'gc':
      return 'err';
    case 'fetch-blocking':
      return 'warn';
  }
}

const TBT_THRESHOLD = 50;

export function LongTaskTrackerOverlay() {
  const open = useUiStore((s) => s.overlays.longTaskTracker.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeId, setRouteId] = useState<string>('all');
  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<LtKind>>([]);
  const [threshold, setThreshold] = useState<number>(50);

  const tasks = useMemo<ReadonlyArray<LongTask>>(() => {
    return LONG_TASKS.filter((t) => {
      if (routeId !== 'all' && t.routeId !== routeId) return false;
      if (activeKinds.length > 0 && !activeKinds.includes(t.kind)) return false;
      if (t.durationMs < threshold) return false;
      return true;
    });
  }, [routeId, activeKinds, threshold]);

  const totalLongMs = tasks.reduce((s, t) => s + t.durationMs, 0);
  const totalTbt = tbtMs(tasks);
  const top10 = useMemo<ReadonlyArray<LongTask>>(() => {
    return [...tasks].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10);
  }, [tasks]);

  // TBT contribution per kind.
  const tbtByKind = useMemo<ReadonlyArray<{ kind: LtKind; ms: number }>>(() => {
    const map = new Map<LtKind, number>();
    for (const t of tasks) {
      const ms = Math.max(0, t.durationMs - TBT_THRESHOLD);
      map.set(t.kind, (map.get(t.kind) ?? 0) + ms);
    }
    return ALL_KINDS.map((k) => ({ kind: k, ms: map.get(k) ?? 0 }));
  }, [tasks]);

  const tbtTotal = tbtByKind.reduce((s, k) => s + k.ms, 0) || 1;
  const durs = tasks.map((t) => t.durationMs);
  const p75 = quantile(durs, 0.75);
  const p95 = quantile(durs, 0.95);

  const SVG_W = 760;
  const SVG_H = 140;
  const TICKS = 6;

  const routeOptions = [
    { value: 'all', label: 'all routes' },
    ...ROUTES.map((r) => ({ value: r, label: r })),
  ];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('longTaskTracker')}
      title="Long-Task Tracker"
      subtitle="main-thread blocking · 60s window"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">Σ long-task:</span>{' '}
              <span className="font-mono text-ink-1">
                {totalLongMs.toFixed(0)}ms
              </span>
            </span>
            <span>
              <span className="text-ink-2">TBT:</span>{' '}
              <span
                className={cn(
                  'font-mono',
                  totalTbt > 600 ? 'text-sev-err' : 'text-ink-1',
                )}
              >
                {totalTbt.toFixed(0)}ms
              </span>
            </span>
            <span>
              <span className="text-ink-2">tasks:</span>{' '}
              <span className="font-mono text-ink-1">{tasks.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="accent"
              onClick={() => toast('TBT optimization plan generated (mock)')}
            >
              Generate TBT plan
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('longTaskTracker')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SelectControl
          label="route"
          value={routeId}
          onChange={setRouteId}
          options={routeOptions}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        {ALL_KINDS.map((k) => {
          const active = activeKinds.includes(k);
          return (
            <ToggleChip
              key={k}
              active={active}
              onClick={() =>
                setActiveKinds((p) =>
                  p.includes(k) ? p.filter((x) => x !== k) : [...p, k],
                )
              }
            >
              {k}
            </ToggleChip>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            threshold
          </span>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="h-1 w-32 cursor-pointer accent-accent"
          />
          <span className="font-mono text-[11px] text-ink-1">
            {threshold}ms
          </span>
        </span>
      </PanelHeader>

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="hairline-r p-3">
          <div className="overflow-hidden rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center justify-between hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              <span>timeline · width = 60s · height ∝ duration</span>
              <span className="font-mono text-ink-2">
                p75 {p75.toFixed(0)}ms · p95 {p95.toFixed(0)}ms
              </span>
            </div>
            <div className="p-2">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="none"
                className="block h-44 w-full"
              >
                {/* axis */}
                {Array.from({ length: TICKS + 1 }).map((_, i) => {
                  const x = (SVG_W * i) / TICKS;
                  const t = ((WINDOW_MS / 1000) * i) / TICKS;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        x2={x}
                        y1={SVG_H - 16}
                        y2={SVG_H - 12}
                        className="stroke-line"
                        strokeWidth={0.5}
                      />
                      <text
                        x={x + 2}
                        y={SVG_H - 4}
                        fontSize={9}
                        className="fill-ink-3"
                      >
                        {t.toFixed(0)}s
                      </text>
                    </g>
                  );
                })}
                <line
                  x1={0}
                  x2={SVG_W}
                  y1={SVG_H - 16}
                  y2={SVG_H - 16}
                  className="stroke-line"
                  strokeWidth={0.5}
                />
                {/* tbt threshold marker — lower bar height that maps to 50ms */}
                {(() => {
                  const maxDur = 1500;
                  const h50 = ((50 / maxDur) * (SVG_H - 24));
                  const y = SVG_H - 16 - h50;
                  return (
                    <g>
                      <line
                        x1={0}
                        x2={SVG_W}
                        y1={y}
                        y2={y}
                        className="stroke-sev-err"
                        strokeWidth={0.6}
                        strokeDasharray="3 2"
                      />
                      <text
                        x={2}
                        y={y - 2}
                        fontSize={8}
                        className="fill-sev-err"
                      >
                        TBT 50ms
                      </text>
                    </g>
                  );
                })()}
                {tasks.map((t) => {
                  const x = (SVG_W * t.ts) / WINDOW_MS;
                  const maxDur = 1500;
                  const h = ((t.durationMs / maxDur) * (SVG_H - 24));
                  const w = Math.max(1.5, (SVG_W * t.durationMs) / WINDOW_MS);
                  const y = SVG_H - 16 - h;
                  return (
                    <g key={t.id} className="cursor-default">
                      <title>
                        {t.kind} · {t.durationMs}ms @ {(t.ts / 1000).toFixed(2)}s
                        {'\n'}
                        {t.attribution}
                      </title>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={1}
                        className={cn(kindFill(t.kind))}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              worst 10 tasks
            </div>
            <ScrollArea className="max-h-56">
              <table className="w-full text-[11px]">
                <thead className="text-ink-3">
                  <tr className="hairline-b">
                    <th className="px-2 py-1 text-left">kind</th>
                    <th className="px-2 py-1 text-left">attribution</th>
                    <th className="px-2 py-1 text-left">route</th>
                    <th className="px-2 py-1 text-right">ts</th>
                    <th className="px-2 py-1 text-right">dur</th>
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((t) => (
                    <tr key={t.id} className="hairline-b hover:bg-bg-hover">
                      <td className="px-2 py-1">
                        <Chip tone={kindTone(t.kind)} size="xs">
                          {t.kind}
                        </Chip>
                      </td>
                      <td className="truncate px-2 py-1 font-mono text-ink-1">
                        {t.attribution}
                      </td>
                      <td className="px-2 py-1 font-mono text-ink-2">
                        {t.routeId}
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-ink-3">
                        {(t.ts / 1000).toFixed(2)}s
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-ink-1">
                        {t.durationMs}ms
                      </td>
                      <td className="px-2 py-1 text-right">
                        <Button
                          size="xs"
                          tone="ghost"
                          onClick={() =>
                            toast(`Open ${t.id} in flame graph (mock)`)
                          }
                        >
                          Open in flame
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {top10.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-3 text-center text-ink-3"
                      >
                        No tasks above threshold.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>

        <aside className="p-3">
          <div className="rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              TBT contribution
            </div>
            <ul className="space-y-1 p-2">
              {tbtByKind.map((row) => {
                const pct = (row.ms / tbtTotal) * 100;
                return (
                  <li key={row.kind} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <Chip tone={kindTone(row.kind)} size="xs">
                          {row.kind}
                        </Chip>
                      </span>
                      <span className="font-mono text-ink-1">
                        {row.ms.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-subtle">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          row.kind === 'script'
                            ? 'bg-accent'
                            : row.kind === 'fetch-blocking'
                              ? 'bg-sev-warn'
                              : row.kind === 'gc'
                                ? 'bg-sev-err'
                                : row.kind === 'layout'
                                  ? 'bg-sev-info'
                                  : 'bg-sem-static',
                        )}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-2 rounded-sm border border-line bg-bg p-2">
            <h4 className="text-[10px] uppercase tracking-caps text-ink-3">
              percentiles
            </h4>
            <dl className="mt-1 grid grid-cols-2 gap-y-0.5 text-[11px]">
              <dt className="text-ink-3">p75 duration</dt>
              <dd className="font-mono text-ink-1">{p75.toFixed(0)}ms</dd>
              <dt className="text-ink-3">p95 duration</dt>
              <dd className="font-mono text-ink-1">{p95.toFixed(0)}ms</dd>
              <dt className="text-ink-3">total tasks</dt>
              <dd className="font-mono text-ink-1">{tasks.length}</dd>
              <dt className="text-ink-3">TBT</dt>
              <dd className="font-mono text-ink-1">
                {totalTbt.toFixed(0)}ms
              </dd>
            </dl>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
