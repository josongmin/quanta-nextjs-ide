import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  CIRCULAR_PAIRS,
  EDGES,
  LAYERS,
  isCircular,
  thicknessFor,
  type Edge,
  type LayerId,
} from './helpers';

const W = 760;
const ROW_H = 70;
const PADDING_X = 40;
const TOP = 30;

interface LayerLayout {
  id: LayerId;
  label: string;
  modules: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ArchitectureMapOverlay() {
  const open = useUiStore((s) => s.overlays.architectureMap.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [highlightLayer, setHighlightLayer] = useState<LayerId | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const layouts: ReadonlyArray<LayerLayout> = useMemo(() => {
    const layerWidth = W - PADDING_X * 2;
    return LAYERS.map((l) => ({
      id: l.id,
      label: l.label,
      modules: l.modules,
      x: PADDING_X,
      y: TOP + l.rank * ROW_H,
      width: layerWidth,
      height: 38,
    }));
  }, []);

  const totalH = TOP + LAYERS.length * ROW_H + 20;

  const visibleEdges = useMemo(() => {
    if (highlightLayer === null) return EDGES;
    return EDGES.filter((e) => e.from === highlightLayer || e.to === highlightLayer);
  }, [highlightLayer]);

  const circularCount = EDGES.filter(isCircular).length;

  function layerOf(id: LayerId): LayerLayout {
    const found = layouts.find((l) => l.id === id);
    if (!found) throw new Error(`unknown layer ${id}`);
    return found;
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('architectureMap')}
      title="Architecture Map"
      subtitle="Layered dependency graph with circular flags"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <span className="text-ink-3">
            {circularCount > 0 ? (
              <span className="text-sev-err">circular: {circularCount}</span>
            ) : (
              <span className="text-sev-info">circular: 0</span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="xs" tone="default" onClick={() => toast('Boundary violations report drafted (mock)')}>
              Detect violations
            </Button>
            <Button size="xs" tone="accent" onClick={() => toast.success('ADR draft created (mock)')}>
              Generate ADR
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          <svg
            viewBox={`0 0 ${W} ${totalH}`}
            className="w-full"
            role="img"
            aria-label="Layer dependency graph"
          >
            <defs>
              <marker
                id="arch-arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" className="fill-ink-3" />
              </marker>
              <marker
                id="arch-arrowhead-circ"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" className="fill-sev-err" />
              </marker>
              <marker
                id="arch-arrowhead-circ-rev"
                markerWidth="8"
                markerHeight="8"
                refX="1"
                refY="4"
                orient="auto"
              >
                <path d="M8,0 L0,4 L8,8 z" className="fill-sev-err" />
              </marker>
            </defs>

            {/* Edges */}
            {visibleEdges.map((e) => {
              const a = layerOf(e.from);
              const b = layerOf(e.to);
              const x1 = a.x + a.width * 0.5;
              const downwards = b.y > a.y;
              const yStart = downwards ? a.y + a.height : a.y;
              const yEnd = downwards ? b.y : b.y + b.height;
              const offset = ((LAYERS.findIndex((l) => l.id === e.from) % 5) - 2) * 30;
              const midX = x1 + offset;
              const x2 = b.x + b.width * 0.5 + offset * 0.5;
              const circ = isCircular(e);
              const stroke = circ ? 'stroke-sev-err' : 'stroke-ink-3';
              const isSelected = selectedEdge?.id === e.id;
              return (
                <g
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedEdge(e)}
                >
                  <path
                    d={`M ${x1} ${yStart} Q ${midX} ${(yStart + yEnd) / 2} ${x2} ${yEnd}`}
                    fill="none"
                    className={cn(stroke, isSelected && 'stroke-accent')}
                    strokeWidth={thicknessFor(e.count)}
                    strokeOpacity={isSelected ? 1 : 0.55}
                    markerEnd={circ ? 'url(#arch-arrowhead-circ)' : 'url(#arch-arrowhead)'}
                    {...(circ ? { markerStart: 'url(#arch-arrowhead-circ-rev)' } : {})}
                  />
                  <text
                    x={midX}
                    y={(yStart + yEnd) / 2 - 4}
                    textAnchor="middle"
                    fontSize={10}
                    className={cn(circ ? 'fill-sev-err' : 'fill-ink-3')}
                  >
                    {e.count}
                  </text>
                </g>
              );
            })}

            {/* Layer rects */}
            {layouts.map((l) => {
              const dim = highlightLayer !== null && highlightLayer !== l.id;
              return (
                <g key={l.id} opacity={dim ? 0.4 : 1}>
                  <rect
                    x={l.x}
                    y={l.y}
                    width={l.width}
                    height={l.height}
                    rx={6}
                    className="fill-bg-subtle stroke-line"
                    strokeWidth={1}
                  />
                  <text
                    x={l.x + 14}
                    y={l.y + l.height / 2 + 4}
                    fontSize={12}
                    className="fill-ink-1 font-mono"
                  >
                    {l.label}
                  </text>
                  <rect
                    x={l.x + l.width - 64}
                    y={l.y + 10}
                    width={54}
                    height={18}
                    rx={9}
                    className="fill-accent-soft"
                  />
                  <text
                    x={l.x + l.width - 37}
                    y={l.y + 22}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-accent"
                  >
                    {l.modules} mods
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Filter chips per layer */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-caps text-ink-3">highlight</span>
            <button
              type="button"
              onClick={() => setHighlightLayer(null)}
              className={cn(
                'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                highlightLayer === null
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
              )}
            >
              all
            </button>
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setHighlightLayer(l.id)}
                className={cn(
                  'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
                  highlightLayer === l.id
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          {CIRCULAR_PAIRS.length > 0 && (
            <div className="mt-3 rounded-sm border border-sev-err/30 bg-sev-err-soft px-2 py-1.5 text-[11px] text-sev-err">
              <span className="font-medium">Circular pairs detected:</span>{' '}
              {CIRCULAR_PAIRS.map((p) => p.hint).join(' · ')}
            </div>
          )}
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="text-[10px] uppercase tracking-caps text-ink-3">Edge inspector</h4>
          {selectedEdge === null ? (
            <p className="mt-2 text-[11px] text-ink-3">
              Click an edge in the graph to see top importing files and a suggested boundary fix.
            </p>
          ) : (
            <div className="mt-2 space-y-2 text-[11px]">
              <div className="flex items-center gap-1">
                <Chip tone="muted" size="xs">
                  {selectedEdge.from}
                </Chip>
                <span className="text-ink-3">→</span>
                <Chip tone={isCircular(selectedEdge) ? 'err' : 'accent'} size="xs">
                  {selectedEdge.to}
                </Chip>
                <span className="ml-auto font-mono text-ink-3">{selectedEdge.count} imports</span>
              </div>
              {isCircular(selectedEdge) && (
                <Chip tone="err" size="xs">
                  CIRCULAR
                </Chip>
              )}
              <div>
                <div className="mb-1 text-ink-3">Top importing files</div>
                <ul className="space-y-0.5">
                  {selectedEdge.topImporters.slice(0, 5).map((f) => (
                    <li key={f} className="truncate font-mono text-ink-2">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-ink-3">Suggested fix</div>
                <div
                  className={cn(
                    'rounded-sm p-2',
                    isCircular(selectedEdge)
                      ? 'bg-sev-err-soft text-sev-err'
                      : 'bg-bg-subtle text-ink-2',
                  )}
                >
                  {selectedEdge.suggestedFix}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
