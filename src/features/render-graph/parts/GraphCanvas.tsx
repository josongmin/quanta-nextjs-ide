import { IconBox } from '@shared/ui';
import { layoutGraph, type RenderGraph } from '../helpers';
import { NodeShape } from './NodeShape';

interface GraphCanvasProps {
  graph: RenderGraph | null;
  layout: ReturnType<typeof layoutGraph> | null;
  visible: Set<string>;
  selectedId: string | null;
  onSelect(id: string): void;
}

export function GraphCanvas({
  graph,
  layout,
  visible,
  selectedId,
  onSelect,
}: GraphCanvasProps) {
  if (!graph || !layout) {
    return (
      <div className="flex h-[420px] items-center justify-center text-xs text-ink-3">
        No route selected
      </div>
    );
  }

  const padX = 24;
  const padY = 18;
  const cx = layout.width / 2 + padX;
  const totalWidth = layout.width + padX * 2;
  const totalHeight = layout.height + padY * 2;

  const positions = new Map(layout.nodes.map((n) => [n.id, n]));

  return (
    <div className="min-w-0">
      <div className="max-h-[440px] overflow-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="block"
        >
          <g>
            {graph.edges.map((e) => {
              const a = positions.get(e.fromId);
              const b = positions.get(e.toId);
              if (!a || !b) return null;
              if (!visible.has(e.fromId) || !visible.has(e.toId)) return null;
              const x1 = cx + a.x;
              const y1 = padY + a.y + layout.nodeHeight;
              const x2 = cx + b.x;
              const y2 = padY + b.y;
              const midY = (y1 + y2) / 2;
              return (
                <path
                  key={`${e.fromId}->${e.toId}`}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="hsl(var(--border-strong))"
                  strokeWidth={1}
                />
              );
            })}
          </g>
          <g>
            {graph.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              return (
                <NodeShape
                  key={node.id}
                  node={node}
                  x={cx + pos.x - layout.nodeWidth / 2}
                  y={padY + pos.y}
                  width={layout.nodeWidth}
                  height={layout.nodeHeight}
                  selected={selectedId === node.id}
                  onSelect={onSelect}
                />
              );
            })}
          </g>
        </svg>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-2 hairline-t bg-bg-subtle">
        <span className="text-[10px] text-ink-3">
          Click a node to inspect. Hover hotspot dots to see re-render reason.
        </span>
        <div className="flex items-center gap-2 text-[10px] text-ink-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sev-warn" />
            hotspot
          </span>
          <span className="flex items-center gap-1">
            <IconBox letter="S" tone="server" /> server
          </span>
          <span className="flex items-center gap-1">
            <IconBox letter="C" tone="client" /> client
          </span>
        </div>
      </div>
    </div>
  );
}
