import { useMemo } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useAgentStore, writeWorkspaceFile } from '@shared/ai';
import { Button, Chip, Icon, OverlayPanel, SeverityDot } from '@shared/ui';
import { cn } from '@shared/lib/cn';
import {
  evaluatePatch,
  patchCandidateToAdmission,
  SAMPLE_PATCH_IDS,
} from './helpers';

const VERDICT_TONE = {
  admit: { label: 'ADMIT', tone: 'static', icon: '✓' },
  review: { label: 'NEEDS REVIEW', tone: 'warn', icon: '◐' },
  reject: { label: 'REJECT', tone: 'err', icon: '✗' },
} as const;

export function AiPatchGateOverlay() {
  const open = useUiStore((s) => s.overlays.aiPatchGate.open);
  const close = useUiStore((s) => s.closeOverlay);
  const patchId = useUiStore((s) => s.overlays.aiPatchGate.patchId);
  const openOverlay = useUiStore((s) => s.openOverlay);

  const agentPatches = useAgentStore((s) => s.patches);
  const removePatch = useAgentStore((s) => s.removePatch);
  const agentPatch = useMemo(
    () => (patchId ? agentPatches.find((p) => p.id === patchId) : undefined),
    [patchId, agentPatches],
  );

  // If the patchId resolves to an agent-emitted candidate, synthesize the
  // admission shape from it; otherwise fall back to the demo registry.
  const result = useMemo(
    () => (agentPatch ? patchCandidateToAdmission(agentPatch) : evaluatePatch(patchId)),
    [agentPatch, patchId],
  );
  const verdict = VERDICT_TONE[result.verdict];

  const handleAdmit = async () => {
    if (result.verdict === 'reject') {
      toast('Cannot admit — verdict is reject');
      return;
    }
    if (agentPatch) {
      try {
        await writeWorkspaceFile(agentPatch.filePath, agentPatch.newContent);
        toast.success(`Wrote ${agentPatch.filePath}`);
        removePatch(agentPatch.id);
      } catch (e) {
        toast.error(`Apply failed: ${(e as Error).message}`);
        return;
      }
    } else {
      toast('Patch admitted (mock)');
    }
    close('aiPatchGate');
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('aiPatchGate'))}
      title="AI Patch Gate"
      subtitle={`Patch ${result.patchId} · ${result.source}`}
      size="md"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Request changes (preview)')}>
            Request changes
          </Button>
          <Button
            size="xs"
            tone="err"
            onClick={() => {
              toast(`Patch ${result.patchId} rejected`);
              close('aiPatchGate');
            }}
          >
            Reject
          </Button>
          <Button
            size="xs"
            tone="default"
            disabled={result.verdict === 'reject'}
            onClick={() => {
              void handleAdmit();
            }}
          >
            {agentPatch ? 'Apply patch' : 'Admit anyway'}
          </Button>
        </>
      }
    >
      {/* Sample patch picker */}
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3 text-xs">
        <span className="text-caps text-ink-3">Patch</span>
        <select
          value={result.patchId}
          onChange={(e) => openOverlay('aiPatchGate', { patchId: e.target.value })}
          className="rounded-sm border border-line bg-bg px-1.5 py-0.5 font-mono text-[11px] text-ink-1 outline-none focus:border-accent"
        >
          {agentPatch && !SAMPLE_PATCH_IDS.includes(agentPatch.id) ? (
            <option key={agentPatch.id} value={agentPatch.id}>
              {agentPatch.id} (agent)
            </option>
          ) : null}
          {SAMPLE_PATCH_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[10px] text-ink-3">
          {result.filesTouched} files · +{result.added} / −{result.removed}
        </span>
      </div>

      {/* Verdict */}
      <section className="px-4 py-4 hairline-b">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
              match(result.verdict)
                .with('admit', () => 'bg-sem-static-soft text-sem-static')
                .with('review', () => 'bg-sev-warn-soft text-sev-warn')
                .with('reject', () => 'bg-sev-err-soft text-sev-err')
                .exhaustive(),
            )}
          >
            {verdict.icon}
          </span>
          <div>
            <div
              className={cn(
                'text-md font-semibold tracking-caps',
                match(result.verdict)
                  .with('admit', () => 'text-sem-static')
                  .with('review', () => 'text-sev-warn')
                  .with('reject', () => 'text-sev-err')
                  .exhaustive(),
              )}
            >
              {verdict.label}
            </div>
            <div className="text-[11px] text-ink-3">
              {result.reasons.length} reason{result.reasons.length === 1 ? '' : 's'} ·{' '}
              {result.proof.filter((p) => !p.pass).length} proof obligation
              {result.proof.filter((p) => !p.pass).length === 1 ? '' : 's'} unmet
            </div>
          </div>
        </div>
      </section>

      {/* Reasons */}
      <section className="px-4 py-3 hairline-b">
        <div className="mb-2 text-caps text-ink-3">
          Reasons {result.verdict === 'admit' ? 'to admit' : result.verdict === 'review' ? 'to review' : 'to reject'} ({result.reasons.length})
        </div>
        <ul className="space-y-1.5">
          {result.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <SeverityDot severity={r.severity} />
              <div className="flex-1">
                <div className="text-ink-1">{r.reason}</div>
                {r.evidence ? (
                  <button
                    onClick={() =>
                      openOverlay('evidenceTracer', { diagnosticId: '' })
                    }
                    className="mt-0.5 font-mono text-[10px] text-accent hover:underline"
                  >
                    {r.evidence} ↗
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Semantic diff */}
      <section className="px-4 py-3 hairline-b">
        <div className="mb-2 text-caps text-ink-3">
          Behavior diff (semantic)
        </div>
        <div className="space-y-1">
          {result.semanticDiff.map((d, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto_1fr_auto] items-center gap-2 text-xs"
            >
              <span className="font-mono text-ink-2">{d.scope}</span>
              <Chip tone="muted" size="xs">
                <span className="font-mono">{d.before}</span>
              </Chip>
              <Icon.Right className="h-3 w-3 text-ink-3" />
              <Chip
                tone={d.severity === 'err' ? 'err' : d.severity === 'warn' ? 'warn' : 'info'}
                size="xs"
              >
                <span className="font-mono">{d.after}</span>
              </Chip>
              <SeverityDot severity={d.severity === 'info' ? 'info' : d.severity} />
            </div>
          ))}
        </div>
      </section>

      {/* Proof obligations */}
      <section className="px-4 py-3">
        <div className="mb-2 text-caps text-ink-3">Proof obligations</div>
        <div className="grid grid-cols-1 gap-1">
          {result.proof.map((p, i) => (
            <div
              key={i}
              className={cn(
                'grid grid-cols-[20px_1fr_auto] items-center gap-2 rounded-sm px-2 py-1 text-xs',
                p.pass ? 'bg-sem-static-soft/30' : 'bg-sev-err-soft/40',
              )}
            >
              <span
                className={cn(
                  'font-bold',
                  p.pass ? 'text-sem-static' : 'text-sev-err',
                )}
              >
                {p.pass ? '✓' : '✗'}
              </span>
              <span className="text-ink-1">{p.check}</span>
              <span className="font-mono text-[10px] text-ink-3">
                {p.note ?? (p.pass ? 'pass' : 'fail')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </OverlayPanel>
  );
}
