import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import { frames, presets } from './helpers';

const FRAME_W = 180;
const FRAME_H = 130;

function FrameMockup({ pct, presetId }: { pct: number; presetId: string }) {
  // simple morphing svg between two states based on pct (0..100)
  const t = pct / 100;
  // shared box position morphs
  const startX = 20;
  const endX = FRAME_W - 80;
  const x = startX + (endX - startX) * t;
  const startW = 40;
  const endW = 60;
  const w = startW + (endW - startW) * t;

  if (presetId === 'page-fade') {
    return (
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
        <rect
          x={6}
          y={6}
          width={FRAME_W - 12}
          height={FRAME_H - 12}
          fill={`rgba(99, 102, 241, ${1 - t})`}
          stroke="rgb(0 0 0 / 0.1)"
        />
        <rect
          x={6}
          y={6}
          width={FRAME_W - 12}
          height={FRAME_H - 12}
          fill={`rgba(34, 197, 94, ${t})`}
          stroke="rgb(0 0 0 / 0.1)"
        />
        <text
          x={FRAME_W / 2}
          y={FRAME_H / 2 + 4}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          fill="white"
        >
          {t < 0.5 ? 'page A' : 'page B'}
        </text>
      </svg>
    );
  }

  if (presetId === 'cross-fade') {
    return (
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
        <rect
          x={6}
          y={6}
          width={FRAME_W - 12}
          height={20}
          fill={`rgba(99, 102, 241, ${1 - t})`}
        />
        <rect
          x={6}
          y={6}
          width={FRAME_W - 12}
          height={20}
          fill={`rgba(20, 184, 166, ${t})`}
        />
        <rect
          x={6}
          y={32}
          width={FRAME_W - 12}
          height={FRAME_H - 38}
          fill={`rgba(99, 102, 241, ${(1 - t) * 0.5})`}
        />
        <rect
          x={6}
          y={32}
          width={FRAME_W - 12}
          height={FRAME_H - 38}
          fill={`rgba(20, 184, 166, ${t * 0.5})`}
        />
      </svg>
    );
  }

  // shared-element-product
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
      <rect
        x={4}
        y={4}
        width={FRAME_W - 8}
        height={FRAME_H - 8}
        fill="rgb(248 250 252)"
        stroke="rgb(0 0 0 / 0.08)"
      />
      <rect
        x={x}
        y={20 + (1 - t) * 10}
        width={w}
        height={w * 0.75}
        fill="rgb(99 102 241)"
        stroke="rgb(79 70 229)"
      />
      <text
        x={FRAME_W / 2}
        y={FRAME_H - 12}
        textAnchor="middle"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
        fill="rgb(75 85 99)"
      >
        product · {Math.round(pct)}%
      </text>
    </svg>
  );
}

export function ViewTransitionsOverlay() {
  const open = useUiStore((s) => s.overlays.viewTransitions.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [presetId, setPresetId] = useState<string>(presets[0]?.id ?? '');
  const [scrub, setScrub] = useState<number>(50);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  const preset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? presets[0],
    [presetId],
  );

  if (!preset) return null;

  const closestFrame = frames.reduce<number>((acc, f) => {
    const cur = frames[acc];
    if (!cur) return acc;
    return Math.abs(f.pct - scrub) < Math.abs(cur.pct - scrub)
      ? frames.indexOf(f)
      : acc;
  }, 0);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('viewTransitions'))}
      title="View Transitions"
      subtitle="::view-transition-old / ::view-transition-new"
      size="lg"
      footer={
        <>
          <ToggleChip
            active={reduceMotion}
            onClick={() => {
              setReduceMotion((v) => !v);
              toast(`prefers-reduced-motion → ${!reduceMotion ? 'on' : 'off'} (mock)`);
            }}
          >
            Reduce motion preview
          </ToggleChip>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Replay (mock)')}
          >
            Replay
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">Preset</span>
        {presets.map((p) => (
          <ToggleChip
            key={p.id}
            active={preset.id === p.id}
            onClick={() => setPresetId(p.id)}
          >
            {p.name}
          </ToggleChip>
        ))}
        <span className="ml-auto text-[10px] text-ink-3">
          {preset.duration}ms · {preset.easing}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Filmstrip
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {frames.map((f, i) => (
              <div
                key={f.pct}
                className={cn(
                  'rounded-sm border bg-bg p-1',
                  i === closestFrame
                    ? 'border-accent/40 ring-1 ring-accent/30'
                    : 'border-line',
                )}
              >
                <FrameMockup pct={f.pct} presetId={preset.id} />
                <div className="mt-1 text-center font-mono text-[10px] text-ink-3">
                  {f.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">
            Scrubber
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast('Play (mock)')}
            >
              Play
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => setScrub(0)}
            >
              Reset
            </Button>
            <input
              type="range"
              min={0}
              max={100}
              value={scrub}
              onChange={(e) => setScrub(Number(e.target.value))}
              className="h-2 flex-1 accent-accent"
            />
            <span className="w-10 text-right font-mono text-[11px] text-ink-1">
              {scrub}%
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {preset.pairs.map((p) => (
              <Chip key={p.name} tone="info" size="xs">
                {p.name}: {p.oldSel} → {p.newSel}
              </Chip>
            ))}
          </div>
        </div>

        <aside className="overflow-y-auto p-3">
          <div className="text-[10px] uppercase tracking-caps text-ink-3">
            Generated CSS
          </div>
          <CodeBlock
            className="mt-1.5"
            code={preset.css}
            language="css"
            showLineNumbers={false}
            maxHeight={300}
          />
          <div className="mt-3 text-[10px] uppercase tracking-caps text-ink-3">
            Stages
          </div>
          <ul className="mt-1 space-y-1 text-[11px]">
            <li className="rounded-sm border border-line bg-bg px-2 py-1">
              <span className="font-mono text-ink-3">start</span> — capture
              snapshot, pseudo-elements created
            </li>
            <li className="rounded-sm border border-line bg-bg px-2 py-1">
              <span className="font-mono text-ink-3">animate</span> — old fades
              out, new fades in {reduceMotion ? '(skipped)' : ''}
            </li>
            <li className="rounded-sm border border-line bg-bg px-2 py-1">
              <span className="font-mono text-ink-3">end</span> — pseudo-elements
              removed, callback resolved
            </li>
          </ul>
        </aside>
      </div>
    </OverlayPanel>
  );
}
