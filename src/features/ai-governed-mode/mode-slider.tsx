/**
 * Phase 18 — Mode slider.
 *
 * Three-segment pill control: Instant · Guided · Governed. Pairs with
 * the Phase-7 ai-mode-system store. When the user types a critical-flow
 * keyword the slider visually animates to "Governed" with a highlight
 * ring and tooltip explaining the auto-upgrade.
 *
 * The slider is only a *display* of the requested floor — actual
 * effective mode is computed inside `runGovernedFlow` via `resolveMode`.
 */

import { useEffect, useState } from 'react';
import { Bolt, Compass, ShieldCheck } from 'lucide-react';
import { useAiMode, type AiMode } from '@features/ai-mode-system';
import { Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';

const SEGMENTS: { id: AiMode; label: string; description: string; Icon: typeof Bolt }[] = [
  {
    id: 'instant',
    label: 'Instant',
    description: 'Single-shot patch, no checks. Best for tiny edits.',
    Icon: Bolt,
  },
  {
    id: 'guided',
    label: 'Guided',
    description: 'Plan first, you approve, then patch. Lightweight checks.',
    Icon: Compass,
  },
  {
    id: 'governed',
    label: 'Governed',
    description: 'Plan → patch → verify with admission gate. Co-shipper mode.',
    Icon: ShieldCheck,
  },
];

const CRITICAL_REGEX = /(payment|checkout|stripe|auth|login|signup|password|admin|billing|subscription|token)/i;

interface Props {
  /** Free-text from the prompt input — used to detect auto-escalation. */
  prompt?: string;
  className?: string;
}

export function ModeSlider({ prompt, className }: Props): JSX.Element {
  const { mode, setMode } = useAiMode();
  const autoEscalated =
    typeof prompt === 'string' && prompt.length > 2 && CRITICAL_REGEX.test(prompt);
  const effectiveMode: AiMode =
    autoEscalated && mode !== 'governed' ? 'governed' : (mode === 'autonomous' ? 'governed' : mode);

  // Crossfade the description.
  const FALLBACK = SEGMENTS[1] as (typeof SEGMENTS)[number];
  const active =
    SEGMENTS.find((s) => s.id === effectiveMode) ?? FALLBACK;
  const [descKey, setDescKey] = useState<AiMode>(active.id);
  useEffect(() => {
    setDescKey(active.id);
  }, [active.id]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        role="radiogroup"
        aria-label="AI mode"
        className={cn(
          'relative inline-flex items-center gap-0.5 rounded-full border bg-bg-subtle p-0.5',
          'transition-shadow duration-moderate',
          autoEscalated
            ? 'border-accent/60 shadow-glow-accent ring-2 ring-accent/30'
            : 'border-line/60',
        )}
      >
        {SEGMENTS.map((seg) => {
          const isActive = seg.id === effectiveMode;
          const isAutoFor = autoEscalated && seg.id === 'governed';
          return (
            <Tooltip
              key={seg.id}
              content={
                isAutoFor
                  ? 'Auto-upgraded — critical flow detected.'
                  : seg.description
              }
              side="bottom"
            >
              <button
                role="radio"
                aria-checked={isActive}
                type="button"
                onClick={() => setMode(seg.id)}
                className={cn(
                  'relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                  'transition-[background-color,color,box-shadow,transform] duration-moderate ease-spring-soft',
                  'mi-focus-ring',
                  isActive
                    ? 'bg-gradient-to-r from-accent/90 to-accent text-white shadow-pop'
                    : 'text-ink-3 hover:text-ink-1',
                )}
              >
                <seg.Icon className="h-3 w-3" />
                <span>{seg.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div
        key={descKey}
        className={cn(
          'min-h-[14px] text-[10px] text-ink-3 transition-opacity duration-moderate',
          'animate-in fade-in-0',
        )}
      >
        {autoEscalated ? (
          <span className="text-accent">
            Auto-upgraded to Governed — payment/auth keyword detected.
          </span>
        ) : (
          active.description
        )}
      </div>
    </div>
  );
}

export default ModeSlider;
