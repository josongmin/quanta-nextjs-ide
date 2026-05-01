// Horizontal swimlane timeline view.
//
// Renders one swimlane per distinct user, each event as a colored block, plus
// a draggable cursor (the vertical line). Click anywhere on the lane to scrub.
import { useMemo, useRef } from 'react';
import { cn } from '@shared/lib/cn';
import type { EventKind, Timeline, TimelineEvent } from './types';

const EVENT_COLOR: Record<EventKind, string> = {
  mutation: 'bg-sev-err-soft text-sev-err border-sev-err/40',
  'revalidate-tag': 'bg-accent-soft text-accent border-accent/40',
  'revalidate-path': 'bg-accent-soft text-accent border-accent/40',
  'page-request': 'bg-sev-info-soft text-sev-info border-sev-info/40',
};

const EVENT_LABEL: Record<EventKind, string> = {
  mutation: 'mutate',
  'revalidate-tag': 'revalidateTag',
  'revalidate-path': 'revalidatePath',
  'page-request': 'GET',
};

const LANE_LABEL_WIDTH = 128; // px

interface TimelineViewProps {
  timeline: Timeline;
  cursorSec: number;
  onScrub: (t: number) => void;
}

export function TimelineView({ timeline, cursorSec, onScrub }: TimelineViewProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const lanes = useMemo(() => groupByUser(timeline.events), [timeline]);
  const horizon = timeline.horizonSec;

  const handleScrub = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onScrub(ratio * horizon);
  };

  const ticks = useMemo(() => {
    const step = horizon <= 30 ? 5 : horizon <= 60 ? 10 : horizon <= 120 ? 20 : 30;
    const out: number[] = [];
    for (let t = 0; t <= horizon; t += step) out.push(t);
    return out;
  }, [horizon]);

  const cursorPct = (cursorSec / horizon) * 100;

  return (
    <div className="select-none">
      <div className="flex">
        <div className="shrink-0" style={{ width: LANE_LABEL_WIDTH }} />
        <div className="relative h-5 flex-1 border-b border-line text-[10px] text-ink-3">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${(t / horizon) * 100}%` }}
            >
              <span className="font-mono">{t}s</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {lanes.map(({ user, events }) => (
          <div
            key={user}
            className="relative flex h-9 items-center border-b border-line/60"
          >
            <div
              className="flex shrink-0 items-center bg-bg/95 pl-2 pr-1 text-[10px] uppercase tracking-caps text-ink-3"
              style={{ width: LANE_LABEL_WIDTH }}
            >
              <span className="truncate">{user}</span>
            </div>
            <div
              className="relative h-full flex-1 cursor-col-resize"
              onMouseDown={(e) => handleScrub(e.clientX)}
              onMouseMove={(e) => {
                if (e.buttons === 1) handleScrub(e.clientX);
              }}
            >
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    'absolute top-1.5 flex h-6 items-center justify-center rounded-sm border px-1.5 text-[10px] font-medium shadow-sm',
                    EVENT_COLOR[ev.kind],
                  )}
                  style={{
                    left: `calc(${(ev.t / horizon) * 100}% - 30px)`,
                    minWidth: 60,
                  }}
                  title={`${EVENT_LABEL[ev.kind]} @ t=${ev.t}s${ev.tag ? ` · ${ev.tag}` : ''}`}
                >
                  <span className="truncate">{ev.label ?? EVENT_LABEL[ev.kind]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* cursor overlay — sits on top of the lane region only */}
        <div
          ref={trackRef}
          className="pointer-events-none absolute inset-y-0"
          style={{ left: LANE_LABEL_WIDTH, right: 0 }}
        >
          <div
            className="absolute top-0 bottom-0 w-px bg-accent"
            style={{ left: `${cursorPct}%` }}
          />
          <div
            className="absolute -top-5 -translate-x-1/2 rounded-sm bg-accent px-1.5 py-0.5 font-mono text-[10px] text-bg"
            style={{ left: `${cursorPct}%` }}
          >
            {cursorSec.toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByUser(
  events: TimelineEvent[],
): { user: string; events: TimelineEvent[] }[] {
  const map = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const list = map.get(ev.user) ?? [];
    list.push(ev);
    map.set(ev.user, list);
  }
  return Array.from(map.entries()).map(([user, events]) => ({ user, events }));
}
