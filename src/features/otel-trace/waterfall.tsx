/**
 * Chrome devtools-flavored waterfall: one row per span, indented by depth,
 * showing a horizontal bar positioned by start + duration.
 */

import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { flatten } from './parser';
import type { NormalizedSpan, TraceTree } from './types';

interface Props {
  tree: TraceTree;
  selectedSpanId: string | null;
  onSelect(id: string): void;
}

const formatUs = (us: number): string => {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)}s`;
  if (us >= 1_000) return `${(us / 1_000).toFixed(1)}ms`;
  return `${us.toFixed(0)}µs`;
};

const KIND_TONE: Record<string, 'neutral' | 'info' | 'accent' | 'isr' | 'edge'> = {
  internal: 'neutral',
  server: 'info',
  client: 'accent',
  producer: 'isr',
  consumer: 'edge',
  unspecified: 'neutral',
};

function barColor(span: NormalizedSpan): string {
  if (span.status === 'error') return 'bg-sev-err';
  if (span.kind === 'server') return 'bg-sev-info';
  if (span.kind === 'client') return 'bg-accent';
  if (span.kind === 'producer') return 'bg-sem-isr';
  if (span.kind === 'consumer') return 'bg-sem-edge';
  return 'bg-ink-3';
}

export function Waterfall({ tree, selectedSpanId, onSelect }: Props) {
  const rows = flatten(tree);
  const total = Math.max(1, tree.totalUs);

  return (
    <div className="overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 bg-bg-subtle text-ink-3">
          <tr className="hairline-b">
            <th className="px-3 py-1 text-left font-medium">span</th>
            <th className="px-2 py-1 text-left font-medium">kind</th>
            <th className="w-[260px] px-2 py-1 text-left font-medium">timeline</th>
            <th className="px-2 py-1 text-right font-medium">self</th>
            <th className="px-2 py-1 text-right font-medium">dur</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sp) => {
            const isSelected = selectedSpanId === sp.spanId;
            const left = (sp.startUs / total) * 100;
            const width = Math.max(0.4, (sp.durationUs / total) * 100);
            return (
              <tr
                key={sp.spanId}
                onClick={() => onSelect(sp.spanId)}
                className={cn(
                  'cursor-pointer hairline-b hover:bg-bg-hover',
                  isSelected && 'bg-bg-hover',
                  sp.status === 'error' && 'text-sev-err',
                )}
              >
                <td className="truncate px-3 py-0.5 font-mono">
                  <span style={{ paddingLeft: `${sp.depth * 10}px` }}>
                    {sp.depth > 0 ? '└ ' : ''}
                    {sp.name}
                  </span>
                </td>
                <td className="px-2 py-0.5">
                  <Chip tone={KIND_TONE[sp.kind] ?? 'neutral'} size="xs">
                    {sp.kind}
                  </Chip>
                </td>
                <td className="px-2 py-0.5">
                  <div className="relative h-3 w-full rounded-sm bg-bg-subtle">
                    <div
                      className={cn(
                        'absolute top-0 h-3 rounded-sm',
                        barColor(sp),
                        isSelected && 'ring-1 ring-accent',
                      )}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </td>
                <td className="px-2 py-0.5 text-right font-mono text-ink-2">
                  {formatUs(sp.selfUs)}
                </td>
                <td className="px-2 py-0.5 text-right font-mono text-ink-2">
                  {formatUs(sp.durationUs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
