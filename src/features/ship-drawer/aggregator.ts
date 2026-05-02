/**
 * Ship-it readiness aggregator (Phase 21).
 *
 * Pure function. Given access to the existing stores it produces a unified
 * `ShipReadiness` snapshot the drawer can render in one pass.
 *
 * Inputs are read defensively (`getState()` only) so the aggregator can be
 * called from event handlers, async tasks, and tests alike.
 */

import { useEvidenceStore, type EvidencePacket } from '@entities/evidence';
import { useRouteStore, selectPageRoutes } from '@entities/route';
import { useRunnerStore, type KindResult, type RunnerKindLabel } from '@shared/runner';
import { extendVerdict, type ExtendedVerdict } from '@shared/admission';
import { calculateCosts, diffCosts } from '@features/cost-predictor/calculator';
import { findProvider } from '@features/cost-predictor/model';
import { useCostStore } from '@features/cost-predictor/store';
import { useCriticalFlowStore } from '@features/critical-flow/store';
import type {
  CostDeltaRow,
  CostDeltaSummary,
  CriticalFlowTouch,
  E2eAffectedSummary,
  RunnerChip,
  SecretLeakSummary,
  ShipReadiness,
  ShipSuggestion,
} from './types';

const RUNNER_ORDER: RunnerKindLabel[] = ['build', 'typecheck', 'lint', 'test'];

function chipFromResult(label: RunnerKindLabel, r: KindResult | undefined): RunnerChip {
  if (!r) return { label, state: 'idle', durationMs: null };
  if (r.state === 'running') {
    return { label, state: 'running', durationMs: r.durationMs, result: r };
  }
  const state = r.state === 'succeeded' ? 'pass' : 'fail';
  let detail: string | undefined;
  if (label === 'typecheck' && r.typecheckErrors != null && r.typecheckErrors > 0) {
    detail = `${r.typecheckErrors} ts err`;
  } else if (label === 'lint' && r.lintErrors != null) {
    const w = r.lintWarnings ?? 0;
    detail =
      r.lintErrors > 0 ? `${r.lintErrors} err${w ? ` · ${w} warn` : ''}` : w > 0 ? `${w} warn` : undefined;
  } else if (label === 'test') {
    const p = r.testsPassed ?? 0;
    const f = r.testsFailed ?? 0;
    if (p + f > 0) detail = `${p}/${p + f} pass`;
  }
  return { label, state, durationMs: r.durationMs, detail, result: r };
}

function buildRunners(): RunnerChip[] {
  const latest = useRunnerStore.getState().latest;
  return RUNNER_ORDER.map((k) => chipFromResult(k, latest[k]));
}

function buildAdmission(packet: EvidencePacket | undefined): ExtendedVerdict | null {
  if (!packet) return null;
  // Wrap the base verdict via extendVerdict (no obligation checks available
  // here — caller should pre-attach them if richer data is desired).
  return extendVerdict(packet.verdict, packet, [], {});
}

function buildCostDelta(): CostDeltaSummary {
  const cost = useCostStore.getState();
  const routes = selectPageRoutes(useRouteStore.getState());
  if (cost.baseline.size === 0) {
    return { totalDelta: 0, rows: [], isIncrease: false };
  }
  const pricing = findProvider(cost.provider);
  const breakdown = calculateCosts(routes, pricing, cost.trafficPerMonth);
  const diffs = diffCosts(breakdown, cost.baseline, pricing);
  const rows: CostDeltaRow[] = diffs.map((d) => ({
    routeId: d.routeId,
    path: d.path,
    fromBucket: d.fromBucket,
    toBucket: d.toBucket,
    monthlyDelta: d.monthlyDelta,
  }));
  const total = rows.reduce((s, r) => s + r.monthlyDelta, 0);
  return { totalDelta: total, rows, isIncrease: total > 0.5 };
}

function buildCriticalFlowsTouched(packet: EvidencePacket | undefined): CriticalFlowTouch[] {
  const flows = useCriticalFlowStore.getState().all();
  if (!packet || packet.change.files.length === 0) return [];
  const changed = new Set(packet.change.files);
  const touches: CriticalFlowTouch[] = [];
  for (const flow of flows) {
    const candidates = [...flow.routes, ...flow.actions];
    const touched = candidates.filter((p) => changed.has(p));
    if (touched.length === 0) continue;

    // Check obligation status from the verdict's required list.
    const required = packet.verdict.required ?? [];
    const status = required.length === 0
      ? 'unknown'
      : required.every((o) => (o.satisfiedBy?.length ?? 0) > 0)
        ? 'satisfied'
        : 'pending';

    touches.push({ flow, touchedFiles: touched, obligationStatus: status });
  }
  return touches;
}

function buildE2e(): E2eAffectedSummary {
  const e2e = useRunnerStore.getState().latest.e2e;
  if (!e2e) return { affected: false, count: 0 };
  const failed = e2e.testsFailed ?? 0;
  const total = (e2e.testsPassed ?? 0) + failed;
  return { affected: total > 0, count: total };
}

function buildSecretLeak(packet: EvidencePacket | undefined): SecretLeakSummary {
  if (!packet) return { detected: false, count: 0 };
  const hits = packet.findings.filter(
    (f) => f.ruleId === 'secret-flow' || f.ruleId === 'secret-in-client',
  );
  return { detected: hits.length > 0, count: hits.length };
}

function buildSuggestions(
  runners: RunnerChip[],
  packet: EvidencePacket | undefined,
): ShipSuggestion[] {
  const out: ShipSuggestion[] = [];
  for (const r of runners) {
    if (r.state !== 'fail') continue;
    if (r.label === 'build') {
      out.push({
        id: `sg_build_${Date.now()}`,
        kind: 'rerun-checks',
        title: 'Build failed',
        detail: 'Re-run build with verbose logging to see compile errors.',
        autoFixable: false,
      });
    } else if (r.label === 'typecheck') {
      out.push({
        id: `sg_ts_${Date.now()}`,
        kind: 'fix-typecheck',
        title: `Fix ${r.detail ?? 'type errors'}`,
        detail: 'Run admission against the changed files to surface auto-fixes.',
        autoFixable: true,
      });
    } else if (r.label === 'lint') {
      out.push({
        id: `sg_lint_${Date.now()}`,
        kind: 'fix-lint',
        title: `Lint: ${r.detail ?? 'errors'}`,
        detail: 'Most lint findings are safe to auto-fix.',
        autoFixable: true,
      });
    } else if (r.label === 'test') {
      out.push({
        id: `sg_test_${Date.now()}`,
        kind: 'add-test',
        title: `Tests failing (${r.detail ?? '?'})`,
        detail: 'Replay last failing test to inspect the trace.',
        autoFixable: false,
      });
    }
  }
  if (packet) {
    for (const f of packet.findings) {
      if (f.ruleId === 'secret-in-client' || f.ruleId === 'secret-flow') {
        out.push({
          id: `sg_secret_${f.id}`,
          kind: 'fix-secret',
          title: 'Potential secret leak',
          detail: f.message,
          autoFixable: true,
        });
      }
    }
    for (const o of packet.verdict.required ?? []) {
      if (o.kind === 'cache-must-revalidate') {
        out.push({
          id: `sg_obl_${o.id}`,
          kind: 'fix-cache-revalidate',
          title: 'Cache revalidate missing',
          detail: o.description,
          autoFixable: true,
        });
      } else if (o.kind === 'auth-preserved') {
        out.push({
          id: `sg_auth_${o.id}`,
          kind: 'fix-auth',
          title: 'Auth invariant must be preserved',
          detail: o.description,
          autoFixable: true,
        });
      }
    }
  }
  // De-dupe by title.
  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  });
}

function deriveShipState(
  runners: RunnerChip[],
  admission: ExtendedVerdict | null,
): ShipReadiness['shipState'] {
  const anyFail = runners.some((r) => r.state === 'fail');
  if (anyFail) return 'blocked';
  if (admission?.decision === 'reject') return 'blocked';
  if (admission?.decision === 'review' || admission?.decision === 'inconclusive') return 'risky';
  const allIdle = runners.every((r) => r.state === 'idle');
  if (allIdle) return 'unknown';
  return 'ready';
}

/**
 * Pure aggregator. Takes optional injected stores (for tests).
 *
 * Reads:
 *  - useRunnerStore (build/typecheck/lint/test)
 *  - useEvidenceStore (latest admission packet)
 *  - useRouteStore + useCostStore (cost delta vs baseline)
 *  - useCriticalFlowStore (touched flows)
 */
export function aggregate(): ShipReadiness {
  const packets = useEvidenceStore.getState().recent(1);
  const packet = packets[0];

  const runners = buildRunners();
  const admission = buildAdmission(packet);
  const costDelta = buildCostDelta();
  const criticalFlowsTouched = buildCriticalFlowsTouched(packet);
  const e2eAffected = buildE2e();
  const secretLeak = buildSecretLeak(packet);
  const suggestions = buildSuggestions(runners, packet);
  const shipState = deriveShipState(runners, admission);

  return {
    runners,
    admission,
    costDelta,
    criticalFlowsTouched,
    e2eAffected,
    secretLeak,
    suggestions,
    shipState,
    computedAt: Date.now(),
  };
}

/** Convenience: count "blocking" issues for the disabled-state tooltip. */
export function countBlockers(r: ShipReadiness): number {
  let n = 0;
  for (const c of r.runners) if (c.state === 'fail') n++;
  if (r.admission?.decision === 'reject') n++;
  if (r.secretLeak.detected) n += r.secretLeak.count;
  return n;
}
