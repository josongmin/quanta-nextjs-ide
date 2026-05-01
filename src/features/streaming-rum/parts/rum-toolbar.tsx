import { PanelHeader } from '@shared/ui/panel-header';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  ROUTES,
  type DateRange,
  type Percentile,
} from '../helpers';

interface RumToolbarProps {
  routeId: string;
  percentile: Percentile;
  range: DateRange;
  onRouteChange: (id: string, firstChunkId: string) => void;
  onPercentileChange: (v: Percentile) => void;
  onRangeChange: (v: DateRange) => void;
}

export function RumToolbar({
  routeId,
  percentile,
  range,
  onRouteChange,
  onPercentileChange,
  onRangeChange,
}: RumToolbarProps): JSX.Element {
  return (
    <PanelHeader>
      <span className="text-[10px] uppercase tracking-caps text-ink-3">route</span>
      {ROUTES.map((r) => (
        <ToggleChip
          key={r.id}
          active={routeId === r.id}
          onClick={() => onRouteChange(r.id, r.chunks[0]?.id ?? 'c1')}
        >
          {r.label}
        </ToggleChip>
      ))}
      <span className="h-4 w-px bg-line" aria-hidden />
      <SelectControl<Percentile>
        label="pct"
        value={percentile}
        onChange={onPercentileChange}
        options={[
          { value: 'p50', label: 'p50' },
          { value: 'p75', label: 'p75' },
          { value: 'p95', label: 'p95' },
        ]}
      />
      <SelectControl<DateRange>
        label="range"
        value={range}
        onChange={onRangeChange}
        options={[
          { value: '7d', label: '7d' },
          { value: '14d', label: '14d' },
          { value: '30d', label: '30d' },
        ]}
      />
    </PanelHeader>
  );
}
