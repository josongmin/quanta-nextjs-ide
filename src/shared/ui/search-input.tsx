import { cn } from '@shared/lib/cn';
import { Icon } from './icons';

interface Props {
  value: string;
  onChange(v: string): void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex h-6 min-w-0 items-center gap-1 rounded-sm border border-line bg-bg px-1.5',
        className,
      )}
    >
      <Icon.Search className="h-3 w-3 shrink-0 text-ink-3" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-xs text-ink-1 placeholder:text-ink-3 focus:outline-none"
      />
      {value.length > 0 ? (
        <button
          aria-label="Clear search"
          className="text-ink-3 hover:text-ink-1"
          onClick={() => onChange('')}
        >
          <Icon.X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
