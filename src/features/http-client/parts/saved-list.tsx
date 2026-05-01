import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { SAVED_REQUESTS, methodTone } from '../helpers';

interface SavedListProps {
  reqId: string;
  onSelect: (id: string) => void;
}

export function SavedList({ reqId, onSelect }: SavedListProps): JSX.Element {
  return (
    <aside className="hairline-r">
      <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
        saved
      </div>
      <ScrollArea className="max-h-[540px]">
        <ul className="px-1 py-1">
          {SAVED_REQUESTS.map((r) => {
            const active = r.id === reqId;
            return (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    'flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left hover:bg-bg-hover',
                    active && 'bg-bg-selected',
                  )}
                >
                  <Chip tone={methodTone(r.method)} size="xs">
                    {r.method}
                  </Chip>
                  <span className="truncate text-[11px] text-ink-1">
                    {r.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
