import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  classOfTest,
  flakeScore,
  flakyTests,
  lastFailureTs,
  type FailReason,
  type FlakeClass,
  type FlakyTest,
  type RunRecord,
} from './helpers';

const SORT_OPTIONS = [
  { value: 'flake', label: 'Flake score' },
  { value: 'runtime', label: 'Runtime' },
  { value: 'lastFail', label: 'Last failure' },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]['value'];

const CLASS_TONE: Record<FlakeClass, 'static' | 'info' | 'warn' | 'err'> = {
  stable: 'static',
  sus: 'info',
  flaky: 'warn',
  broken: 'err',
};

const REASON_TONE: Record<FailReason, 'warn' | 'err' | 'info'> = {
  timeout: 'warn',
  race: 'warn',
  'snapshot drift': 'info',
  network: 'info',
  ordering: 'info',
  memory: 'err',
};

function Sparkline({ runs }: { runs: ReadonlyArray<RunRecord> }) {
  const w = 90;
  const tickW = w / runs.length;
  return (
    <svg width={w} height="14" className="block">
      {runs.map((r, i) => (
        <rect
          key={i}
          x={i * tickW}
          y={2}
          width={Math.max(1, tickW - 1)}
          height={10}
          fill={
            r.outcome === 'pass'
              ? 'hsl(var(--sem-static))'
              : 'hsl(var(--err))'
          }
          opacity={r.outcome === 'pass' ? 0.55 : 0.85}
        />
      ))}
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    score === 0
      ? 'bg-sem-static'
      : score < 0.4
        ? 'bg-sev-info'
        : score < 0.85
          ? 'bg-sev-warn'
          : 'bg-sev-err';
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="relative inline-block h-1 w-14 overflow-hidden rounded-full bg-bg-subtle">
        <span
          className={cn('absolute left-0 top-0 h-full', tone)}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="font-mono text-[10px] text-ink-3 w-7 text-right">
        {pct}%
      </span>
    </div>
  );
}

function fmtAgo(ts: number): string {
  if (ts === 0) return '—';
  const REF = 1735689600_000;
  const days = Math.max(0, Math.round((REF - ts) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export function FlakyDetectorOverlay() {
  const open = useUiStore((s) => s.overlays.flakyDetector.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [sort, setSort] = useState<SortKey>('flake');
  const [onlyFlaky, setOnlyFlaky] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const annotated = flakyTests.map((t) => ({
      t,
      score: flakeScore(t.runs),
      cls: classOfTest(t),
      lastFail: lastFailureTs(t.runs),
    }));
    const filtered = onlyFlaky
      ? annotated.filter(
          (r) => r.cls === 'flaky' || r.cls === 'sus' || r.cls === 'broken',
        )
      : annotated;
    return [...filtered].sort((a, b) => {
      if (sort === 'flake') return b.score - a.score;
      if (sort === 'runtime') return b.t.avgRuntimeMs - a.t.avgRuntimeMs;
      return b.lastFail - a.lastFail;
    });
  }, [sort, onlyFlaky]);

  const flakyCount = flakyTests.filter((t) => {
    const c = classOfTest(t);
    return c === 'flaky' || c === 'sus' || c === 'broken';
  }).length;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('flakyDetector'))}
      title="Flaky Detector"
      subtitle="Last 30 runs per test"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            {flakyCount} flaky / {flakyTests.length} total
          </span>
          <Button
            size="xs"
            tone="warn"
            onClick={() => toast(`Quarantined ${flakyCount} flaky tests`)}
          >
            Quarantine all flaky
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <label className="inline-flex items-center gap-1 text-[11px] text-ink-2">
          <span className="text-[10px] uppercase tracking-caps text-ink-3">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="cursor-pointer rounded-sm border border-line bg-bg px-1 py-0.5 text-[11px] text-ink-1 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-pressed={onlyFlaky}
          onClick={() => setOnlyFlaky((v) => !v)}
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-[11px]',
            onlyFlaky
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-bg text-ink-2 hover:bg-bg-hover',
          )}
        >
          Only flaky
        </button>
        <span className="ml-auto text-[10px] text-ink-3">
          Pass rate · sparkline · last fail
        </span>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
              <th className="px-2 py-1 text-left">Test</th>
              <th className="px-2 py-1 text-left">Last 30 runs</th>
              <th className="px-2 py-1 text-left">Flake</th>
              <th className="px-2 py-1 text-left">Last fail</th>
              <th className="px-2 py-1 text-right" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, score, cls, lastFail }) => {
              const isOpen = expanded === t.id;
              return (
                <FlakyRow
                  key={t.id}
                  t={t}
                  score={score}
                  cls={cls}
                  lastFail={lastFail}
                  isOpen={isOpen}
                  onToggle={() => setExpanded(isOpen ? null : t.id)}
                />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-ink-3">
                  Nothing to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </OverlayPanel>
  );
}

interface FlakyRowProps {
  t: FlakyTest;
  score: number;
  cls: FlakeClass;
  lastFail: number;
  isOpen: boolean;
  onToggle(): void;
}

function FlakyRow({ t, score, cls, lastFail, isOpen, onToggle }: FlakyRowProps) {
  return (
    <>
      <tr className="border-t border-line/60 hover:bg-bg-hover">
        <td className="px-2 py-1">
          <button
            onClick={onToggle}
            className="flex items-start gap-1.5 text-left"
          >
            <span
              className={cn(
                'mt-1 inline-block h-1.5 w-1.5 rounded-full',
                cls === 'stable'
                  ? 'bg-sem-static'
                  : cls === 'sus'
                    ? 'bg-sev-info'
                    : cls === 'flaky'
                      ? 'bg-sev-warn'
                      : 'bg-sev-err',
              )}
            />
            <div>
              <div className="text-ink-1">{t.name}</div>
              <div className="font-mono text-[10px] text-ink-3">{t.file}</div>
            </div>
          </button>
        </td>
        <td className="px-2 py-1">
          <Sparkline runs={t.runs} />
        </td>
        <td className="px-2 py-1">
          <div className="inline-flex items-center gap-2">
            <Chip tone={CLASS_TONE[cls]} size="xs">
              {cls}
            </Chip>
            <ScoreBar score={score} />
          </div>
        </td>
        <td className="px-2 py-1">
          {t.lastFailReason ? (
            <Chip tone={REASON_TONE[t.lastFailReason]} size="xs">
              {t.lastFailReason}
            </Chip>
          ) : (
            <span className="text-[11px] text-ink-3">—</span>
          )}
          <div className="text-[10px] text-ink-3">{fmtAgo(lastFail)}</div>
        </td>
        <td className="px-2 py-1 text-right">
          <div className="inline-flex gap-1">
            <Button
              size="xs"
              tone="ghost"
              onClick={() => toast(`Open "${t.name}"`)}
            >
              Open
            </Button>
            <Button
              size="xs"
              tone="warn"
              onClick={() => toast(`Quarantined "${t.name}"`)}
            >
              Quarantine
            </Button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-bg-subtle/40">
          <td colSpan={5} className="px-2 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                  Error frequency
                </div>
                {t.errorStacks.length === 0 ? (
                  <div className="text-[11px] text-ink-3">
                    No recorded failures.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {t.errorStacks.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-sm border border-line bg-bg px-2 py-1"
                      >
                        <Chip tone="muted" size="xs">
                          ×{s.count}
                        </Chip>
                        <span className="font-mono text-[10px] text-ink-2">
                          {s.stack}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
                  Suggested
                </div>
                <div className="rounded-sm border border-line bg-bg px-2 py-1.5">
                  <div className="text-[11px] text-ink-2">
                    <span className="font-medium text-ink-1">Cause: </span>
                    {t.suggested.cause}
                  </div>
                  <div className="mt-1 text-[11px] text-ink-2">
                    <span className="font-medium text-ink-1">Fix: </span>
                    {t.suggested.fix}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
