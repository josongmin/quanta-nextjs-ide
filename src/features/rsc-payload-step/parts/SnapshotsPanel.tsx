import type { PayloadSnapshot } from '@entities/rsc-payload';
import { Button, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface SnapshotsPanelProps {
  snapshots: ReadonlyArray<PayloadSnapshot>;
  selectedAId: string | null;
  selectedBId: string | null;
  onSelectA: (id: string | null) => void;
  onSelectB: (id: string | null) => void;
  onRemove: (id: string) => void;
  onOpenDiff: () => void;
}

export function SnapshotsPanel({
  snapshots,
  selectedAId,
  selectedBId,
  onSelectA,
  onSelectB,
  onRemove,
  onOpenDiff,
}: SnapshotsPanelProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-[460px] items-center justify-center text-xs text-ink-3">
        No snapshots. Press <span className="mx-1 font-mono text-ink-1">Capture</span> to record one.
      </div>
    );
  }
  return (
    <ScrollArea className="h-[460px]">
      <div>
        {snapshots.map((s) => {
          const isA = selectedAId === s.id;
          const isB = selectedBId === s.id;
          return (
            <div
              key={s.id}
              className={cn(
                'flex items-center gap-2 hairline-b px-3 py-2',
                (isA || isB) && 'bg-accent-soft',
              )}
            >
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-ink-1">{s.label}</span>
                <span className="font-mono text-[10px] text-ink-3">
                  {s.url} · {s.chunks.length} chunks · {Math.round(s.totalMs)}ms · {s.totalBytes}B
                </span>
              </div>
              <span className="ml-auto flex items-center gap-1.5">
                <Button
                  size="xs"
                  tone={isA ? 'accent' : 'ghost'}
                  onClick={() => onSelectA(isA ? null : s.id)}
                >
                  A
                </Button>
                <Button
                  size="xs"
                  tone={isB ? 'accent' : 'ghost'}
                  onClick={() => onSelectB(isB ? null : s.id)}
                >
                  B
                </Button>
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={onOpenDiff}
                  disabled={
                    !selectedAId ||
                    !selectedBId ||
                    selectedAId === selectedBId
                  }
                >
                  Diff
                </Button>
                <Button size="xs" tone="ghost" onClick={() => onRemove(s.id)}>
                  ×
                </Button>
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
