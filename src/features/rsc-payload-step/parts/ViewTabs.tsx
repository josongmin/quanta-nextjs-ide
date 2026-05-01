import type { PayloadSnapshot, RscChunk } from '@entities/rsc-payload';
import { Button } from '@shared/ui';

export type ViewMode = 'live' | 'waterfall' | 'boundary' | 'snapshots' | 'diff';

interface ViewTabsProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  snapshots: ReadonlyArray<PayloadSnapshot>;
  snapshotA: PayloadSnapshot | null;
  snapshotB: PayloadSnapshot | null;
  chunks: ReadonlyArray<RscChunk>;
  onClearSnapshots: () => void;
}

export function ViewTabs({
  view,
  onViewChange,
  snapshots,
  snapshotA,
  snapshotB,
  chunks,
  onClearSnapshots,
}: ViewTabsProps) {
  return (
    <div className="flex items-center gap-1 hairline-b bg-bg-subtle px-3 py-1.5">
      {(['live', 'waterfall', 'boundary', 'snapshots', 'diff'] as const).map((v) => {
        const label =
          v === 'live'
            ? 'Live'
            : v === 'waterfall'
              ? 'Waterfall'
              : v === 'boundary'
                ? 'Boundaries'
                : v === 'snapshots'
                  ? `Snapshots (${snapshots.length})`
                  : 'Diff';
        const disabled =
          (v === 'diff' && (!snapshotA || !snapshotB || snapshotA.id === snapshotB.id)) ||
          ((v === 'waterfall' || v === 'boundary') && chunks.length === 0);
        return (
          <Button
            key={v}
            size="xs"
            tone={view === v ? 'accent' : 'ghost'}
            onClick={() => onViewChange(v)}
            disabled={disabled}
          >
            {label}
          </Button>
        );
      })}
      {view === 'snapshots' && snapshots.length > 0 ? (
        <Button
          size="xs"
          tone="ghost"
          onClick={onClearSnapshots}
          className="ml-auto"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
