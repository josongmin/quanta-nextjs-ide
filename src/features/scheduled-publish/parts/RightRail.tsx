import { toast } from 'sonner';
import { Button, Chip, ScrollArea } from '@shared/ui';
import { SCHEDULED_ITEMS, statusTone, type ScheduledItem } from '../helpers';

interface RightRailProps {
  selected: ScheduledItem | undefined;
}

export function RightRail({ selected }: RightRailProps) {
  return (
    <ScrollArea className="h-[560px]">
      <div className="space-y-3 p-3 text-xs">
        {selected ? (
          <>
            <div className="rounded-sm border border-line bg-bg p-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink-1">{selected.id}</span>
                <Chip tone={statusTone(selected.status)} size="xs">
                  {selected.status}
                </Chip>
              </div>
              <div className="mt-0.5 text-[11px] text-ink-2">{selected.title}</div>
              <div className="mt-0.5 font-mono text-[10px] text-ink-3">
                {selected.scheduledFor} · {selected.locale}
              </div>
            </div>

            <div className="rounded-sm border border-line bg-bg-subtle/40 p-2">
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Preview
              </div>
              <div className="mt-1 flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-line bg-bg p-3 text-center text-[11px] text-ink-2">
                {selected.title}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-caps text-ink-3">
                Dependencies
              </div>
              {selected.dependencies.length === 0 ? (
                <div className="mt-1 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-2 text-center text-[11px] text-ink-3">
                  None
                </div>
              ) : (
                <ul className="mt-1 space-y-1">
                  {selected.dependencies.map((depId) => {
                    const dep = SCHEDULED_ITEMS.find((x) => x.id === depId);
                    if (!dep) return null;
                    return (
                      <li
                        key={depId}
                        className="rounded-sm border border-line bg-bg p-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-ink-2">
                            {dep.id}
                          </span>
                          <Chip tone={statusTone(dep.status)} size="xs">
                            {dep.status}
                          </Chip>
                        </div>
                        <div className="text-[11px] text-ink-1">{dep.title}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1">
              <Button
                size="xs"
                tone="default"
                onClick={() => toast(`Rescheduled ${selected.id} (mock)`)}
              >
                Reschedule
              </Button>
              <Button
                size="xs"
                tone="accent"
                onClick={() => toast(`Published ${selected.id} now (mock)`)}
              >
                Publish now
              </Button>
              <Button
                size="xs"
                tone="ghost"
                onClick={() => toast(`Cancelled ${selected.id} (mock)`)}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                tone="ghost"
                onClick={() => toast('Prerelease checks queued (mock)')}
              >
                Run prerelease
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
            Select a scheduled item.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
