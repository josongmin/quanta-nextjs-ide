import { ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { ALL_LICENSES, ALL_SUPPLIERS } from '../helpers';

interface ToolbarProps {
  query: string;
  onQueryChange(s: string): void;
  activeLicenses: ReadonlyArray<string>;
  onToggleLicense(l: string): void;
  supplier: string;
  onSupplierChange(s: string): void;
}

export function Toolbar({
  query,
  onQueryChange,
  activeLicenses,
  onToggleLicense,
  supplier,
  onSupplierChange,
}: ToolbarProps) {
  return (
    <PanelHeader>
      <div className="w-48">
        <SearchInput value={query} onChange={onQueryChange} placeholder="package" />
      </div>
      <span className="hairline-r mx-1 h-4" />
      <span className="text-caps text-ink-3">License</span>
      <ScrollArea className="max-w-[420px]">
        <div className="flex items-center gap-1 pb-0.5">
          {ALL_LICENSES.map((l) => (
            <ToggleChip
              key={l}
              active={activeLicenses.includes(l)}
              onClick={() => onToggleLicense(l)}
            >
              {l}
            </ToggleChip>
          ))}
        </div>
      </ScrollArea>
      <span className="hairline-r mx-1 h-4" />
      <SelectControl<string>
        label="Supplier"
        value={supplier}
        onChange={onSupplierChange}
        options={[
          { value: 'all', label: 'All' },
          ...ALL_SUPPLIERS.map((s) => ({ value: s, label: s })),
        ]}
      />
    </PanelHeader>
  );
}
