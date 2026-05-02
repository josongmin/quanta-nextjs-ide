/**
 * Verb 8 — "Prove no secret leak".
 *
 * Runs admission (which internally runs the taint solver) on the current
 * file and reports the verdict. Functional — uses the real gate.
 */

import { toast } from 'sonner';
import { Icon } from '@shared/ui';
import { runFullAdmission } from '@shared/admission';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

export const proveNoSecretVerb: NextVerb = {
  id: 'prove-no-secret',
  title: 'Prove no secret leak',
  description: 'Run the taint analyzer on the current file and show the verdict.',
  category: 'security',
  icon: Icon.Lock,
  shouldShow: (ctx) => Boolean(ctx.cursorFile),
  run: async (ctx) => {
    const file = ctx.cursorFile;
    if (!file) return;
    showVerbPreview({
      verbId: 'prove-no-secret',
      title: 'Taint analysis',
      body: (
        <div className="text-ink-2">
          Running taint solver on{' '}
          <span className="font-mono text-ink-1">{file}</span>…
        </div>
      ),
    });
    try {
      const { verdict } = await runFullAdmission({
        kind: 'patch',
        files: [file],
      });
      toast(
        verdict.decision === 'admit'
          ? 'No secret leak detected'
          : `Verdict: ${verdict.decision}`,
        {
          description: verdict.reasons.slice(0, 2).join(' · ') || 'clean',
        },
      );
    } catch (e) {
      toast.error('Taint analysis failed', {
        description: (e as Error).message,
      });
    }
  },
};
