import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { useTicker } from './use-ticker';

interface StatTileProps {
  label: string;
  value: number;
  /** Optional unit suffix shown after the giant number (e.g. "kB", "%"). */
  unit?: string;
  /** Inline mini-bar / breakdown rendered under the number. */
  breakdown?: ReactNode;
  /** Optional click handler — turns the tile into a button. */
  onClick?: () => void;
  /** Stagger animation by N ms (forwarded as inline style). */
  delayMs?: number;
}

export function StatTile({
  label,
  value,
  unit,
  breakdown,
  onClick,
  delayMs = 0,
}: StatTileProps) {
  const ticked = useTicker(value, { durationMs: 800, decimals: 0 });
  const Comp: 'button' | 'div' = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
      className={cn(
        'mi-card animate-spring-up',
        'group flex flex-col items-start gap-1.5 rounded-lg p-4 text-left',
        'border border-line bg-bg',
        'transition-[transform,box-shadow,border-color] duration-moderate ease-spring-soft',
        onClick &&
          'mi-press cursor-pointer hover:-translate-y-0.5 hover:border-line-strong hover:shadow-e2',
      )}
    >
      <div className="flex items-baseline gap-1.5 nums-tabular">
        <span
          className={cn(
            'tracking-tighter2 font-semibold text-ink-1 leading-none',
            'text-[48px]',
          )}
        >
          {ticked}
        </span>
        {unit ? (
          <span className="text-base font-medium text-ink-3">{unit}</span>
        ) : null}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-caps text-ink-3">
        {label}
      </div>
      {breakdown ? (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-3 nums-tabular">
          {breakdown}
        </div>
      ) : null}
    </Comp>
  );
}
