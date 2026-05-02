import { Chip, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecCache, RouteSpecCacheTag } from '../types';

interface Props {
  cache: RouteSpecCache;
  className?: string;
}

const roleTone = (role: RouteSpecCacheTag['role']) => {
  switch (role) {
    case 'produces':
      return 'accent' as const;
    case 'consumes':
      return 'info' as const;
    case 'invalidates':
      return 'warn' as const;
  }
};

const roleGlyph = (role: RouteSpecCacheTag['role']): string => {
  switch (role) {
    case 'produces':
      return '↑';
    case 'consumes':
      return '↓';
    case 'invalidates':
      return '×';
  }
};

export function CacheSection({ cache, className }: Props) {
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1 text-caps text-[10px] uppercase tracking-wide text-ink-3">
        <span>Cache</span>
        {cache.revalidate !== null ? (
          <span className="font-mono nums-tabular text-ink-2">
            · rev {cache.revalidate}s
          </span>
        ) : null}
      </div>
      {cache.tags.length === 0 ? (
        <span className="text-[11px] text-ink-3">no tags</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {cache.tags.slice(0, 6).map((t) => (
            <Tooltip
              key={`${t.role}:${t.name}`}
              content={
                <span className="text-[11px]">
                  {t.role} <span className="font-mono">{t.name}</span>
                </span>
              }
            >
              <Chip tone={roleTone(t.role)} size="xs" className="font-mono">
                <span className="text-ink-3">{roleGlyph(t.role)}</span>
                <span>{t.name}</span>
              </Chip>
            </Tooltip>
          ))}
          {cache.tags.length > 6 ? (
            <Chip tone="muted" size="xs">+{cache.tags.length - 6}</Chip>
          ) : null}
        </div>
      )}
    </div>
  );
}
