import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import {
  analyzeSuspenseBoundaries,
  computeStreamMetrics,
  useLastTraceStore,
} from '@entities/rsc-payload';
import { Button, Chip, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  colorForGroup,
  totalMs as computeTotalMs,
  traceFor,
  traces,
  type RscChunk,
  type StreamingTrace,
} from './helpers';

const TIMELINE_HEIGHT = 280;
const TIMELINE_PAD_LEFT = 60;
const TIMELINE_PAD_RIGHT = 16;
const TIMELINE_PAD_TOP = 18;
const TIMELINE_PAD_BOTTOM = 26;
const BAR_GAP = 6;

export function StreamingVisualizerOverlay() {
  const open = useUiStore((s) => s.overlays.streamingVisualizer.open);
  const requested = useUiStore((s) => s.overlays.streamingVisualizer.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [routeId, setRouteId] = useState<string>(traces[0]?.routeId ?? 'route_home');
  const [now, setNow] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (requested && traces.some((t) => t.routeId === requested)) {
      setRouteId(requested);
    }
  }, [open, requested]);

  const trace = traceFor(routeId);
  const total = trace ? computeTotalMs(trace) : 0;

  // Reset cursor when route changes
  useEffect(() => {
    setNow(0);
    setPlaying(false);
  }, [routeId]);

  useEffect(() => {
    if (!playing || !trace) return;
    lastTimeRef.current = null;
    const tick = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;
      setNow((cur) => {
        const next = cur + dt;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, trace, total]);

  const routeOptions = useMemo(
    () =>
      traces.map((t) => {
        const r = routes.find((x) => x.id === t.routeId);
        return { value: t.routeId, label: r?.path ?? t.routeId };
      }),
    [routes],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('streamingVisualizer'))}
      title="Streaming Visualizer"
      subtitle="RSC payload chunk arrival timeline"
      size="lg"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => { setNow(0); setPlaying(false); }}>
            <Icon.Refresh className="h-3 w-3" /> Reset
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Compare with /products (preview)')}>
            Compare with /products
          </Button>
        </>
      }
    >
      <RscRealTraceBanner />
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <SelectControl label="route" value={routeId} options={routeOptions} onChange={setRouteId} />
        <Button
          size="xs"
          tone={playing ? 'accent' : 'default'}
          onClick={() => {
            if (!trace) return;
            if (now >= total) setNow(0);
            setPlaying((p) => !p);
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <input
          type="range"
          min={0}
          max={total}
          step={10}
          value={Math.round(now)}
          onChange={(e) => {
            setPlaying(false);
            setNow(Number(e.target.value));
          }}
          className="flex-1 accent-accent"
          aria-label="time scrubber"
        />
        <span className="font-mono text-[11px] text-ink-2">
          {Math.round(now)} / {total}ms
        </span>
      </div>

      {!trace ? (
        <div className="p-4">
          <EmptyState title="No trace" description="No streaming data for this route." />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_260px]">
          <div className="p-3">
            <Timeline trace={trace} total={total} now={now} />
          </div>
          <div className="hairline-l bg-bg-subtle/40 p-3">
            <NowPanel trace={trace} now={now} />
          </div>
        </div>
      )}
    </OverlayPanel>
  );
}

function Timeline({
  trace,
  total,
  now,
}: {
  trace: StreamingTrace;
  total: number;
  now: number;
}) {
  const width = 760;
  const innerW = width - TIMELINE_PAD_LEFT - TIMELINE_PAD_RIGHT;
  const chunks = trace.chunks;
  const innerH = TIMELINE_HEIGHT - TIMELINE_PAD_TOP - TIMELINE_PAD_BOTTOM;
  const rowH = Math.max(14, Math.floor((innerH - BAR_GAP * (chunks.length - 1)) / chunks.length));

  const xFor = (ms: number) => TIMELINE_PAD_LEFT + (ms / total) * innerW;
  const cursorX = xFor(now);

  const ticks = useMemo(() => {
    const stepCandidates = [50, 100, 200, 500, 1000, 2000];
    const target = total / 6;
    const step = stepCandidates.find((s) => s >= target) ?? stepCandidates[stepCandidates.length - 1]!;
    const out: number[] = [];
    for (let v = 0; v <= total; v += step) out.push(v);
    return out;
  }, [total]);

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      <svg
        viewBox={`0 0 ${width} ${TIMELINE_HEIGHT}`}
        width="100%"
        height={TIMELINE_HEIGHT}
        role="img"
        aria-label="streaming timeline"
      >
        {/* tick lines */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={xFor(t)}
              x2={xFor(t)}
              y1={TIMELINE_PAD_TOP - 4}
              y2={TIMELINE_HEIGHT - TIMELINE_PAD_BOTTOM}
              stroke="#e5e7eb"
              strokeDasharray="2 3"
            />
            <text
              x={xFor(t)}
              y={TIMELINE_HEIGHT - 8}
              fill="#9ca3af"
              fontSize="10"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {t}ms
            </text>
          </g>
        ))}

        {/* axis */}
        <line
          x1={TIMELINE_PAD_LEFT}
          x2={width - TIMELINE_PAD_RIGHT}
          y1={TIMELINE_HEIGHT - TIMELINE_PAD_BOTTOM}
          y2={TIMELINE_HEIGHT - TIMELINE_PAD_BOTTOM}
          stroke="#d1d5db"
        />

        {chunks.map((c, i) => {
          const x1 = xFor(c.startMs);
          const x2 = xFor(c.endMs);
          const w = Math.max(2, x2 - x1);
          const y = TIMELINE_PAD_TOP + i * (rowH + BAR_GAP);
          const arrived = c.endMs <= now;
          const inFlight = c.startMs <= now && c.endMs > now;
          const fill = colorForGroup(c.parentId);
          const opacity = arrived ? 1 : inFlight ? 0.6 : 0.22;
          return (
            <g key={c.id}>
              {/* row label */}
              <text
                x={TIMELINE_PAD_LEFT - 6}
                y={y + rowH / 2 + 3}
                fill="#6b7280"
                fontSize="10"
                textAnchor="end"
                fontFamily="ui-monospace, monospace"
              >
                {c.id}
              </text>
              <rect
                x={x1}
                y={y}
                width={w}
                height={rowH}
                rx={2}
                fill={fill}
                opacity={opacity}
              />
              <text
                x={x1 + 4}
                y={y + rowH / 2 + 3}
                fill="#fff"
                fontSize={Math.min(11, rowH - 2)}
                fontFamily="ui-sans-serif, system-ui"
                style={{ paintOrder: 'stroke', userSelect: 'none' }}
              >
                {c.componentName} · {(c.bytes / 1024).toFixed(1)}kb
              </text>
            </g>
          );
        })}

        {/* now cursor */}
        <line
          x1={cursorX}
          x2={cursorX}
          y1={TIMELINE_PAD_TOP - 4}
          y2={TIMELINE_HEIGHT - TIMELINE_PAD_BOTTOM}
          stroke="#0ea5e9"
          strokeWidth={2}
        />
        <circle cx={cursorX} cy={TIMELINE_PAD_TOP - 4} r={3} fill="#0ea5e9" />
      </svg>
    </div>
  );
}

function NowPanel({ trace, now }: { trace: StreamingTrace; now: number }) {
  const arrived: RscChunk[] = trace.chunks.filter((c) => c.endMs <= now);
  const pending: RscChunk[] = trace.chunks.filter((c) => c.endMs > now);
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">@ {Math.round(now)}ms — visible</div>
        {arrived.length === 0 ? (
          <div className="mt-1 text-ink-3">— nothing rendered yet —</div>
        ) : (
          <ul className="mt-1 space-y-1">
            {arrived.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-sm"
                    style={{ background: colorForGroup(c.parentId) }}
                  />
                  <span className="font-mono text-ink-1">{c.componentName}</span>
                </span>
                <Chip tone="static" size="xs">arrived</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-caps text-ink-3">pending fallbacks</div>
        {pending.length === 0 ? (
          <div className="mt-1 text-ink-3">— all chunks arrived —</div>
        ) : (
          <ul className="mt-1 space-y-1">
            {pending.map((c) => (
              <li
                key={c.id}
                className={cn(
                  'rounded-sm border border-line bg-bg px-2 py-1',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-ink-2">{c.componentName}</span>
                  <Chip tone="warn" size="xs">{c.startMs <= now ? 'in-flight' : 'queued'}</Chip>
                </div>
                {c.pendingFallback ? (
                  <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                    {c.pendingFallback}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RscRealTraceBanner() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const metrics = useMemo(() => computeStreamMetrics(chunks), [chunks]);
  const boundaries = useMemo(() => analyzeSuspenseBoundaries(chunks), [chunks]);
  if (!url) return null;
  return (
    <div className="hairline-b border-b-2 border-accent/40 bg-accent/5 px-3 py-1.5 text-[11px]">
      <span className="mr-2 font-mono uppercase tracking-caps text-accent">probe live</span>
      <span className="font-mono text-ink-1">{url}</span>
      <span className="ml-2 text-ink-3">
        {metrics.chunkCount} chunks · {Math.round(metrics.totalMs)}ms ·
        {' '}{metrics.followUpCount} follow-ups · {boundaries.length} Suspense
      </span>
      <span className="ml-2 text-ink-3">— mock timeline below; real arrival data in RSC overlay</span>
    </div>
  );
}
