import { cn } from '@shared/lib/cn';
import type { FlameFrame } from '../helpers';
import { ROW_H, SVG_W, kindFill, kindStroke } from './styles';

interface FlameSvgProps {
  focusedSubtree: ReadonlyArray<{
    frame: FlameFrame;
    x: number;
    w: number;
    depth: number;
  }>;
  focusedTotal: number;
  svgH: number;
  selectedId: string;
  matches: Set<string>;
  onPick: (id: string) => void;
  onZoom: (id: string) => void;
}

export function FlameSvg({
  focusedSubtree,
  focusedTotal,
  svgH,
  selectedId,
  matches,
  onPick,
  onZoom,
}: FlameSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      preserveAspectRatio="none"
      className="block h-auto w-full"
      style={{ height: svgH * 1.6 }}
    >
      {focusedSubtree.map(({ frame, x, w, depth }) => {
        const px = (SVG_W * x) / focusedTotal;
        const pw = Math.max(0.5, (SVG_W * w) / focusedTotal);
        const py = svgH - (depth + 1) * ROW_H - 4;
        const isSel = selectedId === frame.id;
        const dim = matches.size > 0 && !matches.has(frame.id);
        return (
          <g
            key={frame.id}
            onClick={(e) => {
              e.stopPropagation();
              onPick(frame.id);
            }}
            onDoubleClick={() => onZoom(frame.id)}
            className="cursor-pointer"
          >
            <title>
              {frame.name} · {frame.totalMs.toFixed(1)}ms (self{' '}
              {frame.selfMs.toFixed(1)}ms)
            </title>
            <rect
              x={px}
              y={py}
              width={pw}
              height={ROW_H - 2}
              rx={1.5}
              className={cn(
                kindFill(frame.kind, dim),
                kindStroke(frame.kind, dim),
              )}
              strokeWidth={isSel ? 1.5 : 0.5}
            />
            {pw > 32 ? (
              <text
                x={px + 3}
                y={py + ROW_H - 7}
                fontSize={9}
                className={cn(
                  'pointer-events-none',
                  dim ? 'fill-ink-3' : 'fill-ink-1',
                )}
              >
                {frame.name.length * 5.5 < pw
                  ? frame.name
                  : `${frame.name.slice(
                      0,
                      Math.max(1, Math.floor(pw / 5.5) - 1),
                    )}…`}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
