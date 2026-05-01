import { useMemo } from 'react';
import { KIND_LABEL, KIND_TONE, type RscChunk } from '@entities/rsc-payload';
import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface WaterfallViewProps {
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  occurrences: ReadonlyMap<string, number>;
  onSelect(id: string): void;
  selectedId: string;
}

interface Lane {
  id: string;
  kind: RscChunk['kind'];
  label: string;
  emissions: ReadonlyArray<{ at: number; size: number }>;
  firstAt: number;
  lastAt: number;
  parent?: string;
  isClient: boolean;
}

const KIND_BAR_COLOR: Record<RscChunk['kind'], string> = {
  module: 'bg-edge',
  element: 'bg-accent',
  reference: 'bg-info',
  hint: 'bg-static',
  text: 'bg-ink-3',
};

export function WaterfallView({
  chunks,
  totalMs,
  occurrences,
  onSelect,
  selectedId,
}: WaterfallViewProps) {
  const lanes = useMemo<Lane[]>(() => {
    const byId = new Map<string, Lane>();
    for (const c of chunks) {
      const existing = byId.get(c.id);
      if (existing) {
        (existing.emissions as { at: number; size: number }[]).push({
          at: c.arrivedAtMs,
          size: c.sizeBytes,
        });
        if (c.arrivedAtMs > existing.lastAt) existing.lastAt = c.arrivedAtMs;
      } else {
        byId.set(c.id, {
          id: c.id,
          kind: c.kind,
          label: c.label ?? c.id,
          emissions: [{ at: c.arrivedAtMs, size: c.sizeBytes }],
          firstAt: c.arrivedAtMs,
          lastAt: c.arrivedAtMs,
          parent: c.parent,
          isClient: c.environment === 'client',
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.firstAt - b.firstAt);
  }, [chunks]);

  const tEnd = Math.max(1, totalMs);
  const ticks = useMemo(() => {
    const step = pickTickStep(tEnd);
    const out: number[] = [];
    for (let t = 0; t <= tEnd; t += step) out.push(t);
    return out;
  }, [tEnd]);

  if (chunks.length === 0) {
    return (
      <div className="flex h-[460px] items-center justify-center text-xs text-ink-3">
        Fetch a route to see the chunk waterfall
      </div>
    );
  }

  return (
    <div className="flex h-[460px] flex-col">
      {/* Time axis */}
      <div className="relative h-7 hairline-b bg-bg-subtle">
        <div className="grid h-full grid-cols-[200px_1fr] items-center">
          <div className="px-3 text-caps text-ink-3">chunk</div>
          <div className="relative h-full">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-1.5 -translate-x-1/2 font-mono text-[10px] text-ink-3"
                style={{ left: `${(t / tEnd) * 100}%` }}
              >
                {t}ms
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lanes */}
      <ScrollArea className="flex-1">
        <div>
          {lanes.map((lane) => {
            const isSelected = lane.id === selectedId;
            const occ = occurrences.get(lane.id) ?? 1;
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => onSelect(lane.id)}
                className={cn(
                  'grid w-full grid-cols-[200px_1fr] items-center gap-2 hairline-b text-left hover:bg-bg-hover',
                  isSelected && 'bg-accent-soft',
                )}
              >
                {/* Lane label */}
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <span className="w-7 font-mono text-[10px] text-ink-3">
                    {lane.id}
                  </span>
                  <Chip tone={KIND_TONE[lane.kind]} size="xs">
                    {KIND_LABEL[lane.kind]}
                  </Chip>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1">
                    {lane.label}
                  </span>
                  {lane.isClient ? (
                    <Chip tone="edge" size="xs">
                      client
                    </Chip>
                  ) : null}
                  {occ > 1 ? (
                    <Chip tone="info" size="xs">
                      ×{occ}
                    </Chip>
                  ) : null}
                </div>

                {/* Bar lane */}
                <div className="relative h-5">
                  {/* Connecting line if multiple emissions */}
                  {lane.emissions.length > 1 ? (
                    <div
                      aria-hidden
                      className="absolute top-1/2 h-px -translate-y-1/2 bg-line-1"
                      style={{
                        left: `${(lane.firstAt / tEnd) * 100}%`,
                        width: `${((lane.lastAt - lane.firstAt) / tEnd) * 100}%`,
                      }}
                    />
                  ) : null}
                  {lane.emissions.map((e, i) => (
                    <div
                      key={`${lane.id}_${i}`}
                      className={cn(
                        'absolute top-1 h-3 rounded-sm',
                        KIND_BAR_COLOR[lane.kind],
                      )}
                      style={{
                        left: `${(e.at / tEnd) * 100}%`,
                        width: `${Math.max(0.4, Math.min(8, (e.size / 200)))}%`,
                      }}
                      title={`${e.at.toFixed(0)}ms · ${e.size}B`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function pickTickStep(tEnd: number): number {
  if (tEnd <= 100) return 20;
  if (tEnd <= 300) return 50;
  if (tEnd <= 1000) return 100;
  if (tEnd <= 3000) return 500;
  return 1000;
}
