/**
 * Verb 7 — "Add revalidate pair".
 *
 * Given the cursor position (heuristically: a server action file), suggest
 * a matching revalidateTag/revalidatePath site. Renders a tiny patch
 * preview with two snippets and pipes the change through admission.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@shared/ui';
import { runFullAdmission } from '@shared/admission';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

function AddRevalidateBody({
  file,
  candidateTag,
}: {
  file: string;
  candidateTag: string;
}) {
  const [tag, setTag] = useState(candidateTag);
  return (
    <div className="space-y-2">
      <div className="text-ink-2">
        Mutation site: <span className="font-mono text-ink-1">{file}</span>
      </div>
      <label className="flex items-center gap-2 text-2xs">
        <span className="text-ink-3 w-12">tag</span>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="flex-1 rounded-sm border border-line bg-bg-subtle px-2 py-1 font-mono text-xs text-ink-1"
        />
      </label>
      <div className="rounded-sm border border-line/60 bg-bg-subtle p-2">
        <div className="text-2xs text-ink-3 mb-1">Insert at end of action:</div>
        <pre className="font-mono text-2xs text-ink-1 whitespace-pre-wrap">
          {`import { revalidateTag } from 'next/cache';\n// after the mutation succeeds:\nrevalidateTag(${JSON.stringify(tag)});`}
        </pre>
      </div>
    </div>
  );
}

export const addRevalidateVerb: NextVerb = {
  id: 'add-revalidate',
  title: 'Add revalidate pair',
  description: 'Suggest a matching revalidateTag/Path call site for a mutation.',
  category: 'cache',
  icon: Icon.Refresh,
  shouldShow: (ctx) => ctx.isServerActionFile,
  run: async (ctx) => {
    const file = ctx.cursorFile ?? 'app/actions.ts';
    const tag = 'products';
    showVerbPreview({
      verbId: 'add-revalidate',
      title: 'Add revalidate pair',
      body: <AddRevalidateBody file={file} candidateTag={tag} />,
      primaryLabel: 'Run admission',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        try {
          const { verdict } = await runFullAdmission({
            kind: 'patch',
            files: [file],
            diff: `// add revalidateTag(${JSON.stringify(tag)}) to ${file}`,
          });
          toast(`Admission: ${verdict.decision}`, {
            description: `score=${verdict.score}`,
          });
        } catch (e) {
          toast.error('Admission failed', {
            description: (e as Error).message,
          });
        }
      },
    });
  },
};
