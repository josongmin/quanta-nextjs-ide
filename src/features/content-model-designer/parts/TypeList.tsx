import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { CONTENT_TYPES } from '../helpers';

interface TypeListProps {
  typeId: string;
  onTypeChange(id: string): void;
}

export function TypeList({ typeId, onTypeChange }: TypeListProps) {
  return (
    <ScrollArea className="h-[560px]">
      <ul className="p-2">
        {CONTENT_TYPES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onTypeChange(t.id)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-bg-hover',
                typeId === t.id && 'bg-bg-selected',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-line bg-bg text-[10px] font-bold text-ink-2"
                >
                  {t.icon}
                </span>
                <span className="font-medium text-ink-1">{t.name}</span>
              </span>
              <Chip tone="muted" size="xs">
                {t.fields.length}
              </Chip>
            </button>
            <div className="px-2 pb-1 text-[10px] text-ink-3">{t.description}</div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
