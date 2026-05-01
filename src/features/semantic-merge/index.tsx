import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Icon, OverlayPanel } from '@shared/ui';
import { COLLISIONS, PRS, type Collision } from './helpers';
import { CollisionDetail } from './parts/CollisionDetail';
import { CollisionList } from './parts/CollisionList';
import { CollisionMatrix } from './parts/CollisionMatrix';
import { MatrixLegend } from './parts/MatrixLegend';
import { PrToolbar } from './parts/PrToolbar';

export type {
  Collision,
  CollisionSeverity,
  MockPR,
  SemanticEdit,
} from './helpers';

export function SemanticMergeOverlay() {
  const open = useUiStore((s) => s.overlays.semanticMerge.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [selectedPrs, setSelectedPrs] = useState<ReadonlyArray<string>>(() =>
    PRS.map((p) => p.id),
  );
  const [selectedCell, setSelectedCell] = useState<{
    prA: string;
    prB: string;
  } | null>(null);

  function togglePr(id: string) {
    setSelectedPrs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const visibleCollisions = useMemo<ReadonlyArray<Collision>>(
    () =>
      COLLISIONS.filter(
        (c) => selectedPrs.includes(c.prA) && selectedPrs.includes(c.prB),
      ),
    [selectedPrs],
  );

  const selectedCollision = useMemo<Collision | null>(() => {
    if (!selectedCell) return null;
    return (
      COLLISIONS.find(
        (c) =>
          (c.prA === selectedCell.prA && c.prB === selectedCell.prB) ||
          (c.prA === selectedCell.prB && c.prB === selectedCell.prA),
      ) ?? null
    );
  }, [selectedCell]);

  function selectCellById(prA: string, prB: string) {
    setSelectedCell({ prA, prB });
  }

  const totalCollisions = visibleCollisions.length;
  const hardCount = visibleCollisions.filter((c) => c.severity === 'hard').length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('semanticMerge')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Semantic Merge</span>
        </span>
      }
      subtitle="Next.js-aware PR collision detector"
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {totalCollisions} collision{totalCollisions === 1 ? '' : 's'} ·{' '}
            {hardCount} hard
          </span>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Merge plan generated (mock)', {
                description: `${selectedPrs.length} PRs · ${totalCollisions} collisions resolved`,
              })
            }
          >
            Generate merge plan
          </Button>
        </>
      }
    >
      <PrToolbar selectedPrs={selectedPrs} onTogglePr={togglePr} />

      <div className="grid grid-cols-[1fr_320px] divide-x divide-line">
        <div className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Collision matrix</header>
          <div className="overflow-auto rounded-sm border border-line bg-bg p-2">
            <CollisionMatrix
              prs={PRS}
              selectedPrs={selectedPrs}
              onSelectCell={selectCellById}
              selectedCell={selectedCell}
            />
          </div>

          <MatrixLegend />

          <header className="mb-2 mt-4 text-caps text-ink-3">Collisions</header>
          <CollisionList
            collisions={visibleCollisions}
            selectedCell={selectedCell}
            onSelectCell={selectCellById}
          />
        </div>

        <aside className="min-w-0 max-h-[64vh] overflow-y-auto p-3">
          <header className="mb-2 text-caps text-ink-3">Selected collision</header>
          {selectedCollision ? (
            <CollisionDetail collision={selectedCollision} />
          ) : (
            <div className="rounded-sm border border-dashed border-line bg-bg-subtle/40 p-3 text-center text-xs text-ink-3">
              Click a matrix cell or list item to view details.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
