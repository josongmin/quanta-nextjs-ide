/**
 * Live tab — chronological event stream (newest at bottom).
 *
 * Filter chips, search highlight, pause-autoscroll toggle, expandable rows.
 * Empty state offers a "Start `next dev`" CTA that calls
 * `useRunnerStore.startByLabel('build', root)`.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Chip, EmptyState, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useRunnerStore, getWorkspaceRoot } from '@shared/runner';
import { useLiveBottomTabsStore, selectFilteredEvents } from './store';
import type { LiveEvent } from './types';

const FILTERS: Array<{ key: 'all' | 'rsc' | 'actions' | 'cache' | 'errors'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'rsc', label: 'RSC' },
  { key: 'actions', label: 'Actions' },
  { key: 'cache', label: 'Cache' },
  { key: 'errors', label: 'Errors' },
];

function fmtTs(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function eventTone(kind: LiveEvent['kind']): 'edge' | 'server' | 'accent' | 'warn' | 'err' {
  switch (kind) {
    case 'rsc-chunk': return 'edge';
    case 'server-action': return 'server';
    case 'revalidate': return 'accent';
    case 'mutation': return 'warn';
    case 'error': return 'err';
  }
}

function eventLabel(kind: LiveEvent['kind']): string {
  switch (kind) {
    case 'rsc-chunk': return 'RSC';
    case 'server-action': return 'ACT';
    case 'revalidate': return 'REV';
    case 'mutation': return 'MUT';
    case 'error': return 'ERR';
  }
}

function highlight(text: string, term: string): React.ReactNode {
  if (!term) return text;
  const lower = text.toLowerCase();
  const t = term.toLowerCase();
  const idx = lower.indexOf(t);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-soft text-accent rounded-sm px-0.5">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function LiveEventsTab() {
  const events = useLiveBottomTabsStore(selectFilteredEvents);
  const filter = useLiveBottomTabsStore((s) => s.filter);
  const search = useLiveBottomTabsStore((s) => s.search);
  const paused = useLiveBottomTabsStore((s) => s.paused);
  const setFilter = useLiveBottomTabsStore((s) => s.setFilter);
  const setSearch = useLiveBottomTabsStore((s) => s.setSearch);
  const togglePaused = useLiveBottomTabsStore((s) => s.togglePaused);
  const clearEvents = useLiveBottomTabsStore((s) => s.clearEvents);
  const startByLabel = useRunnerStore((s) => s.startByLabel);

  const [expanded, setExpanded] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);

  // Auto-scroll to bottom on new events unless user scrolled up.
  useEffect(() => {
    if (paused) return;
    if (userScrolledRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events, paused]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    userScrolledRef.current = !atBottom;
  };

  if (events.length === 0 && filter === 'all' && !search) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<Icon.Zap className="h-5 w-5 text-ink-3" />}
          title="No events yet"
          description="Start the dev server to stream RSC traffic, server actions, and cache events."
          action={
            <Button
              size="sm"
              tone="accent"
              onClick={() => void startByLabel('build', getWorkspaceRoot())}
            >
              Start `next dev`
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                filter === f.key
                  ? 'border-transparent bg-accent text-white'
                  : 'border-line/60 bg-bg text-ink-2 hover:text-ink-1',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="ml-2 h-6 w-48 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-1 outline-none focus:border-accent"
        />
        <span className="ml-auto flex items-center gap-1.5">
          <Button size="xs" tone="ghost" onClick={togglePaused}>
            {paused ? 'Resume' : 'Pause autoscroll'}
          </Button>
          <Button size="xs" tone="ghost" onClick={clearEvents}>
            Clear
          </Button>
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <ul className="divide-y divide-line/40 font-mono text-[11px]">
          {events.map((ev) => (
            <EventRow
              key={ev.id}
              ev={ev}
              expanded={expanded === ev.id}
              onToggle={() => setExpanded(expanded === ev.id ? null : ev.id)}
              search={search}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function EventRow({
  ev,
  expanded,
  onToggle,
  search,
}: {
  ev: LiveEvent;
  expanded: boolean;
  onToggle: () => void;
  search: string;
}) {
  return (
    <li
      className={cn(
        'flex flex-col px-3 py-1 hover:bg-bg-hover',
        ev.kind === 'error' && 'text-sev-err',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="nums-tabular shrink-0 text-ink-3">{fmtTs(ev.ts)}</span>
        <Chip tone={eventTone(ev.kind)} size="xs">
          {eventLabel(ev.kind)}
        </Chip>
        <span className="flex-1 truncate text-ink-1">
          {highlight(ev.summary, search)}
        </span>
        {expanded ? (
          <Icon.ChevDown className="h-3 w-3 text-ink-3" />
        ) : (
          <Icon.ChevRight className="h-3 w-3 text-ink-3" />
        )}
      </button>
      {expanded && ev.detail ? (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 pl-[88px] text-[10px] text-ink-3">
          {Object.entries(ev.detail).map(([k, v]) => (
            <span key={k} className="contents">
              <dt>{k}</dt>
              <dd className="text-ink-1">{String(v)}</dd>
            </span>
          ))}
        </dl>
      ) : null}
    </li>
  );
}
