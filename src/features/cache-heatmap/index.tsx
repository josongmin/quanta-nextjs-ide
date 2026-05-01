import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { ALL_TAGS } from '@shared/mocks/runtime-flow';
import {
  ALL_STATES,
  BUCKET_COUNT,
  aggregateHitRatio,
  bucketLabel,
  formatAge,
  heatmapRows,
  recommendCachePolicy,
  rowStats,
  type CacheCell,
  type CacheCellState,
  type CacheRow,
} from './helpers';

type BucketSize = '5m' | '15m' | '1h';

const BUCKET_SIZE_MIN: Record<BucketSize, number> = { '5m': 5, '15m': 15, '1h': 60 };

const STATE_LABEL: Record<CacheCellState, string> = {
  hit: 'hit',
  miss: 'miss',
  'stale-hit': 'stale',
  revalidate: 'revalidate',
  'no-store': 'no-store',
};

function cellClass(state: CacheCellState): string {
  return match(state)
    .with('hit', () => 'bg-sem-static/30')
    .with('miss', () => 'bg-sev-warn-soft')
    .with('stale-hit', () => 'bg-sev-info-soft')
    .with('revalidate', () => 'bg-accent-soft')
    .with('no-store', () => 'bg-line/40')
    .exhaustive();
}

function aggregateBuckets(cells: ReadonlyArray<CacheCell>, factor: number): CacheCell[] {
  if (factor <= 1) return [...cells];
  const out: CacheCell[] = [];
  for (let i = 0; i < cells.length; i += factor) {
    const slice = cells.slice(i, i + factor);
    const counts: Record<CacheCellState, number> = {
      hit: 0,
      miss: 0,
      'stale-hit': 0,
      revalidate: 0,
      'no-store': 0,
    };
    let ageSum = 0;
    let ageN = 0;
    for (const c of slice) {
      counts[c.state] += 1;
      if (typeof c.ageMs === 'number') {
        ageSum += c.ageMs;
        ageN++;
      }
    }
    let dominant: CacheCellState = 'hit';
    let max = -1;
    for (const s of ALL_STATES) {
      if (counts[s] > max) {
        max = counts[s];
        dominant = s;
      }
    }
    const base: CacheCell = { bucket: out.length, state: dominant };
    out.push(ageN > 0 ? { ...base, ageMs: Math.round(ageSum / ageN) } : base);
  }
  return out;
}

export function CacheHeatmapOverlay() {
  const open = useUiStore((s) => s.overlays.cacheHeatmap.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [bucketSize, setBucketSize] = useState<BucketSize>('5m');
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<ReadonlyArray<string>>([]);
  const [selectedId, setSelectedId] = useState<string>(heatmapRows[0]?.fetchId ?? '');
  const [showRecommendation, setShowRecommendation] = useState(false);

  const aggFactor = bucketSize === '5m' ? 1 : bucketSize === '15m' ? 3 : 12;
  const totalBuckets = Math.ceil(BUCKET_COUNT / aggFactor);

  const filteredRows = useMemo<ReadonlyArray<CacheRow>>(() => {
    const q = search.trim().toLowerCase();
    return heatmapRows.filter((r) => {
      if (q && !r.url.toLowerCase().includes(q) && !r.tags.some((t) => t.toLowerCase().includes(q))) {
        return false;
      }
      if (activeTags.length > 0 && !activeTags.some((t) => r.tags.includes(t))) {
        return false;
      }
      return true;
    });
  }, [search, activeTags]);

  const aggregated = useMemo(
    () =>
      filteredRows.map((r) => ({
        ...r,
        cells: aggregateBuckets(r.cells, aggFactor),
      })),
    [filteredRows, aggFactor],
  );

  const selected = useMemo(
    () => aggregated.find((r) => r.fetchId === selectedId) ?? aggregated[0],
    [aggregated, selectedId],
  );

  const stats = useMemo(() => (selected ? rowStats(selected) : null), [selected]);

  const aggregateRatio = useMemo(() => aggregateHitRatio(aggregated), [aggregated]);

  const sizeMin = BUCKET_SIZE_MIN[bucketSize];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('cacheHeatmap'))}
      title="Cache Heatmap"
      subtitle="fetch × time · hit/miss/age/ttl"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="text-ink-3">
            <span className="text-ink-2">Aggregate hit ratio:</span>{' '}
            <span className="font-mono text-ink-1">{(aggregateRatio * 100).toFixed(1)}%</span>{' '}
            <span className="text-ink-3">across {aggregated.length} fetches · last 2h</span>
          </div>
          <Button size="xs" tone="ghost" onClick={() => close('cacheHeatmap')}>
            Close
          </Button>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">bucket</span>
          {(['5m', '15m', '1h'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBucketSize(b)}
              className={cn(
                'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                bucketSize === b
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              {b}
            </button>
          ))}
        </div>
        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">range</span>
        <span className="font-mono text-[11px] text-ink-1">last 2h</span>
        <span className="h-4 w-px bg-line" aria-hidden />
        <input
          type="search"
          placeholder="search url or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-6 w-44 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3"
        />
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {ALL_TAGS.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setActiveTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                  )
                }
                className={cn(
                  'h-5 rounded-full border px-1.5 font-mono text-[10px]',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-3 hover:text-ink-1',
                )}
              >
                {tag}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="text-[10px] text-ink-3 hover:text-ink-1"
            >
              clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        {/* Heatmap grid */}
        <div className="min-w-0 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-bg-subtle">
              <tr>
                <th className="hairline-b sticky left-0 z-20 bg-bg-subtle px-2 py-1.5 text-left text-[10px] font-normal uppercase tracking-caps text-ink-3">
                  fetch
                </th>
                {Array.from({ length: totalBuckets }).map((_, i) => (
                  <th
                    key={i}
                    className="hairline-b px-0 py-1.5 text-center text-[9px] font-normal text-ink-3"
                  >
                    {i % 4 === 0 ? bucketLabel(i, sizeMin, totalBuckets) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aggregated.map((row) => {
                const isSelected = row.fetchId === selected?.fetchId;
                return (
                  <tr
                    key={row.fetchId}
                    onClick={() => {
                      setSelectedId(row.fetchId);
                      setShowRecommendation(false);
                    }}
                    className={cn(
                      'cursor-pointer hover:bg-bg-hover',
                      isSelected && 'bg-accent-soft/30',
                    )}
                  >
                    <td
                      className={cn(
                        'hairline-b sticky left-0 z-10 px-2 py-1 align-middle',
                        isSelected ? 'bg-accent-soft/30' : 'bg-bg',
                      )}
                      style={{ minWidth: 240, maxWidth: 240 }}
                    >
                      <div className="truncate font-mono text-[11px] text-ink-1" title={row.url}>
                        {row.url}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {row.tags.map((t) => (
                          <Chip key={t} tone="muted" size="xs" className="font-normal">
                            {t}
                          </Chip>
                        ))}
                        <span className="ml-auto font-mono text-[10px] text-ink-3">
                          {row.revalidate === null ? 'no-cache' : `r=${row.revalidate}s`}
                        </span>
                      </div>
                    </td>
                    {row.cells.map((cell) => (
                      <td key={cell.bucket} className="hairline-b p-0">
                        <Tooltip
                          content={
                            <div className="text-[11px]">
                              <div className="font-medium text-ink-1">{STATE_LABEL[cell.state]}</div>
                              <div className="text-ink-3">
                                {bucketLabel(cell.bucket, sizeMin, totalBuckets)}
                                {cell.ageMs !== undefined ? ` · age ${formatAge(cell.ageMs)}` : ''}
                              </div>
                            </div>
                          }
                        >
                          <div
                            className={cn(
                              'h-6 w-full border-r border-line/30',
                              cellClass(cell.state),
                            )}
                            aria-label={STATE_LABEL[cell.state]}
                          />
                        </Tooltip>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {aggregated.length === 0 && (
                <tr>
                  <td
                    colSpan={totalBuckets + 1}
                    className="px-3 py-8 text-center text-[11px] text-ink-3"
                  >
                    No fetches match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Legend */}
          <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-ink-3">
            {ALL_STATES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className={cn('inline-block h-3 w-4 rounded-sm', cellClass(s))} aria-hidden />
                {STATE_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="min-w-0 px-3 py-3">
          {selected && stats ? (
            <>
              <h3 className="text-caps text-ink-3">Selected fetch</h3>
              <div className="mt-1 truncate font-mono text-[12px] text-ink-1" title={selected.url}>
                {selected.url}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">hit ratio</div>
                  <div className="font-mono text-ink-1">{(stats.hitRatio * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">misses</div>
                  <div className="font-mono text-ink-1">{stats.misses}</div>
                </div>
                <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">p50 age</div>
                  <div className="font-mono text-ink-1">{formatAge(stats.p50AgeMs)}</div>
                </div>
                <div className="rounded-sm border border-line bg-bg-subtle p-1.5">
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">p95 age</div>
                  <div className="font-mono text-ink-1">{formatAge(stats.p95AgeMs)}</div>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-caps text-ink-3">Routes</h4>
                <ul className="mt-1 space-y-1">
                  {selected.routes.map((rt) => (
                    <li
                      key={rt}
                      className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1 font-mono text-[11px] text-ink-1"
                    >
                      <span className="truncate">{rt}</span>
                      <span className="text-[10px] text-ink-3">consumer</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3">
                <h4 className="text-caps text-ink-3">Tags</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.tags.map((t) => (
                    <Chip key={t} tone="info" size="xs">
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <Button
                  size="xs"
                  tone="default"
                  className="w-full"
                  onClick={() => setShowRecommendation((v) => !v)}
                >
                  {showRecommendation ? 'Hide suggestion' : 'Recommend cache policy'}
                </Button>
                {showRecommendation && (
                  <div className="mt-2">
                    <CodeBlock
                      code={recommendCachePolicy(selected, stats)}
                      language="ts"
                      maxHeight={220}
                      showLineNumbers={false}
                    />
                    <button
                      type="button"
                      onClick={() => toast('Patch queued (mock)')}
                      className="mt-1 text-[10px] text-accent hover:underline"
                    >
                      apply patch →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-ink-3">Select a row to inspect.</div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
