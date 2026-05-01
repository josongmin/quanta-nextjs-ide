/**
 * Admission gate engine.
 *
 * Inputs: an EvidencePacket (built from analyzers + change descriptor).
 * Outputs: an AdmissionVerdict.
 *
 * Decision algorithm:
 *   - Start at score = 0, decision = 'admit', reasons = [], required = [].
 *   - For each policy rule whose `match` selector fires against the
 *     packet, add `score` and reasons, and any obligations.
 *   - Add an additional +20 if there's no affected test in the change.
 *   - Fail-closed: any taint finding involving an env-secret source whose
 *     confidence is 'low' bumps the decision to at least 'review'.
 *   - If any rule yielded `verdict: 'reject'`, decision becomes 'reject'.
 *   - Otherwise: score < 30 → 'admit'; 30..69 → 'review'; ≥ 70 → 'reject'.
 */

import type {
  AdmissionVerdict,
  EvidencePacket,
  Finding,
  ProofObligation,
} from '@entities/evidence';
import { DEFAULT_POLICY, matchFindingSelector, type PolicyRule } from './policy';

export interface GateOptions {
  /** Override the default policy ruleset. */
  policy?: PolicyRule[];
  /** If true (default), missing tests for the change adds +20. */
  penaliseMissingTests?: boolean;
}

interface Accum {
  score: number;
  reasons: string[];
  required: ProofObligation[];
  hardReject: boolean;
}

function ruleFires(rule: PolicyRule, packet: EvidencePacket): Finding[] | null {
  const m = rule.match;
  let matchingFindings: Finding[] | null = null;

  if (m.whenFinding) {
    const fs = packet.findings.filter((f) => matchFindingSelector(f, m.whenFinding!));
    if (fs.length === 0) return null;
    matchingFindings = fs;
  }

  if (m.whenRuleId) {
    const fs = packet.findings.filter((f) => f.ruleId === m.whenRuleId);
    if (fs.length === 0) return null;
    matchingFindings = (matchingFindings ?? []).concat(fs);
  }

  if (m.whenChangeFile) {
    const re = m.whenChangeFile;
    const hit = packet.change.files.some((p) => re.test(p));
    if (!hit) return null;
    matchingFindings = matchingFindings ?? [];
  }

  if (matchingFindings === null) return null;
  return matchingFindings;
}

function obligationFromRule(rule: PolicyRule): ProofObligation[] {
  return (rule.requires ?? []).map((r) => ({
    id: r.id ?? `${rule.id}:${r.kind}`,
    kind: r.kind,
    description: r.description,
  }));
}

function hasAffectedTest(packet: EvidencePacket): boolean {
  return packet.change.files.some((f) =>
    /\.(test|spec)\.[tj]sx?$/i.test(f) || /(__tests__|tests|e2e)\//i.test(f),
  );
}

function failClosedBump(packet: EvidencePacket): { bump: boolean; reason?: string } {
  for (const f of packet.findings) {
    const w = f.witness;
    if (!w || Array.isArray(w)) continue;
    if (w.source.kind === 'env-secret' && w.confidence === 'low') {
      return {
        bump: true,
        reason: `Low-confidence taint from env-secret in ${f.filePath} — fail-closed to review.`,
      };
    }
  }
  return { bump: false };
}

export function evaluate(
  packet: EvidencePacket,
  options: GateOptions = {},
): AdmissionVerdict {
  const policy = options.policy ?? DEFAULT_POLICY;
  const penaliseMissingTests = options.penaliseMissingTests ?? true;

  const acc: Accum = { score: 0, reasons: [], required: [], hardReject: false };

  for (const rule of policy) {
    const fired = ruleFires(rule, packet);
    if (fired === null) continue;
    if (rule.score) acc.score += rule.score;
    if (rule.reason) acc.reasons.push(rule.reason);
    if (rule.verdict === 'reject') acc.hardReject = true;
    acc.required.push(...obligationFromRule(rule));
  }

  // Always include any obligations the packet was constructed with.
  const seen = new Set(acc.required.map((o) => o.id));
  for (const o of packet.obligations) {
    if (!seen.has(o.id)) {
      acc.required.push(o);
      seen.add(o.id);
    }
  }

  if (penaliseMissingTests && !hasAffectedTest(packet)) {
    acc.score += 20;
    acc.reasons.push('No affected test in the change (no_affected_test +20).');
  }

  const fc = failClosedBump(packet);
  if (fc.bump && fc.reason) acc.reasons.push(fc.reason);

  let decision: AdmissionVerdict['decision'];
  if (acc.hardReject) decision = 'reject';
  else if (acc.score >= 70) decision = 'reject';
  else if (acc.score >= 30) decision = 'review';
  else decision = 'admit';

  if (fc.bump && decision === 'admit') decision = 'review';

  return {
    decision,
    score: acc.score,
    reasons: acc.reasons,
    required: acc.required,
  };
}
