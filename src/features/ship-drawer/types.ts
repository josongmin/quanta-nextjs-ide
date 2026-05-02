/**
 * Ship-it Drawer types (Phase 21).
 *
 * `ShipReadiness` is the unified, pre-deploy verification snapshot the drawer
 * shows. It is computed by `aggregator.ts` from all upstream stores
 * (runner, admission, cost-predictor, critical-flow, evidence) and cached
 * in the drawer's zustand store.
 */

import type { ExtendedDecision, ExtendedVerdict } from '@shared/admission';
import type { CostBucket } from '@features/cost-predictor/model';
import type { KindResult, RunnerKindLabel } from '@shared/runner';
import type { CriticalFlow } from '@features/critical-flow/types';

export type RunnerChipState = 'idle' | 'running' | 'pass' | 'fail';

export interface RunnerChip {
  label: RunnerKindLabel;
  state: RunnerChipState;
  durationMs: number | null;
  /** Free-form metric line (e.g. "12 errors", "tests 24/25"). */
  detail?: string;
  result?: KindResult;
}

export interface CostDeltaRow {
  routeId: string;
  path: string;
  fromBucket: CostBucket;
  toBucket: CostBucket;
  monthlyDelta: number;
}

export interface CostDeltaSummary {
  totalDelta: number;
  rows: CostDeltaRow[];
  /** True when delta > 0 — drawer renders red. */
  isIncrease: boolean;
}

export type CriticalFlowObligationStatus = 'satisfied' | 'pending' | 'unknown';

export interface CriticalFlowTouch {
  flow: CriticalFlow;
  /** Files in the change that intersect this flow. */
  touchedFiles: string[];
  obligationStatus: CriticalFlowObligationStatus;
}

export type SuggestionKind =
  | 'add-test'
  | 'fix-secret'
  | 'fix-cache-revalidate'
  | 'fix-auth'
  | 'fix-lint'
  | 'fix-typecheck'
  | 'rerun-checks';

export interface ShipSuggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  detail: string;
  /** When true the row exposes an Auto-fix button. */
  autoFixable: boolean;
}

export interface E2eAffectedSummary {
  /** Whether any e2e tests are believed to be affected. */
  affected: boolean;
  /** Best-effort count from the test-impact slice / e2e runner. */
  count: number;
}

export interface SecretLeakSummary {
  /** True when admission flagged any 'secret-in-client' or 'secret-flow' finding. */
  detected: boolean;
  count: number;
}

/**
 * Single source of truth for the drawer. Computed by `aggregate()`.
 */
export interface ShipReadiness {
  /** Last 4 runners' state, ordered: build, typecheck, lint, test. */
  runners: RunnerChip[];
  /** Extended Phase-7 admission verdict. */
  admission: ExtendedVerdict | null;
  /** Cost delta vs. baseline (only meaningful if user took a baseline). */
  costDelta: CostDeltaSummary;
  /** Critical flows that intersect the change. */
  criticalFlowsTouched: CriticalFlowTouch[];
  /** E2e impact summary (best-effort). */
  e2eAffected: E2eAffectedSummary;
  /** Secret-leak summary derived from admission findings. */
  secretLeak: SecretLeakSummary;
  /** Auto-fix candidates / actionable issues. */
  suggestions: ShipSuggestion[];
  /** Highest-level decision: blocked / risky / ready. */
  shipState: 'ready' | 'risky' | 'blocked' | 'unknown';
  /** Aggregated timestamp. */
  computedAt: number;
}

export interface ShipResultSuccess {
  ok: true;
  url?: string;
  /** Output captured from the runner. */
  log: string;
}

export interface ShipResultFailure {
  ok: false;
  error: string;
  log: string;
}

export type ShipResult = ShipResultSuccess | ShipResultFailure;

export type ShipBlockReason =
  | { kind: 'build-fail' }
  | { kind: 'admission-reject'; reasons: string[] }
  | { kind: 'admission-inconclusive'; reasons: string[] }
  | { kind: 'tests-fail'; count: number }
  | { kind: 'typecheck-fail'; count: number }
  | { kind: 'no-data' };

/** Helper: a small UI-facing readiness score 0..100 (higher is better). */
export function readinessScore(r: ShipReadiness): number {
  let score = 100;
  for (const c of r.runners) {
    if (c.state === 'fail') score -= 30;
    else if (c.state === 'idle') score -= 10;
  }
  if (r.admission?.decision === 'reject') score -= 50;
  else if (r.admission?.decision === 'review') score -= 20;
  else if (r.admission?.decision === 'inconclusive') score -= 15;
  if (r.costDelta.isIncrease) score -= Math.min(15, Math.round(r.costDelta.totalDelta / 5));
  if (r.secretLeak.detected) score -= 25;
  return Math.max(0, Math.min(100, score));
}

export const decisionLabel: Record<ExtendedDecision, string> = {
  admit: 'ADMIT',
  review: 'REVIEW',
  reject: 'REJECT',
  inconclusive: 'INCONCLUSIVE',
};
