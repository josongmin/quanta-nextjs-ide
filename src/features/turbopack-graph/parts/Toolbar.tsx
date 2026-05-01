import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { KIND_OPTIONS, SNAPSHOTS, type Bundler, type ModuleKind } from '../helpers';

interface ToolbarProps {
  bundler: Bundler;
  onBundlerChange(b: Bundler): void;
  search: string;
  onSearchChange(s: string): void;
  kindFilter: ModuleKind | 'all';
  onKindFilterChange(k: ModuleKind | 'all'): void;
  hmrOnly: boolean;
  onHmrOnlyChange(v: boolean): void;
}

export function Toolbar({
  bundler,
  onBundlerChange,
  search,
  onSearchChange,
  kindFilter,
  onKindFilterChange,
  hmrOnly,
  onHmrOnlyChange,
}: ToolbarProps) {
  return (
    <PanelHeader>
      <span className="text-[10px] uppercase tracking-caps text-ink-3">bundler</span>
      {SNAPSHOTS.map((s) => (
        <ToggleChip
          key={s.id}
          active={bundler === s.id}
          onClick={() => onBundlerChange(s.id)}
        >
          {s.label}
        </ToggleChip>
      ))}
      <span className="h-4 w-px bg-line" aria-hidden />
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search module"
        className="w-44"
      />
      <span className="h-4 w-px bg-line" aria-hidden />
      <span className="text-[10px] uppercase tracking-caps text-ink-3">kind</span>
      {KIND_OPTIONS.map((k) => (
        <ToggleChip
          key={k.id}
          active={kindFilter === k.id}
          onClick={() => onKindFilterChange(k.id)}
        >
          {k.label}
        </ToggleChip>
      ))}
      <span className="h-4 w-px bg-line" aria-hidden />
      <ToggleChip active={hmrOnly} onClick={() => onHmrOnlyChange(!hmrOnly)}>
        HMR boundaries only
      </ToggleChip>
    </PanelHeader>
  );
}
