/**
 * Obligation card — shows a checklist of ProofObligations with a
 * pass/fail/inconclusive icon per row plus a "what would satisfy this"
 * hover hint.
 *
 * Pure presentational — caller supplies the ObligationCheck[] (typically
 * from `checkObligations(...)` in shared/admission).
 */

import { Check, CircleHelp, X } from 'lucide-react';
import type { ObligationCheck } from '@shared/admission';
import { Tooltip, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Props {
  checks: ObligationCheck[];
  /** Optional title; defaults to "Proof obligations". */
  title?: string;
  className?: string;
}

function rowIcon(check: ObligationCheck) {
  if (check.inconclusive) {
    return (
      <CircleHelp className="h-4 w-4 text-sev-warn" aria-label="inconclusive" />
    );
  }
  if (check.satisfied) {
    return <Check className="h-4 w-4 text-sem-static" aria-label="satisfied" />;
  }
  return <X className="h-4 w-4 text-sev-err" aria-label="unsatisfied" />;
}

function rowTone(check: ObligationCheck): 'static' | 'err' | 'warn' {
  if (check.inconclusive) return 'warn';
  if (check.satisfied) return 'static';
  return 'err';
}

export function ObligationCard({
  checks,
  title = 'Proof obligations',
  className,
}: Props): JSX.Element {
  if (checks.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-line/60 bg-bg/40 p-3 text-sm text-ink-3',
          className,
        )}
      >
        No proof obligations apply to this change.
      </div>
    );
  }

  const counts = {
    satisfied: checks.filter((c) => !c.inconclusive && c.satisfied).length,
    unsatisfied: checks.filter((c) => !c.inconclusive && !c.satisfied).length,
    inconclusive: checks.filter((c) => c.inconclusive).length,
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-line/70 bg-bg/40 backdrop-blur',
        className,
      )}
    >
      <div className="hairline-b flex items-center justify-between bg-gradient-to-r from-bg-subtle/40 to-transparent px-3 py-2">
        <span className="text-xs uppercase tracking-caps text-ink-3">
          {title}
        </span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <Chip tone="static" size="xs">
            {counts.satisfied} ok
          </Chip>
          <Chip tone="err" size="xs">
            {counts.unsatisfied} fail
          </Chip>
          <Chip tone="warn" size="xs">
            {counts.inconclusive} ?
          </Chip>
        </span>
      </div>
      <ul className="divide-y divide-line/40">
        {checks.map((c) => (
          <li
            key={c.obligation.id}
            className="flex items-start gap-2 px-3 py-2 text-sm"
          >
            <span className="mt-0.5 shrink-0">{rowIcon(c)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Chip tone={rowTone(c)} size="xs">
                  {c.obligation.kind}
                </Chip>
                <span className="truncate text-ink-1">
                  {c.obligation.description}
                </span>
              </div>
              {c.evidence && c.evidence.length > 0 ? (
                <div className="mt-0.5 truncate text-[11px] text-ink-3">
                  evidence: {c.evidence.slice(0, 3).join(', ')}
                  {c.evidence.length > 3 ? '…' : ''}
                </div>
              ) : null}
              {c.hint ? (
                <Tooltip content={c.hint}>
                  <span className="mt-0.5 inline-block cursor-help text-[11px] text-ink-3 underline decoration-dotted">
                    how to satisfy
                  </span>
                </Tooltip>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
