import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@shared/lib/cn';
import {
  NODE_H,
  NODE_W,
  PLAN_NODES,
  kindFill,
  kindLabelClass,
} from '../helpers';

const VIEW_W = 1200 - 300; // overlay 1200 wide, right rail 300
const VIEW_H = 360;

interface CanvasSvgProps {
  selectedId: string;
  onSelectNode: (id: string) => void;
}

export function CanvasSvg({
  selectedId,
  onSelectNode,
}: CanvasSvgProps): JSX.Element {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (
      (e.target as Element).tagName === 'svg' ||
      ((e.target as Element).tagName === 'rect' &&
        (e.target as Element).getAttribute('data-bg') === 'true')
    ) {
      setDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  }
  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    setPan({
      x: dragStart.panX + (e.clientX - dragStart.x),
      y: dragStart.panY + (e.clientY - dragStart.y),
    });
  }
  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    if (dragging) {
      setDragging(false);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <svg
        role="img"
        aria-label="Plan node graph"
        width="100%"
        height={VIEW_H}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          'block bg-bg-subtle/40 select-none',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
      >
        <defs>
          <marker
            id="arrow-end"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-line-strong" />
          </marker>
          <pattern
            id="grid-dots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" className="fill-line/60" />
          </pattern>
        </defs>
        <rect
          x={-2000}
          y={-2000}
          width={5000}
          height={5000}
          fill="url(#grid-dots)"
          data-bg="true"
        />
        <g transform={`translate(${pan.x}, ${pan.y})`}>
          {/* edges */}
          {PLAN_NODES.flatMap((n) =>
            n.depsIds.map((depId) => {
              const from = PLAN_NODES.find((x) => x.id === depId);
              if (!from) return null;
              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = n.x;
              const y2 = n.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 4} ${y2}`;
              return (
                <path
                  key={`${depId}->${n.id}`}
                  d={d}
                  className="fill-none stroke-line-strong"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-end)"
                />
              );
            }),
          )}
          {/* nodes */}
          {PLAN_NODES.map((n) => {
            const isSel = n.id === selectedId;
            return (
              <g
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(n.id);
                }}
                className="cursor-pointer"
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  ry={6}
                  className={cn(kindFill(n.kind))}
                  strokeWidth={isSel ? 2 : 1}
                />
                {isSel && (
                  <rect
                    x={n.x - 3}
                    y={n.y - 3}
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    rx={8}
                    ry={8}
                    className="fill-none stroke-ink-1"
                    strokeDasharray="3 2"
                    strokeWidth={1}
                  />
                )}
                <text
                  x={n.x + 8}
                  y={n.y + 18}
                  className={cn(
                    'text-[10px] uppercase tracking-caps',
                    kindLabelClass(n.kind),
                  )}
                  style={{ fontFamily: 'inherit' }}
                >
                  {n.kind}
                </text>
                <text
                  x={n.x + NODE_W - 8}
                  y={n.y + 18}
                  textAnchor="end"
                  className="fill-ink-3 text-[10px]"
                  style={{ fontFamily: 'inherit' }}
                >
                  {n.etaMin}m
                </text>
                <text
                  x={n.x + 8}
                  y={n.y + 38}
                  className="fill-ink-1 text-[12px] font-medium"
                  style={{ fontFamily: 'inherit' }}
                >
                  {n.title.length > 22
                    ? n.title.slice(0, 21) + '…'
                    : n.title}
                </text>
                <text
                  x={n.x + 8}
                  y={n.y + 54}
                  className={cn(
                    'text-[10px]',
                    n.status === 'blocked'
                      ? 'fill-sev-err'
                      : n.status === 'done'
                        ? 'fill-sev-info'
                        : n.status === 'doing'
                          ? 'fill-accent'
                          : 'fill-ink-3',
                  )}
                  style={{ fontFamily: 'inherit' }}
                >
                  {n.status}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
