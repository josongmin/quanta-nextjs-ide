/**
 * Phase 18 — Obligation checklist.
 *
 * Each obligation row: pass/fail/inconclusive icon + description +
 * evidence link. Hovering reveals the concrete check (pop-out). Failed
 * obligations expose a "Suppress" button that asks for a reason and
 * persists the suppression to the flow.
 */

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, EyeOff, FileText } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Chip,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ObligationView, ObligationSuppression } from './types';

interface Props {
  obligations: ObligationView[];
  onSuppress?: (id: string, suppression: ObligationSuppression) => void;
  /** Show the "Why?" pointer to the check function. */
  onWhy?: (obligationId: string) => void;
  className?: string;
}

function statusOf(o: ObligationView): 'pass' | 'fail' | 'inconclusive' {
  if (o.suppressed) return 'pass';
  const c = o.check;
  if (c.inconclusive) return 'inconclusive';
  return c.satisfied ? 'pass' : 'fail';
}

export function ObligationChecklist({
  obligations,
  onSuppress,
  onWhy,
  className,
}: Props): JSX.Element {
  if (obligations.length === 0) {
    return (
      <div className={cn('rounded border border-line/60 bg-bg-subtle p-3 text-[11px] text-ink-3', className)}>
        No proof obligations derived for this change.
      </div>
    );
  }

  return (
    <ul className={cn('flex flex-col divide-y divide-line/60 rounded border border-line/60 bg-bg', className)}>
      {obligations.map((o) => (
        <ObligationRow
          key={o.check.obligation.id}
          obligation={o}
          onSuppress={onSuppress}
          onWhy={onWhy}
        />
      ))}
    </ul>
  );
}

function ObligationRow({
  obligation,
  onSuppress,
  onWhy,
}: {
  obligation: ObligationView;
  onSuppress?: Props['onSuppress'];
  onWhy?: Props['onWhy'];
}): JSX.Element {
  const status = statusOf(obligation);
  const o = obligation.check.obligation;
  const evidence = obligation.check.evidence ?? [];
  const [reason, setReason] = useState('');
  const [showSuppress, setShowSuppress] = useState(false);

  const Icon =
    status === 'pass'
      ? CheckCircle2
      : status === 'inconclusive'
        ? HelpCircle
        : AlertTriangle;

  const tone =
    status === 'pass'
      ? 'text-sev-info'
      : status === 'inconclusive'
        ? 'text-sev-warn'
        : 'text-sev-err';

  const hint = obligation.check.hint;

  return (
    <li className="flex items-start gap-2 px-2.5 py-2 text-[11px]">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-ink-1">{o.description}</span>
          <Chip size="xs" tone={status === 'pass' ? 'info' : status === 'inconclusive' ? 'warn' : 'err'}>
            {status === 'pass' ? 'pass' : status === 'inconclusive' ? 'fail-closed' : 'fail'}
          </Chip>
          {obligation.suppressed ? (
            <Tooltip content={`Suppressed: ${obligation.suppressed.reason}`}>
              <Chip size="xs" tone="muted">suppressed</Chip>
            </Tooltip>
          ) : null}
          {status === 'inconclusive' ? (
            <Tooltip content="No evidence available — fail-closed (treat as not satisfied).">
              <span className="rounded bg-sev-warn-soft px-1 py-0 text-[9px] font-bold uppercase tracking-caps text-sev-warn">
                ?
              </span>
            </Tooltip>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-ink-3">
          <span>kind: {o.kind}</span>
          {evidence.length > 0 ? (
            <>
              <span>·</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 rounded px-1 text-accent hover:bg-accent-soft"
                    type="button"
                  >
                    <FileText className="h-2.5 w-2.5" />
                    {evidence.length} evidence
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-[11px]">
                  <div className="mb-1 font-medium text-ink-1">Evidence</div>
                  <ul className="font-mono text-[10px] text-ink-2">
                    {evidence.map((e) => (
                      <li key={e}>· {e}</li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </>
          ) : null}
          {hint ? (
            <>
              <span>·</span>
              <Tooltip content={hint}>
                <span className="cursor-help underline decoration-dotted">hint</span>
              </Tooltip>
            </>
          ) : null}
          <span className="ml-auto flex items-center gap-1">
            <Button
              tone="ghost"
              size="xs"
              type="button"
              onClick={() => onWhy?.(o.id)}
            >
              Why?
            </Button>
            {status !== 'pass' && !obligation.suppressed ? (
              <Popover open={showSuppress} onOpenChange={setShowSuppress}>
                <PopoverTrigger asChild>
                  <Button tone="ghost" size="xs" type="button">
                    <EyeOff className="h-3 w-3" /> Suppress
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-[11px]">
                  <div className="mb-1 font-medium text-ink-1">Suppress {o.id}</div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (recorded in evidence packet)…"
                    className="h-16 w-full rounded border border-line/60 bg-bg p-1 text-[11px] outline-none focus:border-accent"
                  />
                  <div className="mt-1 flex justify-end gap-1">
                    <Button
                      size="xs"
                      tone="ghost"
                      onClick={() => {
                        setShowSuppress(false);
                        setReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      tone="warn"
                      disabled={!reason.trim()}
                      onClick={() => {
                        onSuppress?.(o.id, {
                          obligationId: o.id,
                          reason: reason.trim(),
                          at: Date.now(),
                        });
                        setShowSuppress(false);
                        setReason('');
                      }}
                    >
                      Suppress
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </span>
        </div>
      </div>
    </li>
  );
}

export default ObligationChecklist;
