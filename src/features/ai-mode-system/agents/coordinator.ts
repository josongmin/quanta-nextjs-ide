/**
 * Multi-agent coordinator (spec 37) — scaffolding.
 *
 * In 'governed' mode runs four roles in sequence:
 *   1. planner   — produces plan
 *   2. analyzer  — queries knowledge graph (uses existing AI tools)
 *   3. patcher   — proposes patches via propose_patch
 *   4. verifier  — runs admission gate, returns ExtendedVerdict
 *
 * In other modes runs a subset:
 *   - instant:    patcher only
 *   - guided:     planner -> patcher
 *   - autonomous: planner -> patcher (with higher iteration cap)
 *
 * Each role uses the same Anthropic client through `runAgent`,
 * differentiated by a per-role directive prepended to the user
 * message (see prompts.ts).
 */

import {
  runAgent,
  type AgentRunRequest,
  type AssistantMessage,
  type ChatMessage,
  type PatchCandidate,
} from '@shared/ai';
import {
  evaluate,
  extendVerdict,
  type EvidenceSources,
} from '@shared/admission';
import type {
  EvidencePacket,
  ChangeDescriptor,
} from '@entities/evidence';
import type { AiMode } from '../types';
import type {
  AgentRole,
  AgentStepResult,
  CoordinationProgress,
  CoordinationResult,
} from './types';
import { withRoleDirective } from './prompts';

export interface RunCoordinatedRequest {
  userRequest: string;
  mode: AiMode;
  /** Conversation history reused across roles for context. */
  conversation?: ChatMessage[];
  /** Per-step progress hook. */
  onProgress?: (p: CoordinationProgress) => void;
  /** Cap iterations per role (forwarded to runAgent). */
  maxIterationsPerRole?: number;
  /**
   * Evidence sources for the verifier. Optional — when missing the
   * verifier returns an inconclusive verdict (which is the whole point
   * of the new state).
   */
  evidenceSources?: EvidenceSources;
  /**
   * If provided, the verifier uses this packet skeleton (the patcher's
   * patches will be added as a synthetic ChangeDescriptor).
   */
  basePacket?: EvidencePacket;
}

const ROLES_BY_MODE: Record<AiMode, AgentRole[]> = {
  instant: ['patcher'],
  guided: ['planner', 'patcher'],
  autonomous: ['planner', 'patcher'],
  governed: ['planner', 'analyzer', 'patcher', 'verifier'],
};

async function runRole(
  role: AgentRole,
  userMessage: string,
  conversation: ChatMessage[],
  maxIterations: number,
  onPatch: (p: PatchCandidate) => void,
): Promise<AssistantMessage> {
  const req: AgentRunRequest = {
    userMessage: withRoleDirective(role, userMessage),
    conversation,
    maxIterations,
    hooks: { onPatch },
  };
  return runAgent(req);
}

function buildPacketFromPatches(
  base: EvidencePacket | undefined,
  patches: PatchCandidate[],
): EvidencePacket {
  const change: ChangeDescriptor = base?.change ?? {
    kind: 'patch',
    files: patches.map((p) => p.filePath),
  };
  return {
    id: base?.id ?? `coord_${Date.now()}`,
    createdAt: base?.createdAt ?? Date.now(),
    change: {
      ...change,
      files: Array.from(new Set([...change.files, ...patches.map((p) => p.filePath)])),
    },
    findings: base?.findings ?? [],
    obligations: base?.obligations ?? [],
    verdict: base?.verdict ?? {
      decision: 'admit',
      score: 0,
      reasons: [],
      required: [],
    },
  };
}

export async function runCoordinated(
  req: RunCoordinatedRequest,
): Promise<CoordinationResult> {
  const roles = ROLES_BY_MODE[req.mode];
  const conversation: ChatMessage[] = req.conversation ?? [];
  const steps: AgentStepResult[] = [];
  const patches: PatchCandidate[] = [];
  const onPatch = (p: PatchCandidate): void => {
    patches.push(p);
  };
  const cap = req.maxIterationsPerRole ?? 6;

  for (const role of roles) {
    if (role === 'verifier') continue; // handled separately below
    req.onProgress?.({ step: role, status: 'started' });
    const t0 = Date.now();
    const assistant = await runRole(role, req.userRequest, conversation, cap, onPatch);
    const durationMs = Date.now() - t0;
    steps.push({ role, assistant, durationMs });
    req.onProgress?.({ step: role, status: 'finished', durationMs });

    // Append the role's textual answer to the conversation so the next
    // role can build on it.
    conversation.push(
      { role: 'user', content: `[${role} request]: ${req.userRequest}` },
      { role: 'assistant', content: assistant.text || `[no text — ${role}]` },
    );
  }

  // Verifier — runs the admission gate, NOT the AI client. This keeps
  // the verdict deterministic.
  let verdict: CoordinationResult['verdict'];
  if (roles.includes('verifier')) {
    req.onProgress?.({ step: 'verifier', status: 'started' });
    const t0 = Date.now();
    const packet = buildPacketFromPatches(req.basePacket, patches);
    const base = evaluate(packet);
    verdict = extendVerdict(base, packet, [], {
      taintIndeterminate: req.evidenceSources?.taintIndeterminate,
      criticalFlowWithoutTestData:
        !req.evidenceSources?.affectedTests &&
        packet.change.files.some((f) =>
          /(checkout|payment|auth|login|signup|admin)/i.test(f),
        ),
    });
    const durationMs = Date.now() - t0;
    steps.push({
      role: 'verifier',
      assistant: {
        text: `Verdict: ${verdict.decision} (score ${verdict.score}). ${verdict.reasons.join(' ')} ${
          verdict.uncertaintyReasons.length
            ? `Uncertainty: ${verdict.uncertaintyReasons.join(' ')}`
            : ''
        }`,
        patches: [],
        toolUses: [],
        stopReason: 'verifier_done',
        iterations: 0,
      },
      durationMs,
    });
    req.onProgress?.({ step: 'verifier', status: 'finished', durationMs });
  }

  const summary = [
    `mode=${req.mode}`,
    `roles=${roles.join('->')}`,
    `patches=${patches.length}`,
    verdict ? `verdict=${verdict.decision}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return { steps, patches, verdict, summary };
}
