/**
 * Evidence-packet model used by the admission gate.
 *
 * An EvidencePacket is the unit of work the gate evaluates. It bundles the
 * change being proposed, a list of typed findings (taint hits, boundary
 * violations, etc.) and a list of proof obligations the change must
 * satisfy before it can be admitted.
 */

import type { TaintPath } from '@shared/analyzer/taint';

export type ChangeKind = 'patch' | 'pr';

export interface ChangeDescriptor {
  kind: ChangeKind;
  /** Workspace-relative file paths affected. */
  files: string[];
  /** Optional unified diff. */
  diff?: string;
}

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  /** Maps to the existing diagnostic catalog (e.g. 'secret-flow'). */
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  filePath: string;
  line?: number;
  /** Optional: a TaintPath or a list of evidence strings (file:line). */
  witness?: TaintPath | string[];
}

export type ObligationKind =
  | 'test-must-pass'
  | 'cache-must-revalidate'
  | 'no-secret-leak'
  | 'auth-preserved';

export interface ProofObligation {
  id: string;
  kind: ObligationKind;
  description: string;
  /** Optional: list of evidence ids (e.g. test names) that satisfy this obligation. */
  satisfiedBy?: string[];
}

export type AdmissionDecision = 'admit' | 'review' | 'reject';

export interface AdmissionVerdict {
  decision: AdmissionDecision;
  /** 0 = pristine, higher = riskier. */
  score: number;
  reasons: string[];
  required: ProofObligation[];
}

export interface EvidencePacket {
  id: string;
  createdAt: number;
  change: ChangeDescriptor;
  findings: Finding[];
  obligations: ProofObligation[];
  verdict: AdmissionVerdict;
}
