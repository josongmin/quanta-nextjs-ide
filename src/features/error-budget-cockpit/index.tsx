import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CAUSE_TONE,
  INCIDENTS,
  SLOS,
  insights,
  projectedSeries,
  type SLO,
} from './helpers';

const CHART_W = 260;
const CHART_H = 90;
const PAD = 6;

function SLOChart({ slo }: { slo: SLO }) {
  const projected = useMemo(() => projectedSeries(slo, 14), [slo]);
  const all = [...slo.burn, ...projected];
  const stepX = (CHART_W - PAD * 2) / (all.length - 1);

  const toY = (v: number) => CHART_H - PAD - v * (CHART_H - PAD * 2);
  const targetLineY = toY(slo.targetPct / 100);

  const actualPath = slo.burn
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${PAD + i * stepX} ${toY(v)}`)
    .join(' ');

  const lastBurn = slo.burn[slo.burn.length - 1] ?? 1;
  const projectedPath =
    `M ${PAD + (slo.burn.length - 1) * stepX} ${toY(lastBurn)} ` +
    projected
      .map((v, i) => `L ${PAD + (slo.burn.length + i) * stepX} ${toY(v)}`)
      .join(' ');

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full"
      role="img"
      aria-label={`${slo.name} burn-down`}
    >
      <rect
        x={PAD}
        y={PAD}
        width={CHART_W - PAD * 2}
        height={CHART_H - PAD * 2}
        className="fill-bg-subtle"
        rx={2}
      />
      <line
        x1={PAD}
        x2={CHART_W - PAD}
        y1={targetLineY}
        y2={targetLineY}
        className="stroke-sev-warn"
        strokeDasharray="3 2"
        strokeWidth={1}
      />
      <path d={actualPath} fill="none" className="stroke-accent" strokeWidth={1.5} />
      <path
        d={projectedPath}
        fill="none"
        className="stroke-sev-err"
        strokeDasharray="3 3"
        strokeWidth={1.2}
      />
      <line
        x1={PAD + (slo.burn.length - 1) * stepX}
        x2={PAD + (slo.burn.length - 1) * stepX}
        y1={PAD}
        y2={CHART_H - PAD}
        className="stroke-line"
        strokeDasharray="1 2"
      />
    </svg>
  );
}

export function ErrorBudgetCockpitOverlay() {
  const open = useUiStore((s) => s.overlays.errorBudgetCockpit.open);
  const close = useUiStore((s) => s.closeOverlay);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('errorBudgetCockpit')}
      title="Error Budget Cockpit"
      subtitle="SLO burn-down · 30 days · linear projection"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">4 SLOs · 6 incidents in window</span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="warn" onClick={() => toast('On-call paged (mock)')}>
              Page on-call
            </Button>
            <Button size="xs" tone="default" onClick={() => toast('Postmortem opened (mock)')}>
              Open postmortem
            </Button>
            <Button size="xs" tone="ghost" onClick={() => toast('SLO adjustment proposed (mock)')}>
              Adjust SLO
            </Button>
          </div>
        </div>
      }
    >
      <div className="px-3 py-3">
        <div className="grid grid-cols-4 gap-2">
          {SLOS.map((s) => {
            const { headroomPct, daysToZero } = insights(s);
            const ok = headroomPct >= 0;
            return (
              <div key={s.id} className="rounded-sm border border-line bg-bg p-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    {s.name}
                  </div>
                  <Chip tone={ok ? 'info' : 'err'} size="xs">
                    {ok ? 'on-track' : 'breached'}
                  </Chip>
                </div>
                <div className="mt-1 font-mono text-md text-ink-1">
                  {s.currentPct.toFixed(2)}%
                </div>
                <div className="mt-0.5 text-[10px] text-ink-3">
                  target {s.targetPct}% · headroom{' '}
                  <span className={cn('font-mono', ok ? 'text-ink-2' : 'text-sev-err')}>
                    {headroomPct >= 0 ? '+' : ''}
                    {headroomPct}%
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-ink-3">
                  {daysToZero === null ? 'budget stable' : `~${daysToZero}d to zero`}
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="text-caps mt-4 text-ink-3">
          Burn-down · last 30 days + 14d projection
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {SLOS.map((s) => (
            <div key={s.id} className="rounded-sm border border-line bg-bg p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] text-ink-1">{s.name}</span>
                <span className="text-[10px] text-ink-3">{s.metric}</span>
              </div>
              <SLOChart slo={s} />
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-px w-4 bg-accent" /> actual
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-px w-4"
              style={{ borderTop: '1px dashed currentColor' }}
            />{' '}
            projection
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-px w-4 bg-sev-warn" style={{ opacity: 0.6 }} />{' '}
            target
          </span>
        </div>

        <h3 className="text-caps mt-4 text-ink-3">Recent incidents</h3>
        <ul className="mt-2 space-y-1">
          {INCIDENTS.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5 text-[12px]"
            >
              <span
                className="font-mono text-[10px] text-ink-3"
                style={{ minWidth: 110 }}
              >
                {i.when}
              </span>
              <Chip tone={CAUSE_TONE[i.cause]} size="xs">
                {i.cause}
              </Chip>
              <span className="flex-1 truncate text-ink-1">{i.title}</span>
              <span className="font-mono text-[11px] text-sev-err">
                -{i.impactPct.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </OverlayPanel>
  );
}
