import { match } from 'ts-pattern';
import { Tooltip } from '@shared/ui';
import { truncateName, type GraphNode } from '../helpers';

interface NodeShapeProps {
  node: GraphNode;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  onSelect(id: string): void;
}

export function NodeShape({
  node,
  x,
  y,
  width,
  height,
  selected,
  onSelect,
}: NodeShapeProps) {
  const fill = match(true)
    .when(() => Boolean(node.isRoot), () => 'hsl(var(--accent-soft))')
    .when(() => node.role === 'client', () => 'hsl(var(--bg-selected))')
    .otherwise(() => 'hsl(var(--bg))');
  const stroke = selected ? 'hsl(var(--accent))' : 'hsl(var(--border-strong))';

  return (
    <g
      onClick={() => onSelect(node.id)}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={selected ? 1.5 : 1}
      />
      <text
        x={x + 10}
        y={y + height / 2 + 4}
        fontSize={11}
        fontFamily="ui-sans-serif, system-ui"
        fill="hsl(var(--text))"
      >
        {truncateName(node.name, 14)}
      </text>
      <g transform={`translate(${x + width - 22} ${y + 6})`}>
        <rect
          width={16}
          height={14}
          rx={2}
          fill="hsl(var(--bg))"
          stroke={
            node.role === 'client'
              ? 'hsl(var(--sem-client) / 0.4)'
              : 'hsl(var(--sem-server) / 0.4)'
          }
        />
        <text
          x={8}
          y={10.5}
          fontSize={9}
          fontWeight={700}
          textAnchor="middle"
          fill={
            node.role === 'client'
              ? 'hsl(var(--sem-client))'
              : 'hsl(var(--sem-server))'
          }
        >
          {node.role === 'client' ? 'C' : 'S'}
        </text>
      </g>
      {node.hotspot ? (
        <Tooltip
          content={
            <div className="text-[11px]">
              Re-renders {node.hotspot.rerenders}× on prop change
              <div className="mt-0.5 text-[10px] text-ink-3">
                {node.hotspot.reason}
              </div>
            </div>
          }
        >
          <circle
            cx={x + 8}
            cy={y + 8}
            r={3}
            fill="hsl(var(--warn))"
            stroke="hsl(var(--bg))"
            strokeWidth={1}
          />
        </Tooltip>
      ) : null}
    </g>
  );
}
