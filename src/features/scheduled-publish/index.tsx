import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { OverlayPanel, ScrollArea } from '@shared/ui';
import {
  SCHEDULED_ITEMS,
  inRange,
  statusCounts,
  type PublishStatus,
  type RangeId,
  type ScheduledItem,
} from './helpers';
import { FilterBar } from './parts/FilterBar';
import { FooterBar } from './parts/FooterBar';
import { QueueTable } from './parts/QueueTable';
import { RightRail } from './parts/RightRail';
import { Timeline } from './parts/Timeline';

type SortKey = 'when' | 'type' | 'status';

export function ScheduledPublishOverlay() {
  const open = useUiStore((s) => s.overlays.scheduledPublish.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [range, setRange] = useState<RangeId>('today');
  const [statusSet, setStatusSet] = useState<ReadonlyArray<PublishStatus>>([
    'scheduled',
    'publishing',
    'published',
    'failed',
    'cancelled',
  ]);
  const [typeFilter, setTypeFilter] = useState<ScheduledItem['contentType'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('when');
  const [selectedId, setSelectedId] = useState<string>(SCHEDULED_ITEMS[0]?.id ?? '');

  const filtered = useMemo(() => {
    return SCHEDULED_ITEMS.filter((it) => {
      if (!inRange(it, range)) return false;
      if (!statusSet.includes(it.status)) return false;
      if (typeFilter !== 'all' && it.contentType !== typeFilter) return false;
      return true;
    });
  }, [range, statusSet, typeFilter]);

  const sorted = useMemo(() => {
    const arr = filtered.slice();
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'when':
          return a.scheduledFor.localeCompare(b.scheduledFor);
        case 'type':
          return a.contentType.localeCompare(b.contentType);
        case 'status':
          return a.status.localeCompare(b.status);
      }
    });
    return arr;
  }, [filtered, sortKey]);

  const selected = SCHEDULED_ITEMS.find((it) => it.id === selectedId);
  const counts = statusCounts(filtered);

  function toggleStatus(s: PublishStatus) {
    setStatusSet((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('scheduledPublish')}
      title="Scheduled publish queue"
      subtitle={`${filtered.length} items · ${range}`}
      size="xl"
      footer={<FooterBar counts={counts} />}
    >
      <FilterBar
        range={range}
        onRangeChange={setRange}
        statusSet={statusSet}
        onToggleStatus={toggleStatus}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <ScrollArea className="h-[560px]">
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              24h timeline
            </div>
            <Timeline
              items={sorted.filter((it) => it.day === 'today' || range !== 'today')}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <QueueTable
              items={sorted}
              selectedId={selectedId}
              onSelect={setSelectedId}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
            />
          </div>
        </ScrollArea>

        <RightRail selected={selected} />
      </div>
    </OverlayPanel>
  );
}
