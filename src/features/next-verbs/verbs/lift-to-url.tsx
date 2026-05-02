/**
 * Verb 6 — "Lift state to URL".
 *
 * Heuristic: looks for `useState(...)` in selection. Shows a migration plan
 * to replace with `useSearchParams` + `router.replace`.
 */

import { Icon } from '@shared/ui';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

const USE_STATE_RE = /useState\s*\(/;

export const liftToUrlVerb: NextVerb = {
  id: 'lift-to-url',
  title: 'Lift state to URL',
  description: 'Move a local useState into URL searchParams (sharable + back-button friendly).',
  category: 'refactor',
  icon: Icon.Link,
  shouldShow: (ctx) =>
    Boolean(ctx.selectionText && USE_STATE_RE.test(ctx.selectionText)),
  run: (ctx) => {
    const sel = ctx.selectionText ?? '';
    showVerbPreview({
      verbId: 'lift-to-url',
      title: 'Lift state to URL',
      body: (
        <div className="space-y-2">
          <div className="text-2xs text-ink-3">Selection</div>
          <pre className="rounded-sm border border-line/60 bg-bg-subtle p-2 font-mono text-2xs text-ink-1 whitespace-pre-wrap">
            {sel}
          </pre>
          <div className="rounded-sm border border-accent/30 bg-accent/5 p-2 text-2xs text-ink-2">
            Replace with{' '}
            <span className="font-mono">useSearchParams()</span> read +{' '}
            <span className="font-mono">router.replace</span> write — preserves
            state across navigation and refresh.
          </div>
        </div>
      ),
      primaryLabel: 'Apply (preview)',
      secondaryLabel: 'Cancel',
    });
  },
};
