/**
 * Ship-it Drawer (Phase 21).
 *
 * A right-side 480px drawer built on Radix Dialog (we don't have a Drawer
 * primitive yet). Glass-strong background, 280ms slide-in. The drawer is
 * driven by `useShipDrawerStore` and the global ui-shell overlay slice
 * (`overlays.shipDrawer`).
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '@entities/ui-shell';
import { Button, EmptyState } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { selectLastShippedRelative, useShipDrawerStore } from './store';
import { SectionBuild } from './section-build';
import { SectionAdmission } from './section-admission';
import { SectionCost } from './section-cost';
import { SectionSuggestions } from './section-suggestions';
import { SectionActions } from './section-actions';
import { countBlockers } from './aggregator';

export function ShipDrawer() {
  const open = useUiStore((s) => s.overlays.shipDrawer.open);
  const close = useUiStore((s) => s.closeOverlay);

  const readiness = useShipDrawerStore((s) => s.readiness);
  const isAggregating = useShipDrawerStore((s) => s.isAggregating);
  const refresh = useShipDrawerStore((s) => s.refresh);
  const runAllChecks = useShipDrawerStore((s) => s.runAllChecks);
  const lastShippedRel = useShipDrawerStore(selectLastShippedRelative);

  // On open: aggregate immediately. If never run before, kick off all 4 checks.
  useEffect(() => {
    if (!open) return;
    const r = refresh();
    const allIdle = r.runners.every((c) => c.state === 'idle');
    if (allIdle) {
      void runAllChecks();
    }
    // Refresh every 1s while open so chips update from runner events.
    const id = setInterval(() => refresh(), 1000);
    return () => clearInterval(id);
  }, [open, refresh, runAllChecks]);

  const blockers = readiness ? countBlockers(readiness) : 0;
  const disabled = !readiness || readiness.shipState === 'blocked';

  const allIdle = useMemo(
    () => readiness?.runners.every((c) => c.state === 'idle') ?? true,
    [readiness],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? null : close('shipDrawer'))}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-200',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col',
            'bg-bg/85 backdrop-blur-md hairline-l shadow-pop',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            'duration-300 ease-spring',
          )}
          onEscapeKeyDown={() => close('shipDrawer')}
          aria-describedby={undefined}
        >
          {/* Top progress bar */}
          {isAggregating ? (
            <div className="absolute left-0 right-0 top-0 h-0.5 overflow-hidden">
              <div
                className="h-full w-1/3 bg-accent"
                style={{ animation: 'shipIndeterminate 1.2s linear infinite' }}
              />
              <style>{`
                @keyframes shipIndeterminate {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(400%); }
                }
              `}</style>
            </div>
          ) : null}

          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 hairline-b">
            <Dialog.Title className="text-sm font-semibold tracking-tighter2 text-ink-1">
              Ready to ship?
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {lastShippedRel ? (
                <span className="rounded-full border border-line bg-bg-subtle px-2 py-0 text-[10px] text-ink-3">
                  shipped {lastShippedRel}
                </span>
              ) : null}
              <button
                aria-label="Close"
                onClick={() => close('shipDrawer')}
                className="rounded-md p-1 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!readiness ? (
              <div className="p-6">
                <EmptyState
                  title="Run checks first"
                  description="The drawer needs build, typecheck, lint, and test results to compute readiness."
                  action={
                    <Button tone="accent" onClick={() => void runAllChecks()}>
                      Run all checks
                    </Button>
                  }
                />
              </div>
            ) : allIdle ? (
              <div className="p-6">
                <EmptyState
                  title="No checks have run"
                  description="Kick off build, typecheck, lint, and test in parallel to compute ship readiness."
                  action={
                    <Button tone="accent" onClick={() => void runAllChecks()}>
                      Run all checks
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <SectionBuild runners={readiness.runners} />
                <div className="hairline-b" />
                <SectionAdmission verdict={readiness.admission} />
                <div className="hairline-b" />
                <SectionCost delta={readiness.costDelta} />
                <div className="hairline-b" />
                <SectionSuggestions
                  suggestions={readiness.suggestions}
                  flows={readiness.criticalFlowsTouched}
                />
              </>
            )}
          </div>

          {/* Footer */}
          {readiness && !allIdle ? (
            <SectionActions readiness={readiness} disabled={disabled} />
          ) : null}

          {/* Hidden screen-reader description */}
          <div className="sr-only">
            {blockers > 0
              ? `${blockers} issue${blockers === 1 ? '' : 's'} block deploy.`
              : 'No blockers.'}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { useShipDrawerStore } from './store';
export { aggregate, countBlockers } from './aggregator';
export type {
  ShipReadiness,
  ShipResult,
  ShipSuggestion,
  RunnerChip,
  CostDeltaSummary,
  CriticalFlowTouch,
} from './types';
