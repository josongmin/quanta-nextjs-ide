/**
 * Phase 18 — AI Governed Mode UI types.
 *
 * Wraps the runtime pieces shipped in Phase 7 (mode system + admission
 * extended verdict) into a UI-shaped, stage-driven model the
 * "Co-shipper" panel renders.
 *
 * The runtime work happens in `orchestrator.ts`; consumers of the UI
 * only ever see the shapes here.
 */

import type { CoordinationProgress } from '@features/ai-mode-system/agents/types';
import type { ExtendedVerdict } from '@shared/admission';
import type {
  ObligationCheck,
  EvidenceSources,
} from '@shared/admission';
import type { PatchCandidate } from '@shared/ai';
import type { AiMode, ResolvedMode } from '@features/ai-mode-system';

/** Five visible stages of the governed flow (UI-only progression). */
export type Stage = 'plan' | 'patch' | 'verify' | 'apply' | 'shipped';

export const STAGES: Stage[] = ['plan', 'patch', 'verify', 'apply', 'shipped'];

export const STAGE_LABEL: Record<Stage, string> = {
  plan: 'Plan',
  patch: 'Patch',
  verify: 'Verify',
  apply: 'Apply',
  shipped: 'Shipped',
};

export type StageStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'errored';

export interface ToolCallView {
  id: string;
  name: string;
  inputSummary: string;
  startedAt: number;
  endedAt?: number;
  isError?: boolean;
}

export interface StageState {
  stage: Stage;
  status: StageStatus;
  /** Free-form streaming summary the agent emits for this stage. */
  text?: string;
  /** Tool calls observed during this stage (collapsible bullets). */
  toolCalls: ToolCallView[];
  /** Total wall-clock for the stage (ms). */
  durationMs?: number;
  /** Filled when status transitions to 'errored'. */
  errorMessage?: string;
}

/** Suppress reasons captured for failed obligations (audit log). */
export interface ObligationSuppression {
  obligationId: string;
  reason: string;
  at: number;
  by?: string;
}

export interface ObligationView {
  check: ObligationCheck;
  suppressed?: ObligationSuppression;
}

export interface GovernedFlow {
  id: string;
  createdAt: number;
  /** What the user typed. */
  userMessage: string;
  /** Files the user (or auto-detection) attached. */
  files: string[];
  /** Mode the user requested + what we actually ran. */
  mode: ResolvedMode;
  /** Visible stages, in order. */
  stages: StageState[];
  /** Patches surfaced by the patcher. */
  patches: PatchCandidate[];
  /** Obligation checks (after derivation + check). */
  obligations: ObligationView[];
  /** Final extended verdict (filled at verify stage). */
  verdict?: ExtendedVerdict;
  /** Free-form summary for the toolbar. */
  summary?: string;
  /** True when we shipped the patches (apply stage finished). */
  shipped?: boolean;
}

export interface RunGovernedFlowRequest {
  userMessage: string;
  /** Files explicitly mentioned / selected as context. */
  files?: string[];
  /** Optional pre-computed evidence sources for the verifier. */
  evidenceSources?: EvidenceSources;
  /** User-selected mode (escalation may bump this up). */
  requestedMode?: AiMode;
  /** Streaming callback — invoked after each stage transition. */
  onStage?: (flow: GovernedFlow) => void;
  /** Coordination progress passthrough (for compatibility). */
  onProgress?: (p: CoordinationProgress) => void;
}

/** Public re-export for convenience. */
export type { ExtendedVerdict, PatchCandidate, ObligationCheck };
