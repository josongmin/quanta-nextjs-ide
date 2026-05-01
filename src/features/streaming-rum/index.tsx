import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, OverlayPanel } from '@shared/ui';
import {
  rangeDays,
  routeById,
  sampleSessions,
  type DateRange,
  type Percentile,
} from './helpers';
import { RumToolbar } from './parts/rum-toolbar';
import { StreamTrack } from './parts/stream-track';
import { HistoryTrack } from './parts/history-track';
import { ChunkTable } from './parts/chunk-table';
import { ChunkDetail } from './parts/chunk-detail';
import { SessionsPopover } from './parts/sessions-popover';

export function StreamingRumOverlay() {
  const open = useUiStore((s) => s.overlays.streamingRum.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [routeId, setRouteId] = useState<string>('product-detail');
  const [percentile, setPercentile] = useState<Percentile>('p75');
  const [range, setRange] = useState<DateRange>('14d');
  const [selectedChunk, setSelectedChunk] = useState<string>('c3');

  const route = routeById(routeId);
  const days = rangeDays(range);
  const trimmedHistory = useMemo(
    () => route.history.slice(-days),
    [route, days],
  );

  const maxChunkMs = useMemo(() => {
    let m = 0;
    for (const c of route.chunks) if (c.arrivalMs > m) m = c.arrivalMs;
    for (const v of route.vitals) if (v.ms > m) m = v.ms;
    return Math.ceil(m * 1.05);
  }, [route]);

  const maxChunkBytes = useMemo(() => {
    let m = 0;
    for (const c of route.chunks) if (c.bytes > m) m = c.bytes;
    return m;
  }, [route]);

  const historyMax = useMemo(() => {
    let m = 0;
    for (const h of trimmedHistory) if (h.p95 > m) m = h.p95;
    return Math.ceil(m * 1.05);
  }, [trimmedHistory]);

  const selected =
    route.chunks.find((c) => c.id === selectedChunk) ?? route.chunks[0];

  const sessions = useMemo(() => sampleSessions(routeId), [routeId]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('streamingRum')}
      title="Streaming RUM"
      subtitle="Per-chunk Web Vitals & history bands"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-ink-3">
            <span>
              <span className="text-ink-2">route:</span>{' '}
              <span className="font-mono text-ink-1">{route.label}</span>
            </span>
            <span>
              <span className="text-ink-2">sessions:</span>{' '}
              <span className="font-mono text-ink-1">{route.sessionsCount}</span>
            </span>
            <span>
              <span className="text-ink-2">chunks:</span>{' '}
              <span className="font-mono text-ink-1">{route.chunks.length}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <SessionsPopover route={route} sessions={sessions} />
            <Button
              size="xs"
              tone="accent"
              onClick={() =>
                toast.success(`Optimization plan generated for ${route.label}`)
              }
            >
              Generate optimization plan
            </Button>
          </div>
        </div>
      }
    >
      <RumToolbar
        routeId={routeId}
        percentile={percentile}
        range={range}
        onRouteChange={(id, firstChunkId) => {
          setRouteId(id);
          setSelectedChunk(firstChunkId);
        }}
        onPercentileChange={setPercentile}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <main className="min-w-0 px-3 py-3">
          <StreamTrack
            route={route}
            selectedChunk={selectedChunk}
            maxChunkMs={maxChunkMs}
            maxChunkBytes={maxChunkBytes}
            onSelectChunk={setSelectedChunk}
          />
          <HistoryTrack
            trimmedHistory={trimmedHistory}
            historyMax={historyMax}
            range={range}
            percentile={percentile}
          />
          <ChunkTable
            route={route}
            selectedChunk={selectedChunk}
            onSelect={setSelectedChunk}
          />
        </main>

        <aside className="min-w-0 px-3 py-3">
          <h4 className="mb-2 text-[10px] uppercase tracking-caps text-ink-3">
            Selected chunk
          </h4>
          <ChunkDetail chunk={selected} />
        </aside>
      </div>
    </OverlayPanel>
  );
}
