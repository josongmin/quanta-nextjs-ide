/**
 * Ship-it Drawer / Risk verdict section.
 *
 * Big admission badge (ADMIT/REVIEW/REJECT/INCONCLUSIVE) + reasons + score
 * gauge. The badge animates in (scale + pulse-ring). REJECT shakes.
 */

import { useEffect, useState } from 'react';
import { decisionTone, type ExtendedVerdict } from '@shared/admission';
import { cn } from '@shared/lib/cn';
import { decisionLabel } from './types';

const TONE_BG: Record<'good' | 'warn' | 'bad' | 'unknown', string> = {
  good: 'bg-sem-static-soft text-sem-static border-sem-static/40',
  warn: 'bg-sev-warn-soft text-sev-warn border-sev-warn/40',
  bad: 'bg-sev-err-soft text-sev-err border-sev-err/40',
  unknown: 'bg-bg-subtle text-ink-2 border-line',
};

function Gauge({ score }: { score: number }) {
  // Lower is better. 0..100. Render as a horizontal bar with hue from green→red.
  const clamped = Math.max(0, Math.min(100, score));
  const hue = 120 - (clamped / 100) * 120;
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-1 w-24 overflow-hidden rounded-full bg-bg-subtle">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${clamped}%`,
            background: `hsl(${hue} 70% 50%)`,
            transition: 'width 600ms cubic-bezier(.2,1,.3,1)',
          }}
        />
      </div>
      <span className="font-mono text-[10px] text-ink-3">{clamped}</span>
    </div>
  );
}

export function SectionAdmission({ verdict }: { verdict: ExtendedVerdict | null }) {
  const [pulse, setPulse] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!verdict) return;
    setPulse(true);
    const t1 = setTimeout(() => setPulse(false), 700);
    if (verdict.decision === 'reject') {
      setShake(true);
      const t2 = setTimeout(() => setShake(false), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    return () => clearTimeout(t1);
  }, [verdict?.decision, verdict?.score]);

  if (!verdict) {
    return (
      <div className="px-4 py-3">
        <div className="text-caps mb-2 text-ink-3">Risk verdict</div>
        <div className="rounded-md border border-line bg-bg-subtle/40 p-3 text-xs text-ink-3">
          Run admission to see a verdict.
        </div>
      </div>
    );
  }

  const tone = decisionTone(verdict.decision);
  const label = decisionLabel[verdict.decision];
  const reasons = [...verdict.reasons, ...verdict.uncertaintyReasons].slice(0, 4);

  return (
    <div className="px-4 py-3">
      <div className="text-caps mb-2 text-ink-3">Risk verdict</div>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-md border p-3',
          TONE_BG[tone],
          shake && 'animate-shake',
        )}
        style={
          shake
            ? { animation: 'shipShake 320ms cubic-bezier(.2,1,.3,1)' }
            : undefined
        }
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              'relative inline-flex h-7 items-center rounded-md px-2 font-mono text-sm font-bold tracking-caps',
              'border bg-bg/40',
              pulse && 'shadow-glow-accent',
            )}
            style={{
              transform: pulse ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 280ms cubic-bezier(.2,1,.3,1)',
            }}
          >
            {label}
            {pulse ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-md ring-2 ring-current opacity-50"
                style={{ animation: 'shipPulseRing 600ms cubic-bezier(.2,1,.3,1) forwards' }}
              />
            ) : null}
          </span>
          <Gauge score={verdict.score} />
        </div>
        {reasons.length > 0 ? (
          <ul className="space-y-0.5 text-[11px] leading-snug text-ink-2">
            {reasons.map((r, i) => (
              <li key={i} className="truncate">
                · {r}
              </li>
            ))}
          </ul>
        ) : null}
        {verdict.required.length > 0 ? (
          <div className="text-[10px] text-ink-3">
            {verdict.required.length} obligation
            {verdict.required.length === 1 ? '' : 's'} required
          </div>
        ) : null}
      </div>
      <style>{`
        @keyframes shipShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes shipPulseRing {
          0% { opacity: 0.55; transform: scale(0.95); }
          100% { opacity: 0; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
