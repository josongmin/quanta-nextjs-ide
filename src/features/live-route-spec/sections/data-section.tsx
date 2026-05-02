import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecDataSummary } from '../types';

interface Props {
  data: ReadonlyArray<RouteSpecDataSummary>;
  className?: string;
}

const kindTone = (kind: RouteSpecDataSummary['kind']) => {
  switch (kind) {
    case 'fetch':
      return 'info' as const;
    case 'db':
      return 'accent' as const;
    case 'helper':
      return 'muted' as const;
    case 'cache':
      return 'static' as const;
  }
};

export function DataSection({ data, className }: Props) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1 text-caps text-[10px] uppercase tracking-wide text-ink-3">
        <span>Data</span>
        <span className="nums-tabular text-ink-2">·</span>
        <span className="nums-tabular text-ink-2">{data.length}</span>
      </div>
      {data.length === 0 ? (
        <span className="text-[11px] text-ink-3">no data sources</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {data.slice(0, 4).map((d) => (
            <Chip
              key={d.id}
              tone={kindTone(d.kind)}
              size="xs"
              className="font-mono"
              title={
                d.revalidate !== null
                  ? `${d.kind} · revalidate ${d.revalidate}s`
                  : d.kind
              }
            >
              {d.name}
            </Chip>
          ))}
          {data.length > 4 ? (
            <Chip tone="muted" size="xs">+{data.length - 4}</Chip>
          ) : null}
        </div>
      )}
    </div>
  );
}
