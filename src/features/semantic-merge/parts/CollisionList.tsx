import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  PRS,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  type Collision,
} from '../helpers';

interface CollisionListProps {
  collisions: ReadonlyArray<Collision>;
  selectedCell: { prA: string; prB: string } | null;
  onSelectCell(prA: string, prB: string): void;
}

export function CollisionList({ collisions, selectedCell, onSelectCell }: CollisionListProps) {
  if (collisions.length === 0) {
    return (
      <ul>
        <li className="rounded-sm border border-dashed border-line bg-bg-subtle/40 p-3 text-center text-xs text-ink-3">
          No collisions for the current selection.
        </li>
      </ul>
    );
  }
  return (
    <ul className="space-y-2">
      {collisions.map((c) => {
        const a = PRS.find((p) => p.id === c.prA);
        const b = PRS.find((p) => p.id === c.prB);
        const isActive =
          !!selectedCell &&
          ((selectedCell.prA === c.prA && selectedCell.prB === c.prB) ||
            (selectedCell.prA === c.prB && selectedCell.prB === c.prA));
        return (
          <li
            key={`${c.prA}-${c.prB}`}
            className={cn(
              'cursor-pointer rounded-sm border border-line bg-bg p-2 hover:bg-bg-subtle/40',
              isActive && 'border-accent/60 bg-accent-soft/30',
            )}
            onClick={() => onSelectCell(c.prA, c.prB)}
          >
            <div className="flex items-center gap-2">
              <Chip tone="muted" size="xs">
                #{a?.number ?? '?'} ↔ #{b?.number ?? '?'}
              </Chip>
              <Chip tone={SEVERITY_TONE[c.severity]} size="xs">
                {SEVERITY_LABEL[c.severity]}
              </Chip>
              <span className="font-mono text-[10px] text-ink-3">{c.file}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-ink-1">
              {c.description}
            </p>
            <Chip tone="hint" size="xs" className="mt-1">
              <Icon.Bulb className="h-3 w-3" /> {c.suggestedResolver}
            </Chip>
          </li>
        );
      })}
    </ul>
  );
}
