import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  containers,
  describePlacement,
  getContainer,
  type CellGeom,
  type ContainerKind,
} from './helpers';

const SVG_PAD = 16;

export function FlexGridDebuggerOverlay() {
  const open = useUiStore((s) => s.overlays.flexGridDebugger.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [kind, setKind] = useState<ContainerKind>('flex');
  const [showTracks, setShowTracks] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showGap, setShowGap] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const container = useMemo(() => getContainer(kind), [kind]);
  const selected: CellGeom | null = useMemo(() => {
    if (!selectedId) return container.cells[0] ?? null;
    return container.cells.find((c) => c.id === selectedId) ?? null;
  }, [selectedId, container]);

  const svgW = container.width + SVG_PAD * 2 + (showLineNumbers ? 24 : 0);
  const svgH = container.height + SVG_PAD * 2 + (showLineNumbers ? 24 : 0);
  const offsetX = SVG_PAD + (showLineNumbers ? 24 : 0);
  const offsetY = SVG_PAD + (showLineNumbers ? 24 : 0);

  const trackLineXs: number[] = [];
  for (let i = 0; i <= container.cols; i++) {
    const x =
      i === 0
        ? 0
        : i === container.cols
          ? container.width
          : i * (container.width / container.cols);
    trackLineXs.push(x);
  }
  const trackLineYs: number[] = [];
  for (let i = 0; i <= container.rows; i++) {
    const y =
      i === 0
        ? 0
        : i === container.rows
          ? container.height
          : i * (container.height / container.rows);
    trackLineYs.push(y);
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('flexGridDebugger'))}
      title="Flex / Grid debugger"
      subtitle="Visual layout inspector with track lines & line numbers"
      size="xl"
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Container</span>
        {containers.map((c) => (
          <ToggleChip
            key={c.id}
            active={kind === c.id}
            onClick={() => {
              setKind(c.id);
              setSelectedId(null);
            }}
          >
            {c.name}
          </ToggleChip>
        ))}
        <span className="mx-2 h-4 w-px bg-line" aria-hidden />
        <ToggleChip active={showTracks} onClick={() => setShowTracks((v) => !v)}>
          Track lines
        </ToggleChip>
        <ToggleChip
          active={showLineNumbers}
          onClick={() => setShowLineNumbers((v) => !v)}
        >
          Line numbers
        </ToggleChip>
        <ToggleChip active={showGap} onClick={() => setShowGap((v) => !v)}>
          Gap
        </ToggleChip>
        <span className="ml-auto text-[10px] text-ink-3">
          {container.cells.length} cells · gap {container.gap}px
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="overflow-auto p-4">
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="block"
            role="img"
            aria-label={`${container.name} visual`}
          >
            {/* outer frame */}
            <rect
              x={offsetX - 0.5}
              y={offsetY - 0.5}
              width={container.width + 1}
              height={container.height + 1}
              fill="transparent"
              stroke="rgb(0 0 0 / 0.08)"
              strokeWidth={1}
            />

            {/* gap fills */}
            {showGap &&
              container.cells.map((cell) => {
                const next = container.cells.find(
                  (c) =>
                    c.x === cell.x + cell.w + container.gap && c.y === cell.y,
                );
                if (!next) return null;
                return (
                  <rect
                    key={`gap-h-${cell.id}`}
                    x={offsetX + cell.x + cell.w}
                    y={offsetY + cell.y}
                    width={container.gap}
                    height={cell.h}
                    fill="rgb(99 102 241 / 0.08)"
                  />
                );
              })}

            {/* track lines */}
            {showTracks &&
              trackLineXs.map((x) => (
                <line
                  key={`tx-${x}`}
                  x1={offsetX + x}
                  y1={offsetY}
                  x2={offsetX + x}
                  y2={offsetY + container.height}
                  stroke="rgb(99 102 241 / 0.35)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ))}
            {showTracks &&
              trackLineYs.map((y) => (
                <line
                  key={`ty-${y}`}
                  x1={offsetX}
                  y1={offsetY + y}
                  x2={offsetX + container.width}
                  y2={offsetY + y}
                  stroke="rgb(99 102 241 / 0.35)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ))}

            {/* line numbers */}
            {showLineNumbers &&
              trackLineXs.map((x, i) => (
                <text
                  key={`lx-${i}`}
                  x={offsetX + x}
                  y={offsetY - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="rgb(99 102 241)"
                  fontFamily="ui-monospace, monospace"
                >
                  {i + 1}
                </text>
              ))}
            {showLineNumbers &&
              trackLineYs.map((y, i) => (
                <text
                  key={`ly-${i}`}
                  x={offsetX - 8}
                  y={offsetY + y + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill="rgb(99 102 241)"
                  fontFamily="ui-monospace, monospace"
                >
                  {i + 1}
                </text>
              ))}

            {/* cells */}
            {container.cells.map((cell, idx) => {
              const isHover = hovered === cell.id;
              const isSel = selected?.id === cell.id;
              return (
                <g key={cell.id}>
                  <rect
                    x={offsetX + cell.x}
                    y={offsetY + cell.y}
                    width={cell.w}
                    height={cell.h}
                    fill={
                      isSel
                        ? 'rgb(99 102 241 / 0.18)'
                        : isHover
                          ? 'rgb(99 102 241 / 0.10)'
                          : 'rgb(255 255 255)'
                    }
                    stroke={
                      isSel
                        ? 'rgb(99 102 241)'
                        : 'rgb(0 0 0 / 0.15)'
                    }
                    strokeWidth={isSel ? 1.5 : 1}
                    onMouseEnter={() => setHovered(cell.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelectedId(cell.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <text
                    x={offsetX + cell.x + cell.w / 2}
                    y={offsetY + cell.y + cell.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="ui-monospace, monospace"
                    fill="rgb(75 85 99)"
                    pointerEvents="none"
                  >
                    {idx + 1}
                  </text>
                  {isHover && (
                    <text
                      x={offsetX + cell.x + cell.w / 2}
                      y={offsetY + cell.y + cell.h / 2 + 18}
                      textAnchor="middle"
                      fontSize={9}
                      fontFamily="ui-monospace, monospace"
                      fill="rgb(99 102 241)"
                      pointerEvents="none"
                    >
                      {cell.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">Selected cell</div>
          {selected ? (
            <div className="mt-1.5 space-y-2">
              <div className="rounded-sm border border-line bg-bg p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-ink-1">{selected.id}</span>
                  <Chip tone="accent" size="xs">
                    {selected.w.toFixed(0)}×{selected.h.toFixed(0)}
                  </Chip>
                </div>
                <div className="mt-1 text-[11px] text-ink-2">
                  {describePlacement(selected)}
                </div>
                <div className="mt-1 font-mono text-[10px] text-ink-3">
                  area: {(selected.w * selected.h).toFixed(0)} px²
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  CSS cause
                </div>
                <CodeBlock
                  className="mt-1"
                  code={container.cssCause}
                  language="css"
                  showLineNumbers={false}
                  maxHeight={140}
                />
                <Button
                  size="xs"
                  tone="ghost"
                  className="mt-1"
                  onClick={() => toast('Copied CSS to clipboard')}
                >
                  Copy CSS
                </Button>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-caps text-ink-3">
                  Container
                </div>
                <ul className="mt-1 divide-y divide-line rounded-sm border border-line bg-bg">
                  {container.properties.map((p) => (
                    <li
                      key={p.key}
                      className={cn(
                        'flex items-center justify-between gap-2 px-2 py-1 text-[11px]',
                      )}
                    >
                      <span className="font-mono text-ink-3">{p.key}</span>
                      <span className="font-mono text-ink-1">{p.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-ink-3">No cell selected.</div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
