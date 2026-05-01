import { cn } from '@shared/lib/cn';

export interface FilterChipOption<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  options: ReadonlyArray<FilterChipOption<V>>;
  value: V;
  onChange(value: V): void;
  className?: string;
}

/**
 * Tightly-spaced toggle chip group rendered inline in tab headers.
 */
export function FilterChipGroup<V extends string>({
  options,
  value,
  onChange,
  className,
}: Props<V>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-sm border border-line bg-bg p-px',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-5 px-1.5 text-[11px] tracking-caps text-ink-2 hover:text-ink-1',
              active && 'bg-bg-selected text-ink-1 rounded-sm',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
