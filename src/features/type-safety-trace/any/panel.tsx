/**
 * Any Leakage panel — top sources treemap + per-source detail.
 */

import { useMemo, useState } from 'react';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useTypeSafetyStore } from '../store';
import { SOURCE_LABEL } from './sources';
import type { AnyLeak } from './types';

const SEV_TONE = {
  critical: 'err' as const,
  high: 'err' as const,
  medium: 'warn' as const,
  low: 'info' as const,
};

export function AnyLeakagePanel({
  onJump,
}: {
  onJump?: (file: string, line: number, column: number) => void;
}) {
  const leaks = useTypeSafetyStore((s) => s.any.leaks);
  const [activeIdx, setActive] = useState<number | null>(null);

  const treemap = useMemo(() => {
    const total = leaks.reduce((acc, l) => acc + Math.max(1, l.propagation.length), 0);
    return leaks.map((l, i) => ({
      idx: i,
      leak: l,
      ratio: total === 0 ? 0 : Math.max(1, l.propagation.length) / total,
    }));
  }, [leaks]);

  if (leaks.length === 0) {
    return (
      <div className="p-6 text-center text-[12px] text-ink-3">
        No <span className="font-mono">any</span> types detected — your codebase is type-safe ✓
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-caps text-ink-3">
          Top any sources
        </div>
        <div className="flex flex-wrap gap-1.5">
          {treemap.slice(0, 16).map((t) => {
            const tone = SEV_TONE[t.leak.severity];
            return (
              <button
                key={t.idx}
                type="button"
                onClick={() => setActive(t.idx)}
                className={cn(
                  'rounded-sm border border-line bg-bg-subtle px-2 py-1 text-left text-[10.5px]',
                  'transition-all duration-200',
                  activeIdx === t.idx ? 'ring-1 ring-accent' : 'hover:bg-bg',
                )}
                style={{
                  flex: `${Math.max(0.4, t.ratio * 4)} 1 80px`,
                  minHeight: 36 + Math.round(t.ratio * 64),
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-ink-1 truncate">
                    {t.leak.sourceLocation.name}
                  </span>
                  <Chip tone={tone} size="xs">
                    {t.leak.propagation.length}
                  </Chip>
                </div>
                <div className="mt-0.5 text-[10px] text-ink-3">
                  {SOURCE_LABEL[t.leak.sourceKind]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {leaks.map((leak, i) => (
          <LeakCard
            key={i}
            leak={leak}
            expanded={activeIdx === i}
            onToggle={() => setActive((p) => (p === i ? null : i))}
            onJump={onJump}
          />
        ))}
      </div>
    </div>
  );
}

function LeakCard({
  leak,
  expanded,
  onToggle,
  onJump,
}: {
  leak: AnyLeak;
  expanded: boolean;
  onToggle: () => void;
  onJump?: (file: string, line: number, column: number) => void;
}) {
  return (
    <div className="rounded-md border border-line bg-bg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 p-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Chip tone={SEV_TONE[leak.severity]} size="xs">
              {leak.severity}
            </Chip>
            <span className="font-mono text-[11px] text-ink-1 truncate">
              {leak.sourceLocation.file}:{leak.sourceLocation.line}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-ink-2 truncate">{leak.message}</div>
        </div>
        <div className="shrink-0 text-[10.5px] text-ink-3">
          {leak.propagation.length} downstream
        </div>
      </button>
      {expanded ? (
        <ul className="hairline-t max-h-48 overflow-auto p-2 text-[10.5px] font-mono">
          {leak.propagation.length === 0 ? (
            <li className="text-ink-3">No downstream references found yet — run propagation.</li>
          ) : null}
          {leak.propagation.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className="text-ink-2 hover:text-ink-1"
                onClick={() => onJump?.(p.file, p.line, p.column)}
              >
                {p.file}:{p.line}:{p.column}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
