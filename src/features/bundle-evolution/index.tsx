import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  CALLOUTS,
  CHUNKS,
  ROUTES,
  ROUTE_BUDGETS,
  ROUTE_SERIES,
  WEEKS,
  chunkChipTone,
  chunkColor,
  chunkSeries,
  totalKb,
  type ChunkId,
  type RouteId,
} from './helpers';

type View = 'chunks' | 'routes' | 'both';

export function BundleEvolutionOverlay() {
  const open = useUiStore((s) => s.overlays.bundleEvolution.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [view, setView] = useState<View>('chunks');
  const [activeChunks, setActiveChunks] = useState<ReadonlyArray<ChunkId>>([
    ...CHUNKS,
  ]);
  const [activeRoutes, setActiveRoutes] = useState<ReadonlyArray<RouteId>>([
    ...ROUTES,
  ]);

  const total0 = totalKb(0);
  const totalLast = totalKb(WEEKS - 1);
  const deltaKb = totalLast - total0;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('bundleEvolution')}
      title="Bundle Evolution"
      subtitle="12-week composition over chunks & routes"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">total wk1:</span>{' '}
              <span className="font-mono text-ink-1">{total0}KB</span>
            </span>
            <span>
              <span className="text-ink-2">total wk12:</span>{' '}
              <span className="font-mono text-ink-1">{totalLast}KB</span>
            </span>
            <span>
              <span className="text-ink-2">since wk1:</span>{' '}
              <span
                className={cn(
                  'font-mono',
                  deltaKb > 0 ? 'text-sev-err' : 'text-sem-static',
                )}
              >
                {deltaKb > 0 ? '+' : ''}
                {deltaKb}KB
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('PNG exported (mock)')}
            >
              Export PNG
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('bundleEvolution')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PanelHeader>
        <SelectControl<View>
          label="view"
          value={view}
          onChange={setView}
          options={[
            { value: 'chunks', label: 'Chunks' },
            { value: 'routes', label: 'Per-route' },
            { value: 'both', label: 'Both' },
          ]}
        />
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          chunks
        </span>
        {CHUNKS.map((c) => {
          const active = activeChunks.includes(c);
          return (
            <ToggleChip
              key={c}
              active={active}
              onClick={() =>
                setActiveChunks((p) =>
                  p.includes(c) ? p.filter((x) => x !== c) : [...p, c],
                )
              }
            >
              {c}
            </ToggleChip>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">
            routes
          </span>
          {ROUTES.map((r) => {
            const active = activeRoutes.includes(r);
            return (
              <ToggleChip
                key={r}
                active={active}
                onClick={() =>
                  setActiveRoutes((p) =>
                    p.includes(r) ? p.filter((x) => x !== r) : [...p, r],
                  )
                }
              >
                {r}
              </ToggleChip>
            );
          })}
        </span>
      </PanelHeader>

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="hairline-r p-3 space-y-3">
          {(view === 'chunks' || view === 'both') && (
            <ChunksStacked activeChunks={activeChunks} />
          )}
          {(view === 'routes' || view === 'both') && (
            <RouteSmallMultiples activeRoutes={activeRoutes} />
          )}
        </div>
        <aside className="p-3 space-y-2">
          <div className="rounded-sm border border-line bg-bg">
            <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
              change callouts
            </div>
            <ScrollArea className="max-h-[440px]">
              <ul className="p-2 space-y-1.5">
                {CALLOUTS.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-sm border border-line bg-bg p-2 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Chip tone={chunkChipTone(c.chunk)} size="xs">
                        {c.chunk}
                      </Chip>
                      <span className="text-ink-3">wk{c.week + 1}</span>
                      <span
                        className={cn(
                          'ml-auto font-mono',
                          c.deltaKb > 0 ? 'text-sev-err' : 'text-sem-static',
                        )}
                      >
                        {c.deltaKb > 0 ? '+' : ''}
                        {c.deltaKb}KB
                      </span>
                    </div>
                    <p className="mt-1 text-ink-2">{c.message}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-ink-3">
                        {c.commit}
                      </span>
                      <Button
                        size="xs"
                        tone="ghost"
                        onClick={() =>
                          toast(`Open commit ${c.commit} (mock)`)
                        }
                      >
                        Open commit
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function ChunksStacked({
  activeChunks,
}: {
  activeChunks: ReadonlyArray<ChunkId>;
}) {
  const W = 760;
  const H = 220;
  const PADL = 28;
  const PADB = 22;
  const PADT = 8;

  // Stack order = order in CHUNKS, but only those active.
  const stack = useMemo<
    ReadonlyArray<{ chunk: ChunkId; values: ReadonlyArray<number> }>
  >(() => {
    return CHUNKS.filter((c) => activeChunks.includes(c)).map((c) => ({
      chunk: c,
      values: chunkSeries(c),
    }));
  }, [activeChunks]);

  // total per week.
  const totals = Array.from({ length: WEEKS }).map((_, w) => {
    let s = 0;
    for (const layer of stack) s += layer.values[w] ?? 0;
    return s;
  });
  const yMax = Math.max(...totals, 1) * 1.05;

  function xPx(w: number): number {
    return PADL + ((W - PADL - 4) * w) / (WEEKS - 1);
  }
  function yPx(v: number): number {
    return H - PADB - ((H - PADB - PADT) * v) / yMax;
  }

  // Build cumulative paths from top to bottom for ribbons.
  const cumulative: number[][] = Array.from({ length: WEEKS }).map(() => [0]);
  for (const layer of stack) {
    for (let w = 0; w < WEEKS; w += 1) {
      const cum = cumulative[w]!;
      const last = cum[cum.length - 1]!;
      cum.push(last + (layer.values[w] ?? 0));
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
        chunks · stacked area
      </div>
      <div className="p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block h-56 w-full"
        >
          {/* y gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = yPx(yMax * f);
            return (
              <g key={f}>
                <line
                  x1={PADL}
                  x2={W - 4}
                  y1={y}
                  y2={y}
                  className="stroke-line"
                  strokeWidth={0.4}
                  strokeDasharray="2 2"
                />
                <text
                  x={4}
                  y={y + 3}
                  fontSize={9}
                  className="fill-ink-3"
                >
                  {Math.round(yMax * f)}
                </text>
              </g>
            );
          })}

          {/* ribbons */}
          {stack.map((layer, layerIdx) => {
            const points: string[] = [];
            for (let w = 0; w < WEEKS; w += 1) {
              const top = cumulative[w]?.[layerIdx + 1] ?? 0;
              points.push(`${xPx(w)},${yPx(top)}`);
            }
            for (let w = WEEKS - 1; w >= 0; w -= 1) {
              const bot = cumulative[w]?.[layerIdx] ?? 0;
              points.push(`${xPx(w)},${yPx(bot)}`);
            }
            return (
              <polygon
                key={layer.chunk}
                points={points.join(' ')}
                className={cn(chunkColor(layer.chunk))}
                strokeWidth={0.6}
              />
            );
          })}

          {/* x ticks */}
          {Array.from({ length: WEEKS }).map((_, w) => (
            <text
              key={w}
              x={xPx(w)}
              y={H - 6}
              fontSize={9}
              textAnchor="middle"
              className="fill-ink-3"
            >
              w{w + 1}
            </text>
          ))}
        </svg>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          {stack.map((l) => (
            <Chip key={l.chunk} tone={chunkChipTone(l.chunk)} size="xs">
              {l.chunk} ·{' '}
              {l.values[WEEKS - 1] ?? 0}KB
            </Chip>
          ))}
          {stack.length === 0 && (
            <span className="text-[11px] text-ink-3">No chunks selected.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteSmallMultiples({
  activeRoutes,
}: {
  activeRoutes: ReadonlyArray<RouteId>;
}) {
  const series = ROUTE_SERIES.filter((r) => activeRoutes.includes(r.route));
  const W = 180;
  const H = 80;
  const PADL = 4;
  const PADB = 12;
  const PADT = 4;

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <div className="flex h-7 items-center hairline-b bg-bg-subtle px-2 text-[10px] uppercase tracking-caps text-ink-3">
        per-route weight · target budget
      </div>
      <div className="grid grid-cols-4 gap-px bg-line p-px">
        {series.map((r) => {
          const budget = ROUTE_BUDGETS[r.route];
          const yMax = Math.max(budget * 1.1, ...r.series) * 1.05;
          function xPx(w: number): number {
            return PADL + ((W - PADL - 4) * w) / (WEEKS - 1);
          }
          function yPx(v: number): number {
            return H - PADB - ((H - PADB - PADT) * v) / yMax;
          }
          const path = r.series
            .map((v, w) => `${w === 0 ? 'M' : 'L'}${xPx(w)},${yPx(v)}`)
            .join(' ');
          const last = r.series[WEEKS - 1] ?? 0;
          const overBudget = last > budget;
          return (
            <div key={r.route} className="bg-bg p-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="truncate font-mono text-ink-1">
                  {r.route}
                </span>
                <span
                  className={cn(
                    'font-mono',
                    overBudget ? 'text-sev-err' : 'text-ink-3',
                  )}
                >
                  {last}/{budget}KB
                </span>
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="block h-20 w-full"
              >
                <line
                  x1={PADL}
                  x2={W - 4}
                  y1={yPx(budget)}
                  y2={yPx(budget)}
                  className="stroke-sev-warn"
                  strokeWidth={0.6}
                  strokeDasharray="3 2"
                />
                <path
                  d={path}
                  className={cn(
                    overBudget ? 'stroke-sev-err' : 'stroke-accent',
                  )}
                  strokeWidth={1.2}
                  fill="none"
                />
                {r.series.map((v, w) => (
                  <circle
                    key={w}
                    cx={xPx(w)}
                    cy={yPx(v)}
                    r={1.4}
                    className={cn(
                      overBudget ? 'fill-sev-err' : 'fill-accent',
                    )}
                  />
                ))}
              </svg>
            </div>
          );
        })}
        {series.length === 0 && (
          <div className="col-span-4 bg-bg px-3 py-6 text-center text-[11px] text-ink-3">
            No routes selected.
          </div>
        )}
      </div>
    </div>
  );
}
