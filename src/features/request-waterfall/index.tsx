import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  ALL_KINDS,
  formatBytes,
  mockHeaders,
  mockInitiator,
  totalsFor,
  waterfalls,
  type ReqEntry,
  type ReqKind,
  type RouteWaterfall,
} from './helpers';

type NetSpeed = 'Fast 3G' | '4G' | 'Wi-Fi';

const ROUTES = ['/', '/products/[id]', '/dashboard', '/checkout'] as const;
type RouteKey = (typeof ROUTES)[number];

function kindFill(kind: ReqKind): string {
  return match(kind)
    .with('html', () => 'fill-sem-server')
    .with('rsc', () => 'fill-sem-static')
    .with('js', () => 'fill-sem-dynamic')
    .with('css', () => 'fill-sev-info')
    .with('font', () => 'fill-accent')
    .with('image', () => 'fill-sem-isr')
    .with('xhr', () => 'fill-sem-edge')
    .with('preflight', () => 'fill-ink-3')
    .exhaustive();
}

function kindLight(kind: ReqKind): string {
  return match(kind)
    .with('html', () => 'fill-sem-server-soft')
    .with('rsc', () => 'fill-sem-static-soft')
    .with('js', () => 'fill-sem-dynamic-soft')
    .with('css', () => 'fill-sev-info-soft')
    .with('font', () => 'fill-accent-soft')
    .with('image', () => 'fill-sem-isr-soft')
    .with('xhr', () => 'fill-sem-edge-soft')
    .with('preflight', () => 'fill-line/40')
    .exhaustive();
}

function kindTone(kind: ReqKind): 'server' | 'static' | 'dynamic' | 'info' | 'accent' | 'isr' | 'edge' | 'muted' {
  return match(kind)
    .with('html', () => 'server' as const)
    .with('rsc', () => 'static' as const)
    .with('js', () => 'dynamic' as const)
    .with('css', () => 'info' as const)
    .with('font', () => 'accent' as const)
    .with('image', () => 'isr' as const)
    .with('xhr', () => 'edge' as const)
    .with('preflight', () => 'muted' as const)
    .exhaustive();
}

export function RequestWaterfallOverlay() {
  const open = useUiStore((s) => s.overlays.requestWaterfall.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeKey, setRouteKey] = useState<RouteKey>('/products/[id]');
  const [netSpeed, setNetSpeed] = useState<NetSpeed>('4G');
  const [activeKinds, setActiveKinds] = useState<ReadonlyArray<ReqKind>>([]);
  const [blockingOnly, setBlockingOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const wf: RouteWaterfall = waterfalls[routeKey] ?? waterfalls['/']!;
  const totals = useMemo(() => totalsFor(wf), [wf]);

  const filtered = useMemo<ReadonlyArray<ReqEntry>>(() => {
    return wf.entries.filter((e) => {
      if (activeKinds.length > 0 && !activeKinds.includes(e.kind)) return false;
      if (blockingOnly && !e.renderBlocking) return false;
      return true;
    });
  }, [wf, activeKinds, blockingOnly]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('requestWaterfall'))}
      title="Request Waterfall"
      subtitle="HTML · RSC · JS · CSS · fonts · images"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">total:</span>{' '}
              <span className="font-mono text-ink-1">{formatBytes(totals.totalBytes)}</span>
            </span>
            <span>
              <span className="text-ink-2">requests:</span>{' '}
              <span className="font-mono text-ink-1">{totals.count}</span>
            </span>
            <span>
              <span className="text-ink-2">3rd-party:</span>{' '}
              <span className="font-mono text-ink-1">{totals.thirdParty}</span>
            </span>
            <span>
              <span className="text-ink-2">LCP:</span>{' '}
              <span className="font-mono text-ink-1">{wf.lcpMs}ms</span>
            </span>
            <span>
              <span className="text-ink-2">TBT:</span>{' '}
              <span className="font-mono text-ink-1">{wf.tbtMs}ms</span>
            </span>
          </div>
          <Button size="xs" tone="ghost" onClick={() => close('requestWaterfall')}>
            Close
          </Button>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">route</span>
        <select
          value={routeKey}
          onChange={(e) => {
            setRouteKey(e.target.value as RouteKey);
            setExpandedId(null);
          }}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-[11px] text-ink-1"
        >
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <span className="h-4 w-px bg-line" aria-hidden />
        <span className="text-[10px] uppercase tracking-caps text-ink-3">net</span>
        {(['Fast 3G', '4G', 'Wi-Fi'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setNetSpeed(s)}
            className={cn(
              'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
              netSpeed === s
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
            )}
          >
            {s}
          </button>
        ))}

        <span className="h-4 w-px bg-line" aria-hidden />
        <div className="flex flex-wrap items-center gap-1">
          {ALL_KINDS.map((k) => {
            const active = activeKinds.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() =>
                  setActiveKinds((prev) =>
                    prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                  )
                }
                className={cn(
                  'h-5 rounded-full border px-1.5 font-mono text-[10px]',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-3 hover:text-ink-1',
                )}
              >
                {k}
              </button>
            );
          })}
        </div>

        <label className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink-2">
          <input
            type="checkbox"
            checked={blockingOnly}
            onChange={(e) => setBlockingOnly(e.target.checked)}
            className="h-3 w-3"
          />
          render-blocking only
        </label>
      </div>

      {/* Waterfall */}
      <div className="px-3 py-3">
        <Waterfall
          entries={filtered}
          duration={Math.max(totals.duration, wf.lcpMs + 40)}
          lcpMs={wf.lcpMs}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
        />
        {filtered.length === 0 && (
          <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-3 py-4 text-center text-[11px] text-ink-3">
            No requests match this filter.
          </div>
        )}
      </div>
    </OverlayPanel>
  );
}

function Waterfall({
  entries,
  duration,
  lcpMs,
  expandedId,
  onToggle,
}: {
  entries: ReadonlyArray<ReqEntry>;
  duration: number;
  lcpMs: number;
  expandedId: string | null;
  onToggle(id: string): void;
}) {
  const labelW = 240;
  const barTrackW = 720;
  const rowH = 22;
  const ticks = 8;

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      {/* axis header */}
      <div
        className="grid hairline-b bg-bg-subtle text-[10px] text-ink-3"
        style={{ gridTemplateColumns: `${labelW}px 1fr` }}
      >
        <div className="px-2 py-1.5 uppercase tracking-caps">request</div>
        <div className="relative h-7 px-1">
          <svg viewBox={`0 0 ${barTrackW} 28`} preserveAspectRatio="none" className="block h-full w-full">
            {Array.from({ length: ticks + 1 }).map((_, i) => {
              const x = (barTrackW * i) / ticks;
              const t = Math.round((duration * i) / ticks);
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1={20} y2={28} className="stroke-line" strokeWidth={1} />
                  <text x={x + 2} y={16} fontSize={9} className="fill-ink-3">
                    {t}ms
                  </text>
                </g>
              );
            })}
            <line
              x1={(barTrackW * lcpMs) / duration}
              x2={(barTrackW * lcpMs) / duration}
              y1={0}
              y2={28}
              className="stroke-sev-warn"
              strokeWidth={1.2}
              strokeDasharray="3 2"
            />
            <text
              x={(barTrackW * lcpMs) / duration + 4}
              y={10}
              fontSize={9}
              className="fill-sev-warn"
            >
              LCP {lcpMs}ms
            </text>
          </svg>
        </div>
      </div>

      {/* rows */}
      <div className="max-h-[440px] overflow-y-auto">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id}>
              <div
                className="grid cursor-pointer hover:bg-bg-hover hairline-b"
                style={{ gridTemplateColumns: `${labelW}px 1fr`, height: rowH }}
                onClick={() => onToggle(entry.id)}
              >
                <div className="flex items-center gap-1 truncate px-2 text-[11px]">
                  <Chip tone={kindTone(entry.kind)} size="xs" className="font-normal">
                    {entry.kind}
                  </Chip>
                  <span className="truncate font-mono text-ink-1" title={entry.url}>
                    {entry.url}
                  </span>
                </div>
                <div className="relative px-1">
                  <svg
                    viewBox={`0 0 ${barTrackW} ${rowH}`}
                    preserveAspectRatio="none"
                    className="block h-full w-full"
                  >
                    <BarRow
                      entry={entry}
                      duration={duration}
                      width={barTrackW}
                      height={rowH}
                    />
                  </svg>
                </div>
              </div>
              {isExpanded && (
                <ExpandedRow entry={entry} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarRow({
  entry,
  duration,
  width,
  height,
}: {
  entry: ReqEntry;
  duration: number;
  width: number;
  height: number;
}) {
  const x0 = (width * entry.startMs) / duration;
  const ttfbW = Math.max(1, (width * entry.ttfbMs) / duration);
  const durW = Math.max(1, (width * entry.durMs) / duration);
  const yMid = height / 2;
  const barH = 8;
  const stripeId = `stripe_${entry.id}`;
  return (
    <>
      {entry.cached && (
        <defs>
          <pattern id={stripeId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" className={cn(kindLight(entry.kind))} />
            <line x1="0" x2="0" y1="0" y2="4" className="stroke-line" strokeWidth={1} />
          </pattern>
        </defs>
      )}
      {entry.renderBlocking && (
        <rect
          x={x0 - 1}
          y={yMid - barH / 2 - 1}
          width={2}
          height={barH + 2}
          className="fill-sev-err"
        />
      )}
      <rect
        x={x0}
        y={yMid - barH / 2}
        width={ttfbW}
        height={barH}
        className={cn(kindLight(entry.kind))}
        rx={1.5}
      />
      <rect
        x={x0 + ttfbW}
        y={yMid - barH / 2}
        width={durW}
        height={barH}
        className={cn(entry.cached ? '' : kindFill(entry.kind))}
        fill={entry.cached ? `url(#${stripeId})` : undefined}
        rx={1.5}
      />
      {entry.thirdParty && (
        <circle cx={x0 + ttfbW + durW + 6} cy={yMid} r={2.5} className="fill-sev-warn" />
      )}
    </>
  );
}

function ExpandedRow({ entry }: { entry: ReqEntry }) {
  const headers = mockHeaders(entry);
  const initiator = mockInitiator(entry);
  return (
    <div className="hairline-b bg-bg-subtle px-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-caps text-ink-3">Response headers</h4>
          <dl className="mt-1 grid grid-cols-[120px_1fr] gap-x-2 gap-y-0.5 font-mono text-[10px]">
            {Object.entries(headers).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-3">{k}</dt>
                <dd className="truncate text-ink-1" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h4 className="text-caps text-ink-3">Initiator chain</h4>
          <ol className="mt-1 space-y-0.5 font-mono text-[10px]">
            {initiator.map((step, i) => (
              <li key={i} className="flex items-center gap-1 text-ink-1">
                <span className="text-ink-3">{i === initiator.length - 1 ? '→' : '↓'}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
            <span className="text-ink-3">size</span>
            <span className="font-mono text-ink-1">{formatBytes(entry.bytes)}</span>
            <span className="text-ink-3">ttfb</span>
            <span className="font-mono text-ink-1">{entry.ttfbMs}ms</span>
            <span className="text-ink-3">download</span>
            <span className="font-mono text-ink-1">{entry.durMs}ms</span>
            <span className="text-ink-3">status</span>
            <span className="font-mono text-ink-1">{entry.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
