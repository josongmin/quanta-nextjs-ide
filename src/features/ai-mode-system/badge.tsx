/**
 * Compact AI-mode badge for headers.
 *
 * If `escalation` is provided and `effective !== requested`, the badge
 * shows an upward arrow + tooltip listing the escalation reasons.
 */

import { ArrowUp, Bolt, Bot, Compass, ShieldCheck } from 'lucide-react';
import { Tooltip, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { useAiMode } from './store';
import { MODE_CONFIG, type AiMode, type ResolvedMode } from './types';

const ICON: Record<AiMode, typeof Bolt> = {
  instant: Bolt,
  guided: Compass,
  autonomous: Bot,
  governed: ShieldCheck,
};

interface Props {
  /** Optional resolved mode showing escalation. */
  escalation?: ResolvedMode;
  className?: string;
}

export function AiModeBadge({ escalation, className }: Props): JSX.Element {
  const { mode } = useAiMode();
  const effective = escalation?.effective ?? mode;
  const escalated = escalation && escalation.requested !== escalation.effective;
  const Icon = ICON[effective];
  const cfg = MODE_CONFIG[effective];

  const tooltip = escalated
    ? `Auto-escalated from ${escalation.requested} to ${escalation.effective}: ${escalation.escalationReasons.join('; ')}`
    : `${cfg.label} mode — ${cfg.description}`;

  const tone =
    effective === 'governed'
      ? 'warn'
      : effective === 'autonomous'
      ? 'edge'
      : effective === 'guided'
      ? 'static'
      : 'info';

  return (
    <Tooltip content={tooltip}>
      <Chip
        tone={tone}
        size="xs"
        className={cn('cursor-help gap-1', className)}
      >
        <Icon className="h-3 w-3" />
        <span className="uppercase">{cfg.label}</span>
        {escalated ? (
          <ArrowUp
            className="h-2.5 w-2.5"
            aria-label="auto-escalated"
          />
        ) : null}
      </Chip>
    </Tooltip>
  );
}
