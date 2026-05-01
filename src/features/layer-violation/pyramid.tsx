/**
 * Layer pyramid SVG — renders three stacked, semi-transparent trapezoids
 * (one per layer) with red dashed arrows for violations.
 *
 * The pyramid is purely a visualization aid: hover/click handlers are
 * left to the parent so the same SVG can be embedded in other surfaces
 * (e.g. AI panel, PR summary).
 */

import { useMemo } from 'react';
import type { LayerDefinition, LayerKind, Violation } from './types';
import { LAYER_ORDER } from './config';

interface PyramidProps {
  layers: ReadonlyArray<LayerDefinition>;
  violations: ReadonlyArray<Violation>;
  highlight?: LayerKind | null;
  onHover?(layer: LayerKind | null): void;
}

const W = 520;
const H = 280;
const TOP = 16;
const BOTTOM = H - 24;
const TOP_HALF = 80;
const BOTTOM_HALF = 230;
const ROW_H = (BOTTOM - TOP) / 3;

const TONE_FILL: Record<LayerDefinition['tone'], string> = {
  accent: 'rgba(99, 102, 241, 0.18)',
  info: 'rgba(56, 189, 248, 0.18)',
  warn: 'rgba(244, 114, 22, 0.18)',
  static: 'rgba(148, 163, 184, 0.18)',
};
const TONE_STROKE: Record<LayerDefinition['tone'], string> = {
  accent: 'rgba(99, 102, 241, 0.55)',
  info: 'rgba(56, 189, 248, 0.55)',
  warn: 'rgba(244, 114, 22, 0.55)',
  static: 'rgba(148, 163, 184, 0.55)',
};

function trapezoid(rank: number): { points: string; centerY: number; width: number } {
  // rank 0 at top (narrow), rank 2 at bottom (wide).
  const yTop = TOP + rank * ROW_H;
  const yBot = yTop + ROW_H - 6;
  const ratioTop = rank / 3;
  const ratioBot = (rank + 1) / 3;
  const halfTop = TOP_HALF + (BOTTOM_HALF - TOP_HALF) * ratioTop;
  const halfBot = TOP_HALF + (BOTTOM_HALF - TOP_HALF) * ratioBot;
  const cx = W / 2;
  return {
    points: [
      `${cx - halfTop},${yTop}`,
      `${cx + halfTop},${yTop}`,
      `${cx + halfBot},${yBot}`,
      `${cx - halfBot},${yBot}`,
    ].join(' '),
    centerY: (yTop + yBot) / 2,
    width: (halfTop + halfBot) / 2,
  };
}

export function LayerPyramid({ layers, violations, highlight, onHover }: PyramidProps) {
  const ordered = useMemo(
    () => LAYER_ORDER.map((id) => layers.find((l) => l.id === id)).filter((x): x is LayerDefinition => Boolean(x)),
    [layers],
  );

  // De-duplicate arrows by (from-layer, to-layer, kind) — one stroke per pair.
  const arrows = useMemo(() => {
    const seen = new Map<string, { from: LayerKind; to: LayerKind; kind: Violation['kind']; count: number }>();
    for (const v of violations) {
      const key = `${v.fromLayer}->${v.toLayer}:${v.kind}`;
      const slot = seen.get(key);
      if (slot) slot.count++;
      else seen.set(key, { from: v.fromLayer, to: v.toLayer, kind: v.kind, count: 1 });
    }
    return [...seen.values()];
  }, [violations]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label="Layer pyramid with violations"
      className="block"
    >
      <defs>
        <marker
          id="lv-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="rgb(239, 68, 68)" />
        </marker>
      </defs>

      {ordered.map((layer, idx) => {
        const tz = trapezoid(idx);
        const dim = highlight && highlight !== layer.id;
        return (
          <g
            key={layer.id}
            onMouseEnter={() => onHover?.(layer.id)}
            onMouseLeave={() => onHover?.(null)}
            style={{ cursor: onHover ? 'pointer' : 'default' }}
          >
            <polygon
              points={tz.points}
              fill={TONE_FILL[layer.tone]}
              stroke={TONE_STROKE[layer.tone]}
              strokeWidth={1.5}
              opacity={dim ? 0.35 : 1}
            />
            <text
              x={W / 2}
              y={tz.centerY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fill="rgb(226, 232, 240)"
            >
              {layer.label}
            </text>
          </g>
        );
      })}

      {arrows.map((a) => {
        const fromIdx = LAYER_ORDER.indexOf(a.from);
        const toIdx = LAYER_ORDER.indexOf(a.to);
        if (fromIdx < 0 || toIdx < 0) return null;
        const fromTz = trapezoid(fromIdx);
        const toTz = trapezoid(toIdx);
        // Bow the arrow to the right side of the pyramid for visibility.
        const cx = W / 2 + 60;
        const x1 = cx;
        const y1 = fromTz.centerY;
        const x2 = cx;
        const y2 = toTz.centerY;
        const cpx = cx + 90;
        const cpy = (y1 + y2) / 2;
        const stroke = a.kind === 'reverse' ? 'rgb(220, 38, 38)' : 'rgb(239, 68, 68)';
        return (
          <g key={`${a.from}-${a.to}-${a.kind}`}>
            <path
              d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
              stroke={stroke}
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              markerEnd="url(#lv-arrow)"
            />
            <text
              x={cpx + 6}
              y={cpy}
              fontSize={11}
              fill="rgb(248, 113, 113)"
              fontWeight={600}
            >
              {a.count}× {a.kind}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
