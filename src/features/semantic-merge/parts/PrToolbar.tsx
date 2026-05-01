import { toast } from 'sonner';
import { Button, Icon } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { COLLISIONS, PRS } from '../helpers';

interface PrToolbarProps {
  selectedPrs: ReadonlyArray<string>;
  onTogglePr(id: string): void;
}

export function PrToolbar({ selectedPrs, onTogglePr }: PrToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
      <span className="text-caps text-ink-3">PRs</span>
      {PRS.map((pr) => (
        <ToggleChip
          key={pr.id}
          active={selectedPrs.includes(pr.id)}
          onClick={() => onTogglePr(pr.id)}
          title={pr.title}
        >
          #{pr.number} {pr.author}
        </ToggleChip>
      ))}
      <Button
        size="xs"
        tone="ghost"
        className="ml-auto"
        onClick={() =>
          toast(`Detected ${COLLISIONS.length} collisions across ${PRS.length} PRs (mock)`)
        }
      >
        <Icon.Search className="h-3 w-3" /> Detect collisions
      </Button>
    </div>
  );
}
