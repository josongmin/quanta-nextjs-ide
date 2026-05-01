/**
 * Intent Capture overlay — large input + parsed Intent + gap card.
 */

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { computeGap, type DiagnosticLite } from './gap';
import { GapCard } from './gap-card';
import { parseIntent } from './parser';
import {
  CONSTRAINT_LABEL,
  type Intent,
  type IntentConstraint,
} from './schema';
import { useIntentCaptureStore } from './store';

const PLACEHOLDER = '결제 로직 안전하게 바꿔줘\n— or —\nRefactor /checkout to use server actions, preserve cache, no breaking API.';

export function IntentCaptureOverlay() {
  const open = useUiStore((s) => s.overlays.intentCapture.open);
  const close = useUiStore((s) => s.closeOverlay);

  const current = useIntentCaptureStore((s) => s.current);
  const history = useIntentCaptureStore((s) => s.history);
  const changedFiles = useIntentCaptureStore((s) => s.changedFiles);
  const pushHistory = useIntentCaptureStore((s) => s.pushHistory);
  const setChangedFiles = useIntentCaptureStore((s) => s.setChangedFiles);

  const [draft, setDraft] = useState('');
  const [parsing, setParsing] = useState(false);
  const [diagText, setDiagText] = useState('');
  const [filesText, setFilesText] = useState(changedFiles.join('\n'));

  const diagnostics: ReadonlyArray<DiagnosticLite> = useMemo(() => parseDiagnostics(diagText), [diagText]);

  const gap = useMemo(() => {
    if (!current) return null;
    return computeGap({
      intent: current,
      changedFiles: filesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
      diagnostics,
    });
  }, [current, filesText, diagnostics]);

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setParsing(true);
    try {
      const intent = await parseIntent(text);
      pushHistory(intent);
      toast.success('Intent captured');
      setDraft('');
    } catch (e) {
      toast.error('Failed to parse intent', { description: (e as Error).message });
    } finally {
      setParsing(false);
    }
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('intentCapture'))}
      title="Intent Capture"
      subtitle="State the goal in natural language; we extract scope + constraints."
      size="xl"
      footer={
        <Button size="sm" tone="ghost" onClick={() => close('intentCapture')}>
          Close
        </Button>
      }
    >
      <div className="px-4 py-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={PLACEHOLDER}
          className="block w-full resize-y rounded-md border border-line/60 bg-bg px-3 py-2 text-[14px] text-ink-1 placeholder-ink-3 focus:border-accent focus:outline-none"
          rows={3}
        />
        <div className="mt-2 flex items-center gap-2">
          <Button size="md" tone="default" onClick={submit} disabled={parsing || !draft.trim()}>
            {parsing ? 'Parsing…' : 'Capture intent'}
          </Button>
          <span className="text-[11px] text-ink-3">
            We try AI first; falls back to keyword extraction.
          </span>
        </div>
      </div>

      <div className="border-t border-line bg-bg-subtle px-4 py-3">
        <header className="mb-2 text-caps text-ink-3">Parsed Intent</header>
        {current ? <IntentVisual intent={current} /> : (
          <span className="text-[12px] text-ink-3">No intent captured yet.</span>
        )}
      </div>

      {current && (
        <div className="border-t border-line px-4 py-3">
          <header className="mb-2 text-caps text-ink-3">Implementation</header>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <label className="block">
              <span className="mb-0.5 block text-ink-3">Changed files (one per line)</span>
              <textarea
                value={filesText}
                onChange={(e) => {
                  setFilesText(e.target.value);
                  setChangedFiles(e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
                }}
                rows={4}
                className="w-full resize-y rounded-md border border-line/60 bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-ink-3">Observed diagnostics (one per line: ruleId|file|severity|message)</span>
              <textarea
                value={diagText}
                onChange={(e) => setDiagText(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-md border border-line/60 bg-bg px-2 py-1 font-mono text-[11px] text-ink-1 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          {gap && (
            <div className="mt-3">
              <GapCard gap={gap} intentGoal={current.goal} />
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-line bg-bg-subtle px-4 py-3">
          <header className="mb-2 text-caps text-ink-3">Recent</header>
          <ScrollArea className="max-h-[180px]">
            <ul className="space-y-1 text-[12px]">
              {history.map((h) => (
                <li key={h.parsedAt} className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-ink-3">
                    {new Date(h.parsedAt).toLocaleTimeString()}
                  </span>
                  <span className="truncate text-ink-2">{h.goal}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </OverlayPanel>
  );
}

function IntentVisual({ intent }: { intent: Intent }) {
  return (
    <div className="space-y-2">
      <p className="text-[14px] text-ink-1">{intent.goal}</p>
      <div className="flex flex-wrap gap-1.5">
        {intent.targetFlow && (
          <Chip size="sm" tone="warn">flow: {intent.targetFlow}</Chip>
        )}
        {intent.constraints.map((c) => (
          <Chip key={c} size="sm" tone="info">
            {CONSTRAINT_LABEL[c as IntentConstraint]}
          </Chip>
        ))}
        {intent.scope.routes.map((r) => (
          <Chip key={`r-${r}`} size="sm" tone="static">{r}</Chip>
        ))}
        {intent.scope.files.map((f) => (
          <Chip key={`f-${f}`} size="sm" tone="muted">{shortPath(f)}</Chip>
        ))}
        {intent.scope.symbols.map((s) => (
          <Chip key={`s-${s}`} size="sm" tone="hint">{s}</Chip>
        ))}
        {intent.constraints.length === 0 &&
          intent.scope.routes.length === 0 &&
          intent.scope.files.length === 0 &&
          intent.scope.symbols.length === 0 && (
          <span className={cn('text-[11px] text-ink-3')}>(no scope/constraints extracted)</span>
        )}
      </div>
    </div>
  );
}

function shortPath(path: string): string {
  if (path.length <= 32) return path;
  const parts = path.split('/');
  return parts.length <= 3 ? path : `…/${parts.slice(-2).join('/')}`;
}

function parseDiagnostics(raw: string): DiagnosticLite[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map<DiagnosticLite | null>((line) => {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length < 2) return null;
      const [ruleId = '', filePath = '', severity = 'medium', message = ''] = parts;
      const sev: DiagnosticLite['severity'] =
        severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low' || severity === 'info'
          ? severity
          : 'medium';
      return { ruleId, filePath, severity: sev, message };
    })
    .filter((d): d is DiagnosticLite => Boolean(d));
}
