/**
 * Cache tab — horizontal split.
 *
 *   left:  sorted tag list (revalidating, then stale-by-time-remaining)
 *   right: detail panel for the selected tag (producers / consumers /
 *          invalidators / mini graph / Invalidate button / recent history)
 */

import { useEffect, useState } from 'react';
import { Button, Chip, EmptyState, Icon } from '@shared/ui';
import { useCacheTagStore } from '@entities/cache-tag';
import { cn } from '@shared/lib/cn';
import {
  useLiveBottomTabsStore,
  selectCacheAggregate,
  selectSortedCache,
} from './store';
import { revalidateTagLocally } from './sources/cache-snapshot';
import type { CacheState, CacheTagLive } from './types';

const STATE_TONE: Record<CacheState, 'static' | 'warn' | 'accent'> = {
  fresh: 'static',
  stale: 'warn',
  revalidating: 'accent',
};

function fmtRemaining(ms: number): string {
  if (ms <= 0) return 'stale';
  if (ms >= 60_000) return `${Math.round(ms / 60_000)}m left`;
  return `${Math.round(ms / 1000)}s left`;
}

function fmtAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  if (diff < 1000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function CacheStateTab() {
  const sorted = useLiveBottomTabsStore(selectSortedCache);
  const agg = useLiveBottomTabsStore(selectCacheAggregate);
  const selectedId = useLiveBottomTabsStore((s) => s.selectedCacheId);
  const selectCache = useLiveBottomTabsStore((s) => s.selectCache);
  const cacheTags = useCacheTagStore((s) => s.tags);
  const [now, setNow] = useState(Date.now());

  // 1Hz tick so countdowns/labels update.
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, []);

  const selected = selectedId
    ? sorted.find((t) => t.id === selectedId) ?? null
    : null;
  const selectedMeta = selected
    ? cacheTags.find((t) => t.id === selected.id) ?? null
    : null;

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<Icon.Tag className="h-5 w-5 text-ink-3" />}
          title="No cache tags"
          description="Cache tags appear here once your project declares producers / invalidators."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-3 hairline-b bg-bg-subtle px-3 text-[11px] text-ink-2">
        <span className="font-medium text-ink-1">{agg.total} tags</span>
        <span>· {agg.fresh} fresh</span>
        <span className="text-sev-warn">· {agg.stale} stale</span>
        <span className="text-accent">· {agg.revalidating} revalidating</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] divide-x divide-line">
        <ul className="min-h-0 overflow-y-auto">
          {sorted.map((entry) => (
            <CacheRow
              key={entry.id}
              entry={entry}
              selected={selectedId === entry.id}
              onSelect={() => selectCache(entry.id)}
              now={now}
            />
          ))}
        </ul>
        <div className="min-h-0 overflow-y-auto">
          {selected ? (
            <CacheDetail
              entry={selected}
              meta={selectedMeta}
              now={now}
            />
          ) : (
            <div className="p-4 text-[11px] text-ink-3">
              Select a tag to see its producers, consumers, and invalidators.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CacheRow({
  entry,
  selected,
  onSelect,
  now,
}: {
  entry: CacheTagLive;
  selected: boolean;
  onSelect: () => void;
  now: number;
}) {
  const pct = Math.max(0, Math.min(100, (entry.remainingMs / entry.ttlMs) * 100));
  // "just refreshed" pulse: less than 1s since revalidating→fresh transition
  const justRefreshed =
    entry.state === 'fresh' && now - entry.changedAt < 2_000;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full flex-col gap-1 px-3 py-1.5 text-left hover:bg-bg-hover',
          selected && 'bg-bg-hover',
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
            {entry.name}
          </span>
          <Chip
            tone={STATE_TONE[entry.state]}
            size="xs"
            className={cn(
              entry.state === 'revalidating' && 'mi-pulse-ring',
              justRefreshed && 'animate-pulse',
            )}
          >
            {entry.state === 'fresh' && justRefreshed ? '✓ refreshed' : entry.state}
          </Chip>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-ink-3">
          <span className="nums-tabular w-14">
            {entry.state === 'revalidating' ? 'revalidating…' : fmtRemaining(entry.remainingMs)}
          </span>
          <div className="relative h-1 flex-1 rounded-full bg-bg-subtle">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000',
                entry.state === 'fresh' && 'bg-sem-static',
                entry.state === 'stale' && 'bg-sev-warn',
                entry.state === 'revalidating' && 'bg-accent',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>
    </li>
  );
}

function CacheDetail({
  entry,
  meta,
  now,
}: {
  entry: CacheTagLive;
  meta: ReturnType<typeof useCacheTagStore.getState>['tags'][number] | null;
  now: number;
}) {
  const producers = meta?.producers ?? [];
  const invalidators = meta?.invalidators ?? [];
  const routes = meta?.affectedRouteIds ?? [];

  return (
    <div className="flex flex-col gap-3 p-3">
      <header className="flex items-center gap-2">
        <Icon.Tag className="h-4 w-4 text-ink-3" />
        <span className="font-mono text-[12px] text-ink-1">{entry.name}</span>
        <Chip tone={STATE_TONE[entry.state]} size="xs">
          {entry.state}
        </Chip>
        <Button
          size="xs"
          tone="accent"
          className="ml-auto"
          onClick={() => revalidateTagLocally(entry.id, 'cache-tab')}
          disabled={entry.state === 'revalidating'}
        >
          Invalidate now
        </Button>
      </header>

      <MiniGraph
        producerCount={producers.length}
        consumerCount={routes.length}
        tagName={entry.name}
      />

      <Section title="Producers" count={producers.length}>
        {producers.map((p, i) => (
          <li key={`${p.location.file}:${p.location.line}:${i}`} className="flex gap-2 truncate font-mono text-[10px]">
            <span className="text-ink-3 shrink-0">{p.kind}</span>
            <span className="truncate text-ink-1">
              {p.location.file}:{p.location.line}
            </span>
          </li>
        ))}
      </Section>

      <Section title="Consumer routes" count={routes.length}>
        {routes.map((r) => (
          <li key={r} className="truncate font-mono text-[10px] text-ink-1">
            {r}
          </li>
        ))}
      </Section>

      <Section title="Invalidators" count={invalidators.length}>
        {invalidators.map((p, i) => (
          <li key={`${p.location.file}:${p.location.line}:${i}`} className="flex gap-2 truncate font-mono text-[10px]">
            <span className="text-ink-3 shrink-0">{p.kind}</span>
            <span className="truncate text-ink-1">
              {p.location.file}:{p.location.line}
            </span>
          </li>
        ))}
      </Section>

      <Section title="Recent invalidations" count={entry.recentInvalidations.length}>
        {entry.recentInvalidations.map((inv, i) => (
          <li key={`${inv.at}-${i}`} className="flex gap-2 text-[10px]">
            <span className="nums-tabular text-ink-3">{fmtAgo(inv.at, now)}</span>
            <span className="text-ink-1">via {inv.source}</span>
          </li>
        ))}
        {entry.recentInvalidations.length === 0 ? (
          <li className="text-[10px] text-ink-3">no recent invalidations</li>
        ) : null}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-caps mb-1 flex items-center gap-2 text-ink-3">
        <span>{title}</span>
        <span className="rounded-sm border border-line bg-bg px-1 text-[9px] text-ink-2">
          {count}
        </span>
      </div>
      <ul className="space-y-0.5 rounded-sm border border-line bg-bg-subtle/40 p-1.5">
        {children}
      </ul>
    </div>
  );
}

function MiniGraph({
  producerCount,
  consumerCount,
  tagName,
}: {
  producerCount: number;
  consumerCount: number;
  tagName: string;
}) {
  return (
    <svg
      viewBox="0 0 320 64"
      className="h-16 w-full rounded-sm border border-line bg-bg-subtle/30"
      role="img"
      aria-label={`Cache graph for ${tagName}`}
    >
      <text x={32} y={20} className="fill-ink-3 font-mono" fontSize={9}>
        producers
      </text>
      <text x={140} y={20} className="fill-ink-3 font-mono" fontSize={9}>
        tag
      </text>
      <text x={232} y={20} className="fill-ink-3 font-mono" fontSize={9}>
        consumers
      </text>
      <circle cx={48} cy={40} r={10} className="fill-sem-isr/30 stroke-sem-isr/60" />
      <text x={48} y={43} textAnchor="middle" className="fill-ink-1 font-mono" fontSize={10}>
        {producerCount}
      </text>
      <line x1={60} y1={40} x2={140} y2={40} className="stroke-line" strokeWidth={1} />
      <rect x={140} y={30} width={56} height={20} rx={3} className="fill-accent/20 stroke-accent/60" />
      <text x={168} y={43} textAnchor="middle" className="fill-ink-1 font-mono" fontSize={9}>
        {tagName.slice(0, 8)}
      </text>
      <line x1={196} y1={40} x2={272} y2={40} className="stroke-line" strokeWidth={1} />
      <circle cx={284} cy={40} r={10} className="fill-sem-edge/30 stroke-sem-edge/60" />
      <text x={284} y={43} textAnchor="middle" className="fill-ink-1 font-mono" fontSize={10}>
        {consumerCount}
      </text>
    </svg>
  );
}
