import { useMemo, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  formatEvent,
  gestures,
  targetSizeLabel,
  targetTone,
  tapTargets,
  type GestureKind,
  type TargetTone,
} from './helpers';

interface RecordedPoint {
  x: number;
  y: number;
  t: number;
}

export function TouchSimulatorOverlay() {
  const open = useUiStore((s) => s.overlays.touchSimulator.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [active, setActive] = useState<GestureKind>('tap');
  const [showAudit, setShowAudit] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<RecordedPoint[]>([]);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(
    null,
  );
  const startTimeRef = useRef<number>(0);

  const gesture = useMemo(
    () => gestures.find((g) => g.id === active) ?? gestures[0]!,
    [active],
  );

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCrosshair({ x, y });
    if (recording) {
      const t = Math.round(performance.now() - startTimeRef.current);
      setRecorded((prev) => [...prev, { x, y, t }]);
    }
  }

  function toggleRecord() {
    if (recording) {
      setRecording(false);
      toast('Gesture recorded', {
        description: `${recorded.length} samples captured`,
      });
    } else {
      setRecorded([]);
      startTimeRef.current = performance.now();
      setRecording(true);
      toast('Recording started', {
        description: 'Move the cursor inside the canvas',
      });
    }
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('touchSimulator'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Hash className="h-4 w-4 text-ink-3" />
          <span>Touch Simulator</span>
        </span>
      }
      subtitle="gesture playground · tap target audit"
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('touchSimulator')}>
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="min-w-0 px-3 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-caps text-ink-3">gesture</span>
            {gestures.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActive(g.id)}
                className={cn(
                  'inline-flex h-5 items-center rounded-sm border border-line bg-bg px-1.5 text-[11px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1',
                  active === g.id &&
                    'bg-bg-selected text-ink-1 border-line-strong',
                )}
              >
                {g.label}
              </button>
            ))}
            <span className="ml-2">
              <ToggleChip
                active={showAudit}
                onClick={() => setShowAudit((v) => !v)}
              >
                Tap target audit
              </ToggleChip>
            </span>
            <span className="ml-auto">
              <Button size="xs" tone="soft" onClick={toggleRecord}>
                <Icon.Circle className="h-3 w-3" />
                {recording ? 'Stop' : 'Record gesture'}
              </Button>
            </span>
          </div>

          <div className="mb-2 text-xs text-ink-3">{gesture.description}</div>

          <Canvas
            gesture={gesture}
            recorded={recorded}
            crosshair={crosshair}
            onMove={onMove}
            showAudit={showAudit}
          />

          <div className="mt-3">
            <div className="mb-1 text-caps text-ink-3">event log</div>
            <div className="rounded-sm border border-line bg-bg-subtle/40 p-2 font-mono text-[11px] leading-[16px] text-ink-1">
              {gesture.events.map((e, idx) => (
                <div key={idx} className="whitespace-pre">
                  {formatEvent(e)}
                </div>
              ))}
              {recorded.length > 0 ? (
                <div className="mt-1 hairline-t pt-1 text-ink-3">
                  recorded path · {recorded.length} samples ·{' '}
                  {recorded.length > 0
                    ? `${recorded[recorded.length - 1]!.t}ms`
                    : '0ms'}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showAudit ? (
          <aside className="min-w-0 px-3 py-3">
            <h3 className="mb-1 text-caps text-ink-3">Tap target audit</h3>
            <p className="mb-2 text-[11px] text-ink-3">
              WCAG 2.5.5 AAA: ≥44×44px. Apple HIG: 44pt. Material: 48dp.
            </p>
            <ul className="space-y-1">
              {tapTargets.map((t) => {
                const tone = targetTone(t);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-sm border border-line bg-bg px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs text-ink-1">
                        {t.label}
                      </div>
                      <div className="truncate font-mono text-[10px] text-ink-3">
                        {t.selector}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Chip tone={toneToChip(tone)} size="xs">
                        {targetSizeLabel(t)}
                      </Chip>
                      <button
                        type="button"
                        onClick={() =>
                          toast('Fix queued', {
                            description: `${t.selector} → grow to 44×44`,
                          })
                        }
                        className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[10px] tracking-caps text-ink-2 hover:bg-bg-hover hover:text-ink-1"
                      >
                        Fix
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : (
          <aside className="min-w-0 px-3 py-3 text-xs text-ink-3">
            Audit hidden.
          </aside>
        )}
      </div>
    </OverlayPanel>
  );
}

function toneToChip(t: TargetTone): 'static' | 'warn' | 'err' {
  return match(t)
    .with('static', () => 'static' as const)
    .with('warn', () => 'warn' as const)
    .with('err', () => 'err' as const)
    .exhaustive();
}

function Canvas({
  gesture,
  recorded,
  crosshair,
  onMove,
  showAudit,
}: {
  gesture: { events: readonly { x: number; y: number }[] };
  recorded: readonly RecordedPoint[];
  crosshair: { x: number; y: number } | null;
  onMove(e: React.MouseEvent<SVGSVGElement>): void;
  showAudit: boolean;
}) {
  const path = gesture.events
    .map((e, i) => `${i === 0 ? 'M' : 'L'} ${e.x} ${e.y}`)
    .join(' ');
  const recordedPath = recorded
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg
      width={640}
      height={360}
      viewBox="0 0 640 360"
      onMouseMove={onMove}
      onMouseLeave={() => undefined}
      className="block rounded-sm border border-line bg-bg-subtle"
      role="img"
      aria-label="Touch simulator canvas"
    >
      {/* Mock app frame */}
      <rect x={0} y={0} width={640} height={48} className="fill-white" />
      <line
        x1={0}
        y1={48}
        x2={640}
        y2={48}
        className="stroke-line"
        strokeWidth={1}
      />
      <text x={12} y={30} className="fill-ink-2" fontSize={12} fontFamily="ui-sans-serif">
        ACME · Mobile Header
      </text>
      <rect x={220} y={130} width={200} height={48} rx={6} className="fill-accent-soft stroke-accent" strokeWidth={1} />
      <text x={320} y={159} textAnchor="middle" className="fill-accent" fontSize={13} fontFamily="ui-sans-serif">
        Shop now
      </text>
      <rect x={40} y={220} width={170} height={100} rx={4} className="fill-white stroke-line" strokeWidth={1} />
      <rect x={235} y={220} width={170} height={100} rx={4} className="fill-white stroke-line" strokeWidth={1} />
      <rect x={430} y={220} width={170} height={100} rx={4} className="fill-white stroke-line" strokeWidth={1} />

      {/* Tap target audit overlays */}
      {showAudit
        ? tapTargets.map((t) => {
            const tone = targetTone(t);
            const stroke =
              tone === 'static'
                ? '#16a34a'
                : tone === 'warn'
                  ? '#d97706'
                  : '#dc2626';
            return (
              <rect
                key={t.id}
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                fill="none"
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })
        : null}

      {/* Gesture template path */}
      {path ? (
        <path
          d={path}
          fill="none"
          className="stroke-accent"
          strokeWidth={2}
          strokeDasharray="2 4"
        />
      ) : null}
      {gesture.events.map((e, i) => (
        <circle
          key={i}
          cx={e.x}
          cy={e.y}
          r={i === 0 ? 6 : 3}
          className="fill-accent"
          opacity={0.7}
        />
      ))}

      {/* Recorded path */}
      {recordedPath ? (
        <path
          d={recordedPath}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1.5}
        />
      ) : null}

      {/* Crosshair */}
      {crosshair ? (
        <g>
          <line
            x1={crosshair.x}
            y1={0}
            x2={crosshair.x}
            y2={360}
            stroke="#0ea5e9"
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
          <line
            x1={0}
            y1={crosshair.y}
            x2={640}
            y2={crosshair.y}
            stroke="#0ea5e9"
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
          <circle
            cx={crosshair.x}
            cy={crosshair.y}
            r={4}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth={1}
          />
          <text
            x={crosshair.x + 8}
            y={crosshair.y - 6}
            fontSize={10}
            fontFamily="ui-monospace"
            fill="#0ea5e9"
          >
            {crosshair.x},{crosshair.y}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
