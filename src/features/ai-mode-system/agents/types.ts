/**
 * Multi-agent coordination types (spec 37).
 *
 * Four roles, each implemented as the SAME agent client driven by a
 * role-specific system prompt. Run sequentially in 'governed' mode;
 * skipped or short-circuited in lighter modes.
 */

import type {
  AssistantMessage,
  PatchCandidate,
} from '@shared/ai';
import type { ExtendedVerdict } from '@shared/admission';

export type AgentRole = 'planner' | 'analyzer' | 'patcher' | 'verifier';

export interface AgentStepResult {
  role: AgentRole;
  /** The assistant message returned by the role. */
  assistant: AssistantMessage;
  /** Wall-clock duration. */
  durationMs: number;
}

export interface CoordinationResult {
  /** All steps executed, in order. */
  steps: AgentStepResult[];
  /** Patches surfaced by the patcher role. */
  patches: PatchCandidate[];
  /** Final extended verdict from the verifier (if it ran). */
  verdict?: ExtendedVerdict;
  /** Free-form summary the UI can show. */
  summary: string;
}

export interface CoordinationProgress {
  step: AgentRole;
  status: 'started' | 'finished';
  durationMs?: number;
}
