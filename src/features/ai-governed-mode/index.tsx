/**
 * Phase 18 — AI Governed Mode panel.
 *
 * The "Co-shipper" experience:
 *   prompt → mode escalation → obligations → patch proposal →
 *   admission verdict → "Apply with proof".
 *
 * This file is the panel BODY — it can be embedded inside the existing
 * ai-panel layout OR rendered as an overlay (see integration.ts).
 *
 * Public exports:
 *   - <GovernedFlowPanel /> (embeddable body)
 *   - <GovernedFlowOverlay /> (Dialog-wrapped overlay; consumed by ui-shell)
 *   - useGovernedFlowStore
 *   - runGovernedFlow
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, X, RefreshCw } from 'lucide-react';
import { useUiStore } from '@entities/ui-shell';
import { useAiMode } from '@features/ai-mode-system';
import {
  Button,
  OverlayPanel,
  ScrollArea,
  Skeleton,
  Chip,
  Kbd,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { ModeSlider } from './mode-slider';
import { StageStepper } from './stage-stepper';
import { ObligationChecklist } from './obligation-checklist';
import { VerdictCard } from './verdict-card';
import { ProofChip } from './proof-chip';
import { runGovernedFlow } from './orchestrator';
import { useGovernedFlowStore } from './store';
import type { Stage, StageState } from './types';
import { STAGE_LABEL } from './types';

const SAMPLE_PROMPTS = [
  'Update the checkout total to include tax',
  'Add MFA to the admin login flow',
  'Invalidate the cart cache when a product is deleted',
];

export interface GovernedFlowPanelProps {
  /** When provided, used as the inline header. */
  title?: string;
  /** Hide the prompt input (when embedded somewhere with its own input). */
  hidePromptInput?: boolean;
  className?: string;
}

export function GovernedFlowPanel({
  title = 'Governed Flow — Co-shipper',
  hidePromptInput,
  className,
}: GovernedFlowPanelProps): JSX.Element {
  const { mode } = useAiMode();
  const flow = useGovernedFlowStore((s) => s.flow);
  const isRunning = useGovernedFlowStore((s) => s.isRunning);
  const isApplying = useGovernedFlowStore((s) => s.isApplying);
  const errorMessage = useGovernedFlowStore((s) => s.errorMessage);
  const setFlow = useGovernedFlowStore((s) => s.setFlow);
  const setRunning = useGovernedFlowStore((s) => s.setRunning);
  const setApplying = useGovernedFlowStore((s) => s.setApplying);
  const setError = useGovernedFlowStore((s) => s.setError);
  const beginApply = useGovernedFlowStore((s) => s.beginApply);
  const finishShipping = useGovernedFlowStore((s) => s.finishShipping);
  const suppressObligation = useGovernedFlowStore((s) => s.suppressObligation);
  const reset = useGovernedFlowStore((s) => s.reset);

  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeStage: Stage | undefined = useMemo(() => {
    if (!flow) return undefined;
    const active = flow.stages.find((s) => s.status === 'active');
    if (active) return active.stage;
    // If verify is completed and we have an admit verdict, surface 'apply'.
    if (
      flow.verdict?.decision === 'admit' &&
      flow.stages.find((s) => s.stage === 'verify')?.status === 'completed' &&
      !flow.shipped
    ) {
      return 'apply';
    }
    if (flow.shipped) return 'shipped';
    return undefined;
  }, [flow]);

  const submit = useCallback(async () => {
    const userMessage = prompt.trim();
    if (!userMessage || isRunning) return;
    setError(null);
    setPrompt('');
    setRunning(true);
    try {
      await runGovernedFlow({
        userMessage,
        requestedMode: mode,
        onStage: (next) => {
          setFlow(next);
        },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [prompt, isRunning, mode, setError, setRunning, setFlow]);

  // ⌘↵ to apply when admit-ready.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        flow?.verdict?.decision === 'admit' &&
        flow.patches.length > 0 &&
        !isApplying &&
        !flow.shipped
      ) {
        e.preventDefault();
        void onApply();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.verdict?.decision, flow?.patches.length, flow?.shipped, isApplying]);

  const onApply = useCallback(async () => {
    if (!flow) return;
    beginApply();
    // TODO(phase-18): wire to real patch-application pipeline. For now we
    // simulate the round-trip so the UI can demo end-to-end.
    await new Promise((r) => setTimeout(r, 600));
    finishShipping();
    setApplying(false);
  }, [flow, beginApply, finishShipping, setApplying]);

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-3', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-[13px] font-semibold text-ink-1">{title}</h2>
          </div>
          <p className="text-[11px] text-ink-3">
            For Next.js critical-flow changes the patch goes through obligations + verdict.
          </p>
        </div>
        <ModeSlider prompt={prompt || flow?.userMessage} />
      </header>

      <StageStepper stages={flow?.stages ?? defaultEmptyStages()} activeStage={activeStage} />

      {!hidePromptInput ? (
        <PromptRow
          ref={inputRef}
          value={prompt}
          onChange={setPrompt}
          onSubmit={submit}
          disabled={isRunning}
        />
      ) : null}

      {errorMessage ? (
        <div className="rounded border border-sev-err/40 bg-sev-err-soft/30 px-2 py-1 text-[11px] text-sev-err">
          {errorMessage}
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pr-1">
          {!flow ? (
            <EmptyState
              onSamplePick={(p) => {
                setPrompt(p);
                inputRef.current?.focus();
              }}
            />
          ) : (
            <>
              <StageDetails flow={flow} />
              <Section title="Obligations">
                <ObligationChecklist
                  obligations={flow.obligations}
                  onSuppress={(id, sup) => suppressObligation(id, sup)}
                  onWhy={(id) => {
                    // TODO: open the check function source location.
                    void id;
                  }}
                />
              </Section>
              <Section title="Verdict">
                <VerdictCard
                  verdict={flow.verdict}
                  hasPatches={flow.patches.length > 0}
                  isApplying={isApplying}
                  shipped={flow.shipped}
                  onApply={onApply}
                />
              </Section>
              <Section title={`Patches (${flow.patches.length})`}>
                {flow.patches.length === 0 ? (
                  <div className="rounded border border-line/60 bg-bg-subtle p-3 text-[11px] text-ink-3">
                    No patches surfaced yet.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {flow.patches.map((p) => (
                      <li
                        key={p.id}
                        className="rounded border border-line/60 bg-bg p-2 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <Chip size="xs" tone="warn">PATCH</Chip>
                          <span className="font-mono text-[10px] text-ink-2">{p.filePath}</span>
                          <span className="ml-auto font-mono text-[10px] text-ink-3">{p.id}</span>
                        </div>
                        <p className="mt-1 text-ink-1">{p.rationale}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="xs"
                  tone="ghost"
                  onClick={() => reset()}
                  disabled={isRunning || isApplying}
                >
                  <RefreshCw className="h-3 w-3" /> New flow
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function defaultEmptyStages(): StageState[] {
  return (['plan', 'patch', 'verify', 'apply', 'shipped'] as Stage[]).map(
    (stage) => ({ stage, status: 'pending', toolCalls: [] }),
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-caps text-ink-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function StageDetails({ flow }: { flow: ReturnType<typeof useGovernedFlowStore.getState>['flow'] }): JSX.Element {
  if (!flow) return <span />;
  return (
    <ul className="flex flex-col gap-1.5">
      {flow.stages.map((s) => (
        <li
          key={s.stage}
          className={cn(
            'rounded border bg-bg px-2.5 py-1.5 text-[11px]',
            s.status === 'active'
              ? 'border-accent/50'
              : s.status === 'completed'
                ? 'border-line/60'
                : s.status === 'errored'
                  ? 'border-sev-err/40 bg-sev-err-soft/20'
                  : 'border-line/40 bg-bg-subtle/40',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink-1">{STAGE_LABEL[s.stage]}</span>
            <ProofChip
              status={
                s.status === 'completed'
                  ? 'pass'
                  : s.status === 'active'
                    ? 'pending'
                    : s.status === 'errored'
                      ? 'fail'
                      : 'unknown'
              }
              label={s.status}
            />
            {s.durationMs ? (
              <span className="text-[10px] text-ink-3">· {s.durationMs}ms</span>
            ) : null}
          </div>

          {s.status === 'active' && s.toolCalls.length === 0 ? (
            <div className="mt-1.5">
              <Skeleton className="h-2 w-full rounded" />
              <Skeleton className="mt-1 h-2 w-3/5 rounded" />
            </div>
          ) : null}

          {s.toolCalls.length > 0 ? (
            <ul className="mt-1 space-y-0.5 font-mono text-[10px]">
              {s.toolCalls.map((tc) => (
                <li
                  key={tc.id}
                  className={cn(
                    'flex items-center gap-1.5',
                    'animate-in fade-in-0 slide-in-from-left-1 duration-moderate',
                    tc.isError ? 'text-sev-err' : 'text-ink-2',
                  )}
                >
                  <span className="text-accent">→ {tc.name}</span>
                  <span className="text-ink-3">{tc.inputSummary}</span>
                  {tc.endedAt ? (
                    <span className="text-ink-3">
                      · {tc.endedAt - tc.startedAt}ms ✓
                    </span>
                  ) : (
                    <span className="text-ink-3">…</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {s.errorMessage ? (
            <div className="mt-1 text-sev-err">{s.errorMessage}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

interface PromptRowProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const PromptRow = (
  // forwardRef-light: we accept a textarea ref via prop indirection.
  function PromptRowImpl(
    props: PromptRowProps & { ref?: React.RefObject<HTMLTextAreaElement> },
  ): JSX.Element {
    const { value, onChange, onSubmit, disabled, ref } = props;
    return (
      <div className="flex items-end gap-2 rounded-md border border-line/60 bg-bg p-1.5">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder="Describe the change… e.g. 'add 2FA to the admin login route'"
          className="flex-1 resize-none bg-transparent px-1 py-0.5 text-[12px] text-ink-1 outline-none placeholder:text-ink-3"
          disabled={disabled}
        />
        <Tooltip content={disabled ? 'Running…' : 'Run governed flow (Enter)'}>
          <Button
            tone="accent"
            size="sm"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Run
          </Button>
        </Tooltip>
      </div>
    );
  }
) as React.FC<PromptRowProps & { ref?: React.RefObject<HTMLTextAreaElement> }>;

function EmptyState({ onSamplePick }: { onSamplePick: (p: string) => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line/60 bg-bg-subtle/40 p-6">
      <h3 className="bg-gradient-to-r from-accent via-accent/90 to-accent/60 bg-clip-text text-center text-base font-semibold text-transparent">
        Co-shipper for critical flows
      </h3>
      <p className="max-w-md text-center text-[11px] text-ink-3">
        Type an intent — for payment, auth and cache changes the AI will plan, patch, then verify against the admission gate before anything ships.
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="rounded-full border border-line/60 bg-bg px-2 py-1 text-[11px] text-ink-2 transition hover:border-accent/60 hover:text-accent"
            onClick={() => onSamplePick(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-ink-3">
        Open with <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>G</Kbd>
      </div>
    </div>
  );
}

/**
 * Overlay wrapper — used by the ui-shell when the user opens the
 * 'governedFlow' overlay. Reads open state from the global ui-store.
 */
export function GovernedFlowOverlay(): JSX.Element {
  const open = useUiStore((s) => s.overlays.governedFlow?.open);
  const close = useUiStore((s) => s.closeOverlay);
  return (
    <OverlayPanel
      open={!!open}
      onOpenChange={(o) => (o ? null : close('governedFlow'))}
      title="Governed Flow"
      subtitle="Co-shipper for critical flows"
      width={780}
      footer={
        <span className="text-[11px] text-ink-3">
          Esc closes · ⌘⇧G toggles · ⌘↵ applies
        </span>
      }
    >
      <div className="h-[600px] p-3">
        <GovernedFlowPanel />
      </div>
    </OverlayPanel>
  );
}

export { useGovernedFlowStore } from './store';
export { runGovernedFlow, markShipped, startApply } from './orchestrator';
export type { GovernedFlow, Stage, StageState, ObligationView } from './types';

// Suppress unused import warnings for icons we kept for future stages.
void X;

export default GovernedFlowPanel;
