import { cn } from '@shared/lib/cn';

interface Props {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

/**
 * Shared toggle-switch primitive (track + thumb). Light theme tokens, hairline
 * border, accent track when on. Use this instead of inlining the pattern.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  size = 'md',
  label,
  className,
}: Props) {
  const dims =
    size === 'sm'
      ? { track: 'h-3.5 w-6', thumb: 'h-2.5 w-2.5', on: 'translate-x-2.5', off: 'translate-x-0.5' }
      : { track: 'h-5 w-9', thumb: 'h-3 w-3', on: 'translate-x-5', off: 'translate-x-0.5' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border transition-colors',
        dims.track,
        checked ? 'border-accent bg-accent' : 'border-line bg-bg-subtle',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full bg-bg shadow-sm transition-transform',
          dims.thumb,
          checked ? dims.on : dims.off,
        )}
      />
    </button>
  );
}
