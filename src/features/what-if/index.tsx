import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  defaultScenarioId,
  findScenario,
  scenarios,
  type MetricRow,
  type ScenarioId,
} from './helpers';

export function WhatIfOverlay() {
  const open = useUiStore((s) => s.overlays.whatIf.open);
  const storedScenarioId = useUiStore(
    (s) => s.overlays.whatIf.scenarioId,
  ) as ScenarioId | undefined;
  const close = useUiStore((s) => s.closeOverlay);

  const [scenarioId, setScenarioId] = useState<ScenarioId>(
    storedScenarioId ?? defaultScenarioId,
  );

  useEffect(() => {
    if (storedScenarioId) setScenarioId(storedScenarioId);
  }, [storedScenarioId]);

  const scenario = findScenario(scenarioId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('whatIf'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Zap className="h-4 w-4 text-ink-3" />
          <span>What-if</span>
        </span>
      }
      subtitle="Try changes without modifying files"
      size="sm"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => {
              close('whatIf');
              toast('Discarded what-if', { description: scenario.title });
            }}
          >
            Discard
          </Button>
          <Button
            size="sm"
            tone="default"
            onClick={() =>
              toast('Applied (mock)', {
                description: scenario.title,
              })
            }
          >
            <Icon.Bulb className="h-3 w-3" /> Apply this change
          </Button>
        </>
      }
    >
      <div className="px-4 py-3">
        <label className="block">
          <span className="text-caps text-ink-3">Scenario</span>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value as ScenarioId)}
            className={cn(
              'mt-1 block w-full rounded-sm border border-line bg-bg px-2 py-1.5 text-sm text-ink-1',
              'focus:outline-2 focus:outline-accent',
            )}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-[12px] text-ink-3">{scenario.description}</p>
      </div>

      <section className="hairline-t px-4 py-3">
        <header className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-caps text-ink-3">Predicted behavior</h3>
          <Chip tone="muted" size="xs" className="font-normal normal-case">
            simulation · no files modified
          </Chip>
        </header>
        <div className="overflow-hidden rounded-sm border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-subtle text-caps text-ink-3">
                <th className="w-[36%] px-3 py-1.5 text-left font-normal">field</th>
                <th className="px-3 py-1.5 text-left font-normal">before</th>
                <th className="w-6 px-1 py-1.5 text-center font-normal" />
                <th className="px-3 py-1.5 text-left font-normal">after</th>
              </tr>
            </thead>
            <tbody>
              {scenario.metrics.map((m, idx) => (
                <MetricRowView
                  key={m.id}
                  metric={m}
                  isLast={idx === scenario.metrics.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-ink-3">
          Numbers are estimated from the current static analysis snapshot. Apply
          to materialise as a real diff.
        </p>
      </section>
    </OverlayPanel>
  );
}

function MetricRowView({ metric, isLast }: { metric: MetricRow; isLast: boolean }) {
  const arrow = match(metric.delta)
    .with('better', () => (
      <Icon.Right className="h-3.5 w-3.5 text-sem-static" aria-label="improves" />
    ))
    .with('worse', () => (
      <Icon.Right className="h-3.5 w-3.5 text-sev-warn" aria-label="regresses" />
    ))
    .with('unchanged', () => (
      <Icon.Right className="h-3.5 w-3.5 text-ink-3" aria-label="unchanged" />
    ))
    .with('neutral', () => (
      <Icon.Right className="h-3.5 w-3.5 text-ink-3" aria-label="neutral" />
    ))
    .exhaustive();

  return (
    <tr className={cn(!isLast && 'border-b border-line')}>
      <td className="px-3 py-1.5 font-mono text-[12px] text-ink-2">
        {metric.label}
      </td>
      <td className="px-3 py-1.5 font-mono text-[12px] text-ink-3">
        {metric.before}
      </td>
      <td className="px-1 py-1.5 text-center">{arrow}</td>
      <td className="px-3 py-1.5 font-mono text-[12px]">
        <DeltaValue metric={metric} />
      </td>
    </tr>
  );
}

function DeltaValue({ metric }: { metric: MetricRow }) {
  return match(metric.delta)
    .with('better', () => (
      <Chip tone="static" size="xs" className="font-mono normal-case">
        {metric.after}
      </Chip>
    ))
    .with('worse', () => (
      <Chip tone="warn" size="xs" className="font-mono normal-case">
        {metric.after}
      </Chip>
    ))
    .with('unchanged', () => (
      <span className="text-ink-2">{metric.after}</span>
    ))
    .with('neutral', () => (
      <span className="text-ink-2">{metric.after}</span>
    ))
    .exhaustive();
}
