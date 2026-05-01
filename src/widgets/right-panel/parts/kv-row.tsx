import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface Props {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  mono?: boolean;
}

/**
 * Dense label/value row used inside Inspector sections.
 * Label column is fixed-width caps; value column is mono-friendly.
 */
export function KvRow({ label, children, className, mono = false }: Props) {
  return (
    <div
      className={cn(
        'grid min-h-[28px] grid-cols-[88px_1fr] items-center gap-2 py-0.5 text-sm',
        className,
      )}
    >
      <span className="text-caps text-[11px] uppercase text-ink-3">{label}</span>
      <span
        className={cn(
          'min-w-0 truncate text-ink-2',
          mono && 'font-mono text-xs',
        )}
      >
        {children}
      </span>
    </div>
  );
}
