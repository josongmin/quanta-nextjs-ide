import { useMemo } from 'react';
import {
  COLLISIONS,
  SEVERITY_FILL,
  SEVERITY_STROKE,
  collisionMatrix,
  type MockPR,
} from '../helpers';

interface CollisionMatrixProps {
  prs: ReadonlyArray<MockPR>;
  selectedPrs: ReadonlyArray<string>;
  onSelectCell: (prA: string, prB: string) => void;
  selectedCell: { prA: string; prB: string } | null;
}

export function CollisionMatrix({
  prs,
  selectedPrs,
  onSelectCell,
  selectedCell,
}: CollisionMatrixProps) {
  const ids = selectedPrs;
  const matrix = useMemo(() => collisionMatrix(ids, COLLISIONS), [ids]);

  const cell = 56;
  const labelW = 110;
  const labelH = 24;
  const size = ids.length;
  const w = labelW + cell * size + 8;
  const h = labelH + cell * size + 8;

  if (size === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-sm border border-dashed border-line text-xs text-ink-3">
        Select 2+ PRs to view the collision matrix.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
      {ids.map((id, j) => {
        const pr = prs.find((p) => p.id === id);
        return (
          <text
            key={`col-${id}`}
            x={labelW + cell * j + cell / 2}
            y={labelH - 8}
            textAnchor="middle"
            className="fill-ink-3 font-mono text-[10px]"
          >
            #{pr?.number ?? '?'}
          </text>
        );
      })}
      {ids.map((id, i) => {
        const pr = prs.find((p) => p.id === id);
        return (
          <text
            key={`row-${id}`}
            x={labelW - 6}
            y={labelH + cell * i + cell / 2 + 3}
            textAnchor="end"
            className="fill-ink-2 font-mono text-[10px]"
          >
            #{pr?.number ?? '?'} · {pr?.author ?? ''}
          </text>
        );
      })}
      {matrix.map((row, i) =>
        row.map((sev, j) => {
          const x = labelW + cell * j;
          const y = labelH + cell * i;
          const onDiag = i === j;
          const isSelected =
            !!selectedCell &&
            ((selectedCell.prA === ids[i] && selectedCell.prB === ids[j]) ||
              (selectedCell.prA === ids[j] && selectedCell.prB === ids[i]));
          return (
            <g
              key={`cell-${i}-${j}`}
              role="button"
              onClick={() => {
                if (onDiag) return;
                const a = ids[i];
                const b = ids[j];
                if (a && b) onSelectCell(a, b);
              }}
              style={{ cursor: onDiag ? 'default' : 'pointer' }}
            >
              <rect
                x={x + 1}
                y={y + 1}
                width={cell - 2}
                height={cell - 2}
                fill={onDiag ? '#ffffff' : SEVERITY_FILL[sev]}
                stroke={
                  isSelected ? '#2563eb' : onDiag ? '#e5e7eb' : SEVERITY_STROKE[sev]
                }
                strokeWidth={isSelected ? 2 : 1}
                rx={3}
              />
              {!onDiag ? (
                <text
                  x={x + cell / 2}
                  y={y + cell / 2 + 3}
                  textAnchor="middle"
                  className="fill-ink-2 font-mono text-[9px] uppercase tracking-caps"
                >
                  {sev === 'none' ? '·' : sev[0]}
                </text>
              ) : (
                <text
                  x={x + cell / 2}
                  y={y + cell / 2 + 3}
                  textAnchor="middle"
                  className="fill-ink-3 font-mono text-[9px]"
                >
                  —
                </text>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
