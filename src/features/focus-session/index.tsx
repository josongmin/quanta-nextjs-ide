import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  BREAK_SUGGESTIONS,
  FOCUS_MODES,
  INITIAL_TODAY_MINUTES,
  INITIAL_TODAY_SESSIONS,
  fmtTime,
  pickSuggestion,
  type FocusMode,
  type FocusStatus,
} from './helpers';

const STATUS_TONE: Record<FocusStatus, string> = {
  idle: 'bg-ink-3',
  running: 'bg-sev-info',
  paused: 'bg-sev-warn',
  break: 'bg-accent',
};

const STATUS_LABEL: Record<FocusStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  break: 'On break',
};

export function FocusSessionOverlay() {
  const open = useUiStore((s) => s.overlays.focusSession.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [modeId, setModeId] = useState<string>('pomodoro');
  const mode: FocusMode = useMemo(
    () => FOCUS_MODES.find((m) => m.id === modeId) ?? FOCUS_MODES[0]!,
    [modeId],
  );

  const [status, setStatus] = useState<FocusStatus>('idle');
  const [remainingSec, setRemainingSec] = useState<number>(mode.workSec);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [sessions, setSessions] = useState<number>(INITIAL_TODAY_SESSIONS);
  const [minutes, setMinutes] = useState<number>(INITIAL_TODAY_MINUTES);
  const [muted, setMuted] = useState<boolean>(false);
  const [suggestionSeed, setSuggestionSeed] = useState<number>(0);

  const intervalRef = useRef<number | null>(null);

  // When the mode changes (and idle), reset the timer to the new work duration.
  useEffect(() => {
    if (status === 'idle') {
      setRemainingSec(mode.workSec);
      setPhase('work');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId]);

  // Tick the interval when running.
  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Phase transition handled in a separate effect on `remainingSec === 0`.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  // Phase transition when timer hits zero.
  useEffect(() => {
    if (remainingSec !== 0) return;
    if (status !== 'running') return;
    if (phase === 'work') {
      setSessions((s) => s + 1);
      setMinutes((m) => m + Math.round(mode.workSec / 60));
      setPhase('break');
      setRemainingSec(mode.breakSec);
      setStatus('break');
      setSuggestionSeed((n) => n + 1);
      if (!muted) {
        toast.success('Focus block complete', {
          description: 'Take a short break — see suggestion below.',
        });
      }
    } else {
      setPhase('work');
      setRemainingSec(mode.workSec);
      setStatus('idle');
      if (!muted) toast('Break finished — ready when you are.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, status, phase]);

  // Cleanup on close / unmount.
  useEffect(() => {
    if (!open && intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open]);

  const onStart = () => {
    if (status === 'break') {
      setStatus('running');
      return;
    }
    if (status === 'paused') {
      setStatus('running');
      return;
    }
    // idle → start
    setRemainingSec(phase === 'work' ? mode.workSec : mode.breakSec);
    setStatus('running');
    if (!muted) toast('Focus started', { description: mode.label });
  };

  const onPause = () => {
    if (status === 'running') setStatus('paused');
  };

  const onReset = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('idle');
    setPhase('work');
    setRemainingSec(mode.workSec);
  };

  const onResetDay = () => {
    setSessions(0);
    setMinutes(0);
    toast('Day stats reset (mock)');
  };

  const onToggleMute = () => {
    setMuted((m) => {
      toast(!m ? 'Notifications muted' : 'Notifications on');
      return !m;
    });
  };

  const total = phase === 'work' ? mode.workSec : mode.breakSec;
  const progress = total === 0 ? 0 : 1 - remainingSec / total;
  const suggestion = pickSuggestion(suggestionSeed);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('focusSession')}
      title={
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn('h-2 w-2 rounded-full', STATUS_TONE[status])}
          />
          <span>Focus session</span>
          <Chip tone="muted" size="xs">
            {STATUS_LABEL[status]}
          </Chip>
        </span>
      }
      subtitle="Work in cycles · take real breaks · stack small wins"
      size="sm"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            Today · {sessions} session{sessions === 1 ? '' : 's'} · {minutes} min focus
          </span>
          <Button size="sm" tone="ghost" onClick={onResetDay}>
            Reset day
          </Button>
          <Button size="sm" tone="ghost" onClick={onToggleMute}>
            {muted ? 'Unmute' : 'Mute'} notifications
          </Button>
          <Button size="sm" tone="default" onClick={() => close('focusSession')}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-0">
        {/* Ring + controls */}
        <section className="flex items-center gap-6 px-6 py-5 hairline-b">
          <ProgressRing
            progress={progress}
            label={fmtTime(remainingSec)}
            sub={phase === 'work' ? 'Focus' : 'Break'}
            phase={phase}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="text-caps mb-1.5 text-ink-3">Mode</div>
              <div className="flex flex-wrap gap-1.5">
                {FOCUS_MODES.map((m) => {
                  const active = m.id === modeId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeId(m.id)}
                      disabled={status === 'running'}
                      className={cn(
                        'rounded-sm border px-2 py-1 text-left text-[11px] transition-colors',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
                        status === 'running' && !active && 'opacity-50',
                      )}
                    >
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[10px] text-ink-3">{m.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {status === 'running' ? (
                <Button size="md" tone="default" onClick={onPause}>
                  Pause
                </Button>
              ) : (
                <Button size="md" tone="accent" onClick={onStart}>
                  {status === 'paused'
                    ? 'Resume'
                    : status === 'break'
                      ? 'Resume break'
                      : 'Start'}
                </Button>
              )}
              <Button size="md" tone="soft" onClick={onReset}>
                Reset
              </Button>
            </div>
          </div>
        </section>

        {/* Break suggestion */}
        {status === 'break' ? (
          <section className="px-6 py-4 hairline-b bg-accent-soft/30">
            <div className="text-caps mb-1 text-accent">Break suggestion</div>
            <div className="text-sm font-medium text-ink-1">{suggestion.title}</div>
            <div className="mt-0.5 text-[12px] text-ink-2">{suggestion.body}</div>
            <button
              type="button"
              onClick={() => setSuggestionSeed((n) => n + 1)}
              className="mt-2 text-[11px] text-accent hover:underline"
            >
              Show another idea
            </button>
          </section>
        ) : (
          <section className="px-6 py-4 hairline-b">
            <div className="text-caps mb-1.5 text-ink-3">Library</div>
            <ul className="grid grid-cols-2 gap-1.5">
              {BREAK_SUGGESTIONS.slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  className="rounded-sm border border-line bg-bg-subtle/40 px-2 py-1.5"
                >
                  <div className="text-[11px] font-medium text-ink-1">{s.title}</div>
                  <div className="text-[10px] text-ink-3">{s.body}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </OverlayPanel>
  );
}

interface RingProps {
  progress: number; // 0..1
  label: string;
  sub: string;
  phase: 'work' | 'break';
}

function ProgressRing({ progress, label, sub, phase }: RingProps) {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));
  const color = phase === 'work' ? 'hsl(var(--accent))' : 'hsl(var(--info))';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms linear' }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[26px] font-semibold tabular-nums text-ink-1">
          {label}
        </div>
        <div className="text-caps text-ink-3">{sub}</div>
      </div>
    </div>
  );
}
