import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  RANGE_DAYS,
  ROUTES,
  THRESHOLDS,
  type DayMetric,
  type DeviceFilter,
  type RangeKey,
  type RouteRum,
} from './helpers';

type MetricKey = 'lcp' | 'inp' | 'cls';

const CHART_W = 540;
const CHART_H = 110;
const PAD = 8;

function metricMax(daily: ReadonlyArray<DayMetric>, key: MetricKey): number {
  let m = 0;
  for (const d of daily) {
    if (d[key].p95 > m) m = d[key].p95;
  }
  // floor
  if (key === 'cls') return Math.max(m, 0.3);
  if (key === 'inp') return Math.max(m, 600);
  return Math.max(m, 4500);
}

function VitalChart({
  daily,
  metric,
  label,
}: {
  daily: ReadonlyArray<DayMetric>;
  metric: MetricKey;
  label: string;
}) {
  const max = metricMax(daily, metric);
  const stepX = (CHART_W - PAD * 2) / Math.max(1, daily.length - 1);
  const t = THRESHOLDS[metric];
  const toY = (v: number) => CHART_H - PAD - (v / max) * (CHART_H - PAD * 2);

  const goodY = toY(t.good);
  const poorY = toY(t.poor);

  // p75 line
  const p75 = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${PAD + i * stepX} ${toY(d[metric].p75)}`)
    .join(' ');
  // p95 area
  const p95Top = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${PAD + i * stepX} ${toY(d[metric].p95)}`)
    .join(' ');
  const p95Bottom = daily
    .slice()
    .reverse()
    .map(
      (d, i) =>
        `L ${PAD + (daily.length - 1 - i) * stepX} ${toY(d[metric].p50)}`,
    )
    .join(' ');
  const areaPath = `${p95Top} ${p95Bottom} Z`;

  return (
    <div className="rounded-sm border border-line bg-bg p-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-ink-1">{label}</span>
        <span className="text-[10px] text-ink-3">14d · p50/p75/p95</span>
      </div>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="mt-1 w-full"
        role="img"
        aria-label={`${label} over time`}
      >
        {/* threshold zones */}
        <rect x={PAD} y={PAD} width={CHART_W - PAD * 2} height={goodY - PAD} className="fill-sev-info-soft" />
        <rect x={PAD} y={goodY} width={CHART_W - PAD * 2} height={Math.max(0, poorY - goodY)} className="fill-sev-warn-soft" />
        <rect x={PAD} y={poorY} width={CHART_W - PAD * 2} height={Math.max(0, CHART_H - PAD - poorY)} className="fill-sev-err-soft" />
        {/* p95 band */}
        <path d={areaPath} className="fill-accent/15" />
        {/* p75 line */}
        <path d={p75} fill="none" className="stroke-accent" strokeWidth={1.4} />
      </svg>
    </div>
  );
}

function DonutDevices({ mobile, desktop }: { mobile: number; desktop: number }) {
  const total = mobile + desktop;
  const r = 28;
  const c = 2 * Math.PI * r;
  const mobileLen = (mobile / total) * c;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" role="img" aria-label="device split">
      <circle cx={40} cy={40} r={r} fill="none" className="stroke-bg-subtle" strokeWidth={10} />
      <circle
        cx={40}
        cy={40}
        r={r}
        fill="none"
        className="stroke-accent"
        strokeWidth={10}
        strokeDasharray={`${mobileLen} ${c - mobileLen}`}
        strokeDashoffset={c / 4}
        transform="rotate(-90 40 40)"
      />
      <text x={40} y={38} textAnchor="middle" className="fill-ink-1" fontSize={11}>
        {mobile}%
      </text>
      <text x={40} y={50} textAnchor="middle" className="fill-ink-3" fontSize={8}>
        mobile
      </text>
    </svg>
  );
}

export function RealUserMonitorOverlay() {
  const open = useUiStore((s) => s.overlays.realUserMonitor.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeId, setRouteId] = useState<string>(ROUTES[0]?.id ?? '');
  const [range, setRange] = useState<RangeKey>('14d');
  const [device, setDevice] = useState<DeviceFilter>('all');

  const route: RouteRum | undefined =
    ROUTES.find((r) => r.id === routeId) ?? ROUTES[0];

  const daily = useMemo(() => {
    if (!route) return [];
    const n = Math.min(RANGE_DAYS[range], route.daily.length);
    return route.daily.slice(-n);
  }, [route, range]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('realUserMonitor')}
      title="Real User Monitor"
      subtitle="Web Vitals · LCP / INP / CLS · per route"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            {route ? (
              <>
                <span className="text-ink-2">Route:</span>{' '}
                <span className="font-mono text-ink-1">{route.route}</span>{' '}
                <span className="text-ink-3">· {range} · {device}</span>
              </>
            ) : (
              'No route'
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Session replay opened (mock)')}>
              Open session replay
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
        <span className="text-[10px] uppercase tracking-caps text-ink-3">route</span>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1"
        >
          {ROUTES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.route}
            </option>
          ))}
        </select>
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">range</span>
        {(['7d', '14d', '30d'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              range === r
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {r}
          </button>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        {(['all', 'mobile', 'desktop'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={cn(
              'h-5 rounded-full border px-2 font-mono text-[10px]',
              device === d
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-3 hover:text-ink-1',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          <VitalChart daily={daily} metric="lcp" label="LCP (ms)" />
          <div className="h-2" />
          <VitalChart daily={daily} metric="inp" label="INP (ms)" />
          <div className="h-2" />
          <VitalChart daily={daily} metric="cls" label="CLS" />
          <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-3">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-sev-info-soft" /> good
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-sev-warn-soft" /> needs work
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-sev-err-soft" /> poor
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-px w-4 bg-accent" /> p75
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-accent/15" /> p50–p95 band
            </span>
          </div>
        </main>

        <aside className="min-w-0 px-3 py-3">
          {route && (
            <>
              <h4 className="text-caps text-ink-3">Devices</h4>
              <div className="mt-1 flex items-center gap-3">
                <DonutDevices mobile={route.devices.mobile} desktop={route.devices.desktop} />
                <ul className="text-[11px] text-ink-2">
                  <li>
                    <span className="font-mono text-ink-1">{route.devices.mobile}%</span>{' '}
                    mobile
                  </li>
                  <li>
                    <span className="font-mono text-ink-1">{route.devices.desktop}%</span>{' '}
                    desktop
                  </li>
                </ul>
              </div>

              <h4 className="text-caps mt-3 text-ink-3">Countries</h4>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {route.countries.map((c) => (
                  <Chip key={c.name} tone="muted" size="xs">
                    <span className="mr-1">{c.flag}</span>
                    {c.name} · {c.pct}%
                  </Chip>
                ))}
              </div>

              <h4 className="text-caps mt-3 text-ink-3">Browsers</h4>
              <ul className="mt-1 space-y-0.5 text-[11px] text-ink-2">
                {route.browsers.map((b) => (
                  <li key={b.name} className="flex items-center justify-between">
                    <span>{b.name}</span>
                    <span className="font-mono text-ink-1">{b.pct}%</span>
                  </li>
                ))}
              </ul>

              <h4 className="text-caps mt-3 text-ink-3">Top-5 slowest sessions</h4>
              <ul className="mt-1 space-y-1">
                {route.slowSessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1 text-[11px]"
                  >
                    <span className="font-mono text-[10px] text-ink-3" style={{ minWidth: 40 }}>
                      {s.when}
                    </span>
                    <span className="flex-1 truncate text-ink-1">{s.device}</span>
                    <span className="text-[10px] text-ink-3">{s.country}</span>
                    <span className="font-mono text-[11px] text-sev-err">
                      {(s.lcpMs / 1000).toFixed(1)}s
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
