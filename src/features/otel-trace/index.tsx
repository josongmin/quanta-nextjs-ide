import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { Button, Chip, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { hotspots } from './parser';
import { useOtelStore } from './store';
import { Flame } from './flame';
import { Waterfall } from './waterfall';
import type { NormalizedSpan } from './types';

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

type View = 'waterfall' | 'flame';

export function OtelTraceOverlay() {
  const open = useUiStore((s) => s.overlays.otelTrace.open);
  const close = useUiStore((s) => s.closeOverlay);
  const traces = useOtelStore((s) => s.traces);
  const selectedTraceId = useOtelStore((s) => s.selectedTraceId);
  const selectedSpanId = useOtelStore((s) => s.selectedSpanId);
  const ingest = useOtelStore((s) => s.ingest);
  const selectTrace = useOtelStore((s) => s.selectTrace);
  const selectSpan = useOtelStore((s) => s.selectSpan);
  const clear = useOtelStore((s) => s.clear);
  const openTab = useEditorStore((s) => s.openTab);

  const [view, setView] = useState<View>('waterfall');
  const [paste, setPaste] = useState('');

  const tree = useMemo(
    () => traces.find((t) => t.traceId === selectedTraceId) ?? traces[0] ?? null,
    [traces, selectedTraceId],
  );
  const selectedSpan: NormalizedSpan | null = useMemo(
    () => (tree && selectedSpanId ? (tree.spans.get(selectedSpanId) ?? null) : null),
    [tree, selectedSpanId],
  );
  const top = useMemo(() => (tree ? hotspots(tree, 5) : []), [tree]);

  const handleIngest = () => {
    const trimmed = paste.trim();
    if (!trimmed) {
      toast.error('Paste OTLP/JSON first');
      return;
    }
    const r = ingest(trimmed);
    if (!r.ok) {
      toast.error('No spans found in payload');
      return;
    }
    setPaste('');
    toast.success(`Ingested ${r.count} trace${r.count === 1 ? '' : 's'}`);
  };

  const handleOpenSpan = (sp: NormalizedSpan) => {
    if (!sp.filepath) {
      toast('No code.filepath attribute on this span');
      return;
    }
    openTab({
      id: tabId(sp.filepath),
      file: sp.filepath,
      label: shortName(sp.filepath),
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('otelTrace'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Layers className="h-4 w-4 text-sem-edge" />
          <span>OTel Trace</span>
        </span>
      }
      subtitle="OTLP / JSON · waterfall · flame · jump to source"
      size="lg"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            traces <span className="font-mono text-ink-1">{traces.length}</span>
          </span>
          {tree ? (
            <>
              <span>
                spans{' '}
                <span className="font-mono text-ink-1">{tree.spans.size}</span>
              </span>
              <span>
                duration{' '}
                <span className="font-mono text-ink-1">
                  {formatUs(tree.totalUs)}
                </span>
              </span>
            </>
          ) : null}
          <span className="ml-auto flex items-center gap-1.5">
            <Button size="xs" tone="ghost" onClick={() => clear()}>
              Clear
            </Button>
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <SelectControl
          label="trace"
          value={tree?.traceId ?? ''}
          onChange={(v) => selectTrace(v)}
          options={traces.map((t) => ({
            value: t.traceId,
            label: `${t.traceId.slice(0, 8)} · ${formatUs(t.totalUs)}`,
          }))}
        />
        <div className="ml-2 flex items-center gap-1">
          <ToggleChip
            active={view === 'waterfall'}
            onClick={() => setView('waterfall')}
          >
            waterfall
          </ToggleChip>
          <ToggleChip
            active={view === 'flame'}
            onClick={() => setView('flame')}
          >
            flame
          </ToggleChip>
        </div>
        <span className="ml-auto text-[10px] text-ink-3">
          OpenTelemetry · code.filepath / code.function
        </span>
      </div>

      {!tree ? (
        <EmptyState
          icon={<Icon.Layers className="h-5 w-5 text-ink-3" />}
          title="No traces ingested"
          description="Paste an OTLP/JSON payload on the right to begin."
        />
      ) : (
        <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
          <div className="max-h-[480px]">
            {view === 'waterfall' ? (
              <Waterfall
                tree={tree}
                selectedSpanId={selectedSpanId}
                onSelect={selectSpan}
              />
            ) : (
              <div className="p-2">
                <Flame
                  tree={tree}
                  selectedSpanId={selectedSpanId}
                  onSelect={selectSpan}
                  width={620}
                  height={380}
                />
              </div>
            )}
          </div>
          <div className="flex max-h-[480px] flex-col divide-y divide-line overflow-y-auto">
            <SpanInspector span={selectedSpan} onJump={handleOpenSpan} />
            <Hotspots
              spans={top}
              selectedId={selectedSpanId}
              onSelect={selectSpan}
              onJump={handleOpenSpan}
            />
            <PastePane
              value={paste}
              onChange={setPaste}
              onIngest={handleIngest}
            />
          </div>
        </div>
      )}
    </OverlayPanel>
  );
}

function SpanInspector({
  span,
  onJump,
}: {
  span: NormalizedSpan | null;
  onJump(sp: NormalizedSpan): void;
}) {
  if (!span) {
    return (
      <div className="p-3 text-[11px] text-ink-3">Click a span to inspect.</div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Chip
          tone={span.status === 'error' ? 'err' : 'info'}
          size="xs"
        >
          {span.kind}
        </Chip>
        {span.scope ? (
          <Chip tone="muted" size="xs">
            {span.scope}
          </Chip>
        ) : null}
        <span className="ml-auto font-mono text-[11px] text-ink-3">
          {formatUs(span.selfUs)} self · {formatUs(span.durationUs)} dur
        </span>
      </div>
      <div className="break-all font-mono text-[12px] text-ink-1">
        {span.name}
      </div>
      {span.filepath ? (
        <button
          type="button"
          onClick={() => onJump(span)}
          className="self-start rounded-sm border border-line bg-bg px-2 py-0.5 text-[11px] hover:bg-bg-hover"
        >
          {span.filepath}
          {span.lineno ? `:${span.lineno}` : ''} →
        </button>
      ) : null}
      {span.errorMessage ? (
        <div className="rounded-sm border border-sev-err/30 bg-sev-err-soft px-2 py-1 text-[11px] text-sev-err">
          {span.errorMessage}
        </div>
      ) : null}
      <div>
        <div className="text-caps mb-1 text-ink-3">attributes</div>
        <ul className="space-y-0.5 rounded-sm border border-line bg-bg-subtle/40 p-1.5 font-mono text-[10px]">
          {Object.entries(span.attributes).slice(0, 12).map(([k, v]) => (
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
    </div>
  );
}

function Hotspots({
  spans,
  selectedId,
  onSelect,
  onJump,
}: {
  spans: NormalizedSpan[];
  selectedId: string | null;
  onSelect(id: string): void;
  onJump(sp: NormalizedSpan): void;
}) {
  return (
    <div className="p-3">
      <div className="text-caps mb-1 text-ink-3">top by self-time</div>
      <ul className="space-y-0.5">
        {spans.map((sp) => (
          <li key={sp.spanId}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-sm px-1.5 py-0.5 hover:bg-bg-hover',
                selectedId === sp.spanId && 'bg-bg-hover',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(sp.spanId)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span className="w-14 shrink-0 text-right font-mono text-[10px] text-ink-3">
                  {formatUs(sp.selfUs)}
                </span>
                <span className="flex-1 truncate font-mono text-[11px] text-ink-1">
                  {sp.name}
                </span>
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PastePane({
  value,
  onChange,
  onIngest,
}: {
  value: string;
  onChange(v: string): void;
  onIngest(): void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-caps text-ink-3">paste OTLP/JSON</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='{"resourceSpans":[…]}'
        className="h-32 resize-none rounded-sm border border-line bg-bg p-2 font-mono text-[10px] text-ink-1 outline-none focus:border-accent"
        spellCheck={false}
      />
      <div className="flex gap-1.5">
        <Button size="xs" tone="accent" onClick={onIngest}>
          Ingest
        </Button>
        <Button size="xs" tone="ghost" onClick={() => onChange('')} disabled={!value}>
          Reset
        </Button>
      </div>
    </div>
  );
}
