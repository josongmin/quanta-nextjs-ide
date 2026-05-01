/**
 * Extended admission verdict (Phase 7, spec 22-2).
 *
 * The Phase-5 AdmissionVerdict has decisions {admit, review, reject}.
 * This module layers an additional 'inconclusive' state on top, without
 * touching the original type. Callers opt in by running:
 *
 *     const ext = extendVerdict(base, packet, obligationChecks);
 *
 * The base verdict is preserved verbatim under `.basedOn`; we only
 * promote the decision when uncertainty is detected.
 */

import type {
  AdmissionVerdict,
  EvidencePacket,
} from '@entities/evidence';
import type { ObligationCheck } from './obligations';

export type ExtendedDecision =
  | 'admit'
  | 'review'
  | 'reject'
  | 'inconclusive';

export interface ExtendedVerdict
  extends Omit<AdmissionVerdict, 'decision'> {
  decision: ExtendedDecision;
  /** Why we couldn't conclude — populated when decision === 'inconclusive'. */
  uncertaintyReasons: string[];
  /** The original Phase-5 verdict, untouched. */
  basedOn: AdmissionVerdict;
}

export interface ExtendOptions {
  /** Force inconclusive when taint analysis hit dynamic imports. */
  taintIndeterminate?: boolean;
  /** Force inconclusive when a critical flow lacks any test data. */
  criticalFlowWithoutTestData?: boolean;
  /** Extra free-form uncertainty reasons. */
  reasons?: string[];
}

/**
 * Promote a base verdict to inconclusive when:
 *   - any obligation check is inconclusive (no evidence available), OR
 *   - opts.taintIndeterminate is true, OR
 *   - opts.criticalFlowWithoutTestData is true.
 *
 * If the base decision is already 'reject' we keep it (a reject is
 * stronger than inconclusive). Otherwise inconclusive overrides admit
 * and review.
 */
export function extendVerdict(
  base: AdmissionVerdict,
  packet: EvidencePacket,
  checks: ObligationCheck[] = [],
  opts: ExtendOptions = {},
): ExtendedVerdict {
  void packet;

  const uncertaintyReasons: string[] = [];

  for (const c of checks) {
    if (c.inconclusive) {
      uncertaintyReasons.push(
        `Obligation "${c.obligation.id}" (${c.obligation.kind}) has no evidence available.`,
      );
    }
  }

  if (opts.taintIndeterminate) {
    uncertaintyReasons.push(
      'Taint analysis encountered a dynamic import or unknown runtime value; result is indeterminate.',
    );
  }
  if (opts.criticalFlowWithoutTestData) {
    uncertaintyReasons.push(
      'Change touches a critical flow but no test-impact data is available.',
    );
  }
  if (opts.reasons) uncertaintyReasons.push(...opts.reasons);

  const shouldPromote =
    uncertaintyReasons.length > 0 && base.decision !== 'reject';

  return {
    decision: shouldPromote ? 'inconclusive' : base.decision,
    score: base.score,
    reasons: base.reasons,
    required: base.required,
    uncertaintyReasons,
    basedOn: base,
  };
}

/** UI-friendly tone mapping. */
export function decisionTone(
  d: ExtendedDecision,
): 'good' | 'warn' | 'bad' | 'unknown' {
  switch (d) {
    case 'admit':
      return 'good';
    case 'review':
      return 'warn';
    case 'reject':
      return 'bad';
    case 'inconclusive':
      return 'unknown';
  }
}
