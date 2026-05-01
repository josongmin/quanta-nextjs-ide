import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { CONTENT_TYPES } from '../helpers';

interface ToolbarProps {
  typeId: string;
  onTypeChange(id: string): void;
  relOnly: boolean;
  onRelOnlyToggle(): void;
}

export function Toolbar({ typeId, onTypeChange, relOnly, onRelOnlyToggle }: ToolbarProps) {
  return (
    <PanelHeader>
      <span className="tracking-caps text-ink-3">type</span>
      <div className="flex flex-wrap items-center gap-1">
        {CONTENT_TYPES.map((t) => (
          <ToggleChip
            key={t.id}
            active={typeId === t.id}
            onClick={() => onTypeChange(t.id)}
          >
            {t.name}
          </ToggleChip>
        ))}
      </div>
      <div className="ml-auto">
        <ToggleChip active={relOnly} onClick={onRelOnlyToggle}>
          relations only
        </ToggleChip>
      </div>
    </PanelHeader>
  );
}
