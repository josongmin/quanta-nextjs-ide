import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  countByComponent,
  COMPONENTS,
  events,
  reasonTone,
  REASONS,
  topReason,
  type ReasonKind,
  type RenderEvent,
} from './helpers';

interface BarChartProps {
  data: Array<{ name: string; n: number }>;
  selected: string | null;
  onSelect(name: string | null): void;
  hover: string | null;
  onHover(name: string | null): void;
}

function BarChart({ data, selected, onSelect, hover, onHover }: BarChartProps) {
  const max = data.reduce((m, d) => (d.n > m ? d.n : m), 1);
  const width = 360;
  const height = 200;
  const pad = 28;
  const barW = (width - pad * 2) / Math.max(1, data.length);
  return (
    <svg width={width} height={height} className="block">
      {/* y axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = pad + (1 - p) * (height - pad * 2);
        return (
          <g key={i}>
            <line
              x1={pad}
              x2={width - pad / 2}
              y1={y}
              y2={y}
              stroke="hsl(var(--line))"
              strokeDasharray="2 3"
            />
            <text x={4} y={y + 3} className="fill-ink-3 text-[9px]">
              {Math.round(max * p)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = ((height - pad * 2) * d.n) / max;
        const x = pad + i * barW + barW * 0.15;
        const y = height - pad - h;
        const w = barW * 0.7;
        const isSelected = selected === d.name;
        const isHover = hover === d.name;
        return (
          <g key={d.name}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={2}
              className={cn(
                'cursor-pointer transition-opacity',
                isSelected
                  ? 'fill-accent'
                  : isHover
                    ? 'fill-accent/70'
                    : 'fill-accent/40 hover:fill-accent/60',
              )}
              onMouseEnter={() => onHover(d.name)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(isSelected ? null : d.name)}
            />
            <text
              x={x + w / 2}
              y={y - 3}
              className="fill-ink-2 text-[10px]"
              textAnchor="middle"
            >
              {d.n}
            </text>
            <text
              x={x + w / 2}
              y={height - pad + 11}
              className="fill-ink-3 text-[9px]"
              textAnchor="middle"
            >
              {d.name.length > 11 ? `${d.name.slice(0, 10)}…` : d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function EventRow({ ev }: { ev: RenderEvent }) {
  const [open, setOpen] = useState(false);
  const hasDelta =
    (ev.deltaProps && ev.deltaProps.length > 0) ||
    (ev.deltaState && ev.deltaState.length > 0);
  return (
    <li className="hairline-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] hover:bg-bg-hover"
      >
        <span className="w-14 shrink-0 font-mono text-[10px] text-ink-3">
          T+{ev.at}ms
        </span>
        <span className="flex-1 truncate text-sm text-ink-1">{ev.component}</span>
        <Chip tone={reasonTone(ev.reason)} size="xs">
          {ev.reason}
        </Chip>
        <span className="w-12 text-right font-mono text-[10px] text-ink-3">
          {ev.durationMs.toFixed(1)}ms
        </span>
        <Icon.ChevRight
          className={cn(
            'h-3 w-3 text-ink-3 transition-transform',
            open && 'rotate-90',
          )}
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-line bg-bg-subtle/40 px-2 py-2">
          {ev.deltaProps && ev.deltaProps.length > 0 ? (
            <DeltaTable label="props" rows={ev.deltaProps} />
          ) : null}
          {ev.deltaState && ev.deltaState.length > 0 ? (
            <DeltaTable label="state" rows={ev.deltaState} />
          ) : null}
          {!hasDelta ? (
            <div className="text-[11px] italic text-ink-3">
              {ev.reason === 'parent'
                ? 'Re-rendered because parent rendered. No props/state delta detected.'
                : ev.reason === 'context'
                  ? 'A consumed context value changed.'
                  : ev.reason === 'force'
                    ? 'forceUpdate() called explicitly.'
                    : 'Hook deps array changed.'}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button
              size="xs"
              tone="ghost"
              onClick={() =>
                toast(`Wrap <${ev.component}> in React.memo (preview)`)
              }
            >
              Memoize this component
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function DeltaTable({
  label,
  rows,
}: {
  label: string;
  rows: ReadonlyArray<{ key: string; before: string; after: string }>;
}) {
  return (
    <div>
      <div className="text-caps mb-1 text-ink-3">{label} delta</div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-caps text-ink-3">
            <th className="px-1.5 py-0.5 font-medium">key</th>
            <th className="px-1.5 py-0.5 font-medium">before</th>
            <th className="px-1.5 py-0.5 font-medium">after</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line/60">
              <td className="px-1.5 py-0.5 font-mono text-ink-1">{r.key}</td>
              <td className="px-1.5 py-0.5 font-mono text-sev-err">{r.before}</td>
              <td className="px-1.5 py-0.5 font-mono text-sem-static">{r.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RenderReasonerOverlay() {
  const open = useUiStore((s) => s.overlays.renderReasoner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState<Set<ReasonKind>>(new Set());
  const [search, setSearch] = useState<string>('');
  const [hoverComp, setHoverComp] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedComp && e.component !== selectedComp) return false;
      if (reasonFilter.size > 0 && !reasonFilter.has(e.reason)) return false;
      if (search && !e.component.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedComp, reasonFilter, search]);

  const counts = useMemo(() => countByComponent(filtered), [filtered]);
  const chartData = useMemo(
    () => COMPONENTS.map((c) => ({ name: c, n: counts.get(c) ?? 0 })),
    [counts],
  );
  const total = filtered.length;
  const avg =
    counts.size === 0
      ? 0
      : Math.round((total / counts.size) * 10) / 10;
  const top = topReason(filtered);

  const toggleReason = (r: ReasonKind) => {
    setReasonFilter((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('renderReasoner'))}
      title="Render Reasoner"
      subtitle="why did this component re-render?"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            total renders: <span className="font-mono text-ink-1">{total}</span>
          </span>
          <span>
            avg/component: <span className="font-mono text-ink-1">{avg}</span>
          </span>
          <span>
            top reason:{' '}
            {top ? (
              <Chip tone={reasonTone(top)} size="xs">
                {top}
              </Chip>
            ) : (
              <span className="text-ink-3">—</span>
            )}
          </span>
          <span className="ml-auto">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                setSelectedComp(null);
                setReasonFilter(new Set());
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <div className="flex items-center gap-1">
          {COMPONENTS.map((c) => (
            <ToggleChip
              key={c}
              active={selectedComp === c}
              onClick={() => setSelectedComp(selectedComp === c ? null : c)}
            >
              {c}
            </ToggleChip>
          ))}
        </div>
        <span className="ml-2 text-caps text-ink-3">reason</span>
        <div className="flex items-center gap-1">
          {REASONS.map((r) => (
            <ToggleChip
              key={r}
              active={reasonFilter.has(r)}
              onClick={() => toggleReason(r)}
            >
              {r}
            </ToggleChip>
          ))}
        </div>
        <div className="ml-auto w-40">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="component"
          />
        </div>
      </div>

      <div className="grid grid-cols-[400px_1fr]">
        <aside className="hairline-r p-3">
          <div className="text-caps mb-2 text-ink-3">re-renders by component</div>
          <BarChart
            data={chartData}
            selected={selectedComp}
            onSelect={setSelectedComp}
            hover={hoverComp}
            onHover={setHoverComp}
          />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {chartData
              .slice()
              .sort((a, b) => b.n - a.n)
              .map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() =>
                    setSelectedComp(selectedComp === d.name ? null : d.name)
                  }
                  className={cn(
                    'flex items-center justify-between rounded-sm border border-line bg-bg px-1.5 py-1 text-[11px] hover:bg-bg-hover',
                    selectedComp === d.name && 'bg-accent-soft/60',
                  )}
                >
                  <span className="truncate text-ink-1">{d.name}</span>
                  <span className="font-mono text-ink-3">{d.n}</span>
                </button>
              ))}
          </div>
        </aside>
        <section className="min-w-0">
          <ul className="max-h-[440px] overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-ink-3">
                no events match
              </li>
            ) : (
              filtered.map((e) => <EventRow key={e.id} ev={e} />)
            )}
          </ul>
        </section>
      </div>
    </OverlayPanel>
  );
}
