import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ALL_KINDS,
  findRun,
  runs,
  type ActionRun,
  type ActionStep,
  type ActionStepKind,
} from './helpers';

type Filter = 'all' | 'ok' | 'fail';

function kindClass(kind: ActionStepKind): string {
  return match(kind)
    .with('auth', () => 'fill-sem-server text-sem-server')
    .with('validate', () => 'fill-sev-info text-sev-info')
    .with('authorize', () => 'fill-sem-edge text-sem-edge')
    .with('mutate', () => 'fill-sem-dynamic text-sem-dynamic')
    .with('side-effect', () => 'fill-accent text-accent')
    .with('revalidate', () => 'fill-sem-static text-sem-static')
    .with('redirect', () => 'fill-ink-3 text-ink-3')
    .with('audit', () => 'fill-sev-hint text-sev-hint')
    .with('error', () => 'fill-sev-err text-sev-err')
    .exhaustive();
}

function kindTone(kind: ActionStepKind): 'server' | 'info' | 'edge' | 'dynamic' | 'accent' | 'static' | 'muted' | 'hint' | 'err' {
  return match(kind)
    .with('auth', () => 'server' as const)
    .with('validate', () => 'info' as const)
    .with('authorize', () => 'edge' as const)
    .with('mutate', () => 'dynamic' as const)
    .with('side-effect', () => 'accent' as const)
    .with('revalidate', () => 'static' as const)
    .with('redirect', () => 'muted' as const)
    .with('audit', () => 'hint' as const)
    .with('error', () => 'err' as const)
    .exhaustive();
}

export function ActionReplayOverlay() {
  const open = useUiStore((s) => s.overlays.actionReplay.open);
  const requested = useUiStore((s) => s.overlays.actionReplay.runId);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const visibleRuns = useMemo<ReadonlyArray<ActionRun>>(() => {
    if (filter === 'ok') return runs.filter((r) => r.success);
    if (filter === 'fail') return runs.filter((r) => !r.success);
    return runs;
  }, [filter]);

  const fallbackId = visibleRuns[0]?.id ?? runs[0]?.id;
  const effectiveId = activeRunId ?? requested ?? fallbackId;
  const run = useMemo(() => findRun(effectiveId), [effectiveId]);

  const selectedStep: ActionStep | null = useMemo(() => {
    if (selectedStepId) {
      const found = run.steps.find((s) => s.id === selectedStepId);
      if (found) return found;
    }
    const failing = run.steps.find((s) => !s.ok);
    return failing ?? run.steps[0] ?? null;
  }, [run, selectedStepId]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('actionReplay'))}
      title="Action Replay"
      subtitle="auth → validate → mutate → revalidate timeline"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() =>
              toast(`Replaying ${run.actionName} (mock)`, {
                description: `${run.steps.length} steps · ${run.totalMs}ms`,
              })
            }
          >
            Replay (mock)
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Compare runs (mock)')}>
            Compare runs
          </Button>
          <Button size="xs" tone="ghost" onClick={() => close('actionReplay')}>
            Close
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">run</span>
        <select
          value={run.id}
          onChange={(e) => {
            setActiveRunId(e.target.value);
            setSelectedStepId(null);
          }}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-[11px] text-ink-1"
        >
          {visibleRuns.length === 0 && (
            <option value={run.id}>{run.actionName}</option>
          )}
          {visibleRuns.map((r) => (
            <option key={r.id} value={r.id}>
              {r.actionName} · {r.success ? 'ok' : 'fail'} · {r.totalMs}ms
            </option>
          ))}
        </select>
        <div className="ml-2 flex items-center gap-1">
          {(['all', 'ok', 'fail'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                filter === f
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-2">
          {run.success ? (
            <Chip tone="static" size="xs">
              ok
            </Chip>
          ) : (
            <Chip tone="err" size="xs">
              fail
            </Chip>
          )}
          <span className="font-mono text-[10px] text-ink-3">
            {run.steps.length} steps · {run.totalMs}ms
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        {/* Timeline */}
        <div className="min-w-0 px-3 py-3">
          <Timeline
            run={run}
            selectedStepId={selectedStep?.id ?? null}
            onSelect={(id) => setSelectedStepId(id)}
          />

          {/* Step list */}
          <ol className="mt-3 space-y-1">
            {run.steps.map((step, idx) => {
              const isSel = step.id === selectedStep?.id;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedStepId(step.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm border px-2 py-1 text-left text-[11px]',
                      isSel ? 'border-accent bg-accent-soft/40' : 'border-line bg-bg hover:bg-bg-hover',
                      !step.ok && 'border-sev-err/50',
                    )}
                  >
                    <span className="w-5 text-right font-mono text-[10px] text-ink-3">
                      {idx + 1}
                    </span>
                    <Chip tone={kindTone(step.kind)} size="xs">
                      {step.kind}
                    </Chip>
                    <span className="min-w-0 flex-1 truncate font-mono text-ink-1">{step.label}</span>
                    {!step.ok && <span className="text-sev-err">✕</span>}
                    <span className="font-mono text-[10px] text-ink-3">{step.durMs}ms</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Detail */}
        <aside className="min-w-0 px-3 py-3">
          <h3 className="text-caps text-ink-3">Action</h3>
          <div className="mt-1 rounded-sm border border-line bg-bg-subtle p-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-ink-1">{run.actionName}</span>
              {run.success ? (
                <Chip tone="static" size="xs">
                  ok
                </Chip>
              ) : (
                <Chip tone="err" size="xs">
                  fail
                </Chip>
              )}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-ink-3">
              <span>route</span>
              <span className="truncate font-mono text-ink-1">{run.routeId}</span>
              <span>user</span>
              <span className="truncate font-mono text-ink-1">{run.user}</span>
              <span>total</span>
              <span className="font-mono text-ink-1">{run.totalMs}ms</span>
            </div>
          </div>

          <h3 className="mt-3 text-caps text-ink-3">Step</h3>
          {selectedStep ? (
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-1">
                <Chip tone={kindTone(selectedStep.kind)} size="xs">
                  {selectedStep.kind}
                </Chip>
                {!selectedStep.ok && (
                  <Chip tone="err" size="xs">
                    failed
                  </Chip>
                )}
                <span className="ml-auto font-mono text-[10px] text-ink-3">
                  {selectedStep.durMs}ms
                </span>
              </div>
              <div className="break-all rounded-sm border border-line bg-bg p-1.5 font-mono text-[11px] text-ink-1">
                {selectedStep.label}
              </div>
              <div className="text-[10px] text-ink-3">
                t = {selectedStep.startMs}ms → {selectedStep.startMs + selectedStep.durMs}ms
              </div>
              {selectedStep.payload && (
                <CodeBlock
                  code={selectedStep.payload}
                  language={selectedStep.kind === 'mutate' ? 'sql' : 'json'}
                  maxHeight={200}
                  showLineNumbers={false}
                />
              )}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-ink-3">No step selected.</div>
          )}

          <h3 className="mt-3 text-caps text-ink-3">Legend</h3>
          <ul className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
            {ALL_KINDS.map((k) => (
              <li key={k} className="flex items-center gap-1">
                <span className={cn('inline-block h-2.5 w-3 rounded-sm', kindClass(k))} aria-hidden />
                <span className="text-ink-2">{k}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Timeline({
  run,
  selectedStepId,
  onSelect,
}: {
  run: ActionRun;
  selectedStepId: string | null;
  onSelect(id: string): void;
}) {
  const width = 620;
  const padX = 12;
  const innerW = width - padX * 2;
  const total = Math.max(1, run.totalMs);
  const rowH = 18;
  const height = run.steps.length * rowH + 28;
  const ticks = 5;

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        preserveAspectRatio="none"
      >
        {/* axis */}
        <line
          x1={padX}
          x2={width - padX}
          y1={16}
          y2={16}
          className="stroke-line"
          strokeWidth={1}
        />
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const x = padX + (innerW * i) / ticks;
          const t = Math.round((total * i) / ticks);
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={12} y2={height - 4} className="stroke-line/40" strokeWidth={1} />
              <text x={x} y={10} textAnchor="middle" className="fill-ink-3" fontSize={9}>
                {t}ms
              </text>
            </g>
          );
        })}
        {run.steps.map((step, idx) => {
          const x = padX + (innerW * step.startMs) / total;
          const w = Math.max(2, (innerW * step.durMs) / total);
          const y = 22 + idx * rowH;
          const fillCls = kindClass(step.kind);
          const isSel = step.id === selectedStepId;
          return (
            <g
              key={step.id}
              className="cursor-pointer"
              onClick={() => onSelect(step.id)}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={rowH - 4}
                rx={2}
                className={cn(fillCls, !step.ok && 'stroke-sev-err')}
                strokeWidth={!step.ok ? 1.5 : 0}
                opacity={isSel ? 1 : 0.85}
              />
              <text
                x={Math.min(x + 4, width - padX - 60)}
                y={y + rowH - 8}
                fontSize={10}
                className="fill-ink-1"
              >
                {step.label.length > 38 ? `${step.label.slice(0, 35)}…` : step.label}
              </text>
              {!step.ok && (
                <text x={x + w + 4} y={y + rowH - 8} fontSize={10} className="fill-sev-err">
                  ✕
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
