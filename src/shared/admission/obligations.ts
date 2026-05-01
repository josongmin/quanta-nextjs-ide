/**
 * Proof-Obligation derivation + checking (Phase 7, spec 22-1).
 *
 * Phase 5 already attaches obligations as part of the admission policy.
 * This module is a SEPARATE layer: it lets callers derive *additional*
 * obligations from a CriticalFlow context and check them against
 * available evidence (test impact, taint findings, cache analyzers,
 * auth tracer).
 *
 * Crucially this file does NOT modify policy.ts or gate.ts. It is meant
 * to be composed on top: take a verdict, run `deriveObligations`,
 * `checkObligations`, then optionally `extendVerdict` (see
 * extended-verdict.ts) to fold the inconclusive case in.
 */

import type {
  EvidencePacket,
  ProofObligation,
  ObligationKind,
  Finding,
} from '@entities/evidence';
import type {
  CriticalFlow,
  CriticalFlowKind,
} from '@features/critical-flow/types';

export interface ObligationCheck {
  obligation: ProofObligation;
  /** True when the obligation is verifiably satisfied by available evidence. */
  satisfied: boolean;
  /** True when there is no evidence available to check (data unknown). */
  inconclusive?: boolean;
  /** Cited evidence ids (test names, finding ids, tags). */
  evidence?: string[];
  /** Human-readable hint for what would satisfy the obligation. */
  hint?: string;
}

/**
 * External evidence sources callers can plug in. All optional — when
 * absent the relevant obligations come back inconclusive.
 */
export interface EvidenceSources {
  /** Test names / paths impacted by the change (from test-impact analyzer). */
  affectedTests?: string[];
  /** Set of test names known to currently pass. */
  passingTests?: string[];
  /** Has the change paired any mutation with a revalidate call? */
  hasRevalidate?: boolean;
  /** Has the change preserved auth invariants (per auth-flow-tracer)? */
  authPreserved?: boolean;
  /** Are there any unresolved taint paths from secrets to client? */
  secretLeakPresent?: boolean;
  /** True when taint analysis bailed out on dynamic imports / unknown values. */
  taintIndeterminate?: boolean;
}

const KIND_TO_DESCRIPTION: Record<ObligationKind, string> = {
  'test-must-pass':
    'A test exercising the affected code path must pass before admission.',
  'cache-must-revalidate':
    'Mutation must be paired with revalidatePath / revalidateTag.',
  'no-secret-leak':
    'No env-secret may flow into a client component or response body.',
  'auth-preserved':
    'Authentication invariants (guard, role, session) must be preserved.',
};

const KIND_TO_HINT: Record<ObligationKind, string> = {
  'test-must-pass':
    'Add or update an e2e/unit test that reproduces the path; ensure it is in the passing set.',
  'cache-must-revalidate':
    'Add `revalidateTag(tag)` or `revalidatePath(path)` after the mutation.',
  'no-secret-leak':
    'Move the secret read to a server-only module; do not pass it as a client prop.',
  'auth-preserved':
    'Confirm the auth-flow-tracer reports no removed/relaxed guards.',
};

function obligation(
  id: string,
  kind: ObligationKind,
  description?: string,
  satisfiedBy?: string[],
): ProofObligation {
  return {
    id,
    kind,
    description: description ?? KIND_TO_DESCRIPTION[kind],
    ...(satisfiedBy ? { satisfiedBy } : {}),
  };
}

interface DeriveContext {
  /** Critical flow kinds the change touches. */
  flowKinds?: CriticalFlowKind[];
  /** True if the diff includes a mutation we couldn't pair. */
  unpairedMutation?: boolean;
  /** True if the diff adds a new server action. */
  newServerAction?: boolean;
  /** True if the diff includes any test file. */
  hasAffectedTest?: boolean;
}

/**
 * Derive obligations specifically from CriticalFlow context. This does NOT
 * include the obligations the gate already attached via DEFAULT_POLICY —
 * callers concat the two lists.
 */
export function deriveObligations(
  packet: EvidencePacket,
  flows: CriticalFlow[],
  ctx: DeriveContext = {},
): ProofObligation[] {
  const out: ProofObligation[] = [];
  const seen = new Set<string>();
  const push = (o: ProofObligation): void => {
    if (seen.has(o.id)) return;
    seen.add(o.id);
    out.push(o);
  };

  // Flow-driven obligations.
  const flowKinds =
    ctx.flowKinds ??
    flowKindsFromPacket(packet, flows);

  if (flowKinds.includes('payment')) {
    push(obligation('flow:payment:test', 'test-must-pass', 'Checkout E2E must pass for payment-flow changes.'));
    push(obligation('flow:payment:no-secret', 'no-secret-leak'));
    push(obligation('flow:payment:revalidate', 'cache-must-revalidate'));
  }
  if (flowKinds.includes('auth')) {
    push(obligation('flow:auth:preserved', 'auth-preserved'));
    push(obligation('flow:auth:no-secret', 'no-secret-leak'));
  }
  if (flowKinds.includes('admin')) {
    push(obligation('flow:admin:auth', 'auth-preserved', 'Admin role guards must be preserved.'));
  }
  if (flowKinds.includes('billing') || flowKinds.includes('order')) {
    push(obligation('flow:order-billing:test', 'test-must-pass'));
    push(obligation('flow:order-billing:revalidate', 'cache-must-revalidate'));
  }
  if (flowKinds.includes('pii')) {
    push(obligation('flow:pii:no-secret', 'no-secret-leak', 'PII must not leak into client bundle or logs.'));
  }

  // Generic structural obligations.
  if (ctx.unpairedMutation) {
    push(obligation('structural:revalidate', 'cache-must-revalidate'));
  }
  if (ctx.newServerAction && !ctx.hasAffectedTest) {
    push(obligation('structural:new-action-test', 'test-must-pass',
      'A new server action requires at least one passing test.'));
  }

  return out;
}

/**
 * Heuristic: derive flowKinds purely from the packet's change.files
 * by scanning each flow's route/action lists. Conservative — only
 * exact filename match, callers can pass `flowKinds` explicitly via ctx
 * for path-based detection.
 */
function flowKindsFromPacket(
  packet: EvidencePacket,
  flows: CriticalFlow[],
): CriticalFlowKind[] {
  const kinds = new Set<CriticalFlowKind>();
  for (const f of flows) {
    const touched =
      f.routes.some((rid) => packet.change.files.some((cf) => cf.includes(rid))) ||
      f.actions.some((aid) => packet.change.files.some((cf) => cf.includes(aid)));
    if (touched) kinds.add(f.kind);
  }
  return [...kinds];
}

function findingsHaveSecret(findings: Finding[]): boolean {
  return findings.some(
    (f) => f.ruleId === 'secret-flow' || f.ruleId === 'secret-in-client',
  );
}

/**
 * Check the supplied obligations against external evidence.
 * Pure; does not mutate the obligations.
 */
export function checkObligations(
  obligations: ProofObligation[],
  packet: EvidencePacket,
  sources: EvidenceSources = {},
): ObligationCheck[] {
  return obligations.map((o) => check(o, packet, sources));
}

function check(
  o: ProofObligation,
  packet: EvidencePacket,
  s: EvidenceSources,
): ObligationCheck {
  switch (o.kind) {
    case 'test-must-pass': {
      if (!s.affectedTests || !s.passingTests) {
        return {
          obligation: o,
          satisfied: false,
          inconclusive: true,
          hint: KIND_TO_HINT[o.kind],
        };
      }
      const passingSet = new Set(s.passingTests);
      const affected = s.affectedTests;
      const allPass = affected.length > 0 && affected.every((t) => passingSet.has(t));
      return {
        obligation: o,
        satisfied: allPass,
        evidence: affected,
        hint: allPass ? undefined : KIND_TO_HINT[o.kind],
      };
    }
    case 'no-secret-leak': {
      const hasFinding = findingsHaveSecret(packet.findings);
      if (s.secretLeakPresent === undefined && !hasFinding && s.taintIndeterminate) {
        return {
          obligation: o,
          satisfied: false,
          inconclusive: true,
          hint: KIND_TO_HINT[o.kind],
        };
      }
      const satisfied = !(s.secretLeakPresent ?? hasFinding);
      return {
        obligation: o,
        satisfied,
        evidence: hasFinding
          ? packet.findings
              .filter((f) => f.ruleId === 'secret-flow' || f.ruleId === 'secret-in-client')
              .map((f) => f.id)
          : undefined,
        hint: satisfied ? undefined : KIND_TO_HINT[o.kind],
      };
    }
    case 'cache-must-revalidate': {
      if (s.hasRevalidate === undefined) {
        return {
          obligation: o,
          satisfied: false,
          inconclusive: true,
          hint: KIND_TO_HINT[o.kind],
        };
      }
      return {
        obligation: o,
        satisfied: s.hasRevalidate,
        hint: s.hasRevalidate ? undefined : KIND_TO_HINT[o.kind],
      };
    }
    case 'auth-preserved': {
      if (s.authPreserved === undefined) {
        return {
          obligation: o,
          satisfied: false,
          inconclusive: true,
          hint: KIND_TO_HINT[o.kind],
        };
      }
      return {
        obligation: o,
        satisfied: s.authPreserved,
        hint: s.authPreserved ? undefined : KIND_TO_HINT[o.kind],
      };
    }
    default: {
      // Exhaustive guard.
      return {
        obligation: o,
        satisfied: false,
        inconclusive: true,
      };
    }
  }
}

/** Convenience aggregate. */
export function summarize(checks: ObligationCheck[]): {
  satisfied: number;
  unsatisfied: number;
  inconclusive: number;
  total: number;
} {
  let satisfied = 0;
  let unsatisfied = 0;
  let inconclusive = 0;
  for (const c of checks) {
    if (c.inconclusive) inconclusive += 1;
    else if (c.satisfied) satisfied += 1;
    else unsatisfied += 1;
  }
  return {
    satisfied,
    unsatisfied,
    inconclusive,
    total: checks.length,
  };
}
