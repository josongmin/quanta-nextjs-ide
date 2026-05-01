import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ACTIVE_PAIRS,
  ALL_TOPICS,
  TEAMMATES,
  fmtDuration,
  suggestMatch,
  type ActivePair,
  type Teammate,
} from './helpers';

function avatarColor(name: string): string {
  const palette = ['#2F6BFF', '#E0488B', '#19A37F', '#B86BFF', '#E29A2B', '#1FA2C2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length] ?? '#2F6BFF';
}

function energyTone(e: number): string {
  if (e >= 70) return 'bg-sem-static';
  if (e >= 45) return 'bg-sev-warn';
  return 'bg-sev-err';
}

export function PairQueueOverlay() {
  const open = useUiStore((s) => s.overlays.pairQueue.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [topicFilters, setTopicFilters] = useState<Set<string>>(new Set());
  const [now, setNow] = useState<number>(Date.now());

  // Tick `now` once a minute while the overlay is open so durations update.
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [open]);

  const filteredAvailable = useMemo(() => {
    if (topicFilters.size === 0) return TEAMMATES;
    return TEAMMATES.filter((t) =>
      t.expertise.some((tag) => topicFilters.has(tag)),
    );
  }, [topicFilters]);

  const match = useMemo(() => suggestMatch(filteredAvailable), [filteredAvailable]);

  const toggleTopic = (t: string) => {
    setTopicFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('pairQueue')}
      title={<span>Pair queue</span>}
      subtitle="who's available · what they want to pair on · smart match"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {filteredAvailable.length} available · {ACTIVE_PAIRS.length} active
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Matchmaking muted (mock)')}
          >
            Mute matchmaking
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() => toast('Pair board opened (mock)')}
          >
            Open pair board
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="text-caps text-ink-3">Topics:</span>
        {ALL_TOPICS.map((t) => (
          <ToggleChip key={t} active={topicFilters.has(t)} onClick={() => toggleTopic(t)}>
            {t}
          </ToggleChip>
        ))}
        {topicFilters.size > 0 ? (
          <button
            type="button"
            className="ml-auto text-[10px] text-ink-3 hover:text-ink-1"
            onClick={() => setTopicFilters(new Set())}
          >
            Clear
          </button>
        ) : null}
      </PanelHeader>

      <div className="grid grid-cols-2 gap-0">
        {/* Available */}
        <section className="border-r border-line px-3 py-3">
          <div className="text-caps mb-2 text-ink-3">Available</div>
          {filteredAvailable.length === 0 ? (
            <div className="rounded-sm border border-line bg-bg-subtle/40 px-3 py-4 text-center text-[12px] text-ink-3">
              No teammates match these topics.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredAvailable.map((t) => (
                <AvailableCard key={t.id} t={t} />
              ))}
            </ul>
          )}
        </section>

        {/* Active pairs */}
        <section className="px-3 py-3">
          <div className="text-caps mb-2 text-ink-3">Active pairs</div>
          <ul className="space-y-2">
            {ACTIVE_PAIRS.map((p) => (
              <ActivePairCard key={p.id} p={p} now={now} />
            ))}
          </ul>
        </section>
      </div>

      {/* Smart match */}
      <section className="px-4 py-3 hairline-t bg-accent-soft/30">
        <div className="text-caps mb-1 text-accent">Smart match suggestion</div>
        {match ? (
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 items-center -space-x-2">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white"
                style={{ backgroundColor: avatarColor(match.a.name) }}
              >
                {match.a.initials}
              </span>
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white"
                style={{ backgroundColor: avatarColor(match.b.name) }}
              >
                {match.b.initials}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-ink-1">
                {match.a.name} + {match.b.name}
              </div>
              <div className="text-[11px] text-ink-2">{match.reason}</div>
            </div>
            <Button
              size="sm"
              tone="accent"
              onClick={() =>
                toast.success('Pair invitation sent (mock)', {
                  description: `${match.a.name} ↔ ${match.b.name}`,
                })
              }
            >
              Suggest pair
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-ink-3">
            Need at least two available teammates to suggest a match.
          </div>
        )}
      </section>
    </OverlayPanel>
  );
}

function AvailableCard({ t }: { t: Teammate }) {
  return (
    <li className="rounded-sm border border-line bg-bg p-2.5">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: avatarColor(t.name) }}
        >
          {t.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-ink-1">{t.name}</span>
            <Chip tone="muted" size="xs">
              {t.role}
            </Chip>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {t.expertise.map((e) => (
              <Chip key={e} tone="info" size="xs">
                {e}
              </Chip>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-ink-3">
                <span>energy</span>
                <span className="font-mono tabular-nums">{t.energy}</span>
              </div>
              <div className="relative mt-0.5 h-1 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className={cn('absolute left-0 top-0 h-full rounded-full', energyTone(t.energy))}
                  style={{ width: `${t.energy}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Chip tone="hint" size="xs">
              wants: {t.topic}
            </Chip>
            <Button
              size="xs"
              tone="default"
              className="ml-auto"
              onClick={() =>
                toast(`Pair request sent to ${t.name} (mock)`, {
                  description: t.topic,
                })
              }
            >
              Request pair
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function ActivePairCard({ p, now }: { p: ActivePair; now: number }) {
  return (
    <li className="rounded-sm border border-line bg-bg p-2.5">
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="flex shrink-0 items-center -space-x-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white"
            style={{ backgroundColor: avatarColor(p.a.name) }}
          >
            {p.a.initials}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white"
            style={{ backgroundColor: avatarColor(p.b.name) }}
          >
            {p.b.initials}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-ink-1">
              {p.a.name} + {p.b.name}
            </span>
            <Chip tone="accent" size="xs" className="ml-auto">
              {fmtDuration(p.startedAt, now)}
            </Chip>
          </div>
          <div className="mt-0.5 text-[11px] text-ink-2">{p.focus}</div>
          <div className="mt-1 flex items-center gap-2">
            <Chip tone="info" size="xs">
              mood: {p.mood}
            </Chip>
            <Button
              size="xs"
              tone="ghost"
              className="ml-auto"
              onClick={() => toast(`Dropped in on ${p.a.name} + ${p.b.name} (mock)`)}
            >
              Drop in
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
