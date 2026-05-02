/**
 * Trace tab — flame graph + waterfall + spans, with auto-correlation to routes.
 *
 * Reuses `<Flame />` and `<Waterfall />` from `@features/otel-trace`. A trace
 * list shows recent (route-correlated) traces; selecting a row drives the
 * sub-view. Span click opens code at `code.filepath:code.lineno` via the
 * editor store.
 */

import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, EmptyState, Icon } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { useEditorStore } from '@entities/editor';
import { Flame } from '@features/otel-trace/flame';
import { Waterfall } from '@features/otel-trace/waterfall';
import { hotspots } from '@features/otel-trace/parser';
import { useOtelStore } from '@features/otel-trace/store';
import type { NormalizedSpan, TraceTree } from '@features/otel-trace/types';
import { useLiveBottomTabsStore } from './store';
import { correlateTrace } from './sources/otel-collector';
import { cn } from '@shared/lib/cn';

const formatUs = (us: number): string => {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)}s`;
  if (us >= 1_000) return `${(us / 1_000).toFixed(1)}ms`;
  return `${us.toFixed(0)}µs`;
};

const tabId = (file: string): string => `otel-${file}`;
const shortName = (f: string): string => {
  const segs = f.split('/');
  return segs[segs.length - 1] ?? f;
};

export function TraceGraphTab() {
  const traces = useOtelStore((s) => s.traces);
  const otelSelectTrace = useOtelStore((s) => s.selectTrace);
  const otelSelectSpan = useOtelStore((s) => s.selectSpan);
  const selectedTraceId = useOtelStore((s) => s.selectedTraceId);
  const selectedSpanId = useOtelStore((s) => s.selectedSpanId);
  const subView = useLiveBottomTabsStore((s) => s.traceSubView);
  const setSubView = useLiveBottomTabsStore((s) => s.setTraceSubView);
  const setSelectedTraceId = useLiveBottomTabsStore((s) => s.setSelectedTraceId);
  const openTab = useEditorStore((s) => s.openTab);
  const [routeFilter, setRouteFilter] = useState<string>('');

  // Mirror our slice with the otel store's selection.
  useEffect(() => {
    if (selectedTraceId) setSelectedTraceId(selectedTraceId);
  }, [selectedTraceId, setSelectedTraceId]);

  const correlations = useMemo(
    () => traces.slice(0, 10).map((t) => correlateTrace(t)),
    [traces],
  );

  const routes = useMemo(() => {
    const set = new Set<string>();
    for (const c of correlations) if (c.route) set.add(c.route);
    return Array.from(set);
  }, [correlations]);

  const filtered = routeFilter
    ? correlations.filter((c) => c.route === routeFilter)
    : correlations;

  const tree: TraceTree | null = useMemo(
    () => traces.find((t) => t.traceId === selectedTraceId) ?? traces[0] ?? null,
    [traces, selectedTraceId],
  );
  const selectedSpan: NormalizedSpan | null = useMemo(
    () => (tree && selectedSpanId ? tree.spans.get(selectedSpanId) ?? null : null),
    [tree, selectedSpanId],
  );
  const top = useMemo(() => (tree ? hotspots(tree, 5) : []), [tree]);

  const handleOpenSpan = (sp: NormalizedSpan) => {
    if (!sp.filepath) return;
    openTab({
      id: tabId(sp.filepath),
      file: sp.filepath,
      label: shortName(sp.filepath),
    });
  };

  if (traces.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<Icon.Layers className="h-5 w-5 text-ink-3" />}
          title="No traces"
          description="Paste an OTLP trace or connect to your tracing backend."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <label className="flex items-center gap-1 text-[10px] text-ink-3">
          route
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="h-6 rounded-sm border border-line bg-bg px-1 text-[11px] text-ink-1"
          >
            <option value="">all</option>
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-2 flex items-center gap-1">
          <ToggleChip active={subView === 'flame'} onClick={() => setSubView('flame')}>
            flame
          </ToggleChip>
          <ToggleChip active={subView === 'waterfall'} onClick={() => setSubView('waterfall')}>
            waterfall
          </ToggleChip>
          <ToggleChip active={subView === 'spans'} onClick={() => setSubView('spans')}>
            spans
          </ToggleChip>
        </div>
        <span className="ml-auto text-[10px] text-ink-3">
          {tree ? `${tree.spans.size} spans · ${formatUs(tree.totalUs)}` : null}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] divide-x divide-line">
        <ul className="min-h-0 overflow-y-auto">
          {filtered.map((c) => {
            const active = selectedTraceId === c.traceId;
            return (
              <li key={c.traceId}>
                <button
                  type="button"
                  onClick={() => otelSelectTrace(c.traceId)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 px-3 py-1.5 text-left hover:bg-bg-hover',
                    active && 'bg-bg-hover',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-1">
                      {c.traceId.slice(0, 8)}
                    </span>
                    <Chip tone="edge" size="xs">
                      {formatUs(c.totalUs)}
                    </Chip>
                    <Button
                      size="xs"
                      tone="ghost"
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        otelSelectTrace(c.traceId);
                      }}
                    >
                      Replay
                    </Button>
                  </div>
                  <span className="truncate text-[10px] text-ink-3">
                    {c.route ?? 'no route'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            {tree && subView === 'flame' ? (
              <div className="p-2">
                <Flame
                  tree={tree}
                  selectedSpanId={selectedSpanId}
                  onSelect={otelSelectSpan}
                  width={620}
                  height={300}
                />
              </div>
            ) : null}
            {tree && subView === 'waterfall' ? (
              <Waterfall
                tree={tree}
                selectedSpanId={selectedSpanId}
                onSelect={otelSelectSpan}
              />
            ) : null}
            {tree && subView === 'spans' ? (
              <SpansList
                tree={tree}
                selectedSpanId={selectedSpanId}
                onSelect={otelSelectSpan}
                onJump={handleOpenSpan}
              />
            ) : null}
          </div>

          <div className="shrink-0 hairline-t bg-bg-subtle/50 p-2">
            {selectedSpan ? (
              <SpanPanel span={selectedSpan} onJump={handleOpenSpan} />
            ) : (
              <div className="text-[10px] text-ink-3">click a span to inspect</div>
            )}
            <div className="mt-2">
              <div className="text-caps mb-1 text-ink-3">hot spans</div>
              <ul className="space-y-0.5">
                {top.map((sp) => (
                  <li
                    key={sp.spanId}
                    className={cn(
                      'flex items-center gap-2 rounded-sm px-1.5 py-0.5 hover:bg-bg-hover',
                      selectedSpanId === sp.spanId && 'bg-bg-hover',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => otelSelectSpan(sp.spanId)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      <span className="nums-tabular w-14 shrink-0 text-right font-mono text-[10px] text-ink-3">
                        {formatUs(sp.selfUs)}
                      </span>
                      <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                        {sp.name}
                      </span>
                    </button>
                    {sp.filepath ? (
                      <button
                        type="button"
                        onClick={() => handleOpenSpan(sp)}
                        className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
                        aria-label="open source"
                      >
                        <Icon.UpRight className="h-3 w-3" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpansList({
  tree,
  selectedSpanId,
  onSelect,
  onJump,
}: {
  tree: TraceTree;
  selectedSpanId: string | null;
  onSelect: (id: string) => void;
  onJump: (sp: NormalizedSpan) => void;
}) {
  const spans = Array.from(tree.spans.values()).sort((a, b) => a.startUs - b.startUs);
  return (
    <ul className="divide-y divide-line/40 font-mono text-[11px]">
      {spans.map((sp) => (
        <li
          key={sp.spanId}
          className={cn(
            'flex items-center gap-2 px-3 py-1 hover:bg-bg-hover',
            selectedSpanId === sp.spanId && 'bg-bg-hover',
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(sp.spanId)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span className="text-ink-3 nums-tabular w-12">{formatUs(sp.startUs)}</span>
            <Chip tone="muted" size="xs">{sp.kind}</Chip>
            <span className="flex-1 truncate text-ink-1">{sp.name}</span>
            <span className="nums-tabular text-ink-3">{formatUs(sp.durationUs)}</span>
          </button>
          {sp.filepath ? (
            <button
              type="button"
              onClick={() => onJump(sp)}
              className="rounded-sm p-0.5 text-ink-3 hover:bg-bg hover:text-ink-1"
              aria-label="open source"
            >
              <Icon.UpRight className="h-3 w-3" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SpanPanel({
  span,
  onJump,
}: {
  span: NormalizedSpan;
  onJump: (sp: NormalizedSpan) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Chip tone={span.status === 'error' ? 'err' : 'info'} size="xs">
          {span.kind}
        </Chip>
        <span className="break-all font-mono text-[11px] text-ink-1">{span.name}</span>
        <span className="ml-auto nums-tabular font-mono text-[10px] text-ink-3">
          {formatUs(span.selfUs)} self · {formatUs(span.durationUs)} dur
        </span>
      </div>
      {span.filepath ? (
        <button
          type="button"
          onClick={() => onJump(span)}
          className="self-start rounded-sm border border-line bg-bg px-2 py-0.5 text-[10px] hover:bg-bg-hover"
        >
          {span.filepath}
          {span.lineno ? `:${span.lineno}` : ''} →
        </button>
      ) : null}
      <ul className="space-y-0.5 rounded-sm border border-line bg-bg-subtle/40 p-1.5 font-mono text-[10px]">
        {Object.entries(span.attributes).slice(0, 8).map(([k, v]) => (
          <li key={k} className="flex gap-2">
            <span className="text-ink-3">{k}</span>
            <span className="truncate text-ink-1">{String(v)}</span>
          </li>
        ))}
        {Object.keys(span.attributes).length === 0 ? (
          <li className="text-ink-3">no attributes</li>
        ) : null}
      </ul>
    </div>
  );
}
