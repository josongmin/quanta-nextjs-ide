import type { Severity } from '@shared/types';

export interface PatchAdmissionResult {
  patchId: string;
  source: string;
  filesTouched: number;
  added: number;
  removed: number;
  verdict: 'admit' | 'review' | 'reject';
  reasons: Array<{ severity: Severity; reason: string; evidence?: string }>;
  semanticDiff: Array<{ scope: string; before: string; after: string; severity: 'err' | 'warn' | 'info' }>;
  proof: Array<{ check: string; pass: boolean; note?: string }>;
}

const PATCHES: Record<string, PatchAdmissionResult> = {
  'p_001': {
    patchId: 'p_001',
    source: 'claude-sonnet · 14 files · +320 / −85 lines',
    filesTouched: 14,
    added: 320,
    removed: 85,
    verdict: 'reject',
    reasons: [
      {
        severity: 'err',
        reason: '"use client" introduced at root layout (app/layout.tsx)',
        evidence: 'app/layout.tsx:1',
      },
      {
        severity: 'err',
        reason: 'revalidateTag("products") removed from updateProduct',
        evidence: 'app/admin/products/actions.ts:24',
      },
      {
        severity: 'warn',
        reason: 'Secret reference (STRIPE_SECRET_KEY) reachable from client tree',
        evidence: 'lib/config.ts → components/client/Checkout.tsx',
      },
      {
        severity: 'info',
        reason: 'No new tests added for the changed admin flow',
      },
    ],
    semanticDiff: [
      { scope: '/admin/products', before: 'pair: ✓', after: 'pair: ✗', severity: 'err' },
      { scope: '"use client"', before: 'AppShell.tsx', after: 'app/layout.tsx', severity: 'err' },
      { scope: 'Estimated client JS', before: '~46KB', after: '~260KB', severity: 'warn' },
      { scope: '/products/[id]', before: 'ISR', after: 'Dynamic candidate', severity: 'warn' },
    ],
    proof: [
      { check: 'Auth preserved on /admin/*', pass: true },
      { check: 'Cache pair (revalidateTag)', pass: false, note: 'removed in this patch' },
      { check: 'Types compatible (tsc clean)', pass: true },
      { check: 'Tests added for new behavior', pass: false, note: '0 new tests' },
      { check: 'No secret reaches client', pass: false, note: 'lib/config.ts traverses to client tree' },
    ],
  },
  'p_002': {
    patchId: 'p_002',
    source: 'claude-haiku · 3 files · +24 / −12 lines',
    filesTouched: 3,
    added: 24,
    removed: 12,
    verdict: 'review',
    reasons: [
      {
        severity: 'warn',
        reason: 'Confidence Medium: helper renamed across project (manual review recommended)',
        evidence: 'lib/format-date.ts → lib/date.ts',
      },
      {
        severity: 'info',
        reason: 'Imports updated in 6 files',
      },
    ],
    semanticDiff: [
      { scope: 'lib/format-date.ts', before: 'present', after: 'renamed', severity: 'info' },
    ],
    proof: [
      { check: 'Auth preserved', pass: true },
      { check: 'Cache pair', pass: true },
      { check: 'Types compatible', pass: true },
      { check: 'Tests added', pass: false, note: 'rename only — no new tests required' },
      { check: 'No secret reaches client', pass: true },
    ],
  },
  'p_003': {
    patchId: 'p_003',
    source: 'claude-opus · 5 files · +88 / −20 lines',
    filesTouched: 5,
    added: 88,
    removed: 20,
    verdict: 'admit',
    reasons: [
      {
        severity: 'info',
        reason: 'Adds revalidateTag("orders") to createOrder action',
      },
      {
        severity: 'info',
        reason: 'Adds idempotency key to checkout flow',
      },
    ],
    semanticDiff: [
      { scope: 'createOrder', before: 'no rev pair', after: 'revalidateTag("orders")', severity: 'info' },
      { scope: 'checkout', before: 'no idempotency', after: 'idempotency key', severity: 'info' },
    ],
    proof: [
      { check: 'Auth preserved', pass: true },
      { check: 'Cache pair', pass: true },
      { check: 'Types compatible', pass: true },
      { check: 'Tests added', pass: true, note: '+3 integration tests' },
      { check: 'No secret reaches client', pass: true },
    ],
  },
};

export function evaluatePatch(patchId: string | undefined): PatchAdmissionResult {
  const found = patchId ? PATCHES[patchId] : undefined;
  return found ?? PATCHES['p_001']!;
}

/**
 * Bridge: turn an AI-emitted PatchCandidate into the legacy admission shape.
 *
 * The mocked verdict logic is preserved (the gate's static-analysis layer
 * is owned by another phase). We synthesize a default REVIEW verdict for
 * candidates not in the demo set, listing the rationale and basic diff
 * stats so the UI still has something to show.
 */
import type { PatchCandidate } from '@shared/ai';

export function patchCandidateToAdmission(
  candidate: PatchCandidate,
): PatchAdmissionResult {
  const oldLines = candidate.oldContent.split('\n');
  const newLines = candidate.newContent.split('\n');
  // crude diff stats — full diff is owned by Phase 1 analyzer
  const added = Math.max(0, newLines.length - oldLines.length);
  const removed = Math.max(0, oldLines.length - newLines.length);
  return {
    patchId: candidate.id,
    source: `agent · ${candidate.filePath}`,
    filesTouched: 1,
    added,
    removed,
    verdict: 'review',
    reasons: [
      { severity: 'info', reason: candidate.rationale || 'AI-proposed change.' },
      ...(candidate.evidence.length > 0
        ? [
            {
              severity: 'info' as const,
              reason: `${candidate.evidence.length} tool calls inspected before proposing this patch`,
            },
          ]
        : []),
    ],
    semanticDiff: [
      {
        scope: candidate.filePath,
        before: candidate.oldContent ? 'present' : 'absent',
        after: 'modified',
        severity: 'info',
      },
    ],
    proof: [
      { check: 'Path resolves inside workspace', pass: candidate.filePath.length > 0 },
      { check: 'AI provided a rationale', pass: candidate.rationale.length > 0 },
      { check: 'Static analysis (full)', pass: false, note: 'pending phase-1 verifier' },
      { check: 'Types compatible', pass: false, note: 'pending tsserver pass' },
    ],
  };
}

export const SAMPLE_PATCH_IDS: ReadonlyArray<string> = ['p_001', 'p_002', 'p_003'];

/**
 * Real admission: runs the Phase-5 taint solver + admission gate against the
 * patch candidate's file set, then folds the gate's verdict back into the
 * legacy admission shape that the existing UI consumes.
 *
 * Falls back to `patchCandidateToAdmission` (mocked) if the gate throws —
 * we never want a patch UI to crash because the analyzer hit a bad path.
 */
import { runFullAdmission } from '@shared/admission';

export async function admitPatchCandidate(
  candidate: PatchCandidate,
  workspaceRoot?: string,
): Promise<PatchAdmissionResult> {
  const base = patchCandidateToAdmission(candidate);
  try {
    const { verdict } = await runFullAdmission(
      { kind: 'patch', files: [candidate.filePath], diff: candidate.newContent },
      { workspaceRoot },
    );
    const reasons: PatchAdmissionResult['reasons'] = verdict.reasons.map((r) => ({
      severity:
        verdict.decision === 'reject'
          ? 'err'
          : verdict.decision === 'review'
            ? 'warn'
            : 'info',
      reason: r,
    }));
    const proof: PatchAdmissionResult['proof'] = [
      ...base.proof.filter((p) => !p.note?.includes('pending')),
      {
        check: 'No secret reaches client (taint analysis)',
        pass: !verdict.required.some((o) => o.kind === 'no-secret-leak'),
      },
      {
        check: 'Cache invalidated where required',
        pass: !verdict.required.some((o) => o.kind === 'cache-must-revalidate'),
      },
    ];
    return {
      ...base,
      verdict: verdict.decision,
      reasons: [...base.reasons, ...reasons],
      proof,
    };
  } catch {
    return base;
  }
}
