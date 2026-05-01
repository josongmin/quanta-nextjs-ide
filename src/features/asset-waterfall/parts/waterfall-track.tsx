import { Chip, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  kindFill,
  kindLight,
  kindTone,
  type Asset,
  type AssetRoute,
} from '../helpers';

const LABEL_W = 260;
const TRACK_W = 560;
const ROW_H = 18;

interface WaterfallTrackProps {
  route: AssetRoute;
  filtered: ReadonlyArray<Asset>;
  duration: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function WaterfallTrack({
  route,
  filtered,
  duration,
  selectedId,
  onSelect,
}: WaterfallTrackProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-bg">
      {/* axis header */}
      <div
        className="grid hairline-b bg-bg-subtle text-[10px] text-ink-3"
        style={{ gridTemplateColumns: `${LABEL_W}px 1fr` }}
      >
        <div className="px-2 py-1.5 uppercase tracking-caps">asset</div>
        <div className="relative h-8">
          <svg
            viewBox={`0 0 ${TRACK_W} 32`}
            preserveAspectRatio="none"
            className="block h-full w-full"
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const x = (TRACK_W * i) / 6;
              const t = Math.round((duration * i) / 6);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={24}
                    y2={32}
                    className="stroke-line"
                    strokeWidth={0.5}
                  />
                  <text x={x + 2} y={20} fontSize={9} className="fill-ink-3">
                    {t}ms
                  </text>
                </g>
              );
            })}
            {(
              [
                { ms: route.fcpMs, label: 'FCP', tone: 'stroke-sev-info' },
                { ms: route.lcpMs, label: 'LCP', tone: 'stroke-sev-warn' },
                { ms: route.ttiMs, label: 'TTI', tone: 'stroke-sem-static' },
              ] as const
            ).map((m) => {
              const x = (TRACK_W * m.ms) / duration;
              return (
                <g key={m.label}>
                  <line
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={32}
                    className={m.tone}
                    strokeWidth={0.8}
                    strokeDasharray="3 2"
                  />
                  <text
                    x={x + 2}
                    y={10}
                    fontSize={9}
                    className={cn(
                      m.tone === 'stroke-sev-info'
                        ? 'fill-sev-info'
                        : m.tone === 'stroke-sev-warn'
                          ? 'fill-sev-warn'
                          : 'fill-sem-static',
                    )}
                  >
                    {m.label} {m.ms}ms
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <ScrollArea className="max-h-[440px]">
        <ul>
          {filtered.map((a) => {
            const sel = a.id === selectedId;
            const x0 = (TRACK_W * a.startMs) / duration;
            const ttfbW = Math.max(1, (TRACK_W * a.ttfbMs) / duration);
            const dlW = Math.max(1, (TRACK_W * a.downloadMs) / duration);
            const stripeId = `wf_stripe_${a.id}`;
            return (
              <li
                key={a.id}
                className={cn(
                  'grid cursor-pointer items-center hairline-b text-[11px] hover:bg-bg-hover',
                  sel && 'bg-bg-subtle',
                )}
                style={{
                  gridTemplateColumns: `${LABEL_W}px 1fr`,
                  height: ROW_H + 4,
                }}
                onClick={() => onSelect(a.id)}
              >
                <div className="flex items-center gap-1 truncate px-2">
                  <Chip tone={kindTone(a.kind)} size="xs">
                    {a.kind}
                  </Chip>
                  <span
                    className="truncate font-mono text-ink-1"
                    title={a.url}
                  >
                    {a.url}
                  </span>
                </div>
                <div className="relative px-1">
                  <svg
                    viewBox={`0 0 ${TRACK_W} ${ROW_H}`}
                    preserveAspectRatio="none"
                    className="block h-full w-full"
                  >
                    {a.cached ? (
                      <defs>
                        <pattern
                          id={stripeId}
                          width="4"
                          height="4"
                          patternUnits="userSpaceOnUse"
                          patternTransform="rotate(45)"
                        >
                          <rect
                            width="4"
                            height="4"
                            className={cn(kindLight(a.kind))}
                          />
                          <line
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="4"
                            className="stroke-line"
                            strokeWidth={0.6}
                          />
                        </pattern>
                      </defs>
                    ) : null}
                    <rect
                      x={x0}
                      y={ROW_H / 2 - 4}
                      width={ttfbW}
                      height={8}
                      rx={1}
                      className={cn(kindLight(a.kind))}
                    />
                    <rect
                      x={x0 + ttfbW}
                      y={ROW_H / 2 - 4}
                      width={dlW}
                      height={8}
                      rx={1}
                      className={cn(a.cached ? '' : kindFill(a.kind))}
                      fill={a.cached ? `url(#${stripeId})` : undefined}
                    />
                    {a.blocking ? (
                      <text
                        x={x0 + ttfbW + dlW + 4}
                        y={ROW_H / 2 + 4}
                        fontSize={11}
                        className="fill-sev-err"
                      >
                        *
                      </text>
                    ) : null}
                    {a.origin === '3p' ? (
                      <g>
                        <circle
                          cx={x0 + ttfbW + dlW + 14}
                          cy={ROW_H / 2}
                          r={4}
                          className="fill-sev-warn-soft stroke-sev-warn"
                          strokeWidth={0.6}
                        />
                        <text
                          x={x0 + ttfbW + dlW + 14}
                          y={ROW_H / 2 + 3}
                          fontSize={7}
                          textAnchor="middle"
                          className="fill-sev-warn"
                        >
                          3p
                        </text>
                      </g>
                    ) : null}
                  </svg>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-[11px] text-ink-3">
              No assets match.
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
