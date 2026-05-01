import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, Icon, OverlayPanel, ScrollArea, Tooltip } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ACTIVE_LINE_OFFSET_FROM_START,
  RUNTIMES,
  RUNTIME_LABEL,
  RUNTIME_TONE,
  SOURCE_PREVIEW,
  mockSession,
  type Runtime,
} from './helpers';

const STATE_TONE: Record<
  'running' | 'paused' | 'idle' | 'blocked',
  'accent' | 'warn' | 'muted' | 'err'
> = {
  running: 'accent',
  paused: 'warn',
  idle: 'muted',
  blocked: 'err',
};

export function DebugSessionOverlay() {
  const open = useUiStore((s) => s.overlays.debugSession.open);
  const close = useUiStore((s) => s.closeOverlay);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const [runtime, setRuntime] = useState<Runtime>('node');
  const [active, setActive] = useState<number>(mockSession.activeFrameIndex);
  const [pauseOnUncaught, setPauseOnUncaught] = useState<boolean>(
    mockSession.pauseOnUncaught,
  );

  const activeFrame = mockSession.frames[active] ?? mockSession.frames[0];
  const startLine = (activeFrame?.line ?? 1) - ACTIVE_LINE_OFFSET_FROM_START;

  const userFrames = useMemo(
    () => mockSession.frames.filter((f) => f.isUserCode).length,
    [],
  );

  if (!activeFrame) return null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('debugSession')}
      title="Debug session"
      subtitle={mockSession.reason}
      size="xl"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <button
            type="button"
            onClick={() => setPauseOnUncaught((v) => !v)}
            aria-pressed={pauseOnUncaught}
            className={cn(
              'inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] tracking-caps text-ink-2 hover:bg-bg-hover',
              pauseOnUncaught && 'border-accent/40 bg-accent-soft text-accent',
            )}
          >
            <Icon.Alert className="h-3 w-3" /> Pause on uncaught
          </button>
          <span className="ml-auto flex items-center gap-2">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                openOverlay('variablesScope');
                toast('Open Variables');
              }}
            >
              Open Variables
            </Button>
            <Button
              size="xs"
              tone="ghost"
              onClick={() => {
                openOverlay('watchExpressions');
                toast('Open Watch');
              }}
            >
              Open Watch
            </Button>
            <Button size="xs" tone="warn" onClick={() => toast('Detached debugger')}>
              Detach
            </Button>
          </span>
        </span>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-caps text-ink-3">runtime</span>
        <div className="flex items-center gap-1">
          {RUNTIMES.map((r) => (
            <ToggleChip
              key={r}
              active={runtime === r}
              onClick={() => {
                setRuntime(r);
                toast(`Runtime: ${RUNTIME_LABEL[r]}`);
              }}
            >
              {RUNTIME_LABEL[r]}
            </ToggleChip>
          ))}
        </div>

        <div className="mx-3 h-5 w-px bg-line" />

        <Tooltip content="Continue">
          <Button size="sm" tone="accent" onClick={() => toast('Continue')}>
            <Icon.Right className="h-3.5 w-3.5" /> Resume
          </Button>
        </Tooltip>
        <Tooltip content="Pause">
          <Button size="sm" onClick={() => toast('Paused')}>
            Pause
          </Button>
        </Tooltip>
        <Tooltip content="Step over (F10)">
          <Button size="sm" onClick={() => toast('Step over')}>
            <Icon.Right className="h-3.5 w-3.5" /> Over
          </Button>
        </Tooltip>
        <Tooltip content="Step into (F11)">
          <Button size="sm" onClick={() => toast('Step into')}>
            <Icon.Down className="h-3.5 w-3.5" /> Into
          </Button>
        </Tooltip>
        <Tooltip content="Step out (Shift+F11)">
          <Button size="sm" onClick={() => toast('Step out')}>
            <Icon.Up className="h-3.5 w-3.5" /> Out
          </Button>
        </Tooltip>
        <Tooltip content="Restart">
          <Button size="sm" tone="ghost" onClick={() => toast('Restart')}>
            <Icon.Refresh className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <Chip tone="muted" size="xs">
            frames {mockSession.frames.length}
          </Chip>
          <Chip tone="accent" size="xs">
            user {userFrames}
          </Chip>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[320px_1fr_260px]">
        {/* Left: Call stack */}
        <div className="hairline-r">
          <div className="flex h-7 items-center px-3 text-caps text-ink-3 hairline-b">
            Call stack
          </div>
          <ScrollArea className="h-[440px]">
            <div className="space-y-1 p-2">
              {mockSession.frames.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={cn(
                    'block w-full rounded-sm border border-line bg-bg px-2 py-1.5 text-left hover:bg-bg-hover',
                    active === idx && 'border-accent/40 bg-accent-soft',
                    !f.isUserCode && 'opacity-70',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-ink-1">
                      {f.fn}
                    </span>
                    {f.isAsync ? (
                      <Chip tone="info" size="xs">
                        async
                      </Chip>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Chip tone={RUNTIME_TONE[f.runtime]} size="xs">
                      {RUNTIME_LABEL[f.runtime]}
                    </Chip>
                    <Chip tone={f.isUserCode ? 'accent' : 'muted'} size="xs">
                      {f.isUserCode ? 'user' : 'system'}
                    </Chip>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-ink-3">
                    {f.file}:{f.line}:{f.col}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main: Source preview */}
        <div className="hairline-r">
          <div className="flex h-7 items-center justify-between px-3 hairline-b">
            <span className="font-mono text-[11px] text-ink-2">
              {activeFrame.file}
              <span className="text-ink-3">:</span>
              <span className="text-accent">{activeFrame.line}</span>
            </span>
            <Chip tone={RUNTIME_TONE[activeFrame.runtime]} size="xs">
              {RUNTIME_LABEL[activeFrame.runtime]}
            </Chip>
          </div>
          <div className="bg-bg p-2">
            <pre className="overflow-auto rounded-sm border border-line bg-bg font-mono text-[11px] leading-[18px]">
              <code className="block">
                {SOURCE_PREVIEW.map((line, i) => {
                  const lineNo = startLine + i;
                  const isActive = i === ACTIVE_LINE_OFFSET_FROM_START;
                  const hasBp = i === ACTIVE_LINE_OFFSET_FROM_START;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start whitespace-pre',
                        isActive && 'bg-accent-soft',
                      )}
                    >
                      <span
                        aria-hidden
                        className="inline-flex w-5 select-none items-center justify-center text-ink-3"
                      >
                        {hasBp ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-sev-err" />
                        ) : null}
                      </span>
                      <span className="inline-block w-9 select-none border-r border-line bg-bg-subtle px-1.5 text-right text-ink-3">
                        {lineNo}
                      </span>
                      <span
                        className={cn(
                          'px-2',
                          isActive ? 'text-ink-1' : 'text-ink-2',
                        )}
                      >
                        {line || ' '}
                      </span>
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>
        </div>

        {/* Right rail: threads + loaded scripts */}
        <div>
          <div className="flex h-7 items-center px-3 text-caps text-ink-3 hairline-b">
            Threads
          </div>
          <div className="space-y-1 p-2">
            {mockSession.threads.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-sm border border-line bg-bg px-2 py-1"
              >
                <span className="font-mono text-[11px] text-ink-1">
                  {t.label}
                </span>
                <div className="flex items-center gap-1">
                  <Chip tone={STATE_TONE[t.state]} size="xs">
                    {t.state}
                  </Chip>
                  {t.ms > 0 ? (
                    <span className="font-mono text-[10px] text-ink-3">
                      {t.ms}ms
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex h-7 items-center px-3 text-caps text-ink-3 hairline-b hairline-t">
            Loaded scripts
          </div>
          <div className="flex flex-wrap gap-1 p-2">
            {mockSession.scripts.map((s) => (
              <Chip key={s.id} tone={RUNTIME_TONE[s.runtime]} size="xs">
                {s.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </OverlayPanel>
  );
}
