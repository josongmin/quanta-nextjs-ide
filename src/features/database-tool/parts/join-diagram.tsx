import { Fragment } from 'react';
import { type DbTable } from '../helpers';

interface JoinDiagramProps {
  a: DbTable;
  b: DbTable;
}

export function JoinDiagram({ a, b }: JoinDiagramProps): JSX.Element {
  const W = 520;
  const H = 220;
  const colHeight = 18;
  const headerH = 22;

  const aHeight = headerH + a.columns.length * colHeight + 4;
  const bHeight = headerH + b.columns.length * colHeight + 4;

  const aX = 16;
  const bX = W - 200 - 16;
  const cardW = 200;

  const aY = (H - aHeight) / 2;
  const bY = (H - bHeight) / 2;

  // Find FK relations
  interface Edge {
    aCol: string;
    bCol: string;
    aIdx: number;
    bIdx: number;
  }
  const edges: Edge[] = [];
  a.columns.forEach((c, i) => {
    if (c.fk?.table === b.name) {
      const bIdx = b.columns.findIndex((x) => x.name === c.fk!.column);
      if (bIdx >= 0) edges.push({ aCol: c.name, bCol: c.fk.column, aIdx: i, bIdx });
    }
  });
  b.columns.forEach((c, i) => {
    if (c.fk?.table === a.name) {
      const aIdx = a.columns.findIndex((x) => x.name === c.fk!.column);
      if (aIdx >= 0) edges.push({ aCol: c.fk.column, bCol: c.name, aIdx, bIdx: i });
    }
  });

  function colY(baseY: number, idx: number): number {
    return baseY + headerH + idx * colHeight + colHeight / 2;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      style={{ height: H }}
      role="img"
      aria-label="join diagram"
    >
      {/* table A */}
      <rect
        x={aX}
        y={aY}
        width={cardW}
        height={aHeight}
        rx={3}
        className="fill-bg stroke-line"
      />
      <rect
        x={aX}
        y={aY}
        width={cardW}
        height={headerH}
        className="fill-bg-subtle stroke-line"
      />
      <text
        x={aX + 8}
        y={aY + 14}
        fontSize={11}
        className="fill-ink-1 font-medium"
      >
        {a.name}
      </text>
      {a.columns.map((c, i) => (
        <Fragment key={c.name}>
          <text
            x={aX + 8}
            y={colY(aY, i) + 3}
            fontSize={10}
            className="fill-ink-2 font-mono"
          >
            {c.pk ? '🔑 ' : c.fk ? '↗ ' : ''}
            {c.name}
          </text>
          <text
            x={aX + cardW - 8}
            y={colY(aY, i) + 3}
            fontSize={9}
            textAnchor="end"
            className="fill-ink-3 font-mono"
          >
            {c.type}
          </text>
        </Fragment>
      ))}

      {/* table B */}
      <rect
        x={bX}
        y={bY}
        width={cardW}
        height={bHeight}
        rx={3}
        className="fill-bg stroke-line"
      />
      <rect
        x={bX}
        y={bY}
        width={cardW}
        height={headerH}
        className="fill-bg-subtle stroke-line"
      />
      <text
        x={bX + 8}
        y={bY + 14}
        fontSize={11}
        className="fill-ink-1 font-medium"
      >
        {b.name}
      </text>
      {b.columns.map((c, i) => (
        <Fragment key={c.name}>
          <text
            x={bX + 8}
            y={colY(bY, i) + 3}
            fontSize={10}
            className="fill-ink-2 font-mono"
          >
            {c.pk ? '🔑 ' : c.fk ? '↗ ' : ''}
            {c.name}
          </text>
          <text
            x={bX + cardW - 8}
            y={colY(bY, i) + 3}
            fontSize={9}
            textAnchor="end"
            className="fill-ink-3 font-mono"
          >
            {c.type}
          </text>
        </Fragment>
      ))}

      {/* edges */}
      {edges.map((e, i) => {
        const sx = aX + cardW;
        const sy = colY(aY, e.aIdx);
        const tx = bX;
        const ty = colY(bY, e.bIdx);
        const mx = (sx + tx) / 2;
        return (
          <path
            key={i}
            d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`}
            className="fill-none stroke-accent"
            strokeWidth={1.2}
          />
        );
      })}
      {edges.length === 0 ? (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          fontSize={11}
          className="fill-ink-3"
        >
          No FK relation between selected tables
        </text>
      ) : null}
    </svg>
  );
}
