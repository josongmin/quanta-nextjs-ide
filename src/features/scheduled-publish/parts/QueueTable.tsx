import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { statusTone, type ScheduledItem } from '../helpers';

type SortKey = 'when' | 'type' | 'status';

interface QueueTableProps {
  items: ReadonlyArray<ScheduledItem>;
  selectedId: string;
  onSelect(id: string): void;
  sortKey: SortKey;
  onSortKeyChange(k: SortKey): void;
}

export function QueueTable({ items, selectedId, onSelect, sortKey, onSortKeyChange }: QueueTableProps) {
  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-caps text-ink-3">Queue</div>
        <div className="flex items-center gap-1 text-[10px] text-ink-3">
          sort
          {(['when', 'type', 'status'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSortKeyChange(k)}
              className={cn(
                'rounded-sm px-1 hover:text-ink-1',
                sortKey === k && 'text-ink-1 bg-bg-selected',
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <table className="mt-1 w-full text-xs">
        <thead className="text-left text-[10px] uppercase tracking-caps text-ink-3">
          <tr className="border-b border-line">
            <th className="px-2 py-1 font-medium">When</th>
            <th className="px-2 py-1 font-medium">Type</th>
            <th className="px-2 py-1 font-medium">Title</th>
            <th className="px-2 py-1 font-medium">Author</th>
            <th className="px-2 py-1 font-medium">Locale</th>
            <th className="px-2 py-1 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-2 py-6 text-center text-ink-3">
                Nothing scheduled in this range.
              </td>
            </tr>
          ) : (
            items.map((it) => (
              <tr
                key={it.id}
                className={cn(
                  'cursor-pointer border-b border-line/60 hover:bg-bg-hover',
                  selectedId === it.id && 'bg-bg-selected',
                )}
                onClick={() => onSelect(it.id)}
              >
                <td className="px-2 py-1 font-mono text-[10px] text-ink-3">
                  {it.scheduledFor}
                </td>
                <td className="px-2 py-1">
                  <Chip tone="muted" size="xs">
                    {it.contentType}
                  </Chip>
                </td>
                <td className="px-2 py-1 text-ink-1">{it.title}</td>
                <td className="px-2 py-1 font-mono text-[10px] text-ink-2">
                  {it.author}
                </td>
                <td className="px-2 py-1 font-mono text-[10px] text-ink-2">
                  {it.locale}
                </td>
                <td className="px-2 py-1">
                  <Chip tone={statusTone(it.status)} size="xs">
                    {it.status}
                  </Chip>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
