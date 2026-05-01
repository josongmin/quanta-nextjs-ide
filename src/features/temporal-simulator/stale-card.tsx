// Per-route "User sees stale data for up to N seconds" card.
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteState } from './types';

interface StaleCardProps {
  state: RouteState;
  maxStaleSec: number;
}

const FRESHNESS_TONE: Record<
  RouteState['freshness'],
  'accent' | 'warn' | 'err' | 'neutral'
> = {
  fresh: 'accent',
  stale: 'err',
  mixed: 'warn',
  unknown: 'neutral',
};

const FRESHNESS_LABEL: Record<RouteState['freshness'], string> = {
  fresh: 'fresh',
  stale: 'STALE',
  mixed: 'mixed',
  unknown: '—',
};

export function StaleCard({ state, maxStaleSec }: StaleCardProps) {
  const tone = FRESHNESS_TONE[state.freshness];
  const showWarning = maxStaleSec > 0;
  return (
    <div
      className={cn(
        'rounded-sm border bg-bg p-3 text-xs shadow-sm',
        tone === 'err' && 'border-sev-err/50',
        tone === 'warn' && 'border-sev-warn/50',
        tone === 'accent' && 'border-line',
        tone === 'neutral' && 'border-line',
      )}
    >
      <header className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-ink-1">{state.routeLabel}</span>
        <Chip tone={tone === 'neutral' ? 'accent' : tone} size="xs">
          {FRESHNESS_LABEL[state.freshness]}
        </Chip>
        <span className="ml-auto text-[10px] text-ink-3">
          age{' '}
          <span className="font-mono">
            {state.ageSec == null ? '—' : `${state.ageSec.toFixed(0)}s`}
          </span>
        </span>
      </header>
      <p className="text-ink-2">{state.reason}</p>
      {showWarning ? (
        <p
          className={cn(
            'mt-2 rounded-sm px-2 py-1 text-[11px]',
            maxStaleSec >= 30
              ? 'bg-sev-err-soft text-sev-err'
              : 'bg-sev-warn-soft text-sev-warn',
          )}
        >
          User can see stale data for up to{' '}
          <span className="font-mono font-semibold">{maxStaleSec}s</span> after a
          mutation.
        </p>
      ) : null}
    </div>
  );
}
