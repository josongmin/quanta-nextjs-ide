import { useState } from 'react';
import { match } from 'ts-pattern';
import { Icon } from '@shared/ui';
import { cn } from '@shared/lib/cn';

interface FeedEntry {
  ts: string;
  kind: 'info' | 'ok' | 'warn' | 'patch' | 'watch';
  message: string;
}

const ENTRIES: ReadonlyArray<FeedEntry> = [
  { ts: '08:00:01', kind: 'info', message: 'indexed 17 routes' },
  { ts: '08:00:02', kind: 'ok', message: 'cache lineage rebuilt — 8 tags' },
  { ts: '08:00:02', kind: 'info', message: '9 semantic diff entries' },
  { ts: '08:00:03', kind: 'watch', message: 'watching for changes' },
  { ts: '08:00:04', kind: 'warn', message: 'auth: requireRole removed on /admin/users/delete' },
  { ts: '08:00:05', kind: 'patch', message: '+1 AI patch admitted' },
  { ts: '08:00:06', kind: 'ok', message: 'lighthouse +4 perf on /products/[id]' },
  { ts: '08:00:07', kind: 'info', message: 'bundle 322 KB · stable' },
];

function kindTone(k: FeedEntry['kind']): string {
  return match(k)
    .with('info', () => 'text-ink-2')
    .with('ok', () => 'text-sem-static')
    .with('warn', () => 'text-sev-warn')
    .with('patch', () => 'text-accent')
    .with('watch', () => 'text-ink-3')
    .exhaustive();
}

function kindGlyph(k: FeedEntry['kind']): string {
  return match(k)
    .with('info', () => '·')
    .with('ok', () => '✓')
    .with('warn', () => '!')
    .with('patch', () => '+')
    .with('watch', () => '◌')
    .exhaustive();
}

/**
 * Floating sidecar panel. Toggle button is always rendered; when the dock is
 * closed it collapses to just the bell icon.
 */
export function ActivityFeed() {
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex items-end justify-end">
      {open ? (
        <div
          className={cn(
            'pointer-events-auto flex flex-col rounded-md border border-line bg-bg shadow-pop',
            'transition-all duration-200 ease-out',
          )}
          style={{ width: 280, height: 200 }}
        >
          <div className="flex h-7 shrink-0 items-center gap-2 hairline-b bg-bg-subtle px-2">
            <Icon.Refresh className="h-3 w-3 text-accent" />
            <span className="text-caps text-ink-3">Activity</span>
            <span className="ml-auto font-mono text-[10px] text-ink-3">
              {ENTRIES.length}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close activity feed"
              className="ml-1 rounded-sm p-0.5 text-ink-3 hover:bg-bg-hover hover:text-ink-1"
            >
              <Icon.X className="h-3 w-3" />
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-auto px-2 py-1.5 font-mono text-[10.5px]">
            {ENTRIES.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 py-0.5">
                <span className="text-ink-3">[{e.ts}]</span>
                <span className={cn('w-3 text-center font-bold', kindTone(e.kind))}>
                  {kindGlyph(e.kind)}
                </span>
                <span className="text-ink-1">{e.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open activity feed"
          className={cn(
            'pointer-events-auto inline-flex h-7 w-7 items-center justify-center',
            'rounded-full border border-line bg-bg text-ink-2 shadow-pop',
            'transition-colors hover:bg-bg-hover hover:text-accent',
          )}
        >
          <Icon.Refresh className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
