import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CANDIDATES,
  aggregate,
  formatKb,
  simulate,
  type Candidate,
} from './helpers';

const KIND_TONE: Record<Candidate['kind'], 'info' | 'warn' | 'accent'> = {
  lib: 'info',
  asset: 'warn',
  route: 'accent',
};

export function PerfBudgetSimulatorOverlay() {
  const open = useUiStore((s) => s.overlays.perfBudgetSimulator.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selected, setSelected] = useState<ReadonlyArray<string>>([]);

  const sim = useMemo(() => simulate(selected), [selected]);
  const agg = useMemo(() => aggregate(sim), [sim]);

  const maxKb = useMemo(() => {
    let m = 0;
    for (const r of sim) {
      if (r.budgetKb > m) m = r.budgetKb;
      if (r.simulatedKb > m) m = r.simulatedKb;
    }
    return m * 1.05;
  }, [sim]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const ROW_H = 36;
  const chartHeight = sim.length * ROW_H + 24;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('perfBudgetSimulator')}
      title="Perf Budget Simulator"
      subtitle="What if I add this dependency / image / route?"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="text-ink-3">
            <span className="text-ink-2">Selected:</span>{' '}
            <span className="font-mono text-ink-1">{selected.length}</span>{' '}
            <span className="text-ink-3">candidates · {formatKb(agg.totalKb)} added</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Simulation locked (mock)')}
            >
              Lock simulation
            </Button>
            <Button
              size="xs"
              tone="accent"
              onClick={() => toast('Cleanup plan generated (mock)')}
            >
              Generate cleanup plan
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[320px_1fr_260px] divide-x divide-line">
        {/* Left rail: candidates */}
        <aside className="min-w-0 px-3 py-3">
          <h3 className="text-caps text-ink-3">Candidates</h3>
          <ul className="mt-2 space-y-1">
            {CANDIDATES.map((c) => {
              const checked = selected.includes(c.id);
              return (
                <li key={c.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-sm border px-2 py-1.5',
                      checked
                        ? 'border-accent bg-accent-soft/40'
                        : 'border-line bg-bg hover:bg-bg-hover',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                      className="mt-0.5 h-3 w-3 accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-mono text-[12px] text-ink-1">
                          {c.label}
                        </span>
                        <Chip tone={KIND_TONE[c.kind]} size="xs">
                          {formatKb(c.sizeKB)}
                        </Chip>
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-ink-3">
                        {c.note}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main: bar chart */}
        <main className="min-w-0 px-3 py-3">
          <h3 className="text-caps text-ink-3">Per-route bundle (current vs simulated)</h3>
          <svg
            className="mt-2 w-full"
            viewBox={`0 0 600 ${chartHeight}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Per-route bundle simulation"
          >
            {sim.map((r, i) => {
              const y = i * ROW_H + 14;
              const currentW = (r.currentKb / maxKb) * 360;
              const simW = (r.simulatedKb / maxKb) * 360;
              const budgetX = 200 + (r.budgetKb / maxKb) * 360;
              return (
                <g key={r.id}>
                  <text
                    x={0}
                    y={y + 8}
                    fontSize={10}
                    fill="currentColor"
                    className="font-mono text-ink-2"
                  >
                    {r.route}
                  </text>
                  {/* track */}
                  <rect
                    x={200}
                    y={y - 2}
                    width={360}
                    height={20}
                    className="fill-bg-subtle"
                    rx={2}
                  />
                  {/* current bar */}
                  <rect
                    x={200}
                    y={y}
                    width={currentW}
                    height={6}
                    className="fill-line-strong"
                    rx={1}
                  />
                  {/* simulated bar */}
                  <rect
                    x={200}
                    y={y + 8}
                    width={simW}
                    height={8}
                    className={cn(
                      'transition-all',
                      r.overBudget ? 'fill-sev-err' : 'fill-accent',
                    )}
                    rx={1}
                  />
                  {/* budget marker */}
                  <line
                    x1={budgetX}
                    x2={budgetX}
                    y1={y - 3}
                    y2={y + 19}
                    className="stroke-sev-warn"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                  <text
                    x={565}
                    y={y + 8}
                    fontSize={9}
                    fill="currentColor"
                    className={cn(
                      'font-mono',
                      r.overBudget ? 'text-sev-err' : 'text-ink-2',
                    )}
                  >
                    {formatKb(r.simulatedKb)}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-sm bg-line-strong" /> current
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-accent" /> simulated
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-sev-err" /> over budget
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block h-3 w-px"
                style={{ borderRight: '1px dashed currentColor' }}
              />{' '}
              budget marker
            </span>
          </div>
        </main>

        {/* Right rail: aggregate */}
        <aside className="min-w-0 px-3 py-3">
          <h3 className="text-caps text-ink-3">Aggregate impact</h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">+KB</div>
              <div className="font-mono text-ink-1">{formatKb(agg.totalKb)}</div>
            </div>
            <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">max ΔLCP</div>
              <div className="font-mono text-ink-1">+{agg.maxLcpDeltaMs}ms</div>
            </div>
          </div>

          <h4 className="text-caps mt-3 text-ink-3">Routes blowing budget</h4>
          {agg.blowing.length === 0 ? (
            <p className="mt-1 text-[11px] text-ink-3">All routes within budget.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {agg.blowing.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-sm border border-sev-err/30 bg-sev-err-soft px-2 py-1 font-mono text-[11px]"
                >
                  <span className="truncate text-ink-1">{r.route}</span>
                  <span className="text-sev-err">
                    +{r.simulatedKb - r.budgetKb}KB
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
