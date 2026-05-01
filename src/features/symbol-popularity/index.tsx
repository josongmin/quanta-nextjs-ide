import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  KIND_OPTIONS,
  KIND_TONE,
  SORT_OPTIONS,
  SYMBOLS,
  trendDelta,
  trendDirection,
  type SortKey,
  type SymbolEntry,
  type SymbolKind,
} from './helpers';

type KindFilter = SymbolKind | 'all';

function Sparkline({ data }: { data: ReadonlyArray<number> }) {
  const w = 64;
  const h = 18;
  const max = Math.max(1, ...data);
  const barW = w / data.length;
  const dir = trendDirection(data);
  const fillCls =
    dir === 'up' ? 'fill-accent' : dir === 'down' ? 'fill-sev-warn' : 'fill-ink-3/40';
  return (
    <svg width={w} height={h} aria-hidden role="img">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 2);
        return (
          <rect
            key={i}
            x={i * barW + 1}
            y={h - bh}
            width={barW - 2}
            height={bh}
            rx={1}
            className={fillCls}
          />
        );
      })}
    </svg>
  );
}

export function SymbolPopularityOverlay() {
  const open = useUiStore((s) => s.overlays.symbolPopularity.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [selected, setSelected] = useState<SymbolEntry | null>(null);

  const sorted = useMemo(() => {
    return [...SYMBOLS]
      .filter((s) => kindFilter === 'all' || s.kind === kindFilter)
      .sort((a, b) => {
        if (sortKey === 'count') return b.count - a.count;
        if (sortKey === 'fileCount') return b.fileCount - a.fileCount;
        return trendDelta(b.recentTrend) - trendDelta(a.recentTrend);
      })
      .slice(0, 30);
  }, [kindFilter, sortKey]);

  const maxCount = useMemo(
    () => sorted.reduce((m, s) => Math.max(m, s.count), 1),
    [sorted],
  );

  const detail = selected ?? sorted[0];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('symbolPopularity')}
      title="Symbol Popularity"
      subtitle="Heatmap of internal symbol usage"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            <span className="text-ink-2">{sorted.length}</span> symbols shown
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Cold symbols identified (mock)')}>
              Identify cold symbols
            </Button>
          </div>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">kind</span>
        {KIND_OPTIONS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKindFilter(k.key)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              kindFilter === k.key
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {k.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" />
        <label className="inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px]">
          <span className="text-ink-3">sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="cursor-pointer bg-transparent pr-0.5 text-[11px] tracking-caps text-ink-1 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[1fr_260px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          <div className="grid grid-cols-[minmax(0,1fr)_70px_1fr_50px_70px] gap-2 px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
            <span>name</span>
            <span>kind</span>
            <span>count</span>
            <span className="text-right">files</span>
            <span>trend</span>
          </div>
          <ul className="divide-y divide-line/60 rounded-sm border border-line">
            {sorted.map((s) => {
              const isSel = detail?.id === s.id;
              const dir = trendDirection(s.recentTrend);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    className={cn(
                      'grid w-full grid-cols-[minmax(0,1fr)_70px_1fr_50px_70px] items-center gap-2 px-2 py-1.5 text-left text-[11px] hover:bg-bg-subtle',
                      isSel && 'bg-accent-soft/50',
                    )}
                  >
                    <span className="truncate font-mono text-ink-1">{s.name}</span>
                    <Chip tone={KIND_TONE[s.kind]} size="xs">
                      {s.kind}
                    </Chip>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-ink-2">{s.count}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                        <span
                          className="block h-full bg-accent"
                          style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }}
                        />
                      </span>
                    </span>
                    <span className="justify-self-end">
                      <Chip tone="muted" size="xs">
                        {s.fileCount}
                      </Chip>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkline data={s.recentTrend} />
                      <span
                        className={cn(
                          'text-[10px]',
                          dir === 'up'
                            ? 'text-accent'
                            : dir === 'down'
                              ? 'text-sev-warn'
                              : 'text-ink-3',
                        )}
                      >
                        {dir === 'up' ? '↑' : dir === 'down' ? '↓' : '·'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-[10px] uppercase tracking-caps text-ink-3">Detail</h4>
          {detail === undefined ? (
            <p className="mt-2 text-[11px] text-ink-3">No symbols selected.</p>
          ) : (
            <div className="mt-2 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Chip tone={KIND_TONE[detail.kind]} size="xs">
                  {detail.kind}
                </Chip>
                <span className="font-mono text-md text-ink-1">{detail.name}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-3">
                <span>
                  <span className="text-ink-2">{detail.count}</span> uses
                </span>
                <span>·</span>
                <span>
                  <span className="text-ink-2">{detail.fileCount}</span> files
                </span>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                  Top importers
                </div>
                <ul className="space-y-1.5">
                  {detail.topImporters.slice(0, 5).map((imp, i) => (
                    <li
                      key={`${detail.id}-imp-${i}`}
                      className="rounded-sm border border-line bg-bg p-1.5"
                    >
                      <div className="truncate font-mono text-ink-1">
                        {imp.file}:{imp.line}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-ink-3">{imp.preview}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="xs"
                  tone="default"
                  onClick={() => toast(`Find references to ${detail.name} (mock)`)}
                >
                  Find references
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => toast(`Inline ${detail.name} (mock)`)}
                >
                  Inline
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
