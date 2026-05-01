import { Chip, Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { formatUsd, type CostDiff } from './calculator';
import type { CostBucket } from './model';

const BUCKET_TONE: Record<CostBucket, 'static' | 'isr' | 'dynamic' | 'edge'> = {
  static: 'static',
  isr: 'isr',
  ssr: 'dynamic',
  edge: 'edge',
};

const BUCKET_LABEL: Record<CostBucket, string> = {
  static: 'static',
  isr: 'ISR',
  ssr: 'SSR',
  edge: 'edge',
};

interface Props {
  diffs: ReadonlyArray<CostDiff>;
  totalDelta: number;
}

export function DiffCard({ diffs, totalDelta }: Props) {
  if (diffs.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-bg-subtle/40 p-3 text-[11px] text-ink-3">
        No rendering changes since the snapshot. Click <em>Snapshot baseline</em>{' '}
        to lock in the current modes, then change a route to see a diff.
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-accent/30 bg-accent-soft/30">
      <div className="flex items-center justify-between border-b border-accent/30 px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-1">
          <Icon.Alert className="h-3.5 w-3.5 text-sev-warn" />
          Cost change vs baseline
        </span>
        <span
          className={cn(
            'font-mono text-[12px]',
            totalDelta > 0 ? 'text-sev-err' : 'text-sem-static',
          )}
        >
          {totalDelta > 0 ? '+' : ''}
          {formatUsd(totalDelta)}/mo
        </span>
      </div>
      <ul>
        {diffs.map((d) => {
          const sign = d.monthlyDelta >= 0 ? '+' : '';
          return (
            <li key={d.routeId} className="flex items-center gap-2 px-2.5 py-1 text-[11px] hairline-b last:border-b-0">
              <span className="flex-1 truncate font-mono text-ink-1">
                {d.path}
              </span>
              <Chip tone={BUCKET_TONE[d.fromBucket]} size="xs">
                {BUCKET_LABEL[d.fromBucket]}
              </Chip>
              <Icon.Right className="h-3 w-3 text-ink-3" />
              <Chip tone={BUCKET_TONE[d.toBucket]} size="xs">
                {BUCKET_LABEL[d.toBucket]}
              </Chip>
              <span
                className={cn(
                  'w-16 shrink-0 text-right font-mono text-[10px]',
                  d.monthlyDelta > 0 ? 'text-sev-err' : 'text-sem-static',
                )}
              >
                {sign}
                {formatUsd(d.monthlyDelta)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
