import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className }: Props) {
  return (
    <kbd
      className={cn(
        'inline-flex h-4 min-w-[16px] items-center justify-center rounded-sm border border-line bg-bg-subtle px-1 font-mono text-[10px] leading-none text-ink-2',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
