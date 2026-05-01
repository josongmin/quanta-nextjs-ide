import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function GhostAnnotation({ children, className }: Props) {
  return (
    <span
      className={cn(
        'pointer-events-none select-none truncate font-mono text-[11px] italic text-ink-3',
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}
