import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Shared empty-state primitive — hairline-boxed, centered, no card / shadow.
 * Used by panels (recents, quality, bookmarks, etc.) so messaging is consistent.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-4 py-6 text-center',
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-bg text-ink-3"
        >
          {icon}
        </div>
      ) : null}
      {title ? (
        <div className="text-md text-ink-2">{title}</div>
      ) : null}
      {description ? (
        <div className="max-w-[42ch] text-xs text-ink-3">{description}</div>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
