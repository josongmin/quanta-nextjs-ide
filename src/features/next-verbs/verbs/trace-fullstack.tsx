/**
 * Verb 9 — "Trace fullstack flow".
 *
 * Builds a fullstack trace via the existing builder and renders the first
 * few nodes inline. Real overlay would be opened when fullstackTrace is
 * registered as an overlay key; for now we surface the data inline.
 */

import { Icon } from '@shared/ui';
import { buildTrace } from '@features/fullstack-trace';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

export const traceFullstackVerb: NextVerb = {
  id: 'trace-fullstack',
  title: 'Trace fullstack flow',
  description: 'Open the request → render → action chain for this route.',
  category: 'navigation',
  icon: Icon.Net,
  shouldShow: (ctx) => Boolean(ctx.routePath),
  run: (ctx) => {
    if (!ctx.routePath) return;
    const trace = buildTrace(ctx.routePath);
    showVerbPreview({
      verbId: 'trace-fullstack',
      title: `Fullstack trace · ${ctx.routePath}`,
      body: (
        <div className="space-y-1">
          {trace.length === 0 ? (
            <div className="text-ink-3">No trace nodes for this route.</div>
          ) : (
            trace.slice(0, 12).map((n) => (
              <div
                key={n.id}
                className="rounded-sm border border-line/60 bg-bg-subtle px-2 py-1 text-2xs"
              >
                <span className="font-mono text-ink-3">{n.kind}</span>{' '}
                <span className="text-ink-1">{n.label}</span>
              </div>
            ))
          )}
        </div>
      ),
      secondaryLabel: 'Close',
    });
  },
};
