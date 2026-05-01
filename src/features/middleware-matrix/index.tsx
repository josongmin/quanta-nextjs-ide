import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel, ScrollArea, Tooltip } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { cn } from '@shared/lib/cn';
import {
  HEADER_PRESETS,
  MIDDLEWARE_CODE,
  MIDDLEWARE_MATCHER,
  ROUTES,
  actionLabel,
  actionTone,
  resolveMiddleware,
  type HeaderPreset,
  type MwRoute,
} from './helpers';

interface CellSelection {
  routeId: string;
  presetId: string;
}

export function MiddlewareMatrixOverlay() {
  const open = useUiStore((s) => s.overlays.middlewareMatrix.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [selection, setSelection] = useState<CellSelection | null>(null);

  const matrix = useMemo(() => {
    const out = new Map<string, Map<string, ReturnType<typeof resolveMiddleware>>>();
    for (const r of ROUTES) {
      const inner = new Map<string, ReturnType<typeof resolveMiddleware>>();
      for (const p of HEADER_PRESETS) {
        inner.set(p.id, resolveMiddleware(r, p));
      }
      out.set(r.id, inner);
    }
    return out;
  }, []);

  const selectedRoute = selection ? ROUTES.find((r) => r.id === selection.routeId) : undefined;
  const selectedPreset = selection
    ? HEADER_PRESETS.find((p) => p.id === selection.presetId)
    : undefined;
  const selectedRes =
    selection && selectedRoute && selectedPreset
      ? matrix.get(selectedRoute.id)?.get(selectedPreset.id)
      : undefined;

  // SVG dims
  const cellW = 130;
  const cellH = 32;
  const labelW = 200;
  const headerH = 60;
  const svgW = labelW + HEADER_PRESETS.length * cellW + 20;
  const svgH = headerH + ROUTES.length * cellH + 20;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('middlewareMatrix'))}
      title="Middleware matrix"
      subtitle={`${ROUTES.length} routes × ${HEADER_PRESETS.length} presets`}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Add header preset (mock)')}>
            Add header preset
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Run e2e through all combos (mock)')}>
            Run e2e
          </Button>
          <Button size="xs" tone="accent" onClick={() => toast('Exported as test (mock)')}>
            Export as test
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">matcher</span>
        <span className="font-mono text-[11px] text-ink-2">{MIDDLEWARE_MATCHER}</span>
        <span className="ml-auto text-ink-3">click any cell for execution path</span>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="block w-full" style={{ height: svgH }}>
              {/* preset headers */}
              {HEADER_PRESETS.map((p, i) => (
                <g key={p.id} transform={`translate(${labelW + i * cellW},0)`}>
                  <rect
                    x={2}
                    y={4}
                    width={cellW - 4}
                    height={headerH - 8}
                    rx={3}
                    className="fill-bg-subtle stroke-line"
                  />
                  <text
                    x={cellW / 2}
                    y={20}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-ink-1 font-medium"
                  >
                    {p.label}
                  </text>
                  <text
                    x={cellW / 2}
                    y={34}
                    textAnchor="middle"
                    fontSize={8}
                    className="fill-ink-3"
                  >
                    {p.cookies.length === 0
                      ? 'no cookies'
                      : p.cookies.map((c) => `${c.key}=${c.value}`).join(' ')}
                  </text>
                  <text
                    x={cellW / 2}
                    y={46}
                    textAnchor="middle"
                    fontSize={8}
                    className="fill-ink-3"
                  >
                    {p.description}
                  </text>
                </g>
              ))}

              {/* rows */}
              {ROUTES.map((r, ri) => {
                const y = headerH + ri * cellH;
                return (
                  <g key={r.id} transform={`translate(0,${y})`}>
                    <rect
                      x={0}
                      y={0}
                      width={labelW}
                      height={cellH}
                      className="fill-bg stroke-line/60"
                    />
                    <text
                      x={8}
                      y={cellH / 2 + 3}
                      fontSize={10}
                      className="fill-ink-1 font-mono"
                    >
                      {r.path}
                    </text>
                    <text
                      x={labelW - 6}
                      y={cellH / 2 + 3}
                      textAnchor="end"
                      fontSize={8}
                      className="fill-ink-3"
                    >
                      {r.type}
                    </text>
                    {HEADER_PRESETS.map((p, ci) => (
                      <Cell
                        key={p.id}
                        x={labelW + ci * cellW}
                        cellW={cellW}
                        cellH={cellH}
                        route={r}
                        preset={p}
                        result={matrix.get(r.id)?.get(p.id)}
                        active={
                          selection?.routeId === r.id && selection.presetId === p.id
                        }
                        onSelect={() =>
                          setSelection({ routeId: r.id, presetId: p.id })
                        }
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </ScrollArea>

        {/* Right rail */}
        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">Cell detail</div>
            {selectedRes && selectedRoute && selectedPreset ? (
              <div className="mt-2 space-y-3 text-xs">
                <div className="rounded-sm border border-line bg-bg p-2">
                  <div className="font-mono text-ink-1">
                    {selectedRoute.path} × {selectedPreset.label}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Chip tone={actionTone(selectedRes.action)} size="xs">
                      {actionLabel(selectedRes.action)}
                    </Chip>
                    <span className="text-ink-2">{selectedRes.detail}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-ink-3">
                    <span>status {selectedRes.status}</span>
                    <span>·</span>
                    <span>{selectedRes.durationMs}ms</span>
                    <span>·</span>
                    <span>{selectedRes.ruleId ?? 'no-rule'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Execution path
                  </div>
                  <ol className="mt-1 space-y-0.5 font-mono text-[10px]">
                    {selectedRes.ruleLineage.map((l, i) => (
                      <li key={i} className="text-ink-2">
                        {i + 1}. {l}
                      </li>
                    ))}
                  </ol>
                </div>
                {selectedRes.setCookies.length > 0 ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-caps text-ink-3">
                      Set-cookie headers
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {selectedRes.setCookies.map((c, i) => (
                        <li
                          key={i}
                          className="rounded-sm border border-line bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-1"
                        >
                          {c.key}={c.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div>
                  <div className="text-[10px] uppercase tracking-caps text-ink-3">
                    Middleware code
                  </div>
                  <div className="mt-1">
                    <CodeBlock code={MIDDLEWARE_CODE} language="ts" maxHeight={220} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Click any cell to see lineage.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

interface CellProps {
  x: number;
  cellW: number;
  cellH: number;
  route: MwRoute;
  preset: HeaderPreset;
  result: ReturnType<typeof resolveMiddleware> | undefined;
  active: boolean;
  onSelect(): void;
}

function Cell({ x, cellW, cellH, route, preset, result, active, onSelect }: CellProps) {
  if (!result) return null;
  const tone = actionTone(result.action);
  const fillCls =
    tone === 'static'
      ? 'fill-sem-static-soft'
      : tone === 'warn'
        ? 'fill-sev-warn-soft'
        : tone === 'err'
          ? 'fill-sev-err-soft'
          : tone === 'info'
            ? 'fill-sev-info-soft'
            : 'fill-accent-soft';
  const textCls =
    tone === 'static'
      ? 'fill-sem-static'
      : tone === 'warn'
        ? 'fill-sev-warn'
        : tone === 'err'
          ? 'fill-sev-err'
          : tone === 'info'
            ? 'fill-sev-info'
            : 'fill-accent';
  return (
    <Tooltip
      content={
        <div className="text-[11px]">
          <div className="font-mono text-ink-1">
            {route.path} × {preset.label}
          </div>
          <div className="mt-0.5 text-ink-2">
            {actionLabel(result.action)} · {result.detail}
          </div>
          <ol className="mt-1 max-w-[260px] space-y-0.5 text-[10px] text-ink-3">
            {result.ruleLineage.slice(-3).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </div>
      }
    >
      <g
        transform={`translate(${x},0)`}
        onClick={onSelect}
        className={cn('cursor-pointer', active && 'opacity-100')}
      >
        <rect
          x={2}
          y={2}
          width={cellW - 4}
          height={cellH - 4}
          rx={3}
          className={cn(fillCls, active ? 'stroke-accent' : 'stroke-line/60')}
          strokeWidth={active ? 1.5 : 0.75}
        />
        <text
          x={cellW / 2}
          y={cellH / 2 + 3}
          textAnchor="middle"
          fontSize={10}
          className={cn(textCls, 'font-mono font-medium')}
        >
          {actionLabel(result.action)}
        </text>
      </g>
    </Tooltip>
  );
}
