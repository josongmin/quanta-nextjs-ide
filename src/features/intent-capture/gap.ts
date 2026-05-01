/**
 * Intent ↔ Implementation gap.
 *
 * After the user takes some actions (applied patches, observed
 * diagnostics) we compute how the actual change diverges from the
 * stated intent. The result is rendered in `gap-card.tsx`.
 *
 * Inputs we consume:
 *   - Intent (from the parser)
 *   - The set of files touched (from a ChangeDescriptor)
 *   - The list of diagnostics / findings (from the LSP store / admission)
 *
 * Outputs:
 *   - constraintsSatisfied / constraintsViolated
 *   - scope.matched / scope.unexpected (files/routes outside stated scope)
 *   - overallSummary suitable for one-line display
 */

import type { Intent, IntentConstraint } from './schema';

export interface DiagnosticLite {
  /** Rule id (e.g. 'secret-flow', 'no-cache-revalidate'). */
  ruleId: string;
  filePath: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
}

export interface GapInput {
  intent: Intent;
  /** Files actually changed by applied patches. */
  changedFiles: ReadonlyArray<string>;
  /** Diagnostics observed after the change. */
  diagnostics: ReadonlyArray<DiagnosticLite>;
}

export interface ConstraintCheck {
  constraint: IntentConstraint;
  satisfied: boolean;
  detail: string;
}

export interface IntentGap {
  constraintChecks: ReadonlyArray<ConstraintCheck>;
  scope: {
    expectedFiles: ReadonlyArray<string>;
    actualFiles: ReadonlyArray<string>;
    matched: ReadonlyArray<string>;
    unexpected: ReadonlyArray<string>;
    missing: ReadonlyArray<string>;
  };
  overallSummary: string;
}

const CONSTRAINT_VIOLATING_RULES: Record<IntentConstraint, RegExp> = {
  'preserve-cache': /(no-cache-revalidate|cache-leak|stale-cache)/i,
  'no-secret-leak': /(secret-flow|secret-in-client)/i,
  'preserve-auth': /(auth-bypass|auth-removed)/i,
  'no-breaking-api': /(api-breaking|removed-export|surface-removed)/i,
  'no-perf-regression': /(perf-regression|long-task|render-blocking)/i,
  'preserve-types': /(type-error|implicit-any)/i,
};

function checkConstraints(
  constraints: ReadonlyArray<IntentConstraint>,
  diagnostics: ReadonlyArray<DiagnosticLite>,
): ReadonlyArray<ConstraintCheck> {
  return constraints.map<ConstraintCheck>((c) => {
    const re = CONSTRAINT_VIOLATING_RULES[c];
    const violating = diagnostics.filter((d) => re.test(d.ruleId));
    return {
      constraint: c,
      satisfied: violating.length === 0,
      detail:
        violating.length === 0
          ? 'No violating diagnostics observed.'
          : `${violating.length} violating diagnostic${violating.length === 1 ? '' : 's'}: ${violating
              .slice(0, 2)
              .map((v) => v.ruleId)
              .join(', ')}${violating.length > 2 ? '…' : ''}`,
    };
  });
}

export function computeGap(input: GapInput): IntentGap {
  const expectedFiles = input.intent.scope.files;
  const actualFiles = input.changedFiles;
  const expectedSet = new Set(expectedFiles);
  const actualSet = new Set(actualFiles);

  const matched = actualFiles.filter((f) => expectedSet.has(f));
  const unexpected = actualFiles.filter((f) => !expectedSet.has(f));
  const missing = expectedFiles.filter((f) => !actualSet.has(f));

  const constraintChecks = checkConstraints(input.intent.constraints, input.diagnostics);
  const violations = constraintChecks.filter((c) => !c.satisfied);

  const overallSummary = (() => {
    const parts: string[] = [];
    if (violations.length === 0 && input.intent.constraints.length > 0) {
      parts.push('All stated constraints satisfied');
    } else if (violations.length > 0) {
      parts.push(`${violations.length} constraint${violations.length === 1 ? '' : 's'} violated`);
    }
    if (unexpected.length > 0) {
      parts.push(`${unexpected.length} unexpected file${unexpected.length === 1 ? '' : 's'}`);
    }
    if (missing.length > 0) {
      parts.push(`${missing.length} expected file${missing.length === 1 ? '' : 's'} untouched`);
    }
    if (!parts.length) parts.push('No gap detected');
    return parts.join(' · ');
  })();

  return {
    constraintChecks,
    scope: {
      expectedFiles,
      actualFiles,
      matched,
      unexpected,
      missing,
    },
    overallSummary,
  };
}
