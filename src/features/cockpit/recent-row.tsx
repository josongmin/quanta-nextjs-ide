import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ShippedChange } from './types';

interface RecentRowProps {
  change: ShippedChange;
  delayMs?: number;
}

const KIND_TONE: Record<ShippedChange['kind'], string> = {
  'static-to-isr': 'text-sem-isr',
  'static-to-dynamic': 'text-sem-dynamic',
  'dynamic-to-static': 'text-sem-static',
  'cache-policy': 'text-accent',
  boundary: 'text-sem-server',
  metadata: 'text-ink-2',
  refactor: 'text-ink-2',
  feature: 'text-accent',
  fix: 'text-sev-warn',
};

function relativeAge(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function RecentRow({ change, delayMs = 0 }: RecentRowProps) {
  return (
    <div
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
      className={cn(
        'animate-fade-in',
        'flex items-center gap-3 py-2 text-sm',
      )}
    >
      <Icon.Branch className="h-3.5 w-3.5 text-ink-3" />
      <span className="font-mono text-[12px] text-ink-2">{change.routePath}</span>
      <span className={cn('text-[12px] font-medium', KIND_TONE[change.kind])}>
        {change.description}
      </span>
      <span className="ml-auto flex items-center gap-2 text-[11px] text-ink-3 nums-tabular">
        <span>@{change.author}</span>
        <span aria-hidden>·</span>
        <span>{relativeAge(change.shippedAt)}</span>
      </span>
    </div>
  );
}
