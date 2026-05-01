import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  AGENT_USAGE,
  DAILY_USAGE,
  MODEL_KINDS,
  dailyTotal,
  modelColor,
  modelDot,
  mtdSpend,
  projectedEom,
  shortDay,
  todaySpend,
  totalAgentCost,
  trend7d,
} from './helpers';

const CHART_W = 640;
const CHART_H = 200;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 24;

function fmtUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function TokenMeterOverlay() {
  const open = useUiStore((s) => s.overlays.tokenMeter.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [budget, setBudget] = useState<number>(20);

  const today = useMemo(() => todaySpend(), []);
  const mtd = useMemo(() => mtdSpend(), []);
  const proj = useMemo(() => projectedEom(), []);
  const trend = useMemo(() => trend7d(), []);
  const agentTotal = useMemo(() => totalAgentCost(), []);
  const overBudget = today > budget;

  const maxDay = useMemo(() => {
    let max = 0;
    for (const d of DAILY_USAGE) {
      const total = dailyTotal(d);
      if (total > max) max = total;
    }
    return Math.max(max, 1);
  }, []);

  const innerW = CHART_W - PAD_L - PAD_R;
  const innerH = CHART_H - PAD_T - PAD_B;
  const barW = (innerW / DAILY_USAGE.length) * 0.7;
  const barGap = (innerW / DAILY_USAGE.length) * 0.3;

  // sparkline
  const SPARK_W = 96;
  const SPARK_H = 28;
  const trendMax = Math.max(1, ...trend);
  const sparkPoints = trend
    .map((v, i) => {
      const x = (i / Math.max(trend.length - 1, 1)) * SPARK_W;
      const y = SPARK_H - (v / trendMax) * SPARK_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const yTicks = 4;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('tokenMeter'))}
      title="Token Meter"
      subtitle="14-day window · per-model · per-agent"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            today{' '}
            <span className={cn('font-mono', overBudget ? 'text-sev-err' : 'text-ink-1')}>
              {fmtUSD(today)}
            </span>{' '}
            / budget{' '}
            <span className="font-mono text-ink-2">{fmtUSD(budget)}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast('Exported usage CSV (mock)')}
            >
              Export CSV
            </Button>
            <Button
              size="xs"
              tone="soft"
              onClick={() => toast('Alert configured (mock)')}
            >
              Set alert
            </Button>
            <Button size="xs" tone="ghost" onClick={() => close('tokenMeter')}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-2 px-3 py-3">
        <Kpi label="today" value={fmtUSD(today)} />
        <Kpi label="month-to-date" value={fmtUSD(mtd)} />
        <Kpi label="projected EOM" value={fmtUSD(proj)} />
        <div className="rounded-sm border border-line bg-bg p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">
              7-day trend
            </span>
            <span className="font-mono text-[11px] text-ink-1">
              {fmtUSD(trend.reduce((a, b) => a + b, 0))}
            </span>
          </div>
          <svg
            width="100%"
            height={SPARK_H}
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            className="mt-1"
            aria-label="7-day spend sparkline"
          >
            <polyline
              points={sparkPoints}
              className="fill-none stroke-accent"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] divide-x divide-line">
        <div className="px-3 pb-3">
          {/* Stacked bar chart */}
          <div className="rounded-sm border border-line bg-bg-subtle/50 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-caps text-ink-3">
                daily spend by model · 14d
              </span>
              <div className="flex items-center gap-2">
                {MODEL_KINDS.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 text-[10px] text-ink-3"
                  >
                    <span
                      aria-hidden
                      className={cn('inline-block h-2 w-2 rounded-sm', modelDot(m))}
                    />
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <svg
              width="100%"
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              role="img"
              aria-label="Stacked daily spend bar chart"
            >
              {/* y axis */}
              {Array.from({ length: yTicks + 1 }).map((_, i) => {
                const v = (maxDay / yTicks) * i;
                const y = PAD_T + innerH - (v / maxDay) * innerH;
                return (
                  <g key={i}>
                    <line
                      x1={PAD_L}
                      x2={CHART_W - PAD_R}
                      y1={y}
                      y2={y}
                      className="stroke-line"
                      strokeDasharray="2 3"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_L - 4}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-ink-3 text-[10px]"
                      style={{ fontFamily: 'inherit' }}
                    >
                      ${v.toFixed(0)}
                    </text>
                  </g>
                );
              })}
              {/* bars */}
              {DAILY_USAGE.map((d, i) => {
                const xBase =
                  PAD_L + i * (innerW / DAILY_USAGE.length) + barGap / 2;
                let cumulative = 0;
                return (
                  <g key={d.day}>
                    {MODEL_KINDS.map((m) => {
                      const v = d.spendByModel[m];
                      const h = (v / maxDay) * innerH;
                      const y = PAD_T + innerH - cumulative - h;
                      cumulative += h;
                      return (
                        <rect
                          key={m}
                          x={xBase}
                          y={y}
                          width={barW}
                          height={Math.max(0, h)}
                          className={modelColor(m)}
                        >
                          <title>
                            {d.day} · {m} · {fmtUSD(v)}
                          </title>
                        </rect>
                      );
                    })}
                    {i % 2 === 0 && (
                      <text
                        x={xBase + barW / 2}
                        y={CHART_H - 6}
                        textAnchor="middle"
                        className="fill-ink-3 text-[9px]"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {shortDay(d.day)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Agent breakdown */}
          <div className="mt-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              agent breakdown
            </div>
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-caps text-ink-3">
                <tr>
                  <th className="hairline-b px-2 py-1 text-left">agent</th>
                  <th className="hairline-b px-2 py-1 text-right">cost</th>
                  <th className="hairline-b px-2 py-1 text-right">calls</th>
                  <th className="hairline-b px-2 py-1 text-left">share</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_USAGE.map((a) => {
                  const pct = agentTotal > 0 ? (a.costUSD / agentTotal) * 100 : 0;
                  return (
                    <tr key={a.agent}>
                      <td className="hairline-b px-2 py-1 text-ink-1">
                        {a.agent}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-ink-1">
                        {fmtUSD(a.costUSD)}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-ink-2">
                        {a.callCount}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-subtle">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-ink-3">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget rail */}
        <aside className="px-3 py-3">
          <h3 className="text-caps text-ink-3">Budget</h3>
          <label className="mt-2 block">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">
              daily limit ($)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={budget}
              onChange={(e) =>
                setBudget(Math.max(0, Number(e.target.value) || 0))
              }
              className="mt-0.5 h-7 w-full rounded-sm border border-line bg-bg px-2 font-mono text-xs text-ink-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
          {overBudget ? (
            <Chip tone="err" size="xs" className="mt-2">
              over budget · {fmtUSD(today - budget)} today
            </Chip>
          ) : (
            <Chip tone="info" size="xs" className="mt-2">
              within budget · {fmtUSD(budget - today)} headroom
            </Chip>
          )}
          <div className="mt-2">
            <Button
              size="xs"
              tone="default"
              onClick={() => toast.success(`Budget set $${budget}/day (mock)`)}
            >
              Save
            </Button>
          </div>

          <div className="mt-4 rounded-sm border border-line bg-bg-subtle p-2 text-[11px] text-ink-2">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              tip
            </div>
            <p className="mt-1">
              Route low-stakes refactors to{' '}
              <span className="font-mono text-ink-1">haiku-4.5</span>; reserve{' '}
              <span className="font-mono text-ink-1">opus-4.7</span> for risky
              edits and migrations.
            </p>
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-bg p-2">
      <div className="text-[10px] uppercase tracking-caps text-ink-3">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-md text-ink-1">{value}</div>
    </div>
  );
}
