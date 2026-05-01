import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Compact header strip for left-panel tabs (filters, search, sort controls).
 * Hairline-bottom separator. h-8.
 */
export function TabHeader({ children, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center gap-1 hairline-b bg-bg px-2 text-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}
