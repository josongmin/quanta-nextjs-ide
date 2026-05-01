import { useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useBoundaryStore } from '@entities/boundary';
import type { LayoutInfo } from '@shared/types';
import { Chip, Icon, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { RscTraceSection } from '../parts/rsc-trace-section';

type SortKey = 'pollution' | 'routes' | 'file';

const SORT_OPTIONS: ReadonlyArray<FilterChipOption<SortKey>> = [
  { value: 'pollution', label: 'Pollution' },
  { value: 'routes', label: 'Routes' },
  { value: 'file', label: 'File' },
];

function pollutionTone(score: number) {
  return match<number, 'static' | 'info' | 'warn' | 'err'>(score)
    .when((s) => s >= 60, () => 'err')
    .when((s) => s >= 40, () => 'warn')
    .when((s) => s >= 20, () => 'info')
    .otherwise(() => 'static');
}

interface CheckProps {
  ok: boolean;
  label: string;
  positiveIsBad?: boolean;
}
function Check({ ok, label, positiveIsBad }: CheckProps) {
  // For cookies/headers/client-boundary in layouts, "uses=true" is suspicious.
  const isBad = positiveIsBad ? ok : !ok;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px]',
        isBad ? 'text-sev-warn' : 'text-ink-3',
      )}
      title={`${label}: ${ok ? 'present' : 'absent'}`}
    >
      {label}
      <span className={cn('font-bold', isBad ? 'text-sev-warn' : 'text-sem-static')}>
        {ok ? '✓' : '✗'}
      </span>
    </span>
  );
}

function LayoutRow({ layout }: { layout: LayoutInfo }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => toast('Open layout', { description: layout.file })}
      className="group flex h-8 items-center gap-2 px-2 text-xs hover:bg-bg-hover"
    >
      <Icon.Layers className="h-3 w-3 text-ink-3" />
      <span className="font-mono text-ink-1">{layout.file}</span>
      <Chip tone="muted" size="xs">
        {layout.affectedRouteCount} routes
      </Chip>
      <span className="ml-auto inline-flex items-center gap-2">
        <Check ok={layout.usesCookies} label="cookies" positiveIsBad />
        <Check ok={layout.usesHeaders} label="headers" positiveIsBad />
        <Check ok={layout.isClientBoundary} label="client" positiveIsBad />
      </span>
      <Tooltip content="Click to open Layout Pollution panel">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast('Open Layout Pollution panel', {
              description: `${layout.file} · score ${layout.pollutionScore}`,
            });
          }}
        >
          <Chip
            tone={pollutionTone(layout.pollutionScore)}
            size="xs"
            className="font-semibold"
          >
            pol {layout.pollutionScore}
          </Chip>
        </button>
      </Tooltip>
      {layout.pollutionScore >= 60 && (
        <span className="text-sev-warn">
          <Icon.Alert className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}

export function LayoutsTab() {
  const layouts = useBoundaryStore((s) => s.layouts);
  const [sort, setSort] = useState<SortKey>('pollution');

  const sorted = useMemo(() => {
    const list = [...layouts];
    return match(sort)
      .with('pollution', () => list.sort((a, b) => b.pollutionScore - a.pollutionScore))
      .with('routes', () => list.sort((a, b) => b.affectedRouteCount - a.affectedRouteCount))
      .with('file', () => list.sort((a, b) => a.file.localeCompare(b.file)))
      .exhaustive();
  }, [layouts, sort]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <span className="text-[10px] tracking-caps text-ink-3">SORT</span>
        <FilterChipGroup
          options={SORT_OPTIONS}
          value={sort}
          onChange={(v) => setSort(v)}
        />
        <span className="ml-auto text-[10px] text-ink-3">{layouts.length} layouts</span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/70">
        {sorted.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No layouts
          </div>
        ) : (
          sorted.map((l) => <LayoutRow key={l.id} layout={l} />)
        )}
        <RscTraceSection mode="layouts" />
      </div>
    </div>
  );
}
