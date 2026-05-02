import { Chip, Tooltip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { RouteSpecAuth } from '../types';

interface Props {
  auth: RouteSpecAuth;
  className?: string;
}

export function AuthSection({ auth, className }: Props) {
  const tone =
    auth.label === 'public'
      ? ('muted' as const)
      : auth.archetypeMatches
        ? ('info' as const)
        : ('warn' as const);
  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5', className)}>
      <div className="text-caps text-[10px] uppercase tracking-wide text-ink-3">
        Auth
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Tooltip
          content={
            <span className="text-[11px]">
              guard:{' '}
              <span className="font-mono">{auth.label}</span> · expects{' '}
              <span className="font-mono">{auth.auth.archetypeExpected}</span>
            </span>
          }
        >
          <Chip tone={tone} size="xs" className="font-mono">
            {auth.label}
          </Chip>
        </Tooltip>
        {auth.auth.archetypeExpected !== 'public' ? (
          <Chip tone="muted" size="xs" className="font-mono">
            {auth.auth.archetypeExpected}
          </Chip>
        ) : null}
        {auth.archetypeMatches ? null : (
          <Chip tone="warn" size="xs">guard mismatch</Chip>
        )}
      </div>
    </div>
  );
}
