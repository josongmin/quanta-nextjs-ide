import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  active: boolean;
  onClick(): void;
  children: ReactNode;
  className?: string;
  title?: string;
}

/**
 * Small toggle chip for filter toolbars. Active state uses bg-bg-selected.
 */
export function ToggleChip({ active, onClick, children, className, title }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] tracking-caps text-ink-2 hover:text-ink-1 hover:bg-bg-hover',
        active && 'bg-bg-selected text-ink-1 border-line-strong',
        className,
      )}
    >
      {children}
    </button>
  );
}
