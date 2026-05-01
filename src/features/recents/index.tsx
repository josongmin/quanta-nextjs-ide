import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useUiStore, type RecentItem } from '@entities/ui-shell';
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';

const KIND_LABEL: Record<RecentItem['kind'], string> = {
  route: 'Route',
  file: 'File',
  action: 'Action',
  tag: 'Tag',
};

const KIND_ORDER: RecentItem['kind'][] = ['route', 'file', 'action', 'tag'];

const KIND_TONE: Record<RecentItem['kind'], React.ComponentProps<typeof Chip>['tone']> = {
  route: 'accent',
  file: 'neutral',
  action: 'info',
  tag: 'hint',
};

function relativeTime(at: number): string {
  const diff = Date.now() - at;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

interface RecentsButtonProps {
  /** Optional override for the trigger element — defaults to a ghost icon button. */
  trigger?: ReactNode;
}

export function RecentsButton({ trigger }: RecentsButtonProps = {}) {
  const recents = useUiStore((s) => s.recents);
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<RecentItem['kind'], RecentItem[]>();
    for (const r of recents) {
      const list = map.get(r.kind) ?? [];
      list.push(r);
      map.set(r.kind, list);
    }
    return KIND_ORDER.map((kind) => ({ kind, items: map.get(kind) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [recents]);

  const headlineCount = recents.length;

  function openItem(item: RecentItem) {
    toast(`Open ${KIND_LABEL[item.kind].toLowerCase()}`, {
      description: item.label,
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Tooltip content="Recent items" side="bottom">
            <Button
              tone="ghost"
              size="icon"
              aria-label="Recent items"
              className="relative"
            >
              <Icon.Refresh className="h-3.5 w-3.5" />
              {headlineCount > 0 ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent"
                />
              ) : null}
            </Button>
          </Tooltip>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[320px] p-0"
      >
        <div className="flex items-center justify-between gap-2 hairline-b px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Icon.Refresh className="h-3.5 w-3.5 text-ink-3" />
            <span className="text-sm font-medium text-ink-1">Recents</span>
            {headlineCount > 0 ? (
              <span className="text-xs text-ink-3">· {headlineCount}</span>
            ) : null}
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="p-3">
              <EmptyState
                title="No recent items yet."
                description="Routes, files, actions, and tags you visit will collect here."
              />
            </div>
          ) : (
            <ul className="flex flex-col py-1">
              {grouped.map((g) => (
                <li key={g.kind} className="flex flex-col">
                  <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-caps text-ink-3">
                    {KIND_LABEL[g.kind]}
                  </div>
                  {g.items.slice(0, 6).map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        'group flex items-center gap-2 px-3 py-1.5 text-left transition-colors',
                        'hover:bg-bg-hover',
                      )}
                    >
                      <Chip tone={KIND_TONE[item.kind]} size="xs">
                        {KIND_LABEL[item.kind][0]}
                      </Chip>
                      <span className="flex-1 truncate text-sm text-ink-1">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-ink-3">
                        {relativeTime(item.at)}
                      </span>
                      <Icon.UpRight className="h-3 w-3 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
