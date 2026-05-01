import { useMemo } from 'react';
import {
  analyzeSuspenseBoundaries,
  type RscChunk,
} from '@entities/rsc-payload';
import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface BoundaryViewProps {
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  onSelect(id: string): void;
}

export function BoundaryView({ chunks, totalMs, onSelect }: BoundaryViewProps) {
  const boundaries = useMemo(() => analyzeSuspenseBoundaries(chunks), [chunks]);

  if (chunks.length === 0) {
    return (
      <div className="flex h-[460px] items-center justify-center text-xs text-ink-3">
        Fetch a route to see Suspense boundaries
      </div>
    );
  }

  const tEnd = Math.max(1, totalMs);

  return (
    <div className="flex h-[460px] flex-col">
      {/* Summary header */}
      <div className="flex items-center gap-3 hairline-b bg-bg-subtle px-3 py-2 text-[11px]">
        <span className="font-mono text-ink-2">
          <span className="text-ink-3">Suspense boundaries</span>{' '}
          <span className="text-ink-1">{boundaries.length}</span>
        </span>
        {boundaries.length > 0 ? (
          <>
            <span className="font-mono text-ink-2">
              <span className="text-ink-3">total wait</span>{' '}
              <span className="text-ink-1">
                {Math.round(
                  boundaries.reduce((s, b) => s + b.fallbackDurationMs, 0),
                )}
                ms
              </span>
            </span>
            <span className="font-mono text-ink-2">
              <span className="text-ink-3">slowest</span>{' '}
              <span className="text-ink-1">
                {Math.round(
                  Math.max(0, ...boundaries.map((b) => b.fallbackDurationMs)),
                )}
                ms
              </span>
            </span>
          </>
        ) : null}
      </div>

      {boundaries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-ink-3">
          No Suspense boundaries in this stream
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div>
            {boundaries.map((b) => {
              const startPct = (b.arrivedAtMs / tEnd) * 100;
              const widthPct = Math.max(
                0.5,
                (b.fallbackDurationMs / tEnd) * 100,
              );
              const tone =
                b.fallbackDurationMs > 200
                  ? 'edge'
                  : b.fallbackDurationMs > 50
                    ? 'info'
                    : 'accent';
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelect(b.id)}
                  className="grid w-full grid-cols-[140px_1fr_120px] items-center gap-3 hairline-b px-3 py-2 text-left hover:bg-bg-hover"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-1">
                      {b.id}
                    </span>
                    <Chip tone="info" size="xs">
                      Suspense
                    </Chip>
                  </div>
                  {/* Bar lane: shows when boundary opened → when last child resolved */}
                  <div className="relative h-3">
                    <div
                      aria-hidden
                      className="absolute top-1/2 h-px -translate-y-1/2 bg-line-1"
                      style={{ left: 0, right: 0 }}
                    />
                    <div
                      className={cn(
                        'absolute top-0 h-3 rounded-sm',
                        tone === 'edge' && 'bg-edge',
                        tone === 'info' && 'bg-info',
                        tone === 'accent' && 'bg-accent',
                      )}
                      style={{
                        left: `${startPct}%`,
                        width: `${widthPct}%`,
                      }}
                      title={`opened @${Math.round(b.arrivedAtMs)}ms, resolved @${Math.round(b.resolvedAtMs)}ms`}
                    />
                  </div>
                  <div className="flex justify-end gap-1">
                    <Chip tone={tone} size="xs">
                      {Math.round(b.fallbackDurationMs)}ms
                    </Chip>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
