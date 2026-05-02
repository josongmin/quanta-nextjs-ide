/**
 * Verb 10 — "Run admission on this change".
 *
 * Calls runFullAdmission on the current file and renders the verdict
 * inline. Pipes the same data the verdict-card would show.
 */

import { useEffect, useState } from 'react';
import { Icon } from '@shared/ui';
import { runFullAdmission } from '@shared/admission';
import type { AdmissionVerdict } from '@entities/evidence';
import { showVerbPreview } from '../preview-shell';
import type { NextVerb } from '../types';

function VerdictBody({ file }: { file: string }) {
  const [v, setV] = useState<AdmissionVerdict | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void runFullAdmission({ kind: 'patch', files: [file] })
      .then((r) => {
        if (!cancelled) setV(r.verdict);
      })
      .catch((e) => {
        if (!cancelled) setErr((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);
  if (err) return <div className="text-sev-err text-xs">{err}</div>;
  if (!v)
    return (
      <div className="text-ink-3 text-xs">
        Running admission on{' '}
        <span className="font-mono text-ink-1">{file}</span>…
      </div>
    );
  const tone =
    v.decision === 'admit'
      ? 'text-sev-ok'
      : v.decision === 'reject'
        ? 'text-sev-err'
        : 'text-sev-warn';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-sm border border-line/60 bg-bg-subtle px-2 py-1.5">
        <span className="text-2xs uppercase tracking-wider text-ink-3">
          Decision
        </span>
        <span className={`font-medium ${tone}`}>{v.decision}</span>
      </div>
      <div className="text-2xs text-ink-3">score: {v.score}</div>
      {v.reasons.length > 0 ? (
        <ul className="space-y-1">
          {v.reasons.map((r, i) => (
            <li
              key={i}
              className="rounded-sm border border-line/60 bg-bg-subtle px-2 py-1 text-2xs text-ink-2"
            >
              {r}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const runAdmissionVerb: NextVerb = {
  id: 'run-admission',
  title: 'Run admission on this change',
  description: 'Score the current file through the admission gate.',
  category: 'admission',
  icon: Icon.Shield,
  shouldShow: (ctx) => Boolean(ctx.cursorFile),
  run: (ctx) => {
    const file = ctx.cursorFile;
    if (!file) return;
    showVerbPreview({
      verbId: 'run-admission',
      title: 'Admission verdict',
      body: <VerdictBody file={file} />,
      secondaryLabel: 'Close',
    });
  },
};
