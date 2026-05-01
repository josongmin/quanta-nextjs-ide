import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, CodeBlock, Icon, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  actions,
  diffLines,
  formatDelta,
  formatStateJson,
  kindTone,
  snapshots,
  SPEEDS,
  type StateActionKind,
} from './helpers';

const KIND_LABEL: Record<StateActionKind, string> = {
  mutation: 'MUT',
  navigation: 'NAV',
  query: 'QRY',
  session: 'SES',
  cache: 'CCH',
  effect: 'EFF',
};

export function TimeTravelOverlay() {
  const open = useUiStore((s) => s.overlays.timeTravel.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selectedIndex, setSelectedIndex] = useState<number>(snapshots.length - 1);
  const [newestFirst, setNewestFirst] = useState<boolean>(true);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedIndex(snapshots.length - 1);
      setPlaying(false);
    }
  }, [open]);

  // Play/pause loop — advances index at chosen speed.
  useEffect(() => {
    if (!playing) {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }
    const interval = Math.max(60, 600 / speed);
    timer.current = setInterval(() => {
      setSelectedIndex((i) => {
        if (i >= snapshots.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, interval);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [playing, speed]);

  const orderedActions = useMemo(
    () =>
      newestFirst ? [...actions].slice().reverse() : actions.slice(),
    [newestFirst],
  );

  const current = snapshots[selectedIndex];
  const prev = selectedIndex > 0 ? snapshots[selectedIndex - 1] : null;

  const prevJson = prev ? formatStateJson(prev.state) : '// (initial)';
  const curJson = current ? formatStateJson(current.state) : '';
  const diff = current ? diffLines(prev?.state ?? null, current.state) : [];

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('timeTravel'))}
      title="Time Travel"
      subtitle="state snapshots · rewind · replay"
      size="lg"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {actions.length} actions captured · {((actions[actions.length - 1]?.at ?? 0) - (actions[0]?.at ?? 0)) / 1000}s session
          </span>
          <Button
            size="xs"
            tone="ghost"
            onClick={() => toast('Trace exported (mock)')}
          >
            Export trace
          </Button>
          <Button
            size="xs"
            tone="default"
            onClick={() => toast(`Replaying from ${current?.cause.label}`)}
          >
            Replay from here
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[260px_1fr_300px]">
        {/* Left — action log */}
        <aside className="hairline-r">
          <div className="flex h-8 items-center justify-between gap-2 hairline-b bg-bg-subtle px-2">
            <span className="text-caps text-ink-3">Actions</span>
            <button
              type="button"
              onClick={() => setNewestFirst((v) => !v)}
              className="inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:text-ink-1"
            >
              {newestFirst ? <Icon.Down className="h-2.5 w-2.5" /> : <Icon.Up className="h-2.5 w-2.5" />}
              {newestFirst ? 'newest' : 'oldest'}
            </button>
          </div>
          <ul className="max-h-[460px] overflow-y-auto py-1">
            {orderedActions.map((a) => {
              const idx = actions.findIndex((x) => x.id === a.id);
              const active = idx === selectedIndex;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] hover:bg-bg-hover',
                      active && 'bg-accent-soft/60',
                    )}
                  >
                    <span className="w-12 shrink-0 font-mono text-[10px] text-ink-3">
                      {formatDelta(a.at)}
                    </span>
                    <Chip tone={kindTone(a.kind)} size="xs">
                      {KIND_LABEL[a.kind]}
                    </Chip>
                    <span className="truncate text-ink-1">{a.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Center — scrubber + diff */}
        <section className="min-w-0">
          <div className="flex h-8 items-center gap-2 hairline-b bg-bg-subtle px-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-1 hover:bg-bg-hover"
            >
              {playing ? '❚❚' : '▶'} {playing ? 'pause' : 'play'}
            </button>
            <div className="flex items-center gap-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSpeed(s.value)}
                  className={cn(
                    'h-5 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:text-ink-1',
                    speed === s.value && 'bg-bg-selected text-ink-1 border-line-strong',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedIndex(0)}
              className="inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:text-ink-1"
            >
              <Icon.Up className="h-2.5 w-2.5 rotate-90" />
              start
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex(snapshots.length - 1)}
              className="inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2 hover:text-ink-1"
            >
              end
              <Icon.Down className="h-2.5 w-2.5 rotate-90" />
            </button>
            <span className="ml-auto font-mono text-[11px] text-ink-2">
              {selectedIndex + 1} / {snapshots.length}
            </span>
          </div>

          <div className="px-3 py-3">
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full accent-current text-accent"
            />
            <div className="mt-1 flex justify-between text-[10px] text-ink-3">
              <span>{formatDelta(snapshots[0]?.at ?? 0)}</span>
              <span>{formatDelta(snapshots[snapshots.length - 1]?.at ?? 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-3 pb-3">
            <div>
              <div className="text-caps mb-1 text-ink-3">state @ N-1</div>
              <CodeBlock code={prevJson} maxHeight={200} showLineNumbers={false} />
            </div>
            <div>
              <div className="text-caps mb-1 text-ink-3">state @ N</div>
              <CodeBlock code={curJson} maxHeight={200} showLineNumbers={false} />
            </div>
            <div>
              <div className="text-caps mb-1 text-ink-3">diff</div>
              <div className="rounded-sm border border-line bg-bg-subtle px-2 py-1.5 font-mono text-[11px] text-ink-1">
                {diff.length === 0 ? (
                  <span className="text-ink-3">no change</span>
                ) : (
                  <ul className="space-y-0.5">
                    {diff.map((d, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-accent">~</span>
                        <span className="break-all">{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right — selected detail */}
        <aside className="hairline-l bg-bg-subtle/30">
          {current ? (
            <div className="space-y-3 p-3">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <Chip tone={kindTone(current.cause.kind)} size="xs">
                    {KIND_LABEL[current.cause.kind]}
                  </Chip>
                  <span className="font-mono text-[10px] text-ink-3">
                    {formatDelta(current.at)}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-ink-3">
                    {current.cause.durationMs}ms
                  </span>
                </div>
                <div className="text-sm font-medium text-ink-1">
                  {current.cause.label}
                </div>
              </div>
              {current.cause.payload ? (
                <div>
                  <div className="text-caps mb-1 text-ink-3">payload</div>
                  <CodeBlock
                    code={current.cause.payload}
                    showLineNumbers={false}
                    maxHeight={120}
                  />
                </div>
              ) : null}
              {current.cause.statePatch ? (
                <div>
                  <div className="text-caps mb-1 text-ink-3">state patch</div>
                  <CodeBlock
                    code={current.cause.statePatch}
                    diff="after"
                    showLineNumbers={false}
                    maxHeight={140}
                  />
                </div>
              ) : null}
              <div>
                <div className="text-caps mb-1 text-ink-3">snapshot id</div>
                <code className="font-mono text-[11px] text-ink-2">{current.id}</code>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </OverlayPanel>
  );
}
