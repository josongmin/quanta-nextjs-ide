import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { animations, easings, toCss } from './helpers';

const TIMELINE_W = 620;
const TIMELINE_H = 80;
const CURVE_W = 200;
const CURVE_H = 200;

export function AnimationTimelineOverlay() {
  const open = useUiStore((s) => s.overlays.animationTimeline.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [animId, setAnimId] = useState<string>(animations[0]?.id ?? '');
  const [duration, setDuration] = useState<number>(
    animations[0]?.duration ?? 400,
  );
  const [easingId, setEasingId] = useState<string>('ease-out');
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  // mock-drag: per-stop overridden pct
  const [overridePct, setOverridePct] = useState<Record<string, number>>({});

  const anim = useMemo(
    () => animations.find((a) => a.id === animId) ?? animations[0],
    [animId],
  );
  const easing = useMemo(
    () => easings.find((e) => e.id === easingId) ?? easings[0],
    [easingId],
  );

  if (!anim || !easing) return null;

  const stopPct = (id: string, pct: number): number =>
    overridePct[id] ?? pct;

  const cubicPath = (() => {
    const [x1, y1, x2, y2] = easing.cubic;
    const sx = 0;
    const sy = CURVE_H;
    const ex = CURVE_W;
    const ey = 0;
    const cp1x = x1 * CURVE_W;
    const cp1y = CURVE_H - y1 * CURVE_H;
    const cp2x = x2 * CURVE_W;
    const cp2y = CURVE_H - y2 * CURVE_H;
    return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
  })();

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('animationTimeline'))}
      title="Animation timeline"
      subtitle="@keyframes editor + easing curve playground"
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Play (mock)')}>
            Play (mock)
          </Button>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => {
              setOverridePct({});
              toast('Reset keyframes');
            }}
          >
            Reset
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast('Exported CSS to clipboard')}
          >
            Export CSS
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Animation</span>
        {animations.map((a) => (
          <ToggleChip
            key={a.id}
            active={anim.id === a.id}
            onClick={() => {
              setAnimId(a.id);
              setDuration(a.duration);
              setOverridePct({});
              setSelectedStop(null);
            }}
          >
            {a.name}
          </ToggleChip>
        ))}
        <span className="ml-auto inline-flex items-center gap-2">
          <label className="inline-flex items-center gap-1 text-[11px] text-ink-2">
            duration
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-6 w-16 rounded-sm border border-line bg-bg px-1 font-mono text-[11px] text-ink-1 focus:outline-none"
              min={50}
              max={5000}
            />
            <span className="text-ink-3">ms</span>
          </label>
          <SelectControl
            value={easingId}
            options={easings.map((e) => ({ value: e.id, label: e.label }))}
            onChange={(v) => setEasingId(v)}
            label="easing"
          />
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Keyframe timeline
          </div>
          <svg
            width={TIMELINE_W + 16}
            height={TIMELINE_H}
            viewBox={`0 0 ${TIMELINE_W + 16} ${TIMELINE_H}`}
            className="mt-2 block"
            role="img"
            aria-label="keyframe timeline"
          >
            <line
              x1={8}
              y1={40}
              x2={8 + TIMELINE_W}
              y2={40}
              stroke="rgb(0 0 0 / 0.15)"
            />
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1={8 + (tick / 100) * TIMELINE_W}
                  y1={36}
                  x2={8 + (tick / 100) * TIMELINE_W}
                  y2={44}
                  stroke="rgb(0 0 0 / 0.2)"
                />
                <text
                  x={8 + (tick / 100) * TIMELINE_W}
                  y={60}
                  textAnchor="middle"
                  fontSize={9}
                  fill="rgb(75 85 99)"
                  fontFamily="ui-monospace, monospace"
                >
                  {tick}%
                </text>
              </g>
            ))}
            {anim.stops.map((s) => {
              const p = stopPct(s.id, s.pct);
              const isSel = selectedStop === s.id;
              return (
                <g key={s.id}>
                  <circle
                    cx={8 + (p / 100) * TIMELINE_W}
                    cy={40}
                    r={isSel ? 7 : 5}
                    fill={isSel ? 'rgb(99 102 241)' : 'white'}
                    stroke="rgb(99 102 241)"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedStop(s.id)}
                  />
                  <text
                    x={8 + (p / 100) * TIMELINE_W}
                    y={28}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgb(99 102 241)"
                    fontFamily="ui-monospace, monospace"
                  >
                    {Math.round(p)}%
                  </text>
                </g>
              );
            })}
          </svg>

          {selectedStop && (
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-caps text-ink-3">
                drag {selectedStop}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={stopPct(
                  selectedStop,
                  anim.stops.find((s) => s.id === selectedStop)?.pct ?? 0,
                )}
                onChange={(e) =>
                  setOverridePct((m) => ({
                    ...m,
                    [selectedStop]: Number(e.target.value),
                  }))
                }
                className="h-2 w-48 accent-accent"
              />
            </div>
          )}

          <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">
            Easing curve playground
          </div>
          <svg
            width={CURVE_W + 24}
            height={CURVE_H + 24}
            viewBox={`0 0 ${CURVE_W + 24} ${CURVE_H + 24}`}
            className="mt-2 block"
            role="img"
            aria-label="cubic bezier curve"
          >
            <rect
              x={12}
              y={12}
              width={CURVE_W}
              height={CURVE_H}
              fill="rgb(248 250 252)"
              stroke="rgb(0 0 0 / 0.1)"
            />
            {/* axis grid */}
            {[0.25, 0.5, 0.75].map((t) => (
              <g key={t}>
                <line
                  x1={12 + t * CURVE_W}
                  y1={12}
                  x2={12 + t * CURVE_W}
                  y2={12 + CURVE_H}
                  stroke="rgb(0 0 0 / 0.05)"
                />
                <line
                  x1={12}
                  y1={12 + t * CURVE_H}
                  x2={12 + CURVE_W}
                  y2={12 + t * CURVE_H}
                  stroke="rgb(0 0 0 / 0.05)"
                />
              </g>
            ))}
            <g transform="translate(12, 12)">
              <path
                d={cubicPath}
                fill="none"
                stroke="rgb(99 102 241)"
                strokeWidth={2}
              />
              {/* control points */}
              <circle
                cx={easing.cubic[0] * CURVE_W}
                cy={CURVE_H - easing.cubic[1] * CURVE_H}
                r={4}
                fill="rgb(99 102 241)"
              />
              <circle
                cx={easing.cubic[2] * CURVE_W}
                cy={CURVE_H - easing.cubic[3] * CURVE_H}
                r={4}
                fill="rgb(99 102 241)"
              />
              <line
                x1={0}
                y1={CURVE_H}
                x2={easing.cubic[0] * CURVE_W}
                y2={CURVE_H - easing.cubic[1] * CURVE_H}
                stroke="rgb(99 102 241 / 0.4)"
                strokeDasharray="3 3"
              />
              <line
                x1={CURVE_W}
                y1={0}
                x2={easing.cubic[2] * CURVE_W}
                y2={CURVE_H - easing.cubic[3] * CURVE_H}
                stroke="rgb(99 102 241 / 0.4)"
                strokeDasharray="3 3"
              />
            </g>
            <text
              x={12 + CURVE_W / 2}
              y={12 + CURVE_H + 18}
              textAnchor="middle"
              fontSize={10}
              fill="rgb(75 85 99)"
              fontFamily="ui-monospace, monospace"
            >
              cubic-bezier({easing.cubic.join(', ')})
            </text>
          </svg>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            All keyframes
          </div>
          <div className="mt-1 overflow-hidden rounded-sm border border-line">
            <table className="w-full text-[11px]">
              <thead className="bg-bg-subtle text-ink-3">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">stop</th>
                  <th className="px-2 py-1 text-left font-medium">prop</th>
                  <th className="px-2 py-1 text-left font-medium">value</th>
                </tr>
              </thead>
              <tbody>
                {anim.stops.flatMap((s) =>
                  s.props.map((p, i) => (
                    <tr
                      key={`${s.id}-${i}`}
                      className={cn(
                        'border-t border-line',
                        selectedStop === s.id && 'bg-accent-soft',
                      )}
                    >
                      {i === 0 ? (
                        <td
                          className="px-2 py-1 align-top font-mono"
                          rowSpan={s.props.length}
                        >
                          <Chip tone="muted" size="xs">
                            {Math.round(stopPct(s.id, s.pct))}%
                          </Chip>
                        </td>
                      ) : null}
                      <td className="px-2 py-1 font-mono text-ink-3">{p.name}</td>
                      <td className="px-2 py-1">
                        <input
                          defaultValue={p.value}
                          className="w-full bg-transparent font-mono text-[11px] text-ink-1 focus:outline-none"
                        />
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            Generated CSS
          </div>
          <pre className="mt-1 max-h-40 overflow-auto rounded-sm border border-line bg-bg p-2 font-mono text-[11px] text-ink-1">
            {toCss({ ...anim, duration, easing: easing.label })}
          </pre>
        </aside>
      </div>
    </OverlayPanel>
  );
}
