import { cn } from '@shared/lib/cn';

interface Option<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  value: V;
  options: ReadonlyArray<Option<V>>;
  onChange(v: V): void;
  label?: string;
  className?: string;
}

/**
 * Inline native-select styled to match toolbar chip language.
 */
export function SelectControl<V extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: Props<V>) {
  return (
    <label
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-1.5 text-[11px] text-ink-2',
        className,
      )}
    >
      {label ? <span className="text-ink-3">{label}:</span> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        className="cursor-pointer bg-transparent pr-0.5 text-[11px] tracking-caps text-ink-1 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
