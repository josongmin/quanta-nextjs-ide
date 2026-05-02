import { Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecActionSummary } from '../types';

interface Props {
  actions: ReadonlyArray<RouteSpecActionSummary>;
  className?: string;
}

const scoreTone = (score: number) => {
  if (score < 60) return 'warn' as const;
  if (score < 80) return 'info' as const;
  return 'static' as const;
};

export function ActionsSection({ actions, className }: Props) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1 text-caps text-[10px] uppercase tracking-wide text-ink-3">
        <span>Actions</span>
        <span className="nums-tabular text-ink-2">·</span>
        <span className="nums-tabular text-ink-2">{actions.length}</span>
      </div>
      {actions.length === 0 ? (
        <span className="text-[11px] text-ink-3">no server actions</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {actions.slice(0, 4).map((a) => (
            <Chip
              key={a.id}
              tone={scoreTone(a.score)}
              size="xs"
              className="font-mono nums-tabular"
              title={`${a.name} — score ${a.score}/100`}
            >
              {a.name}
            </Chip>
          ))}
          {actions.length > 4 ? (
            <Chip tone="muted" size="xs">+{actions.length - 4}</Chip>
          ) : null}
        </div>
      )}
    </div>
  );
}
