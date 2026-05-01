/**
 * Tiny SVG flame graph.
 *
 * x-axis = time, y-axis = depth. Each rect is a span; width = duration,
 * color = kind / status. Click a rect to select.
 */

import { cn } from '@shared/lib/cn';
import type { NormalizedSpan, TraceTree } from './types';

interface Props {
  tree: TraceTree;
  selectedSpanId: string | null;
  onSelect(id: string): void;
  width: number;
  height: number;
}

function fillFor(span: NormalizedSpan): string {
  if (span.status === 'error') return 'fill-sev-err/70';
  switch (span.kind) {
    case 'server':
      return 'fill-sev-info/60';
    case 'client':
      return 'fill-accent/60';
    case 'producer':
      return 'fill-sem-isr/60';
    case 'consumer':
      return 'fill-sem-edge/60';
    case 'internal':
      return 'fill-sem-server/40';
    default:
      return 'fill-ink-3/40';
  }
}

const ROW_H = 18;

export function Flame({ tree, selectedSpanId, onSelect, width, height }: Props) {
  const total = Math.max(1, tree.totalUs);
  const spans = Array.from(tree.spans.values());
  const maxDepth = spans.reduce((m, s) => (s.depth > m ? s.depth : m), 0);
  const innerH = (maxDepth + 1) * ROW_H;
  const scaleY = innerH > height ? height / innerH : 1;
  const rowH = ROW_H * scaleY;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-bg-subtle/30"
    >
      {spans.map((sp) => {
        const x = (sp.startUs / total) * width;
        const w = Math.max(1, (sp.durationUs / total) * width);
        const y = sp.depth * rowH;
        const isSelected = selectedSpanId === sp.spanId;
        return (
          <g key={sp.spanId}>
            <rect
              x={x}
              y={y}
              width={w}
              height={Math.max(2, rowH - 2)}
              className={cn(
                fillFor(sp),
                isSelected ? 'stroke-accent' : 'stroke-line/50',
                'cursor-pointer transition-opacity hover:opacity-80',
              )}
              strokeWidth={isSelected ? 1.5 : 0.5}
              onClick={() => onSelect(sp.spanId)}
            >
              <title>
                {sp.name}
                {'\n'}duration: {sp.durationUs.toFixed(0)}µs · self: {sp.selfUs.toFixed(0)}µs
                {sp.filepath ? `\n${sp.filepath}${sp.lineno ? `:${sp.lineno}` : ''}` : ''}
              </title>
            </rect>
            {w > 50 && rowH > 12 ? (
              <text
                x={x + 3}
                y={y + rowH / 2 + 3}
                className="pointer-events-none fill-ink-1 font-mono"
                fontSize={Math.max(8, Math.min(11, rowH - 6))}
              >
                {sp.name.length > 30 ? sp.name.slice(0, 28) + '…' : sp.name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
