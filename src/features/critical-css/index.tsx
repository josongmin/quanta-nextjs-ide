import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useRouteStore } from '@entities/route';
import { Button, Chip, CodeBlock, EmptyState, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  KIND_COLOR,
  KIND_LABEL,
  type RenderPathEntry,
  criticalBundles,
  pathTotalMs,
  renderPaths,
} from './helpers';

const KIND_LEGEND: ReadonlyArray<RenderPathEntry['kind']> = [
  'html',
  'css',
  'js',
  'font',
  'image',
  'xhr',
];

const ROW_H = 18;
const HEADER_H = 18;
const LABEL_W = 200;

function Waterfall({ entries }: { entries: ReadonlyArray<RenderPathEntry> }) {
  const total = Math.max(800, pathTotalMs(entries));
  const width = 540;
  const height = HEADER_H + entries.length * ROW_H + 8;
  const xFor = (ms: number): number => (ms / total) * width;

  // Pick gridlines
  const step = total > 2000 ? 500 : 250;
  const ticks: number[] = [];
  for (let t = 0; t <= total; t += step) ticks.push(t);

  return (
    <svg
      width={LABEL_W + width + 16}
      height={height}
      role="img"
      aria-label="Render waterfall"
      className="block"
    >
      {/* Header / x-axis */}
      <g transform={`translate(${LABEL_W}, 0)`}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={xFor(t)}
              x2={xFor(t)}
              y1={HEADER_H - 2}
              y2={height - 6}
              className="stroke-line"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text
              x={xFor(t)}
              y={HEADER_H - 6}
              className="fill-ink-3"
              fontSize={9}
              textAnchor="middle"
            >
              {t}ms
            </text>
          </g>
        ))}
      </g>

      {/* Bars */}
      {entries.map((en, i) => {
        const y = HEADER_H + i * ROW_H + 2;
        const barX = LABEL_W + xFor(en.startMs);
        const barW = Math.max(2, xFor(en.durMs));
        return (
          <g key={en.id}>
            {/* Row label */}
            <text
              x={LABEL_W - 6}
              y={y + 11}
              fontSize={10}
              textAnchor="end"
              className="fill-ink-2 font-mono"
            >
              {en.resource.length > 32 ? '…' + en.resource.slice(-31) : en.resource}
            </text>
            {/* Render-blocking marker */}
            {en.renderBlocking ? (
              <rect
                x={barX - 4}
                y={y}
                width={2}
                height={ROW_H - 4}
                className="fill-sev-err"
              />
            ) : null}
            {/* Bar */}
            <rect
              x={barX}
              y={y}
              width={barW}
              height={ROW_H - 4}
              rx={2}
              className={cn(KIND_COLOR[en.kind])}
              opacity={0.85}
            />
            {/* Inline duration tag if room */}
            {barW > 30 ? (
              <text
                x={barX + 4}
                y={y + 11}
                fontSize={9}
                className="fill-white font-mono"
                style={{ pointerEvents: 'none' }}
              >
                {en.durMs}ms
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function CriticalCssOverlay() {
  const open = useUiStore((s) => s.overlays.criticalCss.open);
  const initialRouteId = useUiStore((s) => s.overlays.criticalCss.routeId);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);

  const [routeId, setRouteId] = useState<string>(
    initialRouteId ?? 'route_home',
  );

  const route = routes.find((r) => r.id === routeId);
  const entries = useMemo(() => renderPaths[routeId] ?? [], [routeId]);
  const bundle = criticalBundles[routeId];

  const blockingCount = useMemo(
    () => entries.filter((e) => e.renderBlocking).length,
    [entries],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('criticalCss'))}
      title="Critical CSS · Render Path"
      subtitle="above-the-fold extraction + waterfall"
      size="md"
      footer={
        <>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Apply critical CSS plugin (preview)')}
          >
            <Icon.Bulb className="h-3 w-3" />
            Apply critical CSS plugin
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Open as patch (preview)')}>
            <Icon.Branch className="h-3 w-3" />
            Open as patch
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Route</span>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          className="h-6 rounded-sm border border-line bg-bg px-1.5 font-mono text-xs text-ink-1"
        >
          {Object.keys(renderPaths).map((id) => {
            const rt = routes.find((r) => r.id === id);
            return (
              <option key={id} value={id}>
                {rt?.path ?? id}
              </option>
            );
          })}
        </select>
        <div className="ml-2 flex items-center gap-1">
          {KIND_LEGEND.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 text-[10px] text-ink-3">
              <span className={cn('inline-block h-2 w-3 rounded-sm', KIND_COLOR[k].replace('fill-', 'bg-'))} />
              {KIND_LABEL[k]}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Chip size="xs" tone={blockingCount > 0 ? 'warn' : 'static'}>
            {blockingCount} render-blocking
          </Chip>
          <Chip size="xs" tone="muted">
            {entries.length} resources
          </Chip>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No render-path data" description={`No waterfall for ${route?.path ?? routeId}.`} />
      ) : (
        <div className="grid grid-cols-[1fr_400px]">
          {/* Waterfall */}
          <section className="hairline-r p-3">
            <header className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-1">Render waterfall</h3>
              <span className="font-mono text-[11px] text-ink-3">
                total {pathTotalMs(entries)}ms · {route?.path ?? routeId}
              </span>
            </header>
            <div className="overflow-x-auto rounded-sm border border-line bg-bg p-2">
              <Waterfall entries={entries} />
            </div>
            <div className="mt-2 text-[11px] text-ink-3">
              Red tick = render-blocking resource. Hover bars in DevTools (preview).
            </div>
          </section>

          {/* Critical CSS extractor */}
          <aside className="bg-bg-subtle p-3">
            <header className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-1">Critical CSS</h3>
              {bundle ? (
                <Chip size="xs" tone="static">
                  -{bundle.reduceKb} KB initial
                </Chip>
              ) : null}
            </header>
            {bundle ? (
              <>
                <div className="mb-2 flex flex-wrap gap-1">
                  <Chip size="xs" tone="info">
                    inline above-fold
                  </Chip>
                  <Chip size="xs" tone="muted">
                    defer rest
                  </Chip>
                  <Chip size="xs" tone="muted">
                    media swap
                  </Chip>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                      above-the-fold (inline)
                    </div>
                    <CodeBlock
                      code={bundle.aboveFoldRules}
                      language="css"
                      maxHeight={220}
                      showLineNumbers={false}
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                      deferred rules
                    </div>
                    <CodeBlock
                      code={bundle.deferredRules || '/* nothing to defer */'}
                      language="css"
                      maxHeight={160}
                      showLineNumbers={false}
                    />
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="No critical bundle" description="Nothing extracted for this route." />
            )}
          </aside>
        </div>
      )}
    </OverlayPanel>
  );
}
