import { useEffect, useRef } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { STEPS } from './steps';

export function OnboardingOverlay() {
  const open = useUiStore((s) => s.overlays.onboarding.open);
  const step = useUiStore((s) => s.overlays.onboarding.step);
  const onboardingComplete = useUiStore((s) => s.onboardingComplete);
  const openOverlay = useUiStore((s) => s.openOverlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const setOnboardingComplete = useUiStore((s) => s.setOnboardingComplete);

  // Auto-open on first ever app load. Guard so we never re-open on re-renders.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    if (!onboardingComplete && !open) {
      openOverlay('onboarding', { step: 0 });
    }
  }, [onboardingComplete, open, openOverlay]);

  const total = STEPS.length;
  const current = Math.min(Math.max(step, 0), total - 1);
  const stepData = STEPS[current];
  if (!stepData) return null;
  const isLast = current === total - 1;

  function complete() {
    setOnboardingComplete(true);
    closeOverlay('onboarding');
  }

  function next() {
    if (isLast) {
      complete();
      return;
    }
    openOverlay('onboarding', { step: current + 1 });
  }

  function back() {
    if (current === 0) return;
    openOverlay('onboarding', { step: current - 1 });
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : closeOverlay('onboarding'))}
      title={stepData.title}
      subtitle={`Step ${current + 1} of ${total}`}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button tone="ghost" size="sm" onClick={complete}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <Button tone="ghost" size="sm" onClick={back} disabled={current === 0}>
              Back
            </Button>
            <Button tone="accent" size="sm" onClick={next}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_1fr] gap-4 p-4">
        <div className="rounded-sm border border-line bg-bg-subtle/40 p-3">
          {stepData.illustration}
        </div>
        <div className="flex flex-col justify-center gap-3">
          {stepData.body}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to step ${i + 1}`}
            onClick={() => openOverlay('onboarding', { step: i })}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === current
                ? 'w-6 bg-accent'
                : 'w-1.5 bg-line hover:bg-ink-3/40',
            )}
          />
        ))}
      </div>
    </OverlayPanel>
  );
}
