import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  CONTENT_TYPES,
  RANGES,
  STATUSES,
  type PublishStatus,
  type RangeId,
  type ScheduledItem,
} from '../helpers';

interface FilterBarProps {
  range: RangeId;
  onRangeChange(r: RangeId): void;
  statusSet: ReadonlyArray<PublishStatus>;
  onToggleStatus(s: PublishStatus): void;
  typeFilter: ScheduledItem['contentType'] | 'all';
  onTypeFilterChange(t: ScheduledItem['contentType'] | 'all'): void;
}

export function FilterBar({
  range,
  onRangeChange,
  statusSet,
  onToggleStatus,
  typeFilter,
  onTypeFilterChange,
}: FilterBarProps) {
  return (
    <PanelHeader>
      <div className="flex items-center gap-1">
        {RANGES.map((r) => (
          <ToggleChip
            key={r.id}
            active={range === r.id}
            onClick={() => onRangeChange(r.id)}
          >
            {r.label}
          </ToggleChip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {STATUSES.map((s) => (
          <ToggleChip
            key={s}
            active={statusSet.includes(s)}
            onClick={() => onToggleStatus(s)}
          >
            {s}
          </ToggleChip>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ToggleChip
          active={typeFilter === 'all'}
          onClick={() => onTypeFilterChange('all')}
        >
          all types
        </ToggleChip>
        {CONTENT_TYPES.map((t) => (
          <ToggleChip
            key={t}
            active={typeFilter === t}
            onClick={() => onTypeFilterChange(t)}
          >
            {t}
          </ToggleChip>
        ))}
      </div>
    </PanelHeader>
  );
}
