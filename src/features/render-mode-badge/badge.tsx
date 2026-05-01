/**
 * Pill-shaped badge that surfaces the resolved render mode.
 *
 * The badge is intentionally tiny (28px tall) so it can sit inside route
 * rows, the inspector header, or the file gutter without disrupting layout.
 * Hovering shows a quick "why" tooltip, clicking opens the full why-card.
 */

import { useState } from 'react';
import { match } from 'ts-pattern';
import { Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { modeFamily, modeLabel } from './resolver';
import type { ResolvedMode } from './types';
import { WhyCard } from './why-card';

interface Props {
  readonly resolved: ResolvedMode;
  readonly compact?: boolean;
  readonly onClick?: () => void;
}

export function RenderModeBadge({ resolved, compact, onClick }: Props) {
  const [open, setOpen] = useState(false);
  const family = modeFamily(resolved.mode);
  const tone = familyClasses(family);
  const label = modeLabel(resolved.mode);

  return (
    <span className="relative inline-block">
      <Tooltip
        content={
          <div className="space-y-1">
            <div className="font-mono text-[11px]">{label}</div>
            <div className="text-[10px] text-ink-3">{resolved.cause}</div>
            <div className="text-[10px] text-ink-2">{resolved.behavior}</div>
          </div>
        }
      >
        <button
          type="button"
          onClick={() => {
            onClick?.();
            setOpen((v) => !v);
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
            tone.border,
            tone.bg,
            tone.fg,
            compact && 'h-5 px-1.5 text-[9px]',
          )}
          aria-label={`Render mode: ${label}. ${resolved.cause}`}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          <span>{label}</span>
          {resolved.revalidate ? (
            <span className="font-mono text-[9px] opacity-70">
              {resolved.revalidate}s
            </span>
          ) : null}
        </button>
      </Tooltip>
      {open ? (
        <span className="absolute left-0 top-[calc(100%+4px)] z-50 block w-[360px] text-left">
          <WhyCard
            resolved={resolved}
            onClose={(e) => {
              e?.stopPropagation();
              setOpen(false);
            }}
          />
        </span>
      ) : null}
    </span>
  );
}

function familyClasses(family: ReturnType<typeof modeFamily>) {
  return match(family)
    .with('static', () => ({
      border: 'border-sem-static/40',
      bg: 'bg-gradient-to-r from-sem-static/15 to-sem-static/5',
      fg: 'text-sem-static',
      dot: 'bg-sem-static',
    }))
    .with('isr', () => ({
      border: 'border-accent/40',
      bg: 'bg-gradient-to-r from-accent/15 to-accent/5',
      fg: 'text-accent',
      dot: 'bg-accent',
    }))
    .with('dynamic', () => ({
      border: 'border-sev-warn/40',
      bg: 'bg-gradient-to-r from-sev-warn/15 to-sev-warn/5',
      fg: 'text-sev-warn',
      dot: 'bg-sev-warn',
    }))
    .with('streaming', () => ({
      border: 'border-fuchsia-400/40',
      bg: 'bg-gradient-to-r from-fuchsia-400/15 to-fuchsia-400/5',
      fg: 'text-fuchsia-300',
      dot: 'bg-fuchsia-400',
    }))
    .exhaustive();
}
