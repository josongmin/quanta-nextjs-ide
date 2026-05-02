/**
 * Ship-it Drawer / Suggestions section.
 *
 * Lists actionable issues with an Auto-fix button. Each Auto-fix click
 * dispatches `runFullAdmission` against the changed files and collapses
 * the row with a check-mark on success.
 */

import { useState } from 'react';
import { runFullAdmission } from '@shared/admission';
import { useEvidenceStore } from '@entities/evidence';
import { Button } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ShipSuggestion, CriticalFlowTouch } from './types';

interface Props {
  suggestions: ShipSuggestion[];
  flows: CriticalFlowTouch[];
}

export function SectionSuggestions({ suggestions, flows }: Props) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const onAutoFix = async (s: ShipSuggestion) => {
    setPending((p) => new Set(p).add(s.id));
    const last = useEvidenceStore.getState().recent(1)[0];
    const files = last?.change.files ?? [];
    try {
      const { verdict } = await runFullAdmission({
        kind: 'patch',
        files,
      });
      const ok = verdict.decision === 'admit' || verdict.decision === 'review';
      if (ok) {
        setResolved((r) => new Set(r).add(s.id));
      }
    } catch {
      /* ignore — UI shows pending → idle */
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(s.id);
        return next;
      });
    }
  };

  if (suggestions.length === 0 && flows.length === 0) {
    return (
      <div className="px-4 py-3">
        <div className="text-caps mb-2 text-ink-3">Suggestions</div>
        <div className="rounded-md border border-line bg-bg-subtle/40 p-3 text-xs text-ink-3">
          Nothing to fix.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {flows.length > 0 ? (
        <div className="mb-3">
          <div className="text-caps mb-2 text-ink-3">Critical flows touched</div>
          <ul className="flex flex-wrap gap-1.5">
            {flows.map((t) => (
              <li
                key={t.flow.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]',
                  t.obligationStatus === 'satisfied'
                    ? 'border-sem-static/40 bg-sem-static-soft text-sem-static'
                    : t.obligationStatus === 'pending'
                      ? 'border-sev-warn/40 bg-sev-warn-soft text-sev-warn'
                      : 'border-line bg-bg-subtle text-ink-2',
                )}
              >
                <span className="font-mono uppercase tracking-caps">{t.flow.kind}</span>
                <span className="text-[10px] opacity-80">
                  {t.touchedFiles.length} file{t.touchedFiles.length === 1 ? '' : 's'} ·{' '}
                  {t.obligationStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {suggestions.length > 0 ? (
        <>
          <div className="text-caps mb-2 text-ink-3">Suggestions</div>
          <ul className="space-y-1.5">
            {suggestions.map((s) => {
              const isResolved = resolved.has(s.id);
              const isPending = pending.has(s.id);
              return (
                <li
                  key={s.id}
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-2 py-1.5 text-[11px]',
                    'border-line bg-bg-subtle/40',
                    'transition-all duration-moderate ease-spring-soft',
                    isResolved && 'border-sem-static/40 bg-sem-static-soft/40',
                  )}
                  style={
                    isResolved
                      ? { maxHeight: '2rem', overflow: 'hidden', opacity: 0.7 }
                      : undefined
                  }
                >
                  <span className="mt-0.5">
                    {isResolved ? (
                      <span className="text-sem-static">✓</span>
                    ) : isPending ? (
                      <span className="animate-spin text-ink-3">◐</span>
                    ) : (
                      <span className="text-ink-3">·</span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-ink-1">
                      {isResolved ? 'fixed' : s.title}
                    </span>
                    {!isResolved ? (
                      <span className="block truncate text-[10px] text-ink-3">
                        {s.detail}
                      </span>
                    ) : null}
                  </span>
                  {!isResolved && s.autoFixable ? (
                    <Button
                      tone="soft"
                      size="xs"
                      disabled={isPending}
                      onClick={() => onAutoFix(s)}
                    >
                      {isPending ? '…' : 'Auto-fix'}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
