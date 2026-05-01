import { cn } from '@shared/lib/cn';

interface Props {
  lines?: number;
  className?: string;
}

/**
 * Shared skeleton loader — N rows of softly-pulsing hairline blocks.
 * Use for lists / panels while real data is loading.
 */
export function Skeleton({ lines = 3, className }: Props) {
  const rows = Math.max(1, Math.min(20, Math.floor(lines)));
  // Vary widths for a more lifelike loading shimmer.
  const widths = ['w-3/4', 'w-5/6', 'w-2/3', 'w-11/12', 'w-1/2', 'w-4/5'];
  return (
    <div className={cn('flex flex-col gap-1.5 px-3 py-2', className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 rounded-sm bg-line/40 animate-pulse',
            widths[i % widths.length],
          )}
        />
      ))}
    </div>
  );
}
