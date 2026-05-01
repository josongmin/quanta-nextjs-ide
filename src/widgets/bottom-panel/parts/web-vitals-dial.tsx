import { cn } from '@shared/lib/cn';

interface Props {
  label: string;
  value: number;
  /** Threshold for "good" rating */
  good: number;
  /** Threshold for "poor" rating (>= this is poor). */
  poor: number;
  /** Maximum displayable value — defaults to 1.5x poor. */
  max?: number;
  unit?: 'ms' | '';
  className?: string;
  size?: number;
  precision?: number;
}

type Rating = 'good' | 'needs-improvement' | 'poor';

function rate(value: number, good: number, poor: number): Rating {
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

const STROKE_BY_RATING: Record<Rating, string> = {
  good: 'stroke-sem-static',
  'needs-improvement': 'stroke-sev-warn',
  poor: 'stroke-sev-err',
};

const TEXT_BY_RATING: Record<Rating, string> = {
  good: 'text-sem-static',
  'needs-improvement': 'text-sev-warn',
  poor: 'text-sev-err',
};

const RATING_LABEL: Record<Rating, string> = {
  good: 'good',
  'needs-improvement': 'needs work',
  poor: 'poor',
};

/**
 * Simple SVG arc gauge from 0..max. Shows numeric value + unit at center,
 * label below, and is colored green/amber/red by web-vitals thresholds.
 */
export function WebVitalsDial({
  label,
  value,
  good,
  poor,
  max = poor * 1.5,
  unit = 'ms',
  className,
  size = 96,
  precision = 0,
}: Props) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 240° sweep arc — 150°..30° (mirrored)
  const startAngle = 150;
  const endAngle = -30;
  const sweep = startAngle - endAngle; // 180

  const rating = rate(value, good, poor);
  const ratio = Math.max(0, Math.min(1, value / max));

  const polar = (angleDeg: number): { x: number; y: number } => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  const start = polar(startAngle);
  const end = polar(endAngle);
  const valueAngle = startAngle - sweep * ratio;
  const valueEnd = polar(valueAngle);

  // Use a single arc per stroke; sweep large-arc when > 180°
  const arcPath = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    largeArc: 0 | 1,
    sweepFlag: 0 | 1,
  ): string => `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${p1.x} ${p1.y}`;

  const trackPath = arcPath(start, end, 1, 0);
  // value arc — sweep clockwise from start to valueEnd
  const arcSpan = startAngle - valueAngle; // 0..sweep
  const valuePath = arcPath(start, valueEnd, arcSpan > 180 ? 1 : 0, 0);

  const display = unit === 'ms'
    ? `${Math.round(value)}`
    : value.toFixed(precision);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`${label} gauge`}
          role="img"
        >
          <path
            d={trackPath}
            fill="none"
            className="stroke-line"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {value > 0 ? (
            <path
              d={valuePath}
              fill="none"
              className={STROKE_BY_RATING[rating]}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
          {value > 0 ? (
            <circle
              cx={valueEnd.x}
              cy={valueEnd.y}
              r={3}
              className={cn('fill-bg', STROKE_BY_RATING[rating])}
              strokeWidth={1.5}
            />
          ) : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-mono text-base font-semibold leading-none tracking-tight',
              TEXT_BY_RATING[rating],
            )}
          >
            {display}
            {unit === 'ms' ? (
              <span className="ml-0.5 text-[10px] font-normal text-ink-3">ms</span>
            ) : null}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-caps text-ink-3">
            {RATING_LABEL[rating]}
          </span>
        </div>
      </div>
      <span className="text-caps text-[11px] uppercase tracking-caps text-ink-2">
        {label}
      </span>
    </div>
  );
}
