import { useState } from 'react';
import { Icon, SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { CockpitRisk } from './types';

interface RiskRowProps {
  risk: CockpitRisk;
  /** Stagger reveal delay in ms (left-to-right cascade). */
  delayMs?: number;
  /** Optional CTA: "Open evidence tracer". */
  onOpenEvidence?: (risk: CockpitRisk) => void;
}

const KIND_BADGE: Record<
  CockpitRisk['kind'],
  { label: string; tone: string }
> = {
  reject: { label: 'REJECT', tone: 'border-sev-err/40 bg-sev-err-soft text-sev-err' },
  err: { label: 'ERR', tone: 'border-sev-err/30 bg-sev-err-soft/60 text-sev-err' },
  review: { label: 'REVIEW', tone: 'border-sev-warn/40 bg-sev-warn-soft text-sev-warn' },
  warn: { label: 'WARN', tone: 'border-sev-warn/30 bg-sev-warn-soft/60 text-sev-warn' },
};

export function RiskRow({ risk, delayMs = 0, onOpenEvidence }: RiskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = KIND_BADGE[risk.kind];
  return (
    <div
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
      className={cn(
        'animate-slide-up',
        'group rounded-md border border-line bg-bg',
        'transition-[border-color,background-color] duration-moderate ease-spring-soft',
        'hover:border-line-strong hover:bg-bg-hover',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          'mi-focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
        )}
      >
        <SeverityDot severity={risk.severity} />
        <span
          className={cn(
            'inline-flex h-5 items-center rounded-full border px-1.5 text-[9px] font-bold tracking-caps',
            badge.tone,
          )}
        >
          {badge.label}
        </span>
        {risk.routePath ? (
          <span className="font-mono text-[11px] text-ink-2">
            {risk.routePath}
          </span>
        ) : null}
        <span className="flex-1 truncate text-sm text-ink-1">{risk.title}</span>
        <Icon.ChevDown
          className={cn(
            'h-3.5 w-3.5 text-ink-3 transition-transform duration-moderate ease-spring-soft',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* Grid-template-rows trick — no jitter, no max-h tweaking. */}
      <div
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-moderate ease-spring-soft',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        aria-hidden={!expanded}
      >
        <div className="min-h-0">
          <div className="hairline-fade-x" />
          <div className="space-y-2 px-3 py-2.5 text-[12px]">
            <p className="text-ink-2">{risk.cause}</p>
            {risk.witness.length ? (
              <div>
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-caps text-ink-3">
                  Witness chain
                </div>
                <ul className="space-y-0.5 font-mono text-[11px] text-ink-2">
                  {risk.witness.map((w, i) => (
                    <li key={`${w}-${i}`} className="flex items-center gap-2">
                      <span className="text-ink-3">›</span>
                      <span className="truncate">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {risk.affectedFiles.length ? (
              <div>
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-caps text-ink-3">
                  Affected files
                </div>
                <ul className="space-y-0.5 font-mono text-[11px] text-ink-2">
                  {risk.affectedFiles.slice(0, 3).map((f) => (
                    <li key={f} className="truncate">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {onOpenEvidence ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEvidence(risk);
                }}
                className={cn(
                  'mi-press mi-focus-ring inline-flex items-center gap-1 rounded-md',
                  'border border-line bg-bg-subtle px-2 py-1 text-[11px] text-ink-2',
                  'hover:bg-bg-hover hover:border-line-strong',
                )}
              >
                Open evidence tracer
                <Icon.Right className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
