/**
 * AI Mode selector — four glass cards.
 *
 * Public exports:
 *   - <AiModeSelector /> — the card grid
 *   - <AiModeProvider /> — pass-through component (no provider state
 *     needed; the store is global). Exists so a parent surface can
 *     wrap a sub-tree if it later wants to swap to a non-zustand model.
 *   - useAiMode (re-exported from ./store)
 *   - resolveMode (re-exported from ./escalation)
 */

import { Bolt, Compass, Bot, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { useAiMode, useAiModeStore } from './store';
import { MODE_CONFIG, type AiMode } from './types';

const MODE_ICON: Record<AiMode, typeof Bolt> = {
  instant: Bolt,
  guided: Compass,
  autonomous: Bot,
  governed: ShieldCheck,
};

const MODE_GRADIENT: Record<AiMode, string> = {
  instant: 'from-sev-info-soft/30 to-transparent',
  guided: 'from-sem-static-soft/30 to-transparent',
  autonomous: 'from-sem-edge-soft/30 to-transparent',
  governed: 'from-sev-warn-soft/30 to-transparent',
};

const MODES: AiMode[] = ['instant', 'guided', 'autonomous', 'governed'];

export function AiModeSelector(): JSX.Element {
  const { mode, setMode } = useAiMode();
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      role="radiogroup"
      aria-label="AI mode"
    >
      {MODES.map((m) => {
        const cfg = MODE_CONFIG[m];
        const Icon = MODE_ICON[m];
        const active = mode === m;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'relative flex flex-col gap-1 rounded-lg border p-3 text-left transition',
              'bg-bg/40 backdrop-blur',
              active
                ? 'border-accent/60 shadow-pop ring-1 ring-accent/30'
                : 'border-line/60 opacity-80 hover:opacity-100',
              'bg-gradient-to-br',
              MODE_GRADIENT[m],
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon
                className={cn('h-4 w-4', active ? 'text-accent' : 'text-ink-2')}
              />
              <span
                className={cn(
                  'text-sm font-semibold',
                  active ? 'text-accent' : 'text-ink-1',
                )}
              >
                {cfg.label}
              </span>
              {active ? (
                <span className="ml-auto rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-caps text-accent">
                  current
                </span>
              ) : null}
            </div>
            <div className="text-[11px] text-ink-3">{cfg.description}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-3">
              <span>{cfg.latencyHint}</span>
              <span aria-hidden>·</span>
              <span>{cfg.safetyHint}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ProviderProps {
  children: ReactNode;
}

/**
 * No-op wrapper — the AI mode is held in a global store, not context.
 * Provided so a parent surface can opt-in to wrapping a subtree (and
 * we have a place to migrate to context later if needed).
 */
export function AiModeProvider({ children }: ProviderProps): JSX.Element {
  void useAiModeStore.getState; // ensure store is initialized
  return <>{children}</>;
}

export { useAiMode } from './store';
export { resolveMode } from './escalation';
export type { AiMode, AiModeConfig, ResolvedMode } from './types';
export { MODE_CONFIG } from './types';

export default AiModeSelector;
