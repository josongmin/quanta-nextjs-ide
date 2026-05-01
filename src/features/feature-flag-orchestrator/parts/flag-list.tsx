import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { STATUS_TONE, type Flag } from '../helpers';

interface FlagListProps {
  flags: ReadonlyArray<Flag>;
  selectedId: string | undefined;
  onSelect: (flag: Flag) => void;
}

export function FlagList({ flags, selectedId, onSelect }: FlagListProps) {
  return (
    <aside className="min-w-0 px-2 py-2">
      <ul className="space-y-1">
        {flags.map((f) => {
          const isSel = f.id === selectedId;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onSelect(f)}
                className={cn(
                  'w-full rounded-sm border px-2 py-1.5 text-left',
                  isSel
                    ? 'border-accent bg-accent-soft/40'
                    : 'border-line bg-bg hover:bg-bg-hover',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-mono text-[12px] text-ink-1">
                    {f.key}
                  </span>
                  <Chip tone={STATUS_TONE[f.status]} size="xs">
                    {f.status}
                  </Chip>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {f.audiences.map((a) => (
                    <Chip key={a} tone="muted" size="xs">
                      {a}
                    </Chip>
                  ))}
                  {f.dependencies.length > 0 && (
                    <span className="ml-auto text-[10px] text-sev-warn">↳ deps</span>
                  )}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${f.percentage}%` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
        {flags.length === 0 && (
          <li className="px-2 py-3 text-center text-[11px] text-ink-3">
            No flags match this filter.
          </li>
        )}
      </ul>
    </aside>
  );
}
