import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { diff, formatRelative, snapshots, type ProjectSnapshot } from './helpers';

type SlotKey = 'A' | 'B';

function deltaTone(n: number, invert = false): 'static' | 'err' | 'muted' {
  if (n === 0) return 'muted';
  const positive = n > 0;
  // For diagnostics & bundle, "up" is bad → invert.
  const good = invert ? !positive : positive;
  return good ? 'static' : 'err';
}

function DeltaArrow({ n }: { n: number }) {
  if (n === 0) return <span className="text-ink-3">·</span>;
  return n > 0 ? (
    <Icon.Up className="h-2.5 w-2.5" />
  ) : (
    <Icon.Down className="h-2.5 w-2.5" />
  );
}

interface MiniChartProps {
  values: number[];
  width: number;
  height: number;
  color: string;
  label: string;
}

function MiniChart({ values, width, height, color, label }: MiniChartProps) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const path = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / span) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-caps text-ink-3">
        <span>{label}</span>
        <span className="font-mono text-[10px] text-ink-2">
          {values[0]} → {values[values.length - 1]}
        </span>
      </div>
      <svg width={width} height={height} className="overflow-visible">
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
        {values.map((v, i) => {
          const x = i * step;
          const y = height - ((v - min) / span) * height;
          return <circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
        })}
      </svg>
    </div>
  );
}

interface CardProps {
  snap: ProjectSnapshot;
  prev: ProjectSnapshot | undefined;
  slot: SlotKey | null;
  onClick(): void;
}

function SnapshotCard({ snap, prev, slot, onClick }: CardProps) {
  const dRoutes = prev ? snap.routes.total - prev.routes.total : 0;
  const dDiag = prev
    ? snap.diagnostics.err + snap.diagnostics.warn -
      (prev.diagnostics.err + prev.diagnostics.warn)
    : 0;
  const dBundle = prev ? snap.bundleKb - prev.bundleKb : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col gap-1 rounded-sm border border-line bg-bg p-2.5 text-left transition-colors',
        'hover:border-accent/40 hover:bg-bg-hover',
        slot && 'border-accent bg-accent-soft/40',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink-1">{snap.label}</span>
        {slot ? (
          <Chip tone="accent" size="xs">
            {slot}
          </Chip>
        ) : null}
        <span className="ml-auto font-mono text-[10px] text-ink-3">{snap.head}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-ink-3">
        <span>{formatRelative(snap.at)}</span>
        <span aria-hidden>·</span>
        <span className="font-mono">{new Date(snap.at).toISOString().slice(0, 10)}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 text-ink-2">
          <span className="text-caps text-ink-3">routes</span>
          <span className="font-mono text-ink-1">{snap.routes.total}</span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono',
              deltaTone(dRoutes) === 'static' && 'text-sem-static',
              deltaTone(dRoutes) === 'err' && 'text-sev-err',
              deltaTone(dRoutes) === 'muted' && 'text-ink-3',
            )}
          >
            <DeltaArrow n={dRoutes} />
            {dRoutes !== 0 ? Math.abs(dRoutes) : null}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-ink-2">
          <span className="text-caps text-ink-3">diags</span>
          <span className="font-mono text-ink-1">
            {snap.diagnostics.err + snap.diagnostics.warn}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono',
              deltaTone(dDiag, true) === 'static' && 'text-sem-static',
              deltaTone(dDiag, true) === 'err' && 'text-sev-err',
              deltaTone(dDiag, true) === 'muted' && 'text-ink-3',
            )}
          >
            <DeltaArrow n={dDiag} />
            {dDiag !== 0 ? Math.abs(dDiag) : null}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-ink-2">
          <span className="text-caps text-ink-3">bundle</span>
          <span className="font-mono text-ink-1">{snap.bundleKb} KB</span>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono',
              deltaTone(dBundle, true) === 'static' && 'text-sem-static',
              deltaTone(dBundle, true) === 'err' && 'text-sev-err',
              deltaTone(dBundle, true) === 'muted' && 'text-ink-3',
            )}
          >
            <DeltaArrow n={dBundle} />
            {dBundle !== 0 ? Math.abs(dBundle) : null}
          </span>
        </span>
      </div>
    </button>
  );
}

export function SnapshotTimelineOverlay() {
  const open = useUiStore((s) => s.overlays.snapshotTimeline.open);
  const close = useUiStore((s) => s.closeOverlay);

  const ordered = useMemo(
    () => [...snapshots].sort((a, b) => a.at - b.at),
    [],
  );
  const newest = ordered[ordered.length - 1];
  const oldest = ordered[0];

  const [aId, setAId] = useState<string>(oldest?.id ?? '');
  const [bId, setBId] = useState<string>(newest?.id ?? '');
  // 'A' | 'B' rotates which slot the next click assigns to.
  const [nextSlot, setNextSlot] = useState<SlotKey>('A');

  const a = ordered.find((s) => s.id === aId) ?? oldest;
  const b = ordered.find((s) => s.id === bId) ?? newest;

  const onSelect = (id: string) => {
    if (nextSlot === 'A') {
      setAId(id);
      setNextSlot('B');
    } else {
      setBId(id);
      setNextSlot('A');
    }
  };

  const slotFor = (id: string): SlotKey | null => {
    if (id === aId && id === bId) return 'A';
    if (id === aId) return 'A';
    if (id === bId) return 'B';
    return null;
  };

  const reverse = useMemo(() => [...ordered].reverse(), [ordered]);
  const diffLines = a && b ? diff(a, b) : [];
  const routesSeries = ordered.map((s) => s.routes.total);
  const dynamicSeries = ordered.map((s) => s.routes.dynamic);
  const bundleSeries = ordered.map((s) => s.bundleKb);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('snapshotTimeline'))}
      title="Snapshot Timeline"
      subtitle="project semantic state over time"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Open as semantic diff (preview)')}
          >
            Open as semantic diff
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast(`Restore snapshot ${a?.head ?? '—'}`)}
          >
            Restore snapshot
          </Button>
        </>
      }
    >
      {/* Toolbar — A/B selectors */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Compare</span>
        <Chip tone="accent" size="xs">
          A
        </Chip>
        <select
          value={aId}
          onChange={(e) => setAId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {reverse.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} · {s.head}
            </option>
          ))}
        </select>
        <span className="text-ink-3">vs</span>
        <Chip tone="accent" size="xs">
          B
        </Chip>
        <select
          value={bId}
          onChange={(e) => setBId(e.target.value)}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {reverse.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} · {s.head}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[10px] text-ink-3">
          next click → slot {nextSlot}
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_360px] gap-0">
        {/* Timeline (left) */}
        <div className="space-y-2 p-3">
          {reverse.map((snap, i) => {
            // prev = the snapshot immediately *before* this one chronologically
            const ix = ordered.findIndex((s) => s.id === snap.id);
            const prev = ix > 0 ? ordered[ix - 1] : undefined;
            const isLast = i === reverse.length - 1;
            return (
              <div key={snap.id} className="relative pl-5">
                <span
                  aria-hidden
                  className="absolute left-1.5 top-2 inline-block h-2 w-2 rounded-full bg-accent"
                />
                {!isLast ? (
                  <span
                    aria-hidden
                    className="absolute left-[9px] top-4 h-[calc(100%-4px)] w-px bg-line"
                  />
                ) : null}
                <SnapshotCard
                  snap={snap}
                  prev={prev}
                  slot={slotFor(snap.id)}
                  onClick={() => onSelect(snap.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Diff (right) */}
        <aside className="hairline-l bg-bg-subtle/40">
          <div className="px-3 py-2 hairline-b">
            <div className="text-caps text-ink-3">Diff A → B</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-ink-2">
              {a?.head ?? '—'} → {b?.head ?? '—'}
            </div>
          </div>
          <div className="px-3 py-2 hairline-b">
            <div className="text-caps text-ink-3">Changes</div>
            <ul className="mt-1.5 space-y-1 text-xs text-ink-1">
              {diffLines.map((line, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span aria-hidden className="mt-1 inline-block h-1 w-1 rounded-full bg-accent" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          {b ? (
            <div className="px-3 py-2 hairline-b">
              <div className="text-caps text-ink-3">Highlights @ B</div>
              <ul className="mt-1.5 space-y-1 text-xs text-ink-2">
                {b.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span aria-hidden className="mt-1 inline-block h-1 w-1 rounded-full bg-ink-3" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="space-y-3 px-3 py-2">
            <MiniChart
              values={routesSeries}
              width={320}
              height={36}
              color="hsl(var(--accent))"
              label="routes total"
            />
            <MiniChart
              values={dynamicSeries}
              width={320}
              height={36}
              color="hsl(var(--sem-dynamic))"
              label="dynamic routes"
            />
            <MiniChart
              values={bundleSeries}
              width={320}
              height={36}
              color="hsl(var(--sev-warn))"
              label="bundle KB"
            />
          </div>
        </aside>
      </div>
    </OverlayPanel>
  );
}
