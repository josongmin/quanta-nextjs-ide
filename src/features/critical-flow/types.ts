/**
 * Critical Flow types — represents an automatically-detected (or
 * user-tagged) collection of routes / server actions that handle
 * sensitive concerns: payment, auth, admin, billing, order, pii.
 *
 * Detection feeds the obligation system: a change touching a critical
 * flow accrues additional proof obligations.
 */

export type CriticalFlowKind =
  | 'payment'
  | 'auth'
  | 'admin'
  | 'billing'
  | 'order'
  | 'pii';

export type CriticalFlowSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CriticalFlowSignal {
  /** Path or symbol that triggered the match. */
  source: string;
  /** Heuristic label that matched (e.g. 'keyword:checkout'). */
  matched: string;
  weight: number;
}

export interface CriticalFlow {
  id: string;
  kind: CriticalFlowKind;
  /** Display name. */
  label: string;
  routes: string[];
  actions: string[];
  /** 0..1 — heuristic confidence the flow is what we think it is. */
  confidence: number;
  severity: CriticalFlowSeverity;
  signals: CriticalFlowSignal[];
  /** True when the flow was tagged manually rather than auto-detected. */
  manual?: boolean;
  /** When true, applies maximally strict policy on changes touching it. */
  strict?: boolean;
}
