import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * 32px hairline-bottom header strip used by every bottom-panel tab.
 * Holds toolbar controls (filters, group-by, search, etc.).
 */
export function PanelHeader({ children, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}
