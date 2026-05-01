import { Chip, ScrollArea } from '@shared/ui';
import { SearchInput } from '@shared/ui/search-input';
import { cn } from '@shared/lib/cn';
import type { ApiEndpointDef, ApiProtocol } from '../helpers';
import { METHOD_TONE } from './helpers';

interface EndpointListProps {
  search: string;
  onSearchChange: (v: string) => void;
  grouped: Record<ApiProtocol, ApiEndpointDef[]>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function EndpointList({
  search,
  onSearchChange,
  grouped,
  selectedId,
  onSelect,
}: EndpointListProps) {
  return (
    <div className="hairline-r bg-bg-subtle/50">
      <div className="p-2">
        <SearchInput value={search} onChange={onSearchChange} placeholder="filter endpoints" />
      </div>
      <ScrollArea className="max-h-[60vh]">
        {(Object.keys(grouped) as ApiProtocol[]).map((proto) => {
          const list = grouped[proto];
          if (list.length === 0) return null;
          return (
            <div key={proto} className="border-t border-line/60 first:border-t-0">
              <div className="px-3 py-1 text-[10px] uppercase tracking-caps text-ink-3">
                {proto}
              </div>
              <ul>
                {list.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => onSelect(e.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1 text-left text-xs hover:bg-bg-hover',
                        e.id === selectedId && 'bg-bg-selected',
                      )}
                    >
                      {e.method ? (
                        <Chip tone={METHOD_TONE[e.method] ?? 'muted'} size="xs">
                          {e.method}
                        </Chip>
                      ) : (
                        <Chip tone="muted" size="xs">
                          {proto === 'GraphQL' ? 'GQL' : 'tRPC'}
                        </Chip>
                      )}
                      <span className="truncate font-mono text-ink-1">
                        {e.protocol === 'REST' ? e.path : (e.operation ?? e.path)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
