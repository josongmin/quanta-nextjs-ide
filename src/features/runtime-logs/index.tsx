import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { useRuntimeStore } from '@entities/runtime';
import { synthEntry, type LogEntry, type LogSource } from '@shared/mocks/runtime';
import {
  Button,
  Chip,
  CodeBlock,
  EmptyState,
  Icon,
  ScrollArea,
  SeverityLabel,
  Tooltip,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';

type Level = 'info' | 'warn' | 'err';
type SourceFilter = 'all' | LogSource;

const SOURCE_OPTIONS: ReadonlyArray<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'all sources' },
  { value: 'next-server', label: 'next-server' },
  { value: 'next-router', label: 'next-router' },
  { value: 'cache', label: 'cache' },
  { value: 'auth', label: 'auth' },
  { value: 'db', label: 'db' },
  { value: 'build', label: 'build' },
  { value: 'monaco', label: 'monaco' },
];

const LIVE_INTERVAL_MS = 600;

function formatTs(ts: number, now: number): string {
  const diff = now - ts;
  if (diff < 1_000) return `${Math.max(0, diff)}ms ago`;
  if (diff < 60_000) return `${(diff / 1000).toFixed(1)}s ago`;
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

function levelTone(l: Level): 'err' | 'warn' | 'info' {
  return l;
}

function sourceTone(s: LogSource): 'server' | 'client' | 'isr' | 'edge' | 'static' | 'muted' | 'accent' {
  switch (s) {
    case 'next-server':
      return 'server';
    case 'next-router':
      return 'edge';
    case 'cache':
      return 'isr';
    case 'auth':
      return 'accent';
    case 'db':
      return 'static';
    case 'build':
      return 'muted';
    case 'monaco':
      return 'client';
  }
}

export function RuntimeLogsView() {
  const routes = useRouteStore((s) => s.routes);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const logs = useRuntimeStore((s) => s.logs);
  const paused = useRuntimeStore((s) => s.paused);
  const pause = useRuntimeStore((s) => s.pause);
  const resume = useRuntimeStore((s) => s.resume);
  const clear = useRuntimeStore((s) => s.clear);
  const push = useRuntimeStore((s) => s.push);

  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [levels, setLevels] = useState<Set<Level>>(new Set(['info', 'warn', 'err']));
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Live ticker — pushes synth entries when running
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      push(synthEntry());
    }, LIVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, push]);

  // Refresh "now" so relative timestamps tick
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (!levels.has(l.level)) return false;
      if (routeFilter !== 'all' && l.routeId !== routeFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (q.length > 0) {
        const hay = `${l.message} ${l.source} ${l.routeId ?? ''} ${l.requestId ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, levels, routeFilter, sourceFilter, search]);

  const errCount = filtered.filter((l) => l.level === 'err').length;
  const med = median(filtered.map((l) => l.latencyMs ?? 0).filter((v) => v > 0));

  const toggleLevel = (l: Level) =>
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      // Don't allow zero — re-add removed level
      if (next.size === 0) next.add(l);
      return next;
    });

  const routeOptions = useMemo(
    () => [
      { value: 'all', label: 'all routes' },
      ...routes.map((r) => ({ value: r.id, label: r.path })),
    ],
    [routes],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <PanelHeader>
        <SelectControl
          label="route"
          value={routeFilter}
          options={routeOptions}
          onChange={setRouteFilter}
        />
        <div className="inline-flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">level</span>
          {(['info', 'warn', 'err'] as const).map((l) => (
            <ToggleChip key={l} active={levels.has(l)} onClick={() => toggleLevel(l)}>
              <span className="uppercase tracking-caps">{l}</span>
            </ToggleChip>
          ))}
        </div>
        <SelectControl<SourceFilter>
          label="src"
          value={sourceFilter}
          options={SOURCE_OPTIONS}
          onChange={(v) => setSourceFilter(v)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="filter logs"
          className="ml-1 w-44"
        />
        <div className="ml-auto inline-flex items-center gap-1">
          <Tooltip content={paused ? 'Start streaming synthetic logs' : 'Pause synthetic stream'}>
            <Button
              size="xs"
              tone={paused ? 'default' : 'accent'}
              onClick={() => (paused ? resume() : pause())}
            >
              {paused ? (
                <>
                  <Icon.Right className="h-3 w-3" /> Resume
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-sm bg-white" /> Live
                </>
              )}
            </Button>
          </Tooltip>
          <Button size="xs" tone="ghost" onClick={() => clear()}>
            <Icon.X className="h-3 w-3" /> Clear
          </Button>
        </div>
      </PanelHeader>

      <ScrollArea className="flex-1 min-h-0">
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Icon.Terminal className="h-4 w-4" />}
              title="No logs match filters"
              description="Adjust route / level / source filters above, or press Resume to stream synthetic entries."
            />
          </div>
        ) : (
          <ul role="log" className="divide-y divide-line/60">
            {filtered.map((entry) => (
              <LogRow
                key={entry.id}
                entry={entry}
                now={now}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId((id) => (id === entry.id ? null : entry.id))}
                onOpenWaterfall={(routeId) => {
                  toast('Open request waterfall');
                  openOverlay('requestWaterfall', { routeId });
                }}
              />
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="flex h-7 shrink-0 items-center gap-3 hairline-t bg-bg-subtle px-3 text-[11px] text-ink-3">
        <span>
          <span className="font-mono text-ink-1">{filtered.length}</span> shown
        </span>
        <span>·</span>
        <span>
          err <span className={cn('font-mono', errCount > 0 ? 'text-sev-err' : 'text-ink-1')}>{errCount}</span>
        </span>
        <span>·</span>
        <span>
          median <span className="font-mono text-ink-1">{med}ms</span>
        </span>
        <span className="ml-auto">
          {paused ? 'paused' : 'streaming · ~600ms'}
        </span>
      </div>
    </div>
  );
}

interface LogRowProps {
  entry: LogEntry;
  now: number;
  expanded: boolean;
  onToggle(): void;
  onOpenWaterfall(routeId: string): void;
}

function LogRow({ entry, now, expanded, onToggle, onOpenWaterfall }: LogRowProps) {
  return (
    <li
      className={cn(
        'cursor-pointer text-xs hover:bg-bg-hover',
        entry.level === 'err' && 'bg-sev-err-soft/20',
        entry.level === 'warn' && 'bg-sev-warn-soft/15',
      )}
      onClick={onToggle}
    >
      <div className="grid grid-cols-[88px_92px_44px_1fr_auto_auto] items-center gap-2 px-3 py-1">
        <span className="font-mono text-[10px] text-ink-3">{formatTs(entry.ts, now)}</span>
        <Chip tone={sourceTone(entry.source)} size="xs" className="justify-self-start">
          <span className="font-mono">{entry.source}</span>
        </Chip>
        <SeverityLabel severity={levelTone(entry.level)} />
        <span className="truncate text-ink-1">{entry.message}</span>
        {entry.requestId ? (
          <Tooltip content={`Request ${entry.requestId} — click to inspect`}>
            <button
              type="button"
              className="inline-flex h-4 items-center rounded-sm border border-line bg-bg px-1 font-mono text-[10px] text-ink-2 hover:text-ink-1 hover:bg-bg-hover"
              onClick={(e) => {
                e.stopPropagation();
                if (entry.routeId) onOpenWaterfall(entry.routeId);
                else toast(`Request ${entry.requestId}`);
              }}
            >
              {entry.requestId}
            </button>
          </Tooltip>
        ) : (
          <span />
        )}
        {entry.latencyMs != null ? (
          <span
            className={cn(
              'rounded-sm border border-line bg-bg px-1 font-mono text-[10px]',
              entry.latencyMs > 200
                ? 'text-sev-warn'
                : entry.latencyMs > 80
                  ? 'text-ink-1'
                  : 'text-ink-3',
            )}
          >
            {entry.latencyMs}ms
          </span>
        ) : (
          <span />
        )}
      </div>
      {expanded && (
        <div className="grid grid-cols-3 gap-2 px-3 pb-2 pt-0.5">
          <ContextCard label="cookie" content={entry.cookie ?? '— none —'} />
          <ContextCard label="header" content={entry.header ?? '— none —'} />
          <ContextCard label="payload" content={entry.payload ?? '— none —'} />
        </div>
      )}
    </li>
  );
}

function ContextCard({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-caps text-ink-3">{label}</span>
      <CodeBlock code={content} showLineNumbers={false} maxHeight={64} />
    </div>
  );
}
