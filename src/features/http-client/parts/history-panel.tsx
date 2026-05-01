import { Chip, ScrollArea } from '@shared/ui';
import {
  methodTone,
  statusTone,
  type HistoryEntry,
} from '../helpers';

interface HistoryPanelProps {
  history: ReadonlyArray<HistoryEntry>;
  onLoad: (h: HistoryEntry) => void;
}

export function HistoryPanel({
  history,
  onLoad,
}: HistoryPanelProps): JSX.Element {
  return (
    <>
      <div className="flex h-7 items-center px-2 text-[10px] uppercase tracking-caps text-ink-3 hairline-b bg-bg-subtle">
        history ({history.length})
      </div>
      <ScrollArea className="max-h-[260px]">
        <ul className="px-1 py-1">
          {history.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => onLoad(h)}
                className="flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left hover:bg-bg-hover"
              >
                <Chip tone={methodTone(h.method)} size="xs">
                  {h.method}
                </Chip>
                <Chip tone={statusTone(h.status)} size="xs">
                  {h.status}
                </Chip>
                <span className="truncate font-mono text-[10px] text-ink-2">
                  {h.url}
                </span>
                <span className="ml-auto font-mono text-[10px] text-ink-3">
                  {h.ms}ms
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </>
  );
}
