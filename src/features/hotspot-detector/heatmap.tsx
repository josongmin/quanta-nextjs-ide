/**
 * Squarified-treemap layout, vanilla SVG (no extra deps).
 *
 * Rectangle area = LOC, fill = heat band. We do a simplified squarify
 * that lays out one strip at a time greedily — perfect for ~50–500 files,
 * which is the size class the IDE deals with.
 */

import { useMemo } from 'react';
import { cn } from '@shared/lib/cn';
import { heatBand, type HeatedFile } from './score';

interface Props {
  items: ReadonlyArray<HeatedFile>;
  width: number;
  height: number;
  selected: string | null;
  onSelect(file: string): void;
}

interface Tile {
  file: string;
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
}

const MIN_VALUE = 6;

function squarify(
  items: ReadonlyArray<HeatedFile>,
  width: number,
  height: number,
): Tile[] {
  if (items.length === 0 || width <= 0 || height <= 0) return [];
  const total = items.reduce(
    (s, it) => s + Math.max(it.raw.loc, MIN_VALUE),
    0,
  );
  if (total <= 0) return [];

  const area = width * height;
  const scale = area / total;
  const sorted = [...items].sort(
    (a, b) =>
      Math.max(b.raw.loc, MIN_VALUE) - Math.max(a.raw.loc, MIN_VALUE),
  );

  const tiles: Tile[] = [];
  // Place tiles in horizontal strips. Each strip's height is computed so
  // that the worst aspect ratio of its tiles is minimized. We use a small
  // greedy: keep adding tiles to the current strip while the worst ratio
  // improves, otherwise commit the strip and start a new one.
  let x = 0;
  let y = 0;
  let stripWidth = width;
  let stripHeight = height;

  let i = 0;
  while (i < sorted.length) {
    // Decide strip orientation: fill the shorter side first.
    const horizontal = stripWidth >= stripHeight;
    const strip: HeatedFile[] = [];
    let stripSum = 0;
    let bestWorst = Infinity;

    const worstRatio = (sum: number, smallest: number, largest: number, side: number) => {
      const stripSide = (sum * scale) / side;
      const minRatio = Math.max(
        (side * stripSide) / Math.max(largest * scale, 1e-9),
        Math.max(largest * scale, 1e-9) / (side * stripSide),
      );
      const maxRatio = Math.max(
        (side * stripSide) / Math.max(smallest * scale, 1e-9),
        Math.max(smallest * scale, 1e-9) / (side * stripSide),
      );
      return Math.max(minRatio, maxRatio);
    };

    while (i + strip.length < sorted.length) {
      const cand = sorted[i + strip.length]!;
      const v = Math.max(cand.raw.loc, MIN_VALUE);
      const trySum = stripSum + v;
      const trySmallest = strip.length === 0
        ? v
        : Math.min(v, ...strip.map((it) => Math.max(it.raw.loc, MIN_VALUE)));
      const tryLargest = strip.length === 0
        ? v
        : Math.max(v, ...strip.map((it) => Math.max(it.raw.loc, MIN_VALUE)));
      const side = horizontal ? stripWidth : stripHeight;
      const ratio = worstRatio(trySum, trySmallest, tryLargest, side);
      if (ratio < bestWorst || strip.length === 0) {
        bestWorst = ratio;
        strip.push(cand);
        stripSum = trySum;
      } else {
        break;
      }
    }

    // Commit the strip.
    if (horizontal) {
      const stripH = (stripSum * scale) / stripWidth;
      let cx = x;
      for (const it of strip) {
        const v = Math.max(it.raw.loc, MIN_VALUE);
        const w = (v * scale) / stripH;
        tiles.push({ file: it.file, x: cx, y, w, h: stripH, score: it.score });
        cx += w;
      }
      y += stripH;
      stripHeight -= stripH;
    } else {
      const stripW = (stripSum * scale) / stripHeight;
      let cy = y;
      for (const it of strip) {
        const v = Math.max(it.raw.loc, MIN_VALUE);
        const h = (v * scale) / stripW;
        tiles.push({ file: it.file, x, y: cy, w: stripW, h, score: it.score });
        cy += h;
      }
      x += stripW;
      stripWidth -= stripW;
    }
    i += strip.length;
  }
  return tiles;
}

const BAND_FILL: Record<ReturnType<typeof heatBand>, string> = {
  cool: 'fill-sem-static-soft',
  warm: 'fill-sev-info-soft',
  hot: 'fill-sev-warn-soft',
  fire: 'fill-sev-err-soft',
};

const BAND_STROKE: Record<ReturnType<typeof heatBand>, string> = {
  cool: 'stroke-sem-static/40',
  warm: 'stroke-sev-info/50',
  hot: 'stroke-sev-warn/60',
  fire: 'stroke-sev-err/70',
};

const shortName = (file: string): string => {
  const parts = file.split('/');
  return parts[parts.length - 1] ?? file;
};

export function Heatmap({ items, width, height, selected, onSelect }: Props) {
  const tiles = useMemo(() => squarify(items, width, height), [items, width, height]);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-bg-subtle/30"
    >
      {tiles.map((t) => {
        const band = heatBand(t.score);
        const isSelected = selected === t.file;
        return (
          <g key={t.file}>
            <rect
              x={t.x + 0.5}
              y={t.y + 0.5}
              width={Math.max(0, t.w - 1)}
              height={Math.max(0, t.h - 1)}
              className={cn(
                BAND_FILL[band],
                BAND_STROKE[band],
                isSelected && 'stroke-accent',
                'cursor-pointer transition-opacity hover:opacity-80',
              )}
              strokeWidth={isSelected ? 2 : 1}
              onClick={() => onSelect(t.file)}
            >
              <title>
                {t.file}
                {'\n'}heat: {(t.score * 100).toFixed(0)}%
              </title>
            </rect>
            {t.w > 60 && t.h > 18 ? (
              <text
                x={t.x + 4}
                y={t.y + 12}
                className="pointer-events-none fill-ink-1 font-mono"
                fontSize={t.w > 100 ? 11 : 9}
              >
                {shortName(t.file)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
