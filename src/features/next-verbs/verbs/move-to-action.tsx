/**
 * Verb 5 — "Move this to a Server Action".
 *
 * Functional placeholder: shows the migration plan derived from the current
 * editor selection. Heavy work delegated to the existing
 * extract-server-action feature when wired.
 */

import { Icon } from '@shared/ui';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

export const moveToActionVerb: NextVerb = {
  id: 'move-to-action',
  title: 'Move this to a Server Action',
  description: 'Migrate the selected client mutation to a server action.',
  category: 'refactor',
  icon: Icon.Server,
  shouldShow: (ctx) =>
    Boolean(ctx.selectionText) && ctx.isClientFile,
  run: (ctx) => {
    const sel = ctx.selectionText ?? '';
    showVerbPreview({
      verbId: 'move-to-action',
      title: 'Move to Server Action',
      body: (
        <div className="space-y-2">
          <div className="text-2xs text-ink-3">Selected snippet</div>
          <pre className="rounded-sm border border-line/60 bg-bg-subtle p-2 font-mono text-2xs text-ink-1 whitespace-pre-wrap">
            {sel || '// no selection'}
          </pre>
          <div className="rounded-sm border border-accent/30 bg-accent/5 p-2 text-2xs text-ink-2">
            Plan: extract function → add{' '}
            <span className="font-mono">'use server'</span> → swap call site to
            an async invocation.
          </div>
        </div>
      ),
      primaryLabel: 'Open extract-server-action',
      secondaryLabel: 'Cancel',
      onPrimary: () => {
        // TODO: wire to features/extract-server-action when its API exists.
      },
    });
  },
};
