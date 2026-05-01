// Temporal cache simulator — main 2-pane UI.
//
// Left:  timeline editor (swimlanes per user, draggable cursor)
// Right: per-route preview cards reflecting "what user sees at cursor T"
//
// The component is self-contained — pass `open` / `onOpenChange` from a host
// (the existing OverlayPanel-based UI shell, the command palette, etc).
import { useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Chip,
  EmptyState,
  OverlayPanel,
  ScrollArea,
  SelectControl,
} from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { evaluateAt } from './clock';
import { StaleCard } from './stale-card';
import { TimelineView } from './timeline-view';
import { useTemporalSimStore } from './store';

interface TemporalSimulatorOverlayProps {
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function TemporalSimulatorOverlay({
  open,
  onOpenChange,
}: TemporalSimulatorOverlayProps) {
  const ensureBuilt = useTemporalSimStore((s) => s.ensureBuilt);
  const timelines = useTemporalSimStore((s) => s.timelines);
  const selectedId = useTemporalSimStore((s) => s.selectedTimelineId);
  const tSec = useTemporalSimStore((s) => s.tSec);
  const isPlaying = useTemporalSimStore((s) => s.isPlaying);
  const speed = useTemporalSimStore((s) => s.speed);
  const selectTimeline = useTemporalSimStore((s) => s.selectTimeline);
  const setCursor = useTemporalSimStore((s) => s.setCursor);
  const togglePlay = useTemporalSimStore((s) => s.togglePlay);
  const setSpeed = useTemporalSimStore((s) => s.setSpeed);

  useEffect(() => {
    if (open) ensureBuilt();
  }, [open, ensureBuilt]);

  const timeline = useMemo(
    () => timelines.find((t) => t.id === selectedId),
    [timelines, selectedId],
  );

  // Playback ticker — advances the cursor at `speed` × wallclock.
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying || !timeline) {
      lastTickRef.current = null;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const dtMs = now - last;
      lastTickRef.current = now;
      const dtSec = (dtMs / 1000) * speed;
      const next = useTemporalSimStore.getState().tSec + dtSec;
      const horizon = timeline.horizonSec;
      if (next >= horizon) {
        useTemporalSimStore.getState().setCursor(horizon);
        useTemporalSimStore.setState({ isPlaying: false });
        return;
      }
      useTemporalSimStore.getState().setCursor(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, timeline, speed]);

  const snapshot = useMemo(
    () => (timeline ? evaluateAt(timeline, tSec) : null),
    [timeline, tSec],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Temporal cache simulator"
      subtitle={
        timeline
          ? `${timeline.title} · revalidate ${timeline.revalidateSec}s · horizon ${timeline.horizonSec}s`
          : 'Auto-derived "what if" scenarios from cache-tag store'
      }
      size="xl"
      footer={
        <>
          <span className="mr-auto text-[10px] text-ink-3">
            {timelines.length} scenario{timelines.length === 1 ? '' : 's'} derived
          </span>
          <Button size="xs" tone="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">scenario</span>
        {timelines.length > 0 ? (
          <SelectControl
            value={selectedId ?? timelines[0]!.id}
            onChange={(v) => selectTimeline(v)}
            options={timelines.map((t) => ({ value: t.id, label: t.title }))}
          />
        ) : null}
        <span className="ml-auto" />
        <Button
          size="xs"
          tone={isPlaying ? 'warn' : 'accent'}
          onClick={() => togglePlay()}
          disabled={!timeline}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <SelectControl
          value={String(speed)}
          onChange={(v) => setSpeed(Number(v) as 1 | 2 | 4 | 8)}
          options={[
            { value: '1', label: '1×' },
            { value: '2', label: '2×' },
            { value: '4', label: '4×' },
            { value: '8', label: '8×' },
          ]}
          label="speed"
        />
        <Button
          size="xs"
          tone="ghost"
          onClick={() => setCursor(0)}
          disabled={!timeline}
        >
          Reset
        </Button>
      </PanelHeader>

      <div className="grid h-[520px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* LEFT — timeline editor */}
        <div className="border-r border-line">
          {!timeline ? (
            <EmptyState
              title="No scenarios"
              description="Cache-tag store is empty — nothing to simulate."
            />
          ) : (
            <ScrollArea className="h-full">
              <div className="px-4 py-3">
                <TimelineView
                  timeline={timeline}
                  cursorSec={tSec}
                  onScrub={setCursor}
                />
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]">
                  <Chip tone="err" size="xs">
                    mutation
                  </Chip>
                  <Chip tone="accent" size="xs">
                    revalidate
                  </Chip>
                  <Chip tone="info" size="xs">
                    page request
                  </Chip>
                </div>
                <p className="mt-3 text-[11px] text-ink-3">
                  Click or drag in the timeline to scrub. Each lane is a virtual
                  user; events are colored by kind. Right pane updates live.
                </p>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* RIGHT — preview pane */}
        <div className="bg-bg-2/30">
          <ScrollArea className="h-full">
            <div className="space-y-3 px-4 py-3">
              <header className="flex items-baseline gap-2">
                <span className="text-[10px] uppercase tracking-caps text-ink-3">
                  At cursor
                </span>
                <span className="font-mono text-xs text-ink-1">
                  t = {tSec.toFixed(1)}s
                </span>
              </header>
              {!snapshot ? (
                <p className="text-xs text-ink-3">Pick a scenario to preview.</p>
              ) : snapshot.routes.length === 0 ? (
                <p className="text-xs text-ink-3">
                  This tag has no affected routes.
                </p>
              ) : (
                snapshot.routes.map((r) => {
                  const win = snapshot.staleWindows.find(
                    (w) => w.routeId === r.routeId,
                  );
                  return (
                    <StaleCard
                      key={r.routeId}
                      state={r}
                      maxStaleSec={win?.maxStaleSec ?? 0}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </OverlayPanel>
  );
}

export { useTemporalSimStore } from './store';
export type { Timeline, TimelineEvent, RouteState, SimSnapshot } from './types';
