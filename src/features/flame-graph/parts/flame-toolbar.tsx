import { Button } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { ALL_KINDS, ROOT_ID, type FrameKind } from '../helpers';

interface FlameToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeKinds: ReadonlyArray<FrameKind>;
  onToggleKind: (k: FrameKind) => void;
  focusId: string;
  focusedName: string;
  onResetFocus: () => void;
}

export function FlameToolbar({
  search,
  onSearchChange,
  activeKinds,
  onToggleKind,
  focusId,
  focusedName,
  onResetFocus,
}: FlameToolbarProps) {
  return (
    <PanelHeader>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search frame name"
        className="w-56"
      />
      <span className="h-4 w-px bg-line" aria-hidden />
      <span className="text-[10px] uppercase tracking-caps text-ink-3">
        kinds
      </span>
      {ALL_KINDS.map((k) => {
        const active = activeKinds.includes(k);
        return (
          <ToggleChip key={k} active={active} onClick={() => onToggleKind(k)}>
            {k}
          </ToggleChip>
        );
      })}
      <span className="ml-auto inline-flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          focus:
        </span>
        <span className="font-mono text-[11px] text-ink-1">{focusedName}</span>
        {focusId !== ROOT_ID && (
          <Button size="xs" tone="ghost" onClick={onResetFocus}>
            Reset
          </Button>
        )}
      </span>
    </PanelHeader>
  );
}
