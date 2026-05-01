/**
 * Declarative admission policy.
 *
 * Each PolicyRule contributes either an absolute verdict ("reject") or a
 * delta on the risk score, and may add proof obligations that must be
 * satisfied before the change is admitted.
 *
 * The set is intentionally small for MVP. Add new rules here rather than
 * inside gate.ts to keep the engine pure.
 */

import type {
  Finding,
  ProofObligation,
  AdmissionDecision,
} from '@entities/evidence';

export interface PolicyMatch {
  /**
   * "Selector" matched against findings. Two flavours:
   *   - `taint:<sourceKind>-><sinkKind>` matches a finding whose witness
   *     is a TaintPath with that source/sink shape.
   *   - `boundary:<key>` matches a finding whose ruleId is `<key>` (the
   *     existing diagnostic catalog).
   */
  whenFinding?: string;
  /** Match if the change touched a path matching this regex. */
  whenChangeFile?: RegExp;
  /** Match if any finding has this ruleId. */
  whenRuleId?: string;
}

export interface PolicyRule {
  id: string;
  match: PolicyMatch;
  verdict?: AdmissionDecision;
  /** Score delta (additive). */
  score?: number;
  /** Reason rendered to the user when the rule fires. */
  reason?: string;
  /** Obligations that the change must discharge. */
  requires?: Array<Pick<ProofObligation, 'kind' | 'description'> & { id?: string }>;
}

export const DEFAULT_POLICY: PolicyRule[] = [
  {
    id: 'secret_to_client_bundle',
    match: { whenFinding: 'taint:env-secret->client-component-prop' },
    verdict: 'reject',
    score: 100,
    reason: 'Secret value flows into a client-component prop (would ship to the browser bundle).',
    requires: [
      {
        id: 'no-secret-leak',
        kind: 'no-secret-leak',
        description: 'Remove the secret from the client-component prop or read it on the server only.',
      },
    ],
  },
  {
    id: 'server_client_boundary_violation',
    match: { whenRuleId: 'server-only-leak' },
    verdict: 'reject',
    score: 80,
    reason: 'A `server-only` module is reachable from a client component.',
  },
  {
    id: 'mutation_without_revalidation',
    match: { whenRuleId: 'revalidate-pair' },
    score: 30,
    reason: 'Mutation detected without a paired revalidation/tag invalidation.',
    requires: [
      {
        id: 'cache-must-revalidate',
        kind: 'cache-must-revalidate',
        description: 'Add revalidatePath or revalidateTag for affected cache entries.',
      },
    ],
  },
  {
    id: 'payment_amount_flow_changed',
    match: { whenChangeFile: /(checkout|payment|stripe|amount|price)/i },
    score: 40,
    reason: 'Change touches payment/checkout flow.',
    requires: [
      {
        id: 'test-must-pass:checkout-e2e',
        kind: 'test-must-pass',
        description: 'Checkout E2E must pass before admission.',
      },
    ],
  },
  {
    id: 'auth_change',
    match: { whenChangeFile: /(auth|session|cookie|jwt|login|signup)/i },
    score: 30,
    reason: 'Change touches authentication.',
    requires: [
      {
        id: 'auth-preserved',
        kind: 'auth-preserved',
        description: 'Authentication invariants must be preserved by the change.',
      },
    ],
  },
];

export function matchFindingSelector(f: Finding, selector: string): boolean {
  if (selector.startsWith('taint:')) {
    const body = selector.slice('taint:'.length);
    const arrowIx = body.indexOf('->');
    if (arrowIx < 0) return false;
    const srcKind = body.slice(0, arrowIx);
    const sinkKind = body.slice(arrowIx + 2);
    const w = f.witness;
    if (!w || Array.isArray(w)) return false;
    return w.source.kind === srcKind && w.sink.kind === sinkKind;
  }
  if (selector.startsWith('boundary:')) {
    return f.ruleId === selector.slice('boundary:'.length);
  }
  return false;
}
