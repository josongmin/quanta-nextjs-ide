import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ALL_REGIONS,
  edgeFns,
  ratioColor,
  regionLatencies,
  suggestionsFor,
  type EdgeFn,
  type Region,
} from './helpers';

type RuntimeFilter = 'all' | 'edge' | 'node';

export function EdgeColdWarmOverlay() {
  const open = useUiStore((s) => s.overlays.edgeColdWarm.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [runtimeFilter, setRuntimeFilter] = useState<RuntimeFilter>('all');
  const [activeRegions, setActiveRegions] = useState<ReadonlyArray<Region>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo<ReadonlyArray<EdgeFn>>(() => {
    return edgeFns
      .filter((fn) => {
        if (runtimeFilter !== 'all' && fn.runtime !== runtimeFilter) return false;
        if (activeRegions.length > 0 && !activeRegions.some((r) => fn.regions.includes(r))) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.warmRatio - b.warmRatio);
  }, [runtimeFilter, activeRegions]);

  const maxColdP50 = useMemo(
    () => Math.max(50, ...edgeFns.map((f) => f.coldP50)),
    [],
  );

  const maxBundle = useMemo(() => Math.max(64, ...edgeFns.map((f) => f.bundleKb)), []);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('edgeColdWarm'))}
      title="Edge Cold/Warm"
      subtitle="cold start vs warm hit per edge function"
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Open in dashboard (mock)')}>
            Open in dashboard
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Pre-warm strategy applied (mock)')}>
            Pre-warm strategy
          </Button>
          <Button size="xs" tone="ghost" onClick={() => close('edgeColdWarm')}>
            Close
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">runtime</span>
        {(['all', 'edge', 'node'] as const).map((rt) => (
          <button
            key={rt}
            type="button"
            onClick={() => setRuntimeFilter(rt)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              runtimeFilter === rt
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {rt}
          </button>
        ))}
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">regions</span>
        {ALL_REGIONS.map((r) => {
          const active = activeRegions.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() =>
                setActiveRegions((prev) =>
                  prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
                )
              }
              className={cn(
                'h-5 rounded-full border px-1.5 font-mono text-[10px]',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-3 hover:text-ink-1',
              )}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_240px] divide-x divide-line">
        <div className="min-w-0 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-bg-subtle">
              <tr className="text-[10px] uppercase tracking-caps text-ink-3">
                <Th>fn</Th>
                <Th>rt</Th>
                <Th>regions</Th>
                <Th right>kb</Th>
                <Th>cold p50</Th>
                <Th right>p95</Th>
                <Th right>warm p50</Th>
                <Th right>p95</Th>
                <Th right>warm %</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fn) => {
                const ratioCls = ratioColor(fn.warmRatio);
                const isExpanded = expandedId === fn.id;
                return (
                  <Fragment key={fn.id}>
                    <tr
                      onClick={() => setExpandedId((cur) => (cur === fn.id ? null : fn.id))}
                      className={cn(
                        'cursor-pointer hover:bg-bg-hover',
                        isExpanded && 'bg-accent-soft/20',
                      )}
                    >
                      <td className="hairline-b px-2 py-1 font-mono text-[11px] text-ink-1">
                        {fn.routePath}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <Chip tone={fn.runtime === 'edge' ? 'edge' : 'server'} size="xs">
                          {fn.runtime}
                        </Chip>
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <div className="flex items-center gap-0.5">
                          {ALL_REGIONS.map((r) => {
                            const present = fn.regions.includes(r);
                            return (
                              <span
                                key={r}
                                title={r}
                                className={cn(
                                  'inline-block h-3 w-3 rounded-full border',
                                  present
                                    ? 'border-accent/60 bg-accent-soft'
                                    : 'border-line bg-bg',
                                )}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-[11px] text-ink-1">
                        {fn.bundleKb}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-subtle">
                            <div
                              className="h-full bg-sev-warn"
                              style={{ width: `${(fn.coldP50 / maxColdP50) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-ink-1">{fn.coldP50}</span>
                        </div>
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-[11px] text-ink-2">
                        {fn.coldP95}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-[11px] text-ink-1">
                        {fn.warmP50}
                      </td>
                      <td className="hairline-b px-2 py-1 text-right font-mono text-[11px] text-ink-2">
                        {fn.warmP95}
                      </td>
                      <td className="hairline-b px-2 py-1">
                        <div
                          className={cn(
                            'inline-flex h-6 w-14 items-center justify-center rounded-sm font-mono text-[12px] font-medium',
                            ratioCls.bg,
                            ratioCls.fg,
                          )}
                        >
                          {Math.round(fn.warmRatio * 100)}%
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="hairline-b bg-bg-subtle px-3 py-2">
                          <ExpandedFn fn={fn} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[11px] text-ink-3">
                    No functions match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Aggregate scatter */}
        <aside className="min-w-0 px-3 py-3">
          <h3 className="text-caps text-ink-3">Bundle vs Cold p50</h3>
          <Scatter fns={edgeFns} maxBundle={maxBundle} maxCold={maxColdP50} />
          <div className="mt-2 text-[10px] text-ink-3">
            Each dot = one function. Larger dots indicate higher warm ratio.
          </div>

          <h3 className="mt-3 text-caps text-ink-3">Legend</h3>
          <ul className="mt-1 space-y-1 text-[10px]">
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm bg-sem-static-soft" />
              <span className="text-ink-2">≥ 85% warm</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-info-soft" />
              <span className="text-ink-2">70 – 85%</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-warn-soft" />
              <span className="text-ink-2">55 – 70%</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm bg-sev-err-soft" />
              <span className="text-ink-2">&lt; 55%</span>
            </li>
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        'hairline-b bg-bg-subtle px-2 py-1.5 font-normal',
        right ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function ExpandedFn({ fn }: { fn: EdgeFn }) {
  const latencies = regionLatencies(fn);
  const maxLat = Math.max(...Object.values(latencies));
  const tips = suggestionsFor(fn);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <h4 className="text-caps text-ink-3">Per-region p50 (mock)</h4>
        <ul className="mt-1 space-y-1">
          {ALL_REGIONS.filter((r) => fn.regions.includes(r)).map((r) => {
            const ms = latencies[r];
            return (
              <li key={r} className="flex items-center gap-2">
                <span className="w-10 font-mono text-[10px] text-ink-3">{r}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(ms / maxLat) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-[10px] text-ink-1">{ms}ms</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h4 className="text-caps text-ink-3">Suggestions</h4>
        <ul className="mt-1 space-y-1 text-[11px] text-ink-2">
          {tips.map((t, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-accent">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Scatter({
  fns,
  maxBundle,
  maxCold,
}: {
  fns: ReadonlyArray<EdgeFn>;
  maxBundle: number;
  maxCold: number;
}) {
  const w = 200;
  const h = 160;
  const padL = 24;
  const padR = 6;
  const padT = 8;
  const padB = 18;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  return (
    <div className="mt-1 overflow-hidden rounded-sm border border-line bg-bg">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full">
        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} className="stroke-line" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} className="stroke-line" />
        {/* y ticks */}
        {[0, 0.5, 1].map((p) => {
          const y = padT + innerH * (1 - p);
          return (
            <g key={p}>
              <line x1={padL - 2} x2={padL} y1={y} y2={y} className="stroke-line" />
              <text x={padL - 4} y={y + 3} fontSize={8} textAnchor="end" className="fill-ink-3">
                {Math.round(maxCold * p)}
              </text>
            </g>
          );
        })}
        {/* x ticks */}
        {[0, 0.5, 1].map((p) => {
          const x = padL + innerW * p;
          return (
            <g key={p}>
              <line x1={x} x2={x} y1={h - padB} y2={h - padB + 2} className="stroke-line" />
              <text x={x} y={h - padB + 10} fontSize={8} textAnchor="middle" className="fill-ink-3">
                {Math.round(maxBundle * p)}
              </text>
            </g>
          );
        })}
        <text x={padL + innerW / 2} y={h - 2} fontSize={8} textAnchor="middle" className="fill-ink-3">
          bundle KB
        </text>
        <text
          x={6}
          y={padT + innerH / 2}
          fontSize={8}
          className="fill-ink-3"
          transform={`rotate(-90 6 ${padT + innerH / 2})`}
          textAnchor="middle"
        >
          cold p50
        </text>
        {/* points */}
        {fns.map((fn) => {
          const cx = padL + (fn.bundleKb / maxBundle) * innerW;
          const cy = padT + (1 - fn.coldP50 / maxCold) * innerH;
          const r = 2 + fn.warmRatio * 4;
          const ratioCls = ratioColor(fn.warmRatio);
          return (
            <g key={fn.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                className={cn(ratioCls.fg, 'fill-current')}
                opacity={0.6}
                stroke="currentColor"
              />
              <text x={cx + r + 2} y={cy + 3} fontSize={7} className="fill-ink-2">
                {fn.routePath.replace('/api/', '').replace('/route', '')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
