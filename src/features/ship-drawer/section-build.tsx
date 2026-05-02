/**
 * Ship-it Drawer / Build & Checks section.
 *
 * Renders 4 chips for build / typecheck / lint / test. Failures use solid
 * colour, successes use the soft tone (per spec). Hover lifts the row.
 */

import { useState } from 'react';
import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RunnerChip } from './types';

function tone(state: RunnerChip['state']): 'static' | 'err' | 'warn' | 'muted' {
  switch (state) {
    case 'pass':
      return 'static';
    case 'fail':
      return 'err';
    case 'running':
      return 'warn';
    default:
      return 'muted';
  }
}

function chipLabel(c: RunnerChip): string {
  switch (c.state) {
    case 'pass':
      return '✓ pass';
    case 'fail':
      return '✗ fail';
    case 'running':
      return '… running';
    default:
      return '· idle';
  }
}

function durationStr(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SectionBuild({ runners }: { runners: RunnerChip[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  return (
    <div className="px-4 py-3">
      <div className="text-caps mb-2 text-ink-3">Build &amp; checks</div>
      <ul className="grid grid-cols-2 gap-2">
        {runners.map((c, i) => {
          const isFail = c.state === 'fail';
          const expanded = expandedIdx === i;
          return (
            <li
              key={c.label}
              className={cn(
                'group flex flex-col gap-1 rounded-md border border-line/60 bg-bg-subtle/40 px-2 py-1.5',
                'transition-transform duration-moderate ease-spring-soft hover:-translate-y-px hover:shadow-e1 hover:border-line-strong',
                isFail && 'border-sev-err/40',
              )}
              onClick={() => setExpandedIdx(expanded ? null : i)}
              data-testid={`ship-runner-${c.label}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-caps text-ink-2">
                  {c.label}
                </span>
                <Chip tone={tone(c.state)} size="xs">
                  {chipLabel(c)}
                </Chip>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-ink-3">
                <span>{c.detail ?? '—'}</span>
                <span className="font-mono">{durationStr(c.durationMs) ?? '—'}</span>
              </div>
              {expanded && c.result ? (
                <div className="mt-1 rounded-sm bg-bg/60 p-1 font-mono text-[10px] text-ink-3">
                  runId {c.result.runId} · {c.result.state}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
