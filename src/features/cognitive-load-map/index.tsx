import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  AREAS,
  FILES,
  RECOMMENDATIONS,
  aggregate,
  rawRisk,
  suggestedAction,
  tierFor,
  type Area,
  type FileMetric,
  type RiskTier,
} from './helpers';

const TIER_TONE: Record<RiskTier, 'accent' | 'warn' | 'err'> = {
  low: 'accent',
  med: 'warn',
  high: 'err',
};

const TIER_FILL: Record<RiskTier, string> = {
  low: 'hsl(var(--sem-static))',
  med: 'hsl(var(--warn))',
  high: 'hsl(var(--err))',
};

const ACTION_TONE: Record<string, 'err' | 'warn' | 'info' | 'muted'> = {
  split: 'err',
  'freeze refactor': 'warn',
  'test more': 'info',
  monitor: 'muted',
};

export function CognitiveLoadMapOverlay() {
  const open = useUiStore((s) => s.overlays.cognitiveLoadMap.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [areaFilters, setAreaFilters] = useState<Set<Area>>(new Set(AREAS));
  const [topRiskOnly, setTopRiskOnly] = useState<boolean>(false);
  const [hoverFile, setHoverFile] = useState<FileMetric | null>(null);

  const maxRisk = useMemo(
    () => FILES.reduce((m, f) => Math.max(m, rawRisk(f)), 0),
    [],
  );

  const filtered = useMemo(() => {
    let out = FILES.filter((f) => areaFilters.has(f.area));
    if (topRiskOnly) {
      out = out.filter((f) => tierFor(rawRisk(f), maxRisk) === 'high');
    }
    return out;
  }, [areaFilters, topRiskOnly, maxRisk]);

  const top10 = useMemo(
    () => [...filtered].sort((a, b) => rawRisk(b) - rawRisk(a)).slice(0, 10),
    [filtered],
  );

  const stats = useMemo(() => aggregate(filtered, maxRisk), [filtered, maxRisk]);

  const toggleArea = (a: Area) => {
    setAreaFilters((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('cognitiveLoadMap')}
      title={<span>Cognitive load map</span>}
      subtitle="complexity × edit-frequency · 30-day window"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {filtered.length} of {FILES.length} files
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('CSV exported (mock)')}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Refactor plan drafted (mock)', {
                description: `${top10.length} files queued for review.`,
              })
            }
          >
            Generate refactor plan
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="text-caps text-ink-3">Areas:</span>
        {AREAS.map((a) => (
          <ToggleChip key={a} active={areaFilters.has(a)} onClick={() => toggleArea(a)}>
            {a}
          </ToggleChip>
        ))}
        <span className="ml-2">
          <ToggleChip active={topRiskOnly} onClick={() => setTopRiskOnly((v) => !v)}>
            top-risk only
          </ToggleChip>
        </span>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_280px] gap-0">
        {/* Left: scatter + table */}
        <div className="min-w-0">
          <section className="px-4 py-3 hairline-b">
            <div className="text-caps mb-2 text-ink-3">
              Risk scatter · x = edits/30d · y = complexity
            </div>
            <Scatter
              files={filtered}
              maxRisk={maxRisk}
              onHover={setHoverFile}
              hover={hoverFile}
            />
          </section>

          <section className="px-4 py-3">
            <div className="text-caps mb-2 text-ink-3">Top 10 risky files</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-1 font-normal">File</th>
                  <th className="pb-1 pr-2 font-normal">Cx</th>
                  <th className="pb-1 pr-2 font-normal">Edits</th>
                  <th className="pb-1 pr-2 font-normal">Risk</th>
                  <th className="pb-1 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((f) => {
                  const tier = tierFor(rawRisk(f), maxRisk);
                  const action = suggestedAction(f, tier);
                  return (
                    <tr key={f.file} className="border-t border-line/60">
                      <td className="py-1 pr-2">
                        <span className="font-mono text-ink-1" title={f.file}>
                          {f.file}
                        </span>
                      </td>
                      <td className="py-1 pr-2">
                        <Bar value={f.complexity} max={50} tone="warn" />
                      </td>
                      <td className="py-1 pr-2">
                        <Bar value={f.editFreq30d} max={25} tone="info" />
                      </td>
                      <td className="py-1 pr-2">
                        <Chip tone={TIER_TONE[tier]} size="xs">
                          {rawRisk(f)}
                        </Chip>
                      </td>
                      <td className="py-1">
                        <Chip tone={ACTION_TONE[action] ?? 'muted'} size="xs">
                          {action}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
                {top10.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-ink-3">
                      No files match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>

        {/* Right: aggregate + recommendations */}
        <aside className="border-l border-line bg-bg-subtle/40">
          <section className="px-3 py-3 hairline-b">
            <div className="text-caps mb-2 text-ink-3">By area</div>
            <ul className="space-y-1.5">
              {stats.map((s) => (
                <li
                  key={s.area}
                  className="rounded-sm border border-line bg-bg px-2 py-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-ink-1">{s.area}</span>
                    <Chip tone="muted" size="xs">
                      {s.count}
                    </Chip>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-ink-3">
                    <span>cx {s.avgComplexity}</span>
                    <span>edit {s.avgFreq}</span>
                    <span className={cn(s.high > 0 && 'text-sev-err')}>
                      hi {s.high}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="px-3 py-3">
            <div className="text-caps mb-2 text-ink-3">Recommendations</div>
            <ul className="space-y-1.5">
              {RECOMMENDATIONS.map((r) => (
                <li
                  key={r.id}
                  className="rounded-sm border border-line bg-bg px-2 py-1.5 text-[11px] text-ink-2"
                >
                  {r.text}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </OverlayPanel>
  );
}

interface ScatterProps {
  files: ReadonlyArray<FileMetric>;
  maxRisk: number;
  onHover(f: FileMetric | null): void;
  hover: FileMetric | null;
}

function Scatter({ files, maxRisk, onHover, hover }: ScatterProps) {
  const w = 720;
  const h = 240;
  const pad = { l: 32, r: 12, t: 8, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const xMax = 25;
  const yMax = 50;

  const xFor = (v: number) => pad.l + (v / xMax) * innerW;
  const yFor = (v: number) => pad.t + innerH - (v / yMax) * innerH;

  return (
    <div className="relative">
      <svg width={w} height={h} className="block">
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH * t;
          return (
            <line
              key={`gy-${t}`}
              x1={pad.l}
              x2={pad.l + innerW}
              y1={y}
              y2={y}
              stroke="hsl(var(--border))"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const x = pad.l + innerW * t;
          return (
            <line
              key={`gx-${t}`}
              x1={x}
              x2={x}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="hsl(var(--border))"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
          );
        })}
        {/* axes */}
        <line
          x1={pad.l}
          x2={pad.l}
          y1={pad.t}
          y2={pad.t + innerH}
          stroke="hsl(var(--border-strong))"
        />
        <line
          x1={pad.l}
          x2={pad.l + innerW}
          y1={pad.t + innerH}
          y2={pad.t + innerH}
          stroke="hsl(var(--border-strong))"
        />
        {/* axis labels */}
        <text x={pad.l - 6} y={pad.t + 8} textAnchor="end" fontSize={9} fill="hsl(var(--text-3))">
          {yMax}
        </text>
        <text x={pad.l - 6} y={pad.t + innerH} textAnchor="end" fontSize={9} fill="hsl(var(--text-3))">
          0
        </text>
        <text
          x={pad.l + innerW}
          y={pad.t + innerH + 14}
          textAnchor="end"
          fontSize={9}
          fill="hsl(var(--text-3))"
        >
          {xMax} edits
        </text>
        <text
          x={pad.l}
          y={pad.t + innerH + 14}
          textAnchor="start"
          fontSize={9}
          fill="hsl(var(--text-3))"
        >
          0
        </text>
        {/* dots */}
        {files.map((f) => {
          const tier = tierFor(rawRisk(f), maxRisk);
          const cx = xFor(f.editFreq30d);
          const cy = yFor(f.complexity);
          const r = 3 + f.authors * 1.2;
          const isH = hover?.file === f.file;
          return (
            <circle
              key={f.file}
              cx={cx}
              cy={cy}
              r={r}
              fill={TIER_FILL[tier]}
              fillOpacity={isH ? 1 : 0.7}
              stroke={isH ? 'hsl(var(--text))' : 'hsl(var(--border-strong))'}
              strokeWidth={isH ? 1.5 : 0.5}
              onMouseEnter={() => onHover(f)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-sm border border-line bg-bg px-2 py-1 text-[11px] shadow-pop">
          <span className="font-mono text-ink-1">{hover.file}</span>
          <span className="ml-2 text-ink-3">
            cx {hover.complexity} · edit {hover.editFreq30d} · risk {rawRisk(hover)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

interface BarProps {
  value: number;
  max: number;
  tone: 'warn' | 'info';
}

function Bar({ value, max, tone }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'warn' ? 'bg-sev-warn' : 'bg-sev-info';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[10px] tabular-nums text-ink-3">{value}</span>
      <span className="relative inline-block h-1.5 w-16 overflow-hidden rounded-full bg-bg-subtle">
        <span
          className={cn('absolute left-0 top-0 h-full rounded-full', color)}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
