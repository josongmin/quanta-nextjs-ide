/**
 * Phase 18 — Verdict card.
 *
 * Big tone-coloured badge for the ExtendedVerdict (admit/review/reject/
 * inconclusive). Reasons under, score donut on the right, "Apply with
 * proof" CTA at the bottom (disabled unless decision === 'admit').
 *
 * On REJECT the card shakes once horizontally.
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { decisionTone, type ExtendedVerdict } from '@shared/admission';
import { Button, Chip, Kbd, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface Props {
  verdict?: ExtendedVerdict;
  /** Disable the CTA when no patches are present. */
  hasPatches: boolean;
  isApplying?: boolean;
  shipped?: boolean;
  onApply?: () => void;
}

const TONE_TO_BADGE: Record<
  ReturnType<typeof decisionTone>,
  { wrap: string; label: string; chip: 'info' | 'warn' | 'err' | 'muted' }
> = {
  good: { wrap: 'bg-sev-info-soft/30 border-sev-info/40', label: 'text-sev-info', chip: 'info' },
  warn: { wrap: 'bg-sev-warn-soft/30 border-sev-warn/40', label: 'text-sev-warn', chip: 'warn' },
  bad: { wrap: 'bg-sev-err-soft/30 border-sev-err/50', label: 'text-sev-err', chip: 'err' },
  unknown: { wrap: 'bg-sev-warn-soft/20 border-sev-warn/30', label: 'text-sev-warn', chip: 'warn' },
};

const DECISION_TEXT: Record<ExtendedVerdict['decision'], string> = {
  admit: 'ADMIT',
  review: 'REVIEW',
  reject: 'REJECT',
  inconclusive: 'INCONCLUSIVE',
};

export function VerdictCard({
  verdict,
  hasPatches,
  isApplying,
  shipped,
  onApply,
}: Props): JSX.Element {
  const [shake, setShake] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Shake on reject.
  useEffect(() => {
    if (verdict?.decision === 'reject') {
      setShake(true);
      const t = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [verdict?.decision]);

  // Confetti pulse on shipped transition.
  useEffect(() => {
    if (shipped) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [shipped]);

  if (!verdict) {
    return (
      <div className="rounded-md border border-dashed border-line/60 bg-bg-subtle p-3 text-[11px] text-ink-3">
        Verdict will appear here after the verify stage completes.
      </div>
    );
  }

  const tone = decisionTone(verdict.decision);
  const palette = TONE_TO_BADGE[tone];
  const score = Math.max(0, Math.min(100, verdict.score));
  const canApply = hasPatches && verdict.decision === 'admit' && !isApplying && !shipped;

  return (
    <div
      className={cn(
        'relative rounded-md border p-3',
        'transition-[transform,background-color,border-color] duration-moderate',
        palette.wrap,
        shake && 'mi-shake-x',
      )}
      data-decision={verdict.decision}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-caps',
                'border',
                palette.wrap,
                palette.label,
              )}
            >
              {DECISION_TEXT[verdict.decision]}
            </span>
            <Chip size="xs" tone={palette.chip}>
              score {score}
            </Chip>
            {verdict.basedOn.decision !== verdict.decision ? (
              <Tooltip
                content={`Promoted from base verdict "${verdict.basedOn.decision}" because of uncertainty.`}
              >
                <Chip size="xs" tone="muted">promoted</Chip>
              </Tooltip>
            ) : null}
          </div>

          {verdict.reasons.length > 0 ? (
            <ul className="space-y-0.5 text-[11px] text-ink-2">
              {verdict.reasons.map((r, i) => (
                <li key={`r-${i}`} className="flex items-start gap-1.5">
                  <span className="mt-1 inline-block h-1 w-1 rounded-full bg-ink-3" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {verdict.uncertaintyReasons.length > 0 ? (
            <ul className="space-y-0.5 text-[11px] text-sev-warn">
              {verdict.uncertaintyReasons.map((r, i) => (
                <li key={`u-${i}`} className="flex items-start gap-1.5">
                  <span className="mt-1 inline-block h-1 w-1 rounded-full bg-sev-warn" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <ScoreDonut score={score} tone={tone} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          tone="accent"
          size="sm"
          disabled={!canApply}
          onClick={() => onApply?.()}
          className={cn(
            'gap-1.5',
            canApply &&
              'bg-gradient-to-r from-accent to-accent/80 shadow-glow-accent',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {shipped ? 'Shipped' : isApplying ? 'Shipping…' : 'Apply with proof'}
          {canApply ? (
            <span className="ml-1 flex items-center gap-0.5 text-[10px] opacity-80">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </span>
          ) : null}
        </Button>
        <span className="text-[10px] text-ink-3">
          {verdict.decision === 'admit'
            ? 'All checks satisfied — ready to ship.'
            : verdict.decision === 'inconclusive'
              ? 'Resolve uncertainty before applying.'
              : verdict.decision === 'review'
                ? 'Manual review required.'
                : 'Rejected — fix obligations and re-run.'}
        </span>
      </div>

      {confetti ? <ConfettiPulse /> : null}
    </div>
  );
}

function ScoreDonut({
  score,
  tone,
}: {
  score: number;
  tone: ReturnType<typeof decisionTone>;
}): JSX.Element {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const colour =
    tone === 'good'
      ? 'stroke-sev-info'
      : tone === 'warn'
        ? 'stroke-sev-warn'
        : tone === 'bad'
          ? 'stroke-sev-err'
          : 'stroke-sev-warn';
  return (
    <svg viewBox="0 0 40 40" className="h-12 w-12 -rotate-90 shrink-0">
      <circle
        cx="20"
        cy="20"
        r={r}
        className="fill-none stroke-line/40"
        strokeWidth="3"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        className={cn('fill-none transition-[stroke-dashoffset] duration-relaxed', colour)}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
      <text
        x="20"
        y="22"
        textAnchor="middle"
        className="rotate-90 fill-ink-1 font-mono text-[8px]"
        transform="rotate(90 20 20)"
      >
        {score}
      </text>
    </svg>
  );
}

/**
 * Pure-CSS confetti pulse: 6 small dots radiating from the button.
 * Total animation ≤ 500ms — see keyframes in style block below.
 */
function ConfettiPulse(): JSX.Element {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-3 left-3 h-1 w-1"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="absolute inset-0 inline-block h-1 w-1 rounded-full bg-accent"
          style={{
            animation: `governed-confetti 480ms cubic-bezier(.18,.89,.32,1.28) ${i * 12}ms forwards`,
            transform: `rotate(${(360 / 6) * i}deg) translate(0, 0)`,
          }}
        />
      ))}
      <style>{`
        @keyframes governed-confetti {
          0% { transform: rotate(var(--angle, 0deg)) translate(0, 0); opacity: 1; }
          100% { transform: translate(var(--dx,18px), var(--dy,-18px)) scale(.7); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

export default VerdictCard;
