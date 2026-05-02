/**
 * Phase 18 — 5-stage stepper with progress bar.
 *
 * Plan · Patch · Verify · Apply · Shipped.  Active node has accent ring
 * and a pulse-ring animation; completed nodes show a check; pending are
 * muted. The connecting line fills as stages complete.
 */

import { Check } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import type { Stage, StageState } from './types';
import { STAGES, STAGE_LABEL } from './types';

interface Props {
  stages: StageState[];
  activeStage?: Stage;
  className?: string;
}

function progressFraction(stages: StageState[]): number {
  const total = stages.length - 1;
  if (total <= 0) return 0;
  let completed = 0;
  for (const s of stages) {
    if (s.status === 'completed') completed += 1;
  }
  return Math.min(1, completed / total);
}

export function StageStepper({ stages, activeStage, className }: Props): JSX.Element {
  const fraction = progressFraction(stages);
  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative flex items-center justify-between gap-1">
        {/* Background line */}
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-line/60" />
        {/* Filled line */}
        <div
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 h-px -translate-y-1/2',
            'bg-gradient-to-r from-accent via-accent to-accent/40',
            'transition-[width] duration-relaxed ease-spring-soft',
          )}
          style={{ width: `calc(${fraction * 100}% - ${fraction > 0 ? 12 : 0}px)` }}
        />
        {STAGES.map((s) => {
          const state = stages.find((st) => st.stage === s);
          const status = state?.status ?? 'pending';
          const isActive = activeStage === s || status === 'active';
          const isCompleted = status === 'completed';
          const isErrored = status === 'errored';
          return (
            <div key={s} className="relative z-[1] flex flex-col items-center gap-1">
              <div
                className={cn(
                  'relative flex h-6 w-6 items-center justify-center rounded-full border bg-bg',
                  'transition-all duration-moderate ease-spring-soft',
                  isCompleted
                    ? 'border-accent bg-accent/10'
                    : isActive
                      ? 'border-accent ring-2 ring-accent/30'
                      : isErrored
                        ? 'border-sev-err bg-sev-err-soft/30'
                        : 'border-line/60',
                )}
              >
                {isActive && !isCompleted ? (
                  <span
                    className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping"
                    aria-hidden
                  />
                ) : null}
                {isCompleted ? (
                  <Check className="h-3 w-3 text-accent" />
                ) : (
                  <span
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      isActive
                        ? 'bg-accent'
                        : isErrored
                          ? 'bg-sev-err'
                          : 'bg-ink-3/50',
                    )}
                  />
                )}
                {isCompleted ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium uppercase tracking-caps',
                  isActive
                    ? 'text-accent'
                    : isCompleted
                      ? 'text-ink-2'
                      : isErrored
                        ? 'text-sev-err'
                        : 'text-ink-3',
                )}
              >
                {STAGE_LABEL[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StageStepper;
