import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  TRACK_H,
  TRACK_W,
  VITAL_FILL,
  VITAL_STROKE,
  vitalChipTone,
  type RouteStream,
  type Vital,
} from '../helpers';

interface StreamTrackProps {
  route: RouteStream;
  selectedChunk: string;
  maxChunkMs: number;
  maxChunkBytes: number;
  onSelectChunk: (id: string) => void;
}

export function StreamTrack({
  route,
  selectedChunk,
  maxChunkMs,
  maxChunkBytes,
  onSelectChunk,
}: StreamTrackProps): JSX.Element {
  const chunkX = (ms: number): number =>
    12 + (ms / maxChunkMs) * (TRACK_W - 24);

  return (
    <div className="rounded-sm border border-line bg-bg-subtle px-2 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          Stream timeline (this session)
        </span>
        <div className="flex items-center gap-1">
          {(['FCP', 'LCP', 'INP', 'TTI'] as ReadonlyArray<Vital>).map((v) => (
            <Chip key={v} tone={vitalChipTone(v)} size="xs">
              {v}
            </Chip>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${TRACK_W} ${TRACK_H}`}
        className="w-full"
        role="img"
        aria-label="Streaming chunk timeline"
      >
        <line
          x1={12}
          x2={TRACK_W - 12}
          y1={TRACK_H - 24}
          y2={TRACK_H - 24}
          className="stroke-line"
          strokeWidth={1}
        />
        {route.chunks.map((c) => {
          const x = chunkX(c.arrivalMs);
          const h =
            maxChunkBytes === 0
              ? 8
              : Math.max(6, (c.bytes / maxChunkBytes) * 50);
          const isSel = c.id === selectedChunk;
          return (
            <g
              key={c.id}
              className="cursor-pointer"
              onClick={() => onSelectChunk(c.id)}
            >
              <rect
                x={x - 6}
                y={TRACK_H - 24 - h}
                width={12}
                height={h}
                rx={2}
                className={cn(
                  isSel
                    ? 'fill-accent stroke-accent'
                    : 'fill-bg stroke-line-strong',
                )}
                strokeWidth={1}
              />
              <text
                x={x}
                y={TRACK_H - 8}
                textAnchor="middle"
                fontSize={9}
                className={cn(
                  'pointer-events-none font-mono',
                  isSel ? 'fill-accent' : 'fill-ink-3',
                )}
              >
                {c.id}
              </text>
            </g>
          );
        })}
        {route.vitals.map((v) => {
          const x = chunkX(v.ms);
          return (
            <g key={v.vital}>
              <line
                x1={x}
                x2={x}
                y1={4}
                y2={TRACK_H - 24}
                className={VITAL_STROKE[v.vital]}
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
              <rect
                x={x - 12}
                y={2}
                width={24}
                height={12}
                rx={3}
                className={cn(VITAL_FILL[v.vital], 'opacity-90')}
              />
              <text
                x={x}
                y={11}
                textAnchor="middle"
                fontSize={9}
                className="pointer-events-none fill-white font-mono"
              >
                {v.vital}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
