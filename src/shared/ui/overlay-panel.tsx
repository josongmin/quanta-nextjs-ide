import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_TO_WIDTH = {
  sm: 720,
  md: 960,
  lg: 1080,
  xl: 1180,
  full: 1280,
} as const;

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: OverlaySize;
  /** Explicit pixel width. If provided, overrides `size`. */
  width?: number;
  className?: string;
}

export function OverlayPanel({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  width,
  className,
}: Props) {
  const resolvedWidth = width ?? SIZE_TO_WIDTH[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-150',
          )}
        />
        {/*
          Centering is handled by an outer flex wrapper so that the inner
          Dialog.Content's `transform` is free for the open/close animation.
          (Combining `-translate-x-1/2 -translate-y-1/2` + `animate-in zoom-in`
          on the same element causes the centering translate to be wiped during
          the animation, which made the modal appear to slide in from the
          right.)
        */}
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className={cn(
              'pointer-events-auto rounded-md border border-line bg-bg shadow-pop overflow-hidden',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
              'duration-150 ease-out origin-center',
              className,
            )}
            style={{ width: resolvedWidth }}
          >
          <header className="flex items-start justify-between gap-2 px-4 py-3 hairline-b">
            <div className="min-w-0">
              <Dialog.Title asChild>
                <h2 className="text-md font-semibold text-ink-1">{title}</h2>
              </Dialog.Title>
              {subtitle ? (
                <Dialog.Description asChild>
                  <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="rounded-sm p-1 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
          {footer ? (
            <footer className="flex items-center justify-end gap-2 px-4 py-2 hairline-t bg-bg-subtle">
              {footer}
            </footer>
          ) : null}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
