/**
 * Phase 18 — Governed flow orchestrator.
 *
 * Wraps `runCoordinated` (Phase 7) and `runFullAdmission` (Phase 5) into
 * a single stage-driven flow that the UI can render: plan → patch →
 * verify → apply → shipped.
 *
 * The orchestrator is intentionally thin: all the heavy lifting (mode
 * escalation, multi-agent coordination, taint analysis, verdict
 * extension) already exists in lower layers. This file only adapts
 * those streams of work into a UI-shaped GovernedFlow.
 */

import { nanoid } from 'nanoid';
import { resolveMode, type AiMode } from '@features/ai-mode-system';
import { runCoordinated } from '@features/ai-mode-system/agents/coordinator';
import { useCriticalFlowStore } from '@features/critical-flow/store';
import type { CriticalFlow, CriticalFlowKind } from '@features/critical-flow/types';
import {
  runFullAdmission,
  deriveObligations,
  checkObligations,
  extendVerdict,
} from '@shared/admission';
import type { ChangeDescriptor } from '@entities/evidence';
import type {
  GovernedFlow,
  ObligationView,
  RunGovernedFlowRequest,
  Stage,
  StageState,
  ToolCallView,
} from './types';
import { STAGES, STAGE_LABEL } from './types';

function collectFlowKinds(
  flows: CriticalFlow[],
  files: string[],
): CriticalFlowKind[] {
  if (files.length === 0) return [];
  const kinds = new Set<CriticalFlowKind>();
  for (const f of flows) {
    const touched =
      f.routes.some((rid) => files.some((cf) => cf.includes(rid))) ||
      f.actions.some((aid) => files.some((cf) => cf.includes(aid)));
    if (touched) kinds.add(f.kind);
  }
  return [...kinds];
}

function emptyStages(): StageState[] {
  return STAGES.map((stage) => ({
    stage,
    status: 'pending',
    toolCalls: [],
  }));
}

function patchStage(
  flow: GovernedFlow,
  stage: Stage,
  patch: Partial<StageState>,
): GovernedFlow {
  const stages = flow.stages.map((s) =>
    s.stage === stage ? { ...s, ...patch } : s,
  );
  return { ...flow, stages };
}

function summariseInput(input: Record<string, unknown>): string {
  const entries = Object.entries(input).slice(0, 2);
  return entries
    .map(([k, v]) => {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return `${k}=${s.length > 32 ? s.slice(0, 32) + '…' : s}`;
    })
    .join(' ');
}

/**
 * Resolve mode (with auto-escalation), then run the coordinated agent
 * flow, fold its output into stages, run the admission gate at the
 * verify stage, and emit a final `apply`-ready GovernedFlow.
 *
 * Stage emission contract:
 *   - The callback fires AT LEAST once per stage transition.
 *   - The flow object passed in is always a fresh shallow copy.
 *   - The shipped stage is reached only via `markShipped` (UI ships).
 */
export async function runGovernedFlow(
  req: RunGovernedFlowRequest,
): Promise<GovernedFlow> {
  const flowId = `gov_${nanoid(10)}`;
  const requested: AiMode = req.requestedMode ?? 'guided';

  // Heuristic: derive critical-flow kinds for the file set. We use a
  // file-name-includes match on each flow's routes/actions — same shape
  // the obligations layer falls back to (see flowKindsFromPacket).
  const flows = useCriticalFlowStore.getState().all();
  const flowKinds: CriticalFlowKind[] = collectFlowKinds(flows, req.files ?? []);

  const mode = resolveMode(requested, {
    userRequest: req.userMessage,
    mentionedFiles: req.files,
    criticalFlowFiles: req.files?.filter((f) =>
      flows.some((fl) =>
        fl.routes.includes(f) || fl.actions.includes(f),
      ),
    ),
    criticalFlowKinds: flowKinds,
  });

  let flow: GovernedFlow = {
    id: flowId,
    createdAt: Date.now(),
    userMessage: req.userMessage,
    files: req.files ?? [],
    mode,
    stages: emptyStages(),
    patches: [],
    obligations: [],
  };

  const emit = (next: GovernedFlow): void => {
    flow = next;
    req.onStage?.(flow);
  };

  // Bind tool events to the active stage. The coordinator runs roles in
  // order: planner → patcher → verifier; we map planner+analyzer → plan,
  // patcher → patch, verifier → verify.
  let activeUiStage: Stage = 'plan';
  emit(patchStage(flow, 'plan', { status: 'active' }));

  const tStart = Date.now();
  try {
    const result = await runCoordinated({
      userRequest: req.userMessage,
      mode: mode.effective,
      maxIterationsPerRole: 4,
      onProgress: (p) => {
        // Map agent role -> UI stage.
        const next: Stage =
          p.step === 'planner' || p.step === 'analyzer'
            ? 'plan'
            : p.step === 'patcher'
              ? 'patch'
              : 'verify';

        if (p.status === 'started') {
          // Close any prior active stage.
          if (next !== activeUiStage) {
            emit(
              patchStage(flow, activeUiStage, { status: 'completed' }),
            );
            activeUiStage = next;
          }
          emit(patchStage(flow, next, { status: 'active' }));
        } else {
          emit(
            patchStage(flow, next, {
              status: 'completed',
              durationMs: p.durationMs,
            }),
          );
        }

        req.onProgress?.(p);
      },
      evidenceSources: req.evidenceSources,
    });

    // Fold the patcher's patches into the flow.
    const patches = result.patches;

    // Build a synthetic ChangeDescriptor for admission.
    const change: ChangeDescriptor = {
      kind: 'patch',
      files:
        patches.length > 0
          ? patches.map((p) => p.filePath)
          : (req.files ?? []),
    };

    // Run the gate (skipped when there's nothing to evaluate).
    let verdict = result.verdict;
    if (change.files.length > 0) {
      // Make sure verify stage is active before we run the gate.
      if ((activeUiStage as Stage) !== 'verify') {
        emit(patchStage(flow, activeUiStage, { status: 'completed' }));
        activeUiStage = 'verify';
        emit(patchStage(flow, 'verify', { status: 'active' }));
      }

      const admission = await runFullAdmission(change).catch(() => undefined);
      if (admission) {
        // Merge derived obligations on top of any from policy.
        const derived = deriveObligations(admission.packet, flows, {
          flowKinds,
        });
        const allObligations = [
          ...admission.packet.obligations,
          ...derived,
        ];
        const checks = checkObligations(
          allObligations,
          admission.packet,
          req.evidenceSources ?? {},
        );
        verdict = extendVerdict(admission.verdict, admission.packet, checks, {
          taintIndeterminate: req.evidenceSources?.taintIndeterminate,
          criticalFlowWithoutTestData:
            !req.evidenceSources?.affectedTests &&
            change.files.some((f) =>
              /(checkout|payment|auth|login|signup|admin)/i.test(f),
            ),
        });
        const obligations: ObligationView[] = checks.map((c) => ({ check: c }));
        flow = { ...flow, obligations };
      }
    }

    // Close verify, prepare apply stage (apply is user-driven).
    emit({
      ...patchStage(flow, 'verify', {
        status: 'completed',
        durationMs: Date.now() - tStart,
      }),
      patches,
      verdict,
      summary: result.summary,
    });

    // Apply stage is left 'pending' — UI flips it to 'active' when the
    // user clicks "Apply with proof".
    return flow;
  } catch (err) {
    const message = (err as Error).message ?? 'unknown error';
    emit(
      patchStage(flow, activeUiStage, {
        status: 'errored',
        errorMessage: message,
      }),
    );
    throw err;
  }
}

/** Mark the flow as applying — emits a stage transition. */
export function startApply(flow: GovernedFlow): GovernedFlow {
  return patchStage(flow, 'apply', { status: 'active' });
}

/** Mark the flow as shipped — both apply and shipped are completed. */
export function markShipped(flow: GovernedFlow): GovernedFlow {
  const withApply = patchStage(flow, 'apply', { status: 'completed' });
  return {
    ...patchStage(withApply, 'shipped', {
      status: 'completed',
      durationMs: Date.now() - flow.createdAt,
    }),
    shipped: true,
  };
}

/** Surface a tool-call event on the active stage (for inline streaming bullets). */
export function recordToolCall(
  flow: GovernedFlow,
  stage: Stage,
  call: ToolCallView,
): GovernedFlow {
  const stages = flow.stages.map((s) => {
    if (s.stage !== stage) return s;
    const existing = s.toolCalls.find((tc) => tc.id === call.id);
    const next = existing
      ? s.toolCalls.map((tc) => (tc.id === call.id ? { ...tc, ...call } : tc))
      : [...s.toolCalls, call];
    return { ...s, toolCalls: next };
  });
  return { ...flow, stages };
}

/** Convenience for status-line copy. */
export function describeStage(s: StageState): string {
  const label = STAGE_LABEL[s.stage];
  const status = s.status === 'active' ? '…' : s.status;
  return `${label} · ${status}${
    s.durationMs ? ` · ${Math.round(s.durationMs)}ms` : ''
  }`;
}

export { summariseInput };
