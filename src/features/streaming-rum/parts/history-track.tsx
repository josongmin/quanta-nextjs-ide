import {
  HISTORY_H,
  TRACK_W,
  pickPercentile,
  type DateRange,
  type Percentile,
  type RouteStream,
} from '../helpers';

interface HistoryTrackProps {
  trimmedHistory: RouteStream['history'];
  historyMax: number;
  range: DateRange;
  percentile: Percentile;
}

export function HistoryTrack({
  trimmedHistory,
  historyMax,
  range,
  percentile,
}: HistoryTrackProps): JSX.Element {
  const xs = (i: number): number =>
    12 + (i / Math.max(1, trimmedHistory.length - 1)) * (TRACK_W - 24);
  const ys = (n: number): number =>
    HISTORY_H - 8 - (n / historyMax) * (HISTORY_H - 16);

  const areaPath = (() => {
    if (trimmedHistory.length === 0) return '';
    const top = trimmedHistory
      .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(h.p75)}`)
      .join(' ');
    const bottom = [...trimmedHistory]
      .reverse()
      .map(
        (h, i) => `L ${xs(trimmedHistory.length - 1 - i)} ${ys(h.p95)}`,
      )
      .join(' ');
    return `${top} ${bottom} Z`;
  })();

  const linePath = (() => {
    if (trimmedHistory.length === 0) return '';
    return trimmedHistory
      .map(
        (h, i) =>
          `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(pickPercentile(percentile, h))}`,
      )
      .join(' ');
  })();

  return (
    <div className="mt-3 rounded-sm border border-line bg-bg-subtle px-2 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          History {range} · {percentile}
        </span>
        <span className="font-mono text-[10px] text-ink-3">
          max {historyMax}ms
        </span>
      </div>
      <svg
        viewBox={`0 0 ${TRACK_W} ${HISTORY_H}`}
        className="w-full"
        role="img"
        aria-label="History band"
      >
        <path d={areaPath} className="fill-accent-soft" opacity={0.6} />
        <path d={linePath} className="fill-none stroke-accent" strokeWidth={1.6} />
        <line
          x1={12}
          x2={TRACK_W - 12}
          y1={HISTORY_H - 8}
          y2={HISTORY_H - 8}
          className="stroke-line"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
