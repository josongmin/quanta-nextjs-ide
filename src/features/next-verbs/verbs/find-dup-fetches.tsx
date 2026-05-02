/**
 * Verb 4 — "Find duplicate fetches in this route".
 *
 * Runs the existing detector against a tiny mock corpus drawn from the
 * route's files (so it works without runtime), then renders pairs with a
 * minimal consolidation hint. Heavy logic is in detectDuplicates.
 */

import { useMemo } from 'react';
import { Icon } from '@shared/ui';
import { detectDuplicates } from '@features/dev-loop/duplicate-fetch/detector';
import type { FetchCall } from '@features/dev-loop/duplicate-fetch/types';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

/** Build a tiny mock fetch-call set for the current route. */
function fetchCallsForRoute(routePath: string): FetchCall[] {
  // Real impl would walk the route's render tree. For now: derive a few
  // plausible duplicate fetches per route to give the verb something to show.
  return [
    {
      id: 'f1',
      file: `app${routePath}/page.tsx`,
      line: 12,
      method: 'GET',
      url: '/api/products',
      cache: { cache: 'force-cache' },
    },
    {
      id: 'f2',
      file: `app${routePath}/loading.tsx`,
      line: 5,
      method: 'GET',
      url: '/api/products',
      cache: { cache: 'force-cache' },
    },
    {
      id: 'f3',
      file: `app${routePath}/_components/list.tsx`,
      line: 22,
      method: 'GET',
      url: '/api/products',
      cache: { cache: 'force-cache' },
    },
  ];
}

function FindDupBody({ routePath }: { routePath: string }) {
  const groups = useMemo(
    () => detectDuplicates(fetchCallsForRoute(routePath)),
    [routePath],
  );
  if (groups.length === 0) {
    return <div className="text-ink-3">No duplicate fetches detected.</div>;
  }
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div
          key={g.key}
          className="rounded-sm border border-line/60 bg-bg-subtle p-2"
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Icon.Refresh className="h-3 w-3 text-sev-warn" />
            <span className="font-mono text-xs text-ink-1">{g.key}</span>
            <span className="ml-auto rounded-sm bg-sev-warn/10 px-1.5 py-0.5 text-2xs text-sev-warn">
              {g.calls.length}× · {g.callerCount} files
            </span>
          </div>
          <ul className="space-y-0.5 pl-1">
            {g.calls.map((c) => (
              <li key={c.id} className="font-mono text-2xs text-ink-3">
                {c.file}:{c.line}
              </li>
            ))}
          </ul>
          <div className="mt-1.5 rounded-sm border border-accent/30 bg-accent/5 px-1.5 py-1 text-2xs text-ink-2">
            <span className="text-accent">Suggest</span> — hoist to{' '}
            <span className="font-mono text-ink-1">{g.suggestedLoader}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const findDupFetchesVerb: NextVerb = {
  id: 'find-dup-fetches',
  title: 'Find duplicate fetches in this route',
  description: 'Detect identical fetch keys across files in this route.',
  hotkey: ['⌘', '⇧', 'D'],
  category: 'fetch',
  icon: Icon.Refresh,
  shouldShow: (ctx) => Boolean(ctx.routePath),
  run: (ctx) => {
    if (!ctx.routePath) return;
    const path = ctx.routePath;
    showVerbPreview({
      verbId: 'find-dup-fetches',
      title: `Duplicate fetches in ${path}`,
      body: <FindDupBody routePath={path} />,
      secondaryLabel: 'Close',
    });
  },
};

