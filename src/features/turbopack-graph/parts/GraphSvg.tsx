import { cn } from '@shared/lib/cn';
import {
  EDGES,
  GRAPH_H,
  GRAPH_W,
  MODULES,
  kindColor,
  moduleById,
  radiusFor,
  type BundlerSnapshot,
} from '../helpers';

interface GraphSvgProps {
  snap: BundlerSnapshot;
  reach: ReadonlySet<string>;
  visibleIds: ReadonlySet<string>;
  selectedId: string;
  onSelect(id: string): void;
}

export function GraphSvg({ snap, reach, visibleIds, selectedId, onSelect }: GraphSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      className="w-full"
      role="img"
      aria-label="Module dependency graph"
    >
      <defs>
        <marker
          id="tg-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 z" className="fill-ink-3" />
        </marker>
        <marker
          id="tg-arrow-hi"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 z" className="fill-accent" />
        </marker>
      </defs>

      {EDGES.map((e, i) => {
        const a = moduleById(e.from);
        const b = moduleById(e.to);
        const inReach = reach.has(e.from) && reach.has(e.to);
        const visible = visibleIds.has(a.id) && visibleIds.has(b.id);
        if (!visible) return null;
        return (
          <line
            key={`e-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={cn(inReach ? 'stroke-accent' : 'stroke-ink-3')}
            strokeOpacity={inReach ? 0.7 : 0.18}
            strokeWidth={inReach ? 1.4 : 0.9}
            markerEnd={inReach ? 'url(#tg-arrow-hi)' : 'url(#tg-arrow)'}
          />
        );
      })}

      {MODULES.map((m) => {
        const visible = visibleIds.has(m.id);
        const r = radiusFor(snap.sizes[m.id] ?? m.sizeKB);
        const inReach = reach.has(m.id);
        const isSelected = m.id === selectedId;
        const dimmed = !visible || (!inReach && reach.size > 1);
        return (
          <g
            key={m.id}
            className="cursor-pointer"
            opacity={dimmed ? 0.18 : 1}
            onClick={() => onSelect(m.id)}
          >
            {m.hmrBoundary ? (
              <circle
                cx={m.x}
                cy={m.y}
                r={r + 3}
                className="fill-none stroke-sev-warn"
                strokeOpacity={0.6}
                strokeDasharray="2 2"
              />
            ) : null}
            <circle
              cx={m.x}
              cy={m.y}
              r={r}
              className={cn(kindColor(m.kind), isSelected && 'stroke-accent')}
              strokeWidth={isSelected ? 2.2 : 1}
            />
            {m.entryPoint ? (
              <circle cx={m.x} cy={m.y} r={2} className="fill-accent" />
            ) : null}
            <text
              x={m.x}
              y={m.y + r + 9}
              textAnchor="middle"
              fontSize={9}
              className={cn(
                'pointer-events-none font-mono',
                isSelected ? 'fill-ink-1' : 'fill-ink-3',
              )}
            >
              {m.name.split('/').slice(-1)[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
