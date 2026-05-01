import { cn } from '@shared/lib/cn';

export type SortKey = 'name' | 'version' | 'supplier' | 'license' | 'size';
export type SortDir = 'asc' | 'desc';

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick(k: SortKey): void;
}

export function SortHeader({ label, sortKey, activeKey, dir, onClick }: SortHeaderProps) {
  const isActive = sortKey === activeKey;
  return (
    <th className="px-2 py-1.5 text-left font-medium">
      <button
        onClick={() => onClick(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-caps text-[10px]',
          isActive ? 'text-ink-1' : 'text-ink-3 hover:text-ink-1',
        )}
      >
        {label}
        {isActive ? <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span> : null}
      </button>
    </th>
  );
}
