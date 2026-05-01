import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import type { BundleNode, BundleSide } from '@shared/types';
import { cn } from '@shared/lib/cn';
import { Tooltip } from '@shared/ui';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlacedTile extends Rect {
  node: BundleNode;
}

// -----------------------------------------------------------------------------
// Squarified treemap algorithm (Bruls et al, 2000).
// At depth 0 (no zoom) we layout the *direct children* of `root` for the chosen
// side filter, flattening one chunk-level. When the user drills down we layout
// the children of the focused node directly.
// -----------------------------------------------------------------------------

function pickTilesAtRoot(root: BundleNode, side: BundleSide): BundleNode[] {
  // Find the side group at depth 1.
  const sideGroup = root.children?.find((c) => c.side === side);
  if (!sideGroup) return [];
  // Inline the immediate children of each chunk so the treemap shows packages
  // directly rather than two big "node_modules" / "app/*" tiles.
  const tiles: BundleNode[] = [];
  for (const child of sideGroup.children ?? []) {
    if (child.kind === 'chunk' && child.children?.length) {
      tiles.push(...child.children);
    } else {
      tiles.push(child);
    }
  }
  return tiles.filter((n) => n.size > 0).sort((a, b) => b.size - a.size);
}

function pickTilesForFocus(focus: BundleNode): BundleNode[] {
  const children = focus.children ?? [];
  return children.filter((n) => n.size > 0).sort((a, b) => b.size - a.size);
}

interface SquarifyArgs {
  nodes: BundleNode[];
  width: number;
  height: number;
}

function squarify({ nodes, width, height }: SquarifyArgs): PlacedTile[] {
  const total = nodes.reduce((acc, n) => acc + n.size, 0);
  if (total === 0 || nodes.length === 0) return [];

  const area = width * height;
  // Scale every node to occupy the equivalent area.
  const scaled = nodes.map((n) => ({ node: n, area: (n.size / total) * area }));

  const result: PlacedTile[] = [];
  let rect: Rect = { x: 0, y: 0, w: width, h: height };
  let row: typeof scaled = [];
  let i = 0;

  const shortSide = (r: Rect): number => Math.min(r.w, r.h);

  // Worst aspect ratio of a row of tiles laid out along the short side.
  const worst = (r: typeof scaled, length: number): number => {
    if (r.length === 0) return Infinity;
    const sum = r.reduce((acc, t) => acc + t.area, 0);
    const max = r.reduce((acc, t) => Math.max(acc, t.area), 0);
    const min = r.reduce((acc, t) => Math.min(acc, t.area), Infinity);
    const length2 = length * length;
    const sum2 = sum * sum;
    return Math.max((length2 * max) / sum2, sum2 / (length2 * min));
  };

  const layoutRow = (
    row: typeof scaled,
    rect: Rect,
  ): { placed: PlacedTile[]; nextRect: Rect } => {
    const placed: PlacedTile[] = [];
    if (row.length === 0) return { placed, nextRect: rect };
    const sum = row.reduce((acc, t) => acc + t.area, 0);
    const horizontal = rect.w >= rect.h;
    if (horizontal) {
      // Row stacks vertically along the shorter side (height), runs in width.
      const w = sum / rect.h;
      let y = rect.y;
      for (const t of row) {
        const h = t.area / w;
        placed.push({ node: t.node, x: rect.x, y, w, h });
        y += h;
      }
      return {
        placed,
        nextRect: { x: rect.x + w, y: rect.y, w: rect.w - w, h: rect.h },
      };
    }
    const h = sum / rect.w;
    let x = rect.x;
    for (const t of row) {
      const w = t.area / h;
      placed.push({ node: t.node, x, y: rect.y, w, h });
      x += w;
    }
    return {
      placed,
      nextRect: { x: rect.x, y: rect.y + h, w: rect.w, h: rect.h - h },
    };
  };

  while (i < scaled.length) {
    const next = scaled[i];
    if (!next) break;
    const candidate = [...row, next];
    const side = shortSide(rect);
    const w0 = worst(row, side);
    const w1 = worst(candidate, side);
    if (row.length === 0 || w1 <= w0) {
      row = candidate;
      i += 1;
    } else {
      const { placed, nextRect } = layoutRow(row, rect);
      result.push(...placed);
      rect = nextRect;
      row = [];
    }
  }
  if (row.length > 0) {
    const { placed } = layoutRow(row, rect);
    result.push(...placed);
  }
  return result;
}

// -----------------------------------------------------------------------------
// Coloring: hash by node name into a small palette of muted ink shades.
// Selected tile uses accent-soft.
// -----------------------------------------------------------------------------

const PALETTE = [
  'fill-bg-subtle',
  'fill-bg-hover',
  'fill-bg-selected',
  'fill-bg-active',
  'fill-bg',
];

const TEXT_PALETTE = ['fill-ink-1', 'fill-ink-2'];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function fillFor(node: BundleNode, selected: boolean): string {
  if (selected) return 'fill-accent-soft';
  const idx = hashName(node.name) % PALETTE.length;
  return PALETTE[idx] ?? PALETTE[0]!;
}

function kindLabel(kind: BundleNode['kind']): string {
  return match(kind)
    .with('package', () => 'package')
    .with('module', () => 'module')
    .with('chunk', () => 'chunk')
    .with('shared', () => 'shared')
    .with('monorepo', () => 'group')
    .exhaustive();
}

// -----------------------------------------------------------------------------
// Public component
// -----------------------------------------------------------------------------

interface BundleTreemapProps {
  data: BundleNode;
  selected: string | null;
  onSelect(node: BundleNode): void;
  side: BundleSide;
  unit: 'gzip' | 'raw';
  width?: number;
  height?: number;
  className?: string;
  /** Optional callback fired when zoom path changes. */
  onZoom?(path: BundleNode[]): void;
}

function formatSize(bytes: number, unit: 'gzip' | 'raw'): string {
  // For "raw" we approximate ungzipped as ~3x; this is a mock so the multiplier
  // is documented only here.
  const factor = unit === 'raw' ? 3 : 1;
  const value = bytes * factor;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

export function BundleTreemap({
  data,
  selected,
  onSelect,
  side,
  unit,
  width = 640,
  height = 320,
  className,
  onZoom,
}: BundleTreemapProps) {
  // path is the zoom stack. Empty path = root view (uses pickTilesAtRoot).
  // Each entry is the BundleNode the user drilled into.
  const [path, setPath] = useState<BundleNode[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom when side changes — different bundle entirely.
  useEffect(() => {
    setPath([]);
  }, [side, data]);

  const focus = path[path.length - 1];

  const tiles = useMemo(() => {
    const nodes = focus
      ? pickTilesForFocus(focus)
      : pickTilesAtRoot(data, side);
    return squarify({ nodes, width, height });
  }, [data, side, width, height, focus]);

  const drillInto = useCallback(
    (node: BundleNode) => {
      if (!node.children || node.children.length === 0) return;
      setPath((prev) => {
        const next = [...prev, node];
        onZoom?.(next);
        return next;
      });
    },
    [onZoom],
  );

  const popTo = useCallback(
    (depth: number) => {
      // depth = -1 means "root", otherwise truncate to `depth + 1` entries.
      setPath((prev) => {
        const next = depth < 0 ? [] : prev.slice(0, depth + 1);
        onZoom?.(next);
        return next;
      });
    },
    [onZoom],
  );

  const popOne = useCallback(() => {
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      onZoom?.(next);
      return next;
    });
  }, [onZoom]);

  // Keyboard: Esc / Backspace pop one level. Only when our container has focus
  // or contains the active element to avoid stealing global keys.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (path.length === 0) return;
      if (e.key !== 'Escape' && e.key !== 'Backspace') return;
      const root = containerRef.current;
      if (!root) return;
      const active = document.activeElement;
      if (active && (active === root || root.contains(active))) {
        e.preventDefault();
        popOne();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [path.length, popOne]);

  const breadcrumbItems = useMemo(() => {
    const rootLabel = focus
      ? side
      : side; // always show side label as "root"
    return [
      { id: '__root__', label: rootLabel, depth: -1 },
      ...path.map((n, idx) => ({ id: n.id, label: n.name, depth: idx })),
    ];
  }, [path, focus, side]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        'hairline rounded-sm bg-bg outline-none focus-visible:ring-1 focus-visible:ring-accent',
        className,
      )}
      aria-label="Bundle treemap"
    >
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between gap-2 hairline-b px-2 py-1.5 text-[11px]">
        <nav
          aria-label="Treemap zoom path"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden font-mono"
        >
          {breadcrumbItems.map((item, i) => {
            const isLast = i === breadcrumbItems.length - 1;
            return (
              <span key={item.id} className="flex items-center gap-1">
                {i > 0 ? (
                  <span className="text-ink-3" aria-hidden>
                    ›
                  </span>
                ) : null}
                {isLast ? (
                  <span className="truncate text-ink-1">{item.label}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => popTo(item.depth)}
                    className="truncate rounded-sm px-1 py-0 text-ink-2 hover:bg-bg-hover hover:text-ink-1"
                  >
                    {item.label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          {path.length > 0 ? (
            <button
              type="button"
              onClick={popOne}
              className="rounded-sm border border-line bg-bg px-1.5 py-0 text-[10px] uppercase tracking-caps text-ink-2 hover:bg-bg-hover"
              aria-label="Zoom out one level"
              title="Zoom out (Esc)"
            >
              Up
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => popTo(-1)}
            className="rounded-sm border border-line bg-bg px-1.5 py-0 text-[10px] uppercase tracking-caps text-ink-2 hover:bg-bg-hover disabled:opacity-40"
            disabled={path.length === 0}
            aria-label="Reset treemap zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {tiles.length === 0 ? (
        <div
          className="flex items-center justify-center text-xs text-ink-3"
          style={{ width, height }}
        >
          {focus
            ? `${focus.name} has no children to drill into.`
            : `No tiles for ${side}.`}
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Bundle treemap (${side}${focus ? ' / ' + focus.name : ''})`}
          className="block"
        >
          {tiles.map((t) => {
            const isSelected = selected === t.node.id;
            const textIdx = hashName(t.node.name) % TEXT_PALETTE.length;
            const showLabel = t.w > 60 && t.h > 24;
            const childCount = t.node.children?.length ?? 0;
            const drillable = childCount > 0;
            const label = t.node.name.length > 18
              ? `${t.node.name.slice(0, 18)}…`
              : t.node.name;
            return (
              <Tooltip
                key={t.node.id}
                content={
                  <div className="space-y-0.5 text-xs">
                    <div className="font-medium text-ink-1">{t.node.name}</div>
                    <div className="text-ink-3">
                      {kindLabel(t.node.kind)}
                      {' · '}
                      {formatSize(t.node.size, unit)}
                      {' · '}
                      {t.node.side}
                    </div>
                    {childCount > 0 ? (
                      <div className="text-ink-3">
                        {childCount} child
                        {childCount === 1 ? '' : 'ren'}
                        {' · click to zoom'}
                      </div>
                    ) : null}
                    {t.node.routes && t.node.routes.length > 0 ? (
                      <div className="text-ink-3">
                        affects {t.node.routes.length} route
                        {t.node.routes.length === 1 ? '' : 's'}
                      </div>
                    ) : null}
                  </div>
                }
              >
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    if (drillable) {
                      // Drillable: clicking zooms in (and updates selection
                      // so heaviest-list / inspector reflect the zoomed node).
                      onSelect(t.node);
                      drillInto(t.node);
                    } else {
                      onSelect(t.node);
                    }
                  }}
                  role="button"
                  aria-label={
                    drillable
                      ? `Zoom into ${t.node.name}`
                      : `Select ${t.node.name}`
                  }
                >
                  <rect
                    x={t.x}
                    y={t.y}
                    width={Math.max(0, t.w)}
                    height={Math.max(0, t.h)}
                    className={cn(
                      fillFor(t.node, isSelected),
                      'stroke-line transition-colors hover:fill-bg-hover',
                      isSelected && 'stroke-accent',
                    )}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                  />
                  {showLabel ? (
                    <>
                      <text
                        x={t.x + 6}
                        y={t.y + 14}
                        className={cn(
                          'pointer-events-none font-mono text-[10px]',
                          TEXT_PALETTE[textIdx],
                        )}
                      >
                        {label}
                        {drillable ? (
                          <tspan className="fill-ink-3"> ›</tspan>
                        ) : null}
                      </text>
                      {t.h > 36 ? (
                        <text
                          x={t.x + 6}
                          y={t.y + 26}
                          className="pointer-events-none fill-ink-3 font-mono text-[9px]"
                        >
                          {formatSize(t.node.size, unit)}
                          {drillable ? ` · ${childCount}` : ''}
                        </text>
                      ) : null}
                    </>
                  ) : null}
                </g>
              </Tooltip>
            );
          })}
        </svg>
      )}
    </div>
  );
}
