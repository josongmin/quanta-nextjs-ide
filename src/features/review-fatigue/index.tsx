import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { SearchInput } from '@shared/ui/search-input';
import { SelectControl } from '@shared/ui/select-control';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  REVIEWERS,
  SORT_OPTIONS,
  TEAM_SUGGESTIONS,
  recLabel,
  recTone,
  sortReviewers,
  teamFatigue,
  type Reviewer,
  type SortKey,
} from './helpers';

function avatarColor(name: string): string {
  const palette = ['#2F6BFF', '#E0488B', '#19A37F', '#B86BFF', '#E29A2B', '#1FA2C2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length] ?? '#2F6BFF';
}

function fatigueRingColor(score: number): string {
  if (score >= 75) return 'hsl(var(--err))';
  if (score >= 55) return 'hsl(var(--warn))';
  return 'hsl(var(--sem-static))';
}

function fatigueBarColor(score: number): string {
  if (score >= 75) return 'bg-sev-err';
  if (score >= 55) return 'bg-sev-warn';
  return 'bg-sem-static';
}

export function ReviewFatigueOverlay() {
  const open = useUiStore((s) => s.overlays.reviewFatigue.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [query, setQuery] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('fatigueScore');
  const [atRiskOnly, setAtRiskOnly] = useState<boolean>(false);

  const filtered = useMemo(() => {
    let out: ReadonlyArray<Reviewer> = REVIEWERS;
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (r) => r.name.toLowerCase().includes(q) || r.area.toLowerCase().includes(q),
      );
    }
    if (atRiskOnly) out = out.filter((r) => r.fatigueScore >= 70);
    return sortReviewers(out, sort);
  }, [query, sort, atRiskOnly]);

  const team = teamFatigue(REVIEWERS);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('reviewFatigue')}
      title={<span>Review fatigue</span>}
      subtitle="reviewer load · response time · 8-week trend"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {filtered.length} of {REVIEWERS.length} reviewers
          </span>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => toast('Break scheduled (mock)')}
          >
            Schedule break
          </Button>
          <Button
            size="sm"
            tone="accent"
            onClick={() =>
              toast.success('Auto-rebalance queued', {
                description: 'Top-fatigued reviewers paused for 48h.',
              })
            }
          >
            Auto-rebalance
          </Button>
        </>
      }
    >
      <PanelHeader>
        <SearchInput value={query} onChange={setQuery} placeholder="Search reviewer or area" />
        <SelectControl<SortKey>
          label="sort"
          value={sort}
          options={SORT_OPTIONS}
          onChange={setSort}
        />
        <ToggleChip active={atRiskOnly} onClick={() => setAtRiskOnly((v) => !v)}>
          at-risk only
        </ToggleChip>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_280px] gap-0">
        <div className="min-w-0 px-4 py-3">
          {filtered.length === 0 ? (
            <div className="rounded-sm border border-line bg-bg-subtle/40 px-4 py-6 text-center text-[12px] text-ink-3">
              No reviewers match the current filters.
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((r) => (
                <ReviewerCard key={r.id} r={r} />
              ))}
            </ul>
          )}
        </div>

        <aside className="border-l border-line bg-bg-subtle/40">
          <section className="px-3 py-3 hairline-b">
            <div className="text-caps mb-2 text-ink-3">Team fatigue</div>
            <div className="flex items-center gap-3">
              <RadialGauge value={team} />
              <div className="text-[11px] text-ink-2">
                <div>
                  <span className="text-ink-3">avg</span>{' '}
                  <span className="font-mono text-ink-1">{team}</span>
                  <span className="text-ink-3"> / 100</span>
                </div>
                <div className="text-ink-3">
                  {team >= 65 ? 'Trending high — intervene.' : 'Within healthy band.'}
                </div>
              </div>
            </div>
          </section>
          <section className="px-3 py-3">
            <div className="text-caps mb-2 text-ink-3">Suggestions</div>
            <ul className="space-y-1.5">
              {TEAM_SUGGESTIONS.map((s) => (
                <li
                  key={s.id}
                  className="rounded-sm border border-line bg-bg px-2 py-1.5 text-[11px] text-ink-2"
                >
                  {s.text}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </OverlayPanel>
  );
}

function ReviewerCard({ r }: { r: Reviewer }) {
  const ringColor = fatigueRingColor(r.fatigueScore);
  return (
    <li className="rounded-sm border border-line bg-bg p-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${ringColor} ${r.fatigueScore}%, hsl(var(--border)) ${r.fatigueScore}% 100%)`,
          }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: avatarColor(r.name) }}
          >
            {r.initials}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-ink-1">{r.name}</span>
            <Chip tone="muted" size="xs">
              {r.area}
            </Chip>
            <Chip tone={recTone(r.recommendation)} size="xs" className="ml-auto">
              {recLabel(r.recommendation)}
            </Chip>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-ink-3">
            <span>
              <span className="text-ink-2">{r.reviewsThisWeek}</span> reviews / wk
            </span>
            <span>
              avg <span className="text-ink-2">{r.avgResponseHrs.toFixed(1)}h</span>
            </span>
            <span>
              queue <span className="text-ink-2">{r.currentQueueDepth}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-ink-3">
                <span>fatigue</span>
                <span className="font-mono tabular-nums">{r.fatigueScore}</span>
              </div>
              <div className="relative mt-0.5 h-1.5 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className={cn('absolute left-0 top-0 h-full rounded-full', fatigueBarColor(r.fatigueScore))}
                  style={{ width: `${r.fatigueScore}%` }}
                />
              </div>
            </div>
            <Sparkline values={r.trend8w} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          size="xs"
          tone="ghost"
          onClick={() =>
            toast(`Re-routed reviews from ${r.name} (mock)`, {
              description: 'Their queue will redistribute over 24h.',
            })
          }
        >
          Re-route reviews
        </Button>
      </div>
    </li>
  );
}

function Sparkline({ values }: { values: ReadonlyArray<number> }) {
  const w = 80;
  const h = 22;
  const pad = 2;
  const max = Math.max(1, ...values);
  const step = (w - pad * 2) / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - v / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = values[values.length - 1] ?? 0;
  return (
    <svg width={w} height={h} className="block shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={fatigueRingColor(last)}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RadialGauge({ value }: { value: number }) {
  const size = 80;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (Math.max(0, Math.min(100, value)) / 100);
  const color = fatigueRingColor(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[14px] font-semibold text-ink-1">{value}</span>
      </div>
    </div>
  );
}
