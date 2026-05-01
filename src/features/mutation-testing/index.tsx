import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  fileMutations,
  killRatio,
  mutatorBreakdown,
  survivedCount,
  totalKillRatio,
  type FileMutation,
  type MutantStatus,
} from './helpers';

const STATUS_TONE: Record<MutantStatus, 'static' | 'err' | 'warn' | 'muted'> = {
  killed: 'static',
  survived: 'err',
  timeout: 'warn',
  noCoverage: 'muted',
};

function KillBar({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  const tone =
    pct >= 90
      ? 'bg-sem-static'
      : pct >= 70
        ? 'bg-sev-info'
        : pct >= 50
          ? 'bg-sev-warn'
          : 'bg-sev-err';
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="relative inline-block h-1 w-20 overflow-hidden rounded-full bg-bg-subtle">
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

function HistorySpark({ history }: { history: ReadonlyArray<number> }) {
  const w = 60;
  const h = 14;
  if (history.length === 0) return <svg width={w} height={h} />;
  const max = 1;
  const step = w / Math.max(1, history.length - 1);
  const points = history.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`);
  return (
    <svg width={w} height={h} className="block">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="1.2"
      />
      {history.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (v / max) * (h - 2) - 1}
          r="1.5"
          fill="hsl(var(--accent))"
        />
      ))}
    </svg>
  );
}

export function MutationTestingOverlay() {
  const open = useUiStore((s) => s.overlays.mutationTesting.open);
  const close = useUiStore((s) => s.closeOverlay);

  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...fileMutations].sort(
        (a, b) => survivedCount(b) - survivedCount(a),
      ),
    [],
  );
  const total = totalKillRatio();
  const totalPct = Math.round(total * 100);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('mutationTesting'))}
      title="Mutation Testing"
      subtitle="Killed / total mutants per file"
      size="md"
      footer={
        <>
          <span className="mr-auto text-[11px] text-ink-3">
            Total kill ratio:{' '}
            <span className="text-ink-1 font-medium">{totalPct}%</span>
          </span>
          <Button
            size="xs"
            tone="accent"
            onClick={() => toast('Running mutation pass (mock)')}
          >
            Run mutation pass (mock)
          </Button>
        </>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-[10px] uppercase tracking-caps text-ink-3">
          Sort
        </span>
        <span className="rounded-sm border border-line bg-bg px-1.5 py-0.5 text-[11px] text-ink-1">
          surviving desc
        </span>
        <span className="ml-auto text-[10px] text-ink-3">
          {sorted.length} files
        </span>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-subtle text-[10px] uppercase tracking-caps text-ink-3">
              <th className="px-2 py-1 text-left">File</th>
              <th className="px-2 py-1 text-left">Score</th>
              <th className="px-2 py-1 text-left">Survived</th>
              <th className="px-2 py-1 text-left">Mutators</th>
              <th className="px-2 py-1 text-left">Trend</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => (
              <MutationRow
                key={f.file}
                f={f}
                isOpen={expanded === f.file}
                onToggle={() =>
                  setExpanded(expanded === f.file ? null : f.file)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </OverlayPanel>
  );
}

interface RowProps {
  f: FileMutation;
  isOpen: boolean;
  onToggle(): void;
}

function MutationRow({ f, isOpen, onToggle }: RowProps) {
  const ratio = killRatio(f);
  const survived = survivedCount(f);
  const breakdown = mutatorBreakdown(f);
  const survivors = f.mutants.filter((m) => m.status === 'survived');

  return (
    <>
      <tr className="border-t border-line/60 hover:bg-bg-hover">
        <td className="px-2 py-1">
          <button
            onClick={onToggle}
            className="text-left font-mono text-[11px] text-ink-1"
          >
            {f.file}
          </button>
        </td>
        <td className="px-2 py-1">
          <KillBar ratio={ratio} />
        </td>
        <td className="px-2 py-1">
          <Chip tone={survived > 0 ? 'err' : 'static'} size="xs">
            {survived} survived
          </Chip>
        </td>
        <td className="px-2 py-1">
          <div className="flex flex-wrap gap-1">
            {breakdown.map((b) => (
              <span
                key={b.mutator}
                className="inline-flex h-4 items-center rounded-sm border border-line bg-bg-subtle px-1 text-[10px] text-ink-2"
              >
                {b.mutator} ×{b.count}
              </span>
            ))}
          </div>
        </td>
        <td className="px-2 py-1">
          <HistorySpark history={f.history} />
        </td>
        <td className="px-2 py-1 text-right">
          <Button size="xs" tone="ghost" onClick={onToggle}>
            {isOpen ? 'Hide' : 'Survivors'}
          </Button>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-bg-subtle/40">
          <td colSpan={6} className="px-2 py-2">
            {survivors.length === 0 ? (
              <div className="text-[11px] text-ink-3">
                No survived mutants — all killed or not covered.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {survivors.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-sm border border-line bg-bg px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2">
                        <Chip tone={STATUS_TONE[m.status]} size="xs">
                          {m.status}
                        </Chip>
                        <span className="font-mono text-[10px] text-ink-3">
                          {m.file}:{m.line}
                        </span>
                        <span className="text-[11px] text-ink-2">
                          {m.description}
                        </span>
                      </div>
                      <Button
                        size="xs"
                        tone="ghost"
                        onClick={() =>
                          toast(`Suggest test for ${m.id} (${m.mutator})`)
                        }
                      >
                        Suggest test
                      </Button>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div className="rounded-sm border border-sev-err/30 bg-sev-err-soft/30 px-2 py-1 font-mono text-[10px] text-sev-err">
                        <span className="select-none text-ink-3">- </span>
                        {m.before}
                      </div>
                      <div className="rounded-sm border border-sem-static/30 bg-sem-static-soft/30 px-2 py-1 font-mono text-[10px] text-sem-static">
                        <span className="select-none text-ink-3">+ </span>
                        {m.after}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-ink-3">
                      Mutator: {m.mutator}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
