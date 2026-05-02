/**
 * Cockpit start screen — types.
 *
 * The Cockpit is a 1-page project pulse rendered when no editor tab is
 * active (or via a deliberate "Cockpit" overlay). All values are computed
 * from existing zustand stores — no new ground-truth lives here.
 */

import type { Diagnostic, Severity } from '@shared/types';

export interface RouteTotals {
  total: number;
  static: number;
  dynamic: number;
  streaming: number;
  /** Estimated client-bundle p50 (KB) across page routes. */
  clientKbP50: number;
  /** Server-budget headroom remaining (0..100, higher = healthier). */
  serverBudgetPct: number;
}

export type RiskKind = 'reject' | 'review' | 'warn' | 'err';

export interface CockpitRisk {
  id: string;
  diagnosticId?: string;
  kind: RiskKind;
  severity: Severity;
  routeId?: string;
  routePath?: string;
  title: string;
  cause: string;
  /** Witness chain — `file:line` strings or short evidence labels. */
  witness: string[];
  /** Workspace-relative file paths affected. */
  affectedFiles: string[];
}

export type ShippedChangeKind =
  | 'static-to-isr'
  | 'static-to-dynamic'
  | 'dynamic-to-static'
  | 'cache-policy'
  | 'boundary'
  | 'metadata'
  | 'refactor'
  | 'feature'
  | 'fix';

export interface ShippedChange {
  id: string;
  routeId?: string;
  routePath: string;
  kind: ShippedChangeKind;
  description: string;
  author: string;
  /** Unix epoch milliseconds. */
  shippedAt: number;
}

export type ReadinessVerdict = 'admit' | 'review' | 'reject';

export type ReadinessGateStatus = 'pass' | 'warn' | 'fail' | 'pending';

export interface ReadinessGate {
  id: 'build' | 'typecheck' | 'lint' | 'tests';
  label: string;
  status: ReadinessGateStatus;
  detail?: string;
}

export interface DeployReadiness {
  verdict: ReadinessVerdict;
  /** 0 = pristine, higher = riskier. */
  score: number;
  reasons: string[];
  gates: ReadinessGate[];
}

export interface ProjectPulse {
  projectName: string;
  framework: string;
  workspacePath: string;
  totals: RouteTotals;
  risks: CockpitRisk[];
  recentShipped: ShippedChange[];
  deployReadiness: DeployReadiness;
  /** When this pulse was computed (epoch ms). */
  computedAt: number;
}

export type RawDiagnostic = Diagnostic;
