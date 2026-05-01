import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { Button, Chip, Icon, OverlayPanel, RenderingChip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  NODE_DIMS,
  applyFilter,
  applyLayout,
  bounds,
  buildFlow,
  edgeColor,
  edgeDashed,
  type LayoutMode,
  type RouteFilter,
} from './helpers';

const FILTERS: ReadonlyArray<{ id: RouteFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'authed', label: 'Authed' },
  { id: 'admin', label: 'Admin' },
  { id: 'api', label: 'API' },
];

const LAYOUTS: ReadonlyArray<{ id: LayoutMode; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'archetype', label: 'By archetype' },
  { id: 'depth', label: 'By URL depth' },
];

export function RouteFlowEditorOverlay() {
  const open = useUiStore((s) => s.overlays.routeFlowEditor.open);
  const close = useUiStore((s) => s.closeOverlay);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const openTab = useEditorStore((s) => s.openTab);
  const routes = useRouteStore((s) => s.routes);
  const routesById = useMemo(
    () => new Map(routes.map((r) => [r.id, r] as const)),
    [routes],
  );

  const [filter, setFilter] = useState<RouteFilter>('all');
  const [layout, setLayout] = useState<LayoutMode>('auto');
  const [showRedirects, setShowRedirects] = useState(true);
  const [showParallel, setShowParallel] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const flow = useMemo(() => buildFlow(routes), [routes]);
  const filtered = useMemo(
    () => applyFilter(flow.nodes, filter, routesById),
    [flow.nodes, filter, routesById],
  );
  const positioned = useMemo(() => applyLayout(filtered, layout), [filtered, layout]);
  const visibleIds = useMemo(() => new Set(positioned.map((n) => n.routeId)), [positioned]);
  const visibleEdges = useMemo(
    () =>
      flow.edges.filter((e) => {
        if (!visibleIds.has(e.from) || !visibleIds.has(e.to)) return false;
        if (!showRedirects && e.kind === 'redirect') return false;
        if (!showParallel && (e.kind === 'parallel' || e.kind === 'intercepting'))
          return false;
        return true;
      }),
    [flow.edges, visibleIds, showRedirects, showParallel],
  );
  const dim = useMemo(() => bounds(positioned), [positioned]);
  const selected = selectedId ? routesById.get(selectedId) : null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('routeFlowEditor'))}
      title="Route Flow Editor"
      subtitle={`${positioned.length} nodes · ${visibleEdges.length} edges`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Export graph as SVG (preview)')}>
            Export SVG
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => {
              close('routeFlowEditor');
              openOverlay('wizardNewRoute');
            }}
          >
            <Icon.Plus className="h-3 w-3" />
            Add route
          </Button>
        </>
      }
    >
      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-selected={filter === f.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                filter === f.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="inline-flex h-6 items-center rounded-full border border-line bg-bg p-px">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              aria-selected={layout === l.id}
              className={cn(
                'h-5 px-2 text-[10px] uppercase tracking-caps text-ink-2 hover:text-ink-1',
                layout === l.id && 'rounded-full bg-bg-selected text-ink-1',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowRedirects((v) => !v)}
          aria-pressed={showRedirects}
          className={cn(
            'h-5 rounded-full border px-2 text-[10px] tracking-caps',
            showRedirects
              ? 'border-sev-warn/30 bg-sev-warn-soft text-sev-warn'
              : 'border-line bg-bg text-ink-3 hover:text-ink-1',
          )}
        >
          Redirects
        </button>
        <button
          onClick={() => setShowParallel((v) => !v)}
          aria-pressed={showParallel}
          className={cn(
            'h-5 rounded-full border px-2 text-[10px] tracking-caps',
            showParallel
              ? 'border-sem-edge/30 bg-sem-edge-soft text-sem-edge'
              : 'border-line bg-bg text-ink-3 hover:text-ink-1',
          )}
        >
          Parallel slots
        </button>

        <div className="ml-auto inline-flex h-6 items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:bg-bg-hover"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="font-mono text-[10px] text-ink-3">{(zoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:bg-bg-hover"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:bg-bg-hover"
          >
            reset
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[1fr_240px]">
        <div className="relative overflow-auto bg-bg-subtle" style={{ maxHeight: '60vh' }}>
          <svg
            width={dim.w * zoom}
            height={dim.h * zoom}
            viewBox={`0 0 ${dim.w} ${dim.h}`}
            className="block"
          >
            {/* edges first */}
            <g>
              {visibleEdges.map((e) => {
                const a = positioned.find((n) => n.routeId === e.from);
                const b = positioned.find((n) => n.routeId === e.to);
                if (!a || !b) return null;
                const x1 = a.x + NODE_DIMS.w;
                const y1 = a.y + NODE_DIMS.h / 2;
                const x2 = b.x;
                const y2 = b.y + NODE_DIMS.h / 2;
                const cx = (x1 + x2) / 2;
                const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
                return (
                  <path
                    key={e.id}
                    d={d}
                    stroke={edgeColor(e.kind)}
                    strokeWidth={1.25}
                    strokeDasharray={edgeDashed(e.kind) ? '4 3' : undefined}
                    fill="none"
                    opacity={0.7}
                  />
                );
              })}
            </g>
            {/* nodes */}
            <g>
              {positioned.map((n) => {
                const isSelected = selectedId === n.routeId;
                const r = routesById.get(n.routeId);
                const tone =
                  n.rendering === 'static'
                    ? 'hsl(var(--sem-static-soft))'
                    : n.rendering === 'isr'
                      ? 'hsl(var(--sem-isr-soft))'
                      : n.rendering === 'dynamic'
                        ? 'hsl(var(--sem-dynamic-soft))'
                        : 'hsl(var(--bg-subtle))';
                return (
                  <g
                    key={n.routeId}
                    transform={`translate(${n.x}, ${n.y})`}
                    onClick={() => setSelectedId(n.routeId)}
                    onDoubleClick={() => {
                      if (r?.files.page) {
                        openTab({
                          id: `tab-${r.files.page}`,
                          file: r.files.page,
                          label: r.files.page.split('/').pop() ?? 'page.tsx',
                        });
                        close('routeFlowEditor');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      width={NODE_DIMS.w}
                      height={NODE_DIMS.h}
                      rx={6}
                      fill={tone}
                      stroke={isSelected ? 'hsl(var(--accent))' : 'hsl(var(--border))'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x={12}
                      y={20}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize={11}
                      fill="hsl(var(--text))"
                    >
                      {n.path}
                    </text>
                    <text
                      x={12}
                      y={36}
                      fontFamily="Inter, sans-serif"
                      fontSize={10}
                      fill="hsl(var(--text-3))"
                    >
                      {n.archetype}
                    </text>
                    <text
                      x={12}
                      y={54}
                      fontFamily="Inter, sans-serif"
                      fontSize={9}
                      fontWeight={600}
                      fill={
                        n.rendering === 'static'
                          ? 'hsl(var(--sem-static))'
                          : n.rendering === 'isr'
                            ? 'hsl(var(--sem-isr))'
                            : 'hsl(var(--sem-dynamic))'
                      }
                    >
                      {n.rendering.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right detail panel */}
        <aside className="hairline-l bg-bg">
          {selected ? (
            <>
              <div className="px-3 py-3 hairline-b">
                <div className="text-caps text-ink-3">Route</div>
                <div className="mt-1 font-mono text-sm text-ink-1">{selected.path}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip tone="muted" size="xs">
                    {selected.archetype}
                  </Chip>
                  <RenderingChip
                    rendering={selected.rendering}
                    confidence={selected.renderingConfidence}
                    showQuestion
                  />
                </div>
              </div>
              <div className="px-3 py-3 hairline-b">
                <div className="text-caps text-ink-3">Files</div>
                <ul className="mt-1 space-y-0.5">
                  {Object.entries(selected.files).map(([k, v]) =>
                    v ? (
                      <li key={k} className="font-mono text-[11px] text-ink-2">
                        <span className="text-ink-3">{k}</span> {v}
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
              <div className="px-3 py-3 hairline-b">
                <div className="text-caps text-ink-3">Boundaries</div>
                <ul className="mt-1 space-y-0.5 text-[11px]">
                  {(['loading', 'error', 'notFound', 'default', 'template'] as const).map((b) => (
                    <li key={b} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'font-bold',
                          selected.boundaries[b] === 'present' && 'text-sem-static',
                          selected.boundaries[b] === 'missing' && 'text-sev-err',
                          selected.boundaries[b] === 'na' && 'text-ink-3',
                        )}
                      >
                        {selected.boundaries[b] === 'present' ? '✓' : selected.boundaries[b] === 'missing' ? '✗' : '·'}
                      </span>
                      <span className="text-ink-2">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-3 py-3">
                <Button
                  size="sm"
                  tone="accent"
                  className="w-full"
                  onClick={() => {
                    setInspectorContext({ kind: 'route', routeId: selected.id });
                    close('routeFlowEditor');
                  }}
                >
                  Open contract
                </Button>
              </div>
            </>
          ) : (
            <div className="px-3 py-6 text-center text-xs text-ink-3">
              Click a node to inspect
            </div>
          )}
        </aside>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 hairline-t bg-bg-subtle px-3 py-1.5 text-[10px] text-ink-3">
        <span className="text-caps">Edges</span>
        <Legend color="hsl(var(--accent))" label="link" />
        <Legend color="hsl(var(--sev-warn))" label="redirect" />
        <Legend color="hsl(var(--sem-edge))" label="parallel" dashed />
        <Legend color="hsl(var(--sem-client))" label="intercepting" dashed />
        <span className="ml-4 text-caps">Rendering</span>
        <Swatch color="hsl(var(--sem-static-soft))" label="static" />
        <Swatch color="hsl(var(--sem-isr-soft))" label="ISR" />
        <Swatch color="hsl(var(--sem-dynamic-soft))" label="dynamic" />
      </div>
    </OverlayPanel>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg width={20} height={6}>
        <line
          x1={0}
          x2={20}
          y1={3}
          y2={3}
          stroke={color}
          strokeWidth={1.25}
          strokeDasharray={dashed ? '3 2' : undefined}
        />
      </svg>
      {label}
    </span>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-sm border border-line"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
