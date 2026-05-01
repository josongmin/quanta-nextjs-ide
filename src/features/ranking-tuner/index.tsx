import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  PER_QUERY_BENCH,
  PROFILE_CURRENT,
  PROFILE_EXPERIMENTAL,
  RANKING_SIGNALS,
  computeLift,
  rankAll,
  rankShift,
  type WeightProfile,
} from './helpers';

export function RankingTunerOverlay() {
  const open = useUiStore((s) => s.overlays.rankingTuner.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [activeProfile, setActiveProfile] = useState<'current' | 'experimental'>('experimental');
  const [query, setQuery] = useState('sweater wool');
  const [experimental, setExperimental] = useState<WeightProfile>({ ...PROFILE_EXPERIMENTAL });

  const current = useMemo(() => rankAll(query, PROFILE_CURRENT, 10), [query]);
  const exp = useMemo(() => rankAll(query, experimental, 10), [query, experimental]);
  const lift = useMemo(() => computeLift(current, exp), [current, exp]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('rankingTuner')}
      title="Ranking tuner"
      subtitle="Weight profile A/B with rank-shift preview"
      size="xl"
    >
      <div className="flex flex-wrap items-center gap-2 hairline-b bg-bg-subtle px-3 py-2">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">profile</span>
        <ToggleChip active={activeProfile === 'current'} onClick={() => setActiveProfile('current')}>
          current
        </ToggleChip>
        <ToggleChip
          active={activeProfile === 'experimental'}
          onClick={() => setActiveProfile('experimental')}
        >
          experimental
        </ToggleChip>
        <span className="ml-3 text-[10px] uppercase tracking-caps text-ink-3">test query</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search query"
          className="h-7 w-72 rounded-sm border border-line bg-bg px-2 font-mono text-xs"
        />
        <Chip tone="static" size="sm" className="ml-auto">
          ndcg {lift.ndcg}
        </Chip>
      </div>

      <div className="grid grid-cols-[1fr_1fr_240px]">
        <div className="hairline-r p-3">
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            signal weights
          </div>
          <div className="space-y-3">
            {RANKING_SIGNALS.map((sig) => (
              <SignalRow
                key={sig.key}
                label={sig.label}
                description={sig.description}
                experimental={experimental[sig.key]}
                current={PROFILE_CURRENT[sig.key]}
                disabled={activeProfile === 'current'}
                onChange={(v) => setExperimental((p) => ({ ...p, [sig.key]: v }))}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Avg rank Δ" value={lift.avgRankDelta > 0 ? `+${lift.avgRankDelta}` : `${lift.avgRankDelta}`} />
            <Stat label="Top-10 churn" value={`${lift.top10Churn}`} />
            <Stat label="NDCG-like" value={`${lift.ndcg}`} />
          </div>
        </div>

        <div className="p-3">
          <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
            ranked results
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ResultsCol label="current" rows={current} otherList={exp} kind="current" />
            <ResultsCol label="experimental" rows={exp} otherList={current} kind="experimental" />
          </div>
        </div>

        <ScrollArea className="hairline-l max-h-[60vh]">
          <div className="p-3">
            <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
              per-query winners
            </div>
            <ul className="space-y-1">
              {PER_QUERY_BENCH.map((b) => (
                <li
                  key={b.q}
                  className="flex items-center gap-2 rounded-sm border border-line bg-bg p-2 text-xs"
                >
                  <span className="font-mono text-ink-1">{b.q}</span>
                  <Chip
                    tone={b.winner === 'experimental' ? 'static' : b.winner === 'current' ? 'info' : 'muted'}
                    size="xs"
                    className="ml-auto"
                  >
                    {b.winner}
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-bg p-2 text-center">
      <div className="font-mono text-md text-ink-1">{value}</div>
      <div className="text-[10px] text-ink-3">{label}</div>
    </div>
  );
}

function SignalRow({
  label,
  description,
  experimental,
  current,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  experimental: number;
  current: number;
  disabled: boolean;
  onChange(v: number): void;
}) {
  return (
    <div className="rounded-sm border border-line bg-bg p-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-ink-1">{label}</div>
          <div className="text-[10px] text-ink-3">{description}</div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs text-ink-1">{experimental}</span>
          <span className="ml-1 text-[10px] text-ink-3">/ {current} cur</span>
        </div>
      </div>
      <div className="relative mt-2">
        {/* Reference line for current */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <div
          aria-hidden
          className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-ink-3/60"
          style={{ left: `${current}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={experimental}
          disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="relative w-full accent-accent"
        />
      </div>
    </div>
  );
}

type RankedRow = ReturnType<typeof rankAll>[number];

function ResultsCol({
  label,
  rows,
  otherList,
  kind,
}: {
  label: string;
  rows: ReadonlyArray<RankedRow>;
  otherList: ReadonlyArray<RankedRow>;
  kind: 'current' | 'experimental';
}) {
  return (
    <div className="rounded-sm border border-line bg-bg">
      <div className="hairline-b bg-bg-subtle px-2 py-1 text-[10px] uppercase tracking-caps text-ink-3">
        {label}
      </div>
      <ul>
        {rows.map((r, i) => {
          const otherRank = rankShift(r.doc.id, otherList);
          let shift: { tone: 'static' | 'err' | 'muted' | 'warn'; text: string } = {
            tone: 'muted',
            text: '=',
          };
          if (otherRank === 'new') {
            shift = { tone: kind === 'experimental' ? 'static' : 'err', text: 'new' };
          } else {
            const delta = otherRank - (i + 1);
            if (kind === 'experimental') {
              if (delta > 0) shift = { tone: 'static', text: `↑${delta}` };
              else if (delta < 0) shift = { tone: 'err', text: `↓${Math.abs(delta)}` };
              else shift = { tone: 'muted', text: '=' };
            } else {
              if (delta > 0) shift = { tone: 'static', text: `↑${delta}` };
              else if (delta < 0) shift = { tone: 'warn', text: `↓${Math.abs(delta)}` };
              else shift = { tone: 'muted', text: '=' };
            }
          }
          return (
            <li
              key={r.doc.id}
              className={cn(
                'flex items-center gap-2 border-t border-line/60 px-2 py-1.5 text-xs first:border-t-0',
              )}
            >
              <span className="w-5 text-right font-mono text-[10px] text-ink-3">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-ink-1">{r.doc.title}</span>
              <span className="font-mono text-[10px] text-ink-3">{r.score.toFixed(2)}</span>
              <Chip tone={shift.tone} size="xs">
                {shift.text}
              </Chip>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
