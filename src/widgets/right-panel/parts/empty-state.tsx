import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
}

export function EmptyState({ children, className }: Props) {
  return (
    <div
      className={cn(
        'px-3 py-6 text-center text-xs text-ink-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
