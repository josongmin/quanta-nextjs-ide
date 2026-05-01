import { useMemo } from 'react';
import {
  diffSnapshots,
  KIND_LABEL,
  KIND_TONE,
  type ChunkDiffStatus,
  type PayloadSnapshot,
} from '@entities/rsc-payload';
import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';

const STATUS_TONE: Record<ChunkDiffStatus, 'accent' | 'edge' | 'info' | 'muted'> = {
  added: 'accent',
  removed: 'edge',
  changed: 'info',
  unchanged: 'muted',
};

const STATUS_GLYPH: Record<ChunkDiffStatus, string> = {
  added: '+',
  removed: '−',
  changed: '~',
  unchanged: '·',
};

interface DiffViewProps {
  before: PayloadSnapshot;
  after: PayloadSnapshot;
}

export function DiffView({ before, after }: DiffViewProps) {
  const diff = useMemo(() => diffSnapshots(before, after), [before, after]);

  return (
    <div className="flex h-[460px] flex-col">
      {/* summary bar */}
      <div className="flex items-center gap-3 hairline-b bg-bg-subtle px-3 py-2 text-[11px]">
        <span className="font-mono text-ink-2">
          <span className="text-ink-3">A</span> {before.label}
        </span>
        <span className="text-ink-3">→</span>
        <span className="font-mono text-ink-2">
          <span className="text-ink-3">B</span> {after.label}
        </span>
        <span className="ml-auto flex gap-1.5">
          <Chip tone="accent" size="xs">
            +{diff.added}
          </Chip>
          <Chip tone="edge" size="xs">
            −{diff.removed}
          </Chip>
          <Chip tone="info" size="xs">
            ~{diff.changed}
          </Chip>
          <Chip tone="muted" size="xs">
            ={diff.unchanged}
          </Chip>
          <Chip
            tone={diff.totalSizeDelta === 0 ? 'muted' : diff.totalSizeDelta > 0 ? 'edge' : 'accent'}
            size="xs"
          >
            {formatDelta(diff.totalSizeDelta)}B
          </Chip>
          <Chip
            tone={diff.totalTimeDelta === 0 ? 'muted' : diff.totalTimeDelta > 0 ? 'edge' : 'accent'}
            size="xs"
          >
            {formatDelta(Math.round(diff.totalTimeDelta))}ms
          </Chip>
        </span>
      </div>

      {/* entries */}
      <ScrollArea className="flex-1">
        <div>
          {diff.entries.map((entry) => {
            const ref = entry.after ?? entry.before;
            if (!ref) return null;
            const label = ref.label ?? ref.payload.slice(0, 40);
            const sizeDelta = entry.sizeDeltaBytes;
            const timeDelta = entry.timeDeltaMs;
            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-2 hairline-b px-3 py-1.5',
                  entry.status === 'unchanged' && 'opacity-60',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'w-4 text-center font-mono text-[11px]',
                    entry.status === 'added' && 'text-accent',
                    entry.status === 'removed' && 'text-edge',
                    entry.status === 'changed' && 'text-info',
                    entry.status === 'unchanged' && 'text-ink-3',
                  )}
                >
                  {STATUS_GLYPH[entry.status]}
                </span>
                <span className="w-8 font-mono text-[11px] text-ink-3">
                  {entry.id}
                </span>
                <Chip tone={KIND_TONE[ref.kind]} size="xs">
                  {KIND_LABEL[ref.kind]}
                </Chip>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1">
                  {label}
                </span>
                <Chip tone={STATUS_TONE[entry.status]} size="xs">
                  {entry.status}
                </Chip>
                {sizeDelta !== 0 ? (
                  <span
                    className={cn(
                      'font-mono text-[10px]',
                      sizeDelta > 0 ? 'text-edge' : 'text-accent',
                    )}
                  >
                    {formatDelta(sizeDelta)}B
                  </span>
                ) : null}
                {timeDelta !== 0 && Math.abs(timeDelta) >= 1 ? (
                  <span
                    className={cn(
                      'font-mono text-[10px]',
                      timeDelta > 0 ? 'text-edge' : 'text-accent',
                    )}
                  >
                    {formatDelta(Math.round(timeDelta))}ms
                  </span>
                ) : null}
              </div>
            );
          })}
          {diff.entries.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-ink-3">
              No chunks in either snapshot
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function formatDelta(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}
