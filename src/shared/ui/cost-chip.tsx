import type { CostClass } from '@shared/types';
import { cn } from '@shared/lib/cn';
import { Tooltip } from './tooltip';

interface Props {
  cost: CostClass;
  className?: string;
}

const tones: Record<CostClass, string> = {
  A: 'text-sem-static bg-sem-static-soft',
  B: 'text-ink-2 bg-bg-subtle',
  C: 'text-sem-isr bg-sem-isr-soft',
  D: 'text-sev-warn bg-sev-warn-soft',
  E: 'text-sev-err bg-sev-err-soft',
};

const COST_HELP: Record<CostClass, { label: string; what: string }> = {
  A: { label: 'Cost A — Cheapest', what: 'Static · CDN-only · ~free at the edge' },
  B: { label: 'Cost B — Light', what: 'ISR · CDN-cached with periodic regeneration' },
  C: { label: 'Cost C — Server', what: 'Dynamic server render · cacheable per request' },
  D: { label: 'Cost D — Heavy', what: 'Dynamic + heavy client JS or external API hops' },
  E: { label: 'Cost E — Critical', what: 'Dynamic + multiple external calls · uncached · no LCP budget' },
};

export function CostChip({ cost, className }: Props) {
  const h = COST_HELP[cost];
  return (
    <Tooltip
      side="top"
      content={
        <div className="max-w-[260px] space-y-1 p-1">
          <div className="text-xs font-medium text-ink-1">{h.label}</div>
          <div className="text-[11px] text-ink-2">{h.what}</div>
          <div className="text-[10px] text-ink-3">A → E · cheaper to costlier</div>
        </div>
      }
    >
      <span
        className={cn(
          'inline-flex h-5 min-w-[20px] cursor-help items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tracking-caps',
          tones[cost],
          className,
        )}
        aria-label={`${h.label}: ${h.what}`}
      >
        {cost}
      </span>
    </Tooltip>
  );
}
