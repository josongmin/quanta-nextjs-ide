import { cn } from '@shared/lib/cn';
import { FLAGS } from '../helpers';

interface DependencyGraphProps {
  selectedId: string;
}

export function DependencyGraph({ selectedId }: DependencyGraphProps) {
  // hand-rolled SVG layout
  const W = 200;
  const ROW = 36;
  const H = FLAGS.length * ROW + 16;
  const yOf = (id: string) => {
    const idx = FLAGS.findIndex((f) => f.id === id);
    return 14 + idx * ROW;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 w-full"
      role="img"
      aria-label="Flag dependency graph"
    >
      <defs>
        <marker
          id="ffo-arrow"
          viewBox="0 0 6 6"
          refX="5"
          refY="3"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 z" className="fill-line-strong" />
        </marker>
      </defs>
      {FLAGS.map((f, i) =>
        f.dependencies.map((depId) => {
          const y1 = yOf(f.id) + 8;
          const y2 = yOf(depId) + 8;
          const isSel = selectedId === f.id || selectedId === depId;
          return (
            <path
              key={`${f.id}-${depId}-${i}`}
              d={`M 100 ${y1} C 150 ${y1}, 150 ${y2}, 100 ${y2}`}
              fill="none"
              className={cn(isSel ? 'stroke-accent' : 'stroke-line-strong')}
              strokeWidth={isSel ? 1.5 : 1}
              markerEnd="url(#ffo-arrow)"
            />
          );
        }),
      )}
      {FLAGS.map((f) => {
        const y = yOf(f.id);
        const isSel = selectedId === f.id;
        return (
          <g key={f.id}>
            <rect
              x={4}
              y={y}
              width={92}
              height={16}
              rx={2}
              className={cn(
                isSel
                  ? 'fill-accent-soft stroke-accent'
                  : 'fill-bg stroke-line',
              )}
              strokeWidth={1}
            />
            <text
              x={50}
              y={y + 11}
              textAnchor="middle"
              fontSize={9}
              className={cn(isSel ? 'fill-accent' : 'fill-ink-1')}
            >
              {f.key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
