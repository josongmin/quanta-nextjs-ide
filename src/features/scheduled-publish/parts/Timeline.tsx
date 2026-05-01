import { cn } from '@shared/lib/cn';
import { statusFill, statusStroke, type ScheduledItem } from '../helpers';

interface TimelineProps {
  items: ReadonlyArray<ScheduledItem>;
  selectedId: string;
  onSelect(id: string): void;
}

export function Timeline({ items, selectedId, onSelect }: TimelineProps) {
  const w = 800;
  const rulerH = 24;
  const trackH = 22;
  const trackGap = 4;
  const padX = 28;
  const innerW = w - padX * 2;
  const lanes = 3;
  const h = rulerH + lanes * (trackH + trackGap) + 8;

  function xFromHour(hour: number): number {
    return padX + (hour / 24) * innerW;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 block w-full" style={{ height: h }}>
      {Array.from({ length: 25 }).map((_, hr) => {
        const x = xFromHour(hr);
        return (
          <g key={hr}>
            <line
              x1={x}
              y1={rulerH - 4}
              x2={x}
              y2={rulerH}
              className="stroke-line"
              strokeWidth={1}
            />
            {hr % 3 === 0 ? (
              <text
                x={x}
                y={rulerH - 8}
                textAnchor="middle"
                fontSize={9}
                className="fill-ink-3"
              >
                {hr.toString().padStart(2, '0')}
              </text>
            ) : null}
          </g>
        );
      })}
      <line
        x1={padX}
        y1={rulerH}
        x2={w - padX}
        y2={rulerH}
        className="stroke-line"
        strokeWidth={1}
      />

      {Array.from({ length: lanes }).map((_, lane) => (
        <rect
          key={lane}
          x={padX}
          y={rulerH + 4 + lane * (trackH + trackGap)}
          width={innerW}
          height={trackH}
          className="fill-bg-subtle stroke-line"
          strokeWidth={0.5}
          rx={2}
        />
      ))}

      {items.map((it, i) => {
        const lane = i % lanes;
        const x = xFromHour(it.hour);
        const barW = 60;
        const y = rulerH + 4 + lane * (trackH + trackGap);
        const active = it.id === selectedId;
        return (
          <g
            key={it.id}
            className="cursor-pointer"
            onClick={() => onSelect(it.id)}
          >
            <rect
              x={x}
              y={y + 2}
              width={barW}
              height={trackH - 4}
              rx={3}
              className={cn(statusFill(it.status), active ? statusStroke(it.status) : 'stroke-line/60')}
              strokeWidth={active ? 1.5 : 0.75}
            />
            <text
              x={x + 4}
              y={y + trackH / 2 + 3}
              fontSize={9}
              className="fill-ink-1 font-mono"
            >
              {it.contentType.slice(0, 3).toUpperCase()} · {it.scheduledFor.slice(11)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
