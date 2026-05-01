import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  COHORT_LABELS,
  FUNNELS,
  RANGES,
  REASON_TONE,
  buildCohortMatrix,
  funnelById,
} from './helpers';

const FUNNEL_W = 480;
const FUNNEL_H = 320;
const HEAT_W = 320;
const HEAT_H = 240;

export function FunnelEditorOverlay() {
  const open = useUiStore((s) => s.overlays.funnelEditor.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [funnelId, setFunnelId] = useState<string>('subscribe');
  const [range, setRange] = useState<string>('30d');
  const [selectedStepId, setSelectedStepId] = useState<string>('subscribe');

  const funnel = funnelById(funnelId);
  const matrix = useMemo(() => buildCohortMatrix(), []);

  const selectedStep =
    funnel.steps.find((s) => s.id === selectedStepId) ?? funnel.steps[0];

  const maxCount = Math.max(1, ...funnel.steps.map((s) => s.count));

  const stepRowH = funnel.steps.length > 0 ? FUNNEL_H / funnel.steps.length : 0;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('funnelEditor')}
      title="Funnel Editor"
      subtitle={`${funnel.name} · ${range} · ${funnel.steps.length} steps`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-end gap-1.5 text-xs">
          <Button size="xs" tone="default" onClick={() => toast('Snapshot saved (mock)')}>
            Save snapshot
          </Button>
          <Button size="xs" tone="ghost" onClick={() => toast('Funnel exported (mock)')}>
            Export
          </Button>
        </div>
      }
    >
      <div className="flex">
        <div className="min-w-0 flex-1">
          <PanelHeader>
            <span className="text-ink-3">funnel:</span>
            {FUNNELS.map((f) => (
              <ToggleChip
                key={f.id}
                active={funnelId === f.id}
                onClick={() => setFunnelId(f.id)}
              >
                {f.name}
              </ToggleChip>
            ))}
            <span className="mx-1 h-3 w-px bg-line" />
            <span className="text-ink-3">range:</span>
            {RANGES.map((r) => (
              <ToggleChip
                key={r}
                active={range === r}
                onClick={() => setRange(r)}
              >
                {r}
              </ToggleChip>
            ))}
          </PanelHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="text-caps text-ink-3">Funnel</div>
                  <svg
                    viewBox={`0 0 ${FUNNEL_W} ${FUNNEL_H}`}
                    className="mt-2 w-full"
                    role="img"
                    aria-label="funnel visualization"
                  >
                    {funnel.steps.map((s, i) => {
                      const ratio = s.count / maxCount;
                      const w = ratio * (FUNNEL_W - 40);
                      const x = (FUNNEL_W - w) / 2;
                      const y = i * stepRowH + 4;
                      const h = stepRowH - 8;
                      const nextRatio =
                        i < funnel.steps.length - 1
                          ? funnel.steps[i + 1]!.count / maxCount
                          : ratio;
                      const wNext = nextRatio * (FUNNEL_W - 40);
                      const xNext = (FUNNEL_W - wNext) / 2;
                      const isSel = selectedStepId === s.id;
                      return (
                        <g
                          key={s.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedStepId(s.id)}
                        >
                          <path
                            d={`M ${x} ${y} L ${x + w} ${y} L ${xNext + wNext} ${y + h} L ${xNext} ${y + h} Z`}
                            className={cn(
                              isSel
                                ? 'fill-accent stroke-accent'
                                : 'fill-accent-soft stroke-line',
                            )}
                            fillOpacity={isSel ? 0.6 : 1}
                          />
                          <text
                            x={FUNNEL_W / 2}
                            y={y + h / 2 - 2}
                            textAnchor="middle"
                            className={cn(
                              'font-mono text-[11px]',
                              isSel ? 'fill-white' : 'fill-ink-1',
                            )}
                          >
                            {s.name}
                          </text>
                          <text
                            x={FUNNEL_W / 2}
                            y={y + h / 2 + 12}
                            textAnchor="middle"
                            className={cn(
                              'text-[10px]',
                              isSel ? 'fill-white' : 'fill-ink-3',
                            )}
                          >
                            {s.count.toLocaleString()} · {s.conversionPct.toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="text-caps text-ink-3">Cohort retention</div>
                  <svg
                    viewBox={`0 0 ${HEAT_W} ${HEAT_H}`}
                    className="mt-2"
                    width={HEAT_W}
                    height={HEAT_H}
                    role="img"
                    aria-label="cohort retention"
                  >
                    {matrix.map((row, r) =>
                      row.map((v, c) => {
                        const cellW = (HEAT_W - 30) / 12;
                        const cellH = (HEAT_H - 20) / 8;
                        const x = 30 + c * cellW;
                        const y = r * cellH;
                        const opacity = 0.1 + v * 0.85;
                        return (
                          <rect
                            key={`${r}-${c}`}
                            x={x + 0.5}
                            y={y + 0.5}
                            width={cellW - 1}
                            height={cellH - 1}
                            className="fill-accent"
                            fillOpacity={opacity}
                          >
                            <title>{`${COHORT_LABELS[r]} · w${c}: ${(v * 100).toFixed(0)}%`}</title>
                          </rect>
                        );
                      }),
                    )}
                    {COHORT_LABELS.map((lbl, r) => {
                      const cellH = (HEAT_H - 20) / 8;
                      return (
                        <text
                          key={lbl}
                          x={4}
                          y={r * cellH + cellH / 2 + 3}
                          className="fill-ink-3 text-[9px]"
                        >
                          {lbl}
                        </text>
                      );
                    })}
                    {Array.from({ length: 12 }).map((_, c) => {
                      const cellW = (HEAT_W - 30) / 12;
                      return (
                        <text
                          key={c}
                          x={30 + c * cellW + cellW / 2}
                          y={HEAT_H - 6}
                          textAnchor="middle"
                          className="fill-ink-3 text-[9px]"
                        >
                          w{c}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <h3 className="text-caps mt-4 text-ink-3">Drop-off reasons (per step)</h3>
              <div className="mt-2 space-y-1">
                {funnel.steps.map((s) => {
                  const total = s.dropOffReasons.reduce((a, b) => a + b.pct, 0);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-[11px]"
                    >
                      <span className="w-20 truncate font-mono text-ink-2">
                        {s.name}
                      </span>
                      <svg
                        viewBox="0 0 200 14"
                        preserveAspectRatio="none"
                        className="h-3 flex-1"
                      >
                        {(() => {
                          let acc = 0;
                          return s.dropOffReasons.map((r, i) => {
                            const w = (r.pct / Math.max(1, total)) * 200;
                            const x = acc;
                            acc += w;
                            return (
                              <rect
                                key={r.label}
                                x={x}
                                y={0}
                                width={w}
                                height={14}
                                className={REASON_TONE[i % REASON_TONE.length]}
                                fillOpacity={0.7}
                              >
                                <title>{`${r.label}: ${r.pct}%`}</title>
                              </rect>
                            );
                          });
                        })()}
                      </svg>
                      <span className="w-32 truncate text-[10px] text-ink-3">
                        {s.dropOffReasons[0]?.label ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        <aside className="w-[320px] shrink-0 hairline-l bg-bg-subtle/40">
          <div className="p-3">
            <div className="text-caps text-ink-3">Selected step</div>
            <div className="mt-1 font-mono text-md text-ink-1">
              {selectedStep?.name ?? '—'}
            </div>
            {selectedStep ? (
              <>
                <div className="mt-1 flex items-center gap-1">
                  <Chip tone="accent" size="xs">
                    {selectedStep.count.toLocaleString()}
                  </Chip>
                  <Chip tone="info" size="xs">
                    {selectedStep.conversionPct.toFixed(1)}% conv
                  </Chip>
                </div>

                <h4 className="text-caps mt-3 text-ink-3">Top events</h4>
                <ul className="mt-1 space-y-0.5">
                  {selectedStep.topEvents.map((e) => (
                    <li key={e} className="font-mono text-[10px] text-ink-2">
                      {e}
                    </li>
                  ))}
                </ul>

                <h4 className="text-caps mt-3 text-ink-3">Top exit pages</h4>
                <ul className="mt-1 space-y-0.5">
                  {selectedStep.topExitPages.map((p) => (
                    <li key={p} className="font-mono text-[10px] text-ink-2">
                      {p}
                    </li>
                  ))}
                </ul>

                <h4 className="text-caps mt-3 text-ink-3">Drop-off reasons</h4>
                <ul className="mt-1 space-y-0.5">
                  {selectedStep.dropOffReasons.map((r) => (
                    <li
                      key={r.label}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-ink-2">{r.label}</span>
                      <span className="font-mono text-ink-3">{r.pct}%</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="xs"
                  tone="default"
                  className="mt-3 w-full"
                  onClick={() =>
                    toast(`Suggested experiment for "${selectedStep.name}" (mock)`)
                  }
                >
                  Suggest experiment
                </Button>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
