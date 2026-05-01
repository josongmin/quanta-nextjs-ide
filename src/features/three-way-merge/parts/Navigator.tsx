import { Button, Chip } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ConflictRegion, ResolutionDefault } from '../helpers';

interface NavigatorProps {
  regions: ReadonlyArray<ConflictRegion>;
  resolved: Record<string, boolean>;
  decisions: Record<string, ResolutionDefault>;
  activeRegion: string | null;
  onFocusRegion(id: string): void;
  onMarkResolved(id: string): void;
}

export function Navigator({
  regions,
  resolved,
  decisions,
  activeRegion,
  onFocusRegion,
  onMarkResolved,
}: NavigatorProps) {
  return (
    <aside className="min-w-0 max-h-[60vh] overflow-y-auto p-2">
      <header className="mb-2 px-1 text-caps text-ink-3">Navigator</header>
      <ul className="space-y-1">
        {regions.map((r) => {
          const isResolved = !!resolved[r.id];
          const decision = decisions[r.id] ?? r.resolutionDefault;
          return (
            <li
              key={r.id}
              className={cn(
                'rounded-sm border border-line bg-bg p-2',
                activeRegion === r.id && 'border-accent/60 bg-accent-soft/40',
              )}
            >
              <button
                type="button"
                onClick={() => onFocusRegion(r.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span className="font-mono text-[11px] text-ink-1">{r.id}</span>
                <span className="font-mono text-[10px] text-ink-3">
                  L{r.startLine}–{r.endLine}
                </span>
                <Chip
                  tone={isResolved ? 'static' : 'warn'}
                  size="xs"
                  className="ml-auto"
                >
                  {isResolved ? 'resolved' : 'open'}
                </Chip>
              </button>
              <p className="mt-1 text-[11px] leading-snug text-ink-2">{r.hint}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <Chip tone="muted" size="xs">
                  {decision}
                </Chip>
                <Button
                  size="xs"
                  tone="ghost"
                  className="ml-auto"
                  onClick={() => onMarkResolved(r.id)}
                >
                  Mark
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
