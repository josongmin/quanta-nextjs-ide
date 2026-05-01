import { cn } from '@shared/lib/cn';
import type { FlagStatus } from '../helpers';

const STATUS_FILTERS: ReadonlyArray<FlagStatus | 'all'> = [
  'all',
  'off',
  'canary',
  'partial',
  'on',
];

interface FilterToolbarProps {
  search: string;
  statusFilter: FlagStatus | 'all';
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (s: FlagStatus | 'all') => void;
}

export function FilterToolbar({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: FilterToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2 text-xs">
      <input
        type="search"
        placeholder="search key or description…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-6 w-56 rounded-sm border border-line bg-bg px-2 font-mono text-[11px] text-ink-1 placeholder:text-ink-3"
      />
      <span className="h-4 w-px bg-line" aria-hidden />
      <span className="text-[10px] uppercase tracking-caps text-ink-3">status</span>
      {STATUS_FILTERS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onStatusFilterChange(s)}
          className={cn(
            'h-5 rounded-sm border px-1.5 font-mono text-[11px]',
            statusFilter === s
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
