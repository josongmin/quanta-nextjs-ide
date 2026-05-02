/**
 * Glass overlay shown after a verb is invoked from the command palette.
 *
 * The palette closes on `onSelect`, so verbs publish a payload to a tiny
 * Zustand store; <NextVerbPreviewShell /> subscribes and renders it
 * centered with breadcrumb header and footer actions.
 */

import { useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { Button, Icon, Kbd } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { PreviewPayload } from './types';

interface PreviewState {
  open: boolean;
  payload: PreviewPayload | null;
  show(p: PreviewPayload): void;
  close(): void;
}

export const useVerbPreviewStore = create<PreviewState>((set) => ({
  open: false,
  payload: null,
  show: (p) => set({ open: true, payload: p }),
  close: () => set({ open: false, payload: null }),
}));

/** Imperative helper for verbs (avoids React hooks at call sites). */
export function showVerbPreview(p: PreviewPayload): void {
  useVerbPreviewStore.getState().show(p);
}

export function NextVerbPreviewShell(): ReactNode {
  const open = useVerbPreviewStore((s) => s.open);
  const payload = useVerbPreviewStore((s) => s.payload);
  const close = useVerbPreviewStore((s) => s.close);

  // Esc closes; Enter triggers primary if defined.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Enter' && payload?.onPrimary) {
        e.preventDefault();
        void payload.onPrimary();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, payload, close]);

  if (!open || !payload) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-start justify-center',
        'bg-black/40 backdrop-blur-sm',
        'animate-in fade-in duration-100',
      )}
      onClick={close}
    >
      <div
        role="dialog"
        aria-label={payload.title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'mt-[10vh] w-full max-w-[720px] rounded-md',
          'border border-line/60 bg-bg-1/95 shadow-2xl',
          'backdrop-blur-md',
          'animate-in zoom-in-95 slide-in-from-top-2 duration-150',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 hairline-b">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-accent/20 to-accent/0 px-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-2xs font-medium uppercase tracking-wider text-accent">
              Next.js
            </span>
          </span>
          <span className="text-xs text-ink-3">cmd</span>
          <Icon.ChevRight className="h-3 w-3 text-ink-3" />
          <h2 className="flex-1 text-sm font-medium text-ink-1">
            {payload.title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-sm p-1 text-ink-3 hover:bg-bg-selected hover:text-ink-1"
            aria-label="Close"
          >
            <Icon.X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 text-sm">
          {payload.body}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 hairline-t">
          <div className="flex items-center gap-3 text-2xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>Esc</Kbd> close
            </span>
            {payload.onPrimary ? (
              <span className="inline-flex items-center gap-1">
                <Kbd>Enter</Kbd> {payload.primaryLabel ?? 'Confirm'}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {payload.secondaryLabel ? (
              <Button
                tone="ghost"
                size="sm"
                onClick={() => {
                  payload.onSecondary?.();
                  close();
                }}
              >
                {payload.secondaryLabel}
              </Button>
            ) : null}
            {payload.onPrimary ? (
              <Button
                tone="accent"
                size="sm"
                className="bg-gradient-to-r from-accent to-accent/80"
                onClick={() => {
                  void payload.onPrimary?.();
                }}
              >
                {payload.primaryLabel ?? 'Confirm'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
