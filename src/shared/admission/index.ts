/**
 * Public API for Phase-5 admission.
 *
 * Two entry points:
 *   - `evaluate(packet)` → synchronous; takes a fully built EvidencePacket.
 *   - `runFullAdmission(change, opts?)` → async; runs the taint solver,
 *     converts hits into Findings, builds a packet, evaluates it, and
 *     records the result in the EvidenceStore.
 *
 * Phase 4 (AI patch gate) and the diagnostics UI both consume the
 * AdmissionVerdict shape: `{ decision, score, reasons, required }`.
 */

import { nanoid } from 'nanoid';
import {
  useEvidenceStore,
  type ChangeDescriptor,
  type EvidencePacket,
  type Finding,
  type AdmissionVerdict,
  type FindingSeverity,
} from '@entities/evidence';
import { analyzeTaint, type TaintPath, type SolverResult } from '@shared/analyzer/taint';
import { evaluate, type GateOptions } from './gate';

export { evaluate } from './gate';
export { DEFAULT_POLICY } from './policy';
export type { PolicyRule } from './policy';
export {
  deriveObligations,
  checkObligations,
  summarize as summarizeObligations,
} from './obligations';
export type {
  ObligationCheck,
  EvidenceSources,
} from './obligations';
export { extendVerdict, decisionTone } from './extended-verdict';
export type {
  ExtendedDecision,
  ExtendedVerdict,
  ExtendOptions,
} from './extended-verdict';

const TAINT_RULE_ID_BY_SINK: Record<TaintPath['sink']['kind'], string> = {
  'client-component-prop': 'secret-in-client',
  'serialized-response': 'secret-flow',
  'log': 'secret-flow',
  'fetch-body': 'secret-flow',
};

function severityFor(path: TaintPath): FindingSeverity {
  if (path.source.kind === 'env-secret' && path.sink.kind === 'client-component-prop') {
    return 'critical';
  }
  if (path.confidence === 'high') return 'high';
  if (path.confidence === 'medium') return 'medium';
  return 'low';
}

export function taintPathToFinding(path: TaintPath): Finding {
  const ruleId = TAINT_RULE_ID_BY_SINK[path.sink.kind] ?? 'secret-flow';
  return {
    id: `taint_${nanoid(8)}`,
    ruleId,
    severity: severityFor(path),
    message: `Tainted ${path.source.kind} (${path.source.expr}) reaches ${path.sink.kind}.`,
    filePath: path.sink.file,
    line: path.sink.node.line,
    witness: path,
  };
}

export interface RunAdmissionOptions extends GateOptions {
  /** Workspace root used to resolve files when running the taint solver. */
  workspaceRoot?: string;
  /**
   * Pre-computed taint result. If provided we skip running the solver.
   * Useful for tests and for callers that ran the solver themselves.
   */
  taint?: SolverResult;
  /** Additional findings to merge in (e.g. from other analyzers). */
  extraFindings?: Finding[];
}

export interface RunAdmissionResult {
  packet: EvidencePacket;
  verdict: AdmissionVerdict;
}

/**
 * One-shot helper: produce a full EvidencePacket for the change, evaluate
 * it through the gate, push it onto the EvidenceStore, and return both.
 */
export async function runFullAdmission(
  change: ChangeDescriptor,
  options: RunAdmissionOptions = {},
): Promise<RunAdmissionResult> {
  const taint = options.taint ?? (await analyzeTaint(options.workspaceRoot ?? '.'));
  // Limit taint paths to those touching the changed files when we have a diff.
  const relevant = change.files.length
    ? taint.paths.filter(
        (p) =>
          change.files.includes(p.source.file) ||
          change.files.includes(p.sink.file),
      )
    : taint.paths;

  const findings: Finding[] = [
    ...relevant.map(taintPathToFinding),
    ...(options.extraFindings ?? []),
  ];

  const packet: EvidencePacket = {
    id: `ev_${nanoid(10)}`,
    createdAt: Date.now(),
    change,
    findings,
    obligations: [],
    verdict: { decision: 'admit', score: 0, reasons: [], required: [] },
  };

  const verdict = evaluate(packet, options);
  packet.verdict = verdict;

  // Best-effort: write to the store; in non-React/Node test contexts the
  // hook still works as a plain getState/setState.
  try {
    useEvidenceStore.getState().record(packet);
  } catch {
    /* ignore */
  }

  return { packet, verdict };
}

/**
 * Diagnostic action: callable from any UI surface to re-run admission.
 * Phase 4 (AI gate) consumes the returned verdict directly:
 *   `{ decision, score, reasons, required }`.
 */
export async function runAdmissionDiagnostic(
  change: ChangeDescriptor,
  options: RunAdmissionOptions = {},
): Promise<AdmissionVerdict> {
  const { verdict } = await runFullAdmission(change, options);
  return verdict;
}
