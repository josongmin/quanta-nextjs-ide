import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { Button } from './button';
import { Icon } from './icons';

interface Props {
  title: ReactNode;
  meta?: ReactNode;
  rightActions?: ReactNode;
  children: ReactNode;
  className?: string;
  pinned?: boolean;
  onTogglePin?(): void;
}

export function Inspector({
  title,
  meta,
  rightActions,
  children,
  className,
  pinned,
  onTogglePin,
}: Props) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-bg', className)}>
      <header className="flex items-center justify-between gap-2 px-3 py-2 hairline-b bg-bg-subtle">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-1">{title}</div>
          {meta ? <div className="mt-0.5 text-xs text-ink-3">{meta}</div> : null}
        </div>
        <div className="flex items-center gap-1">
          {rightActions}
          {onTogglePin && (
            <Button
              size="icon"
              tone="ghost"
              onClick={onTogglePin}
              aria-label={pinned ? 'Unpin inspector' : 'Pin inspector'}
              aria-pressed={pinned}
              className={cn(pinned && 'text-accent')}
            >
              <Icon.Pin className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
