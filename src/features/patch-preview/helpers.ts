import type { Diagnostic, QuickFix } from '@shared/types';

/**
 * Find diagnostics that share a `ruleId` with the given diagnostic
 * (excluding the diagnostic itself). Used to estimate the size of an
 * "Apply to all similar" operation.
 */
export function findRelatedDiagnostics(
  d: Diagnostic,
  all: Diagnostic[],
): Diagnostic[] {
  return all.filter((x) => x.ruleId === d.ruleId && x.id !== d.id);
}

/**
 * Synthesize a contextual before/after stub when a fix has no explicit
 * `preview`. Uses the diagnostic's location to anchor the mock so the
 * overlay never shows an empty diff.
 */
export function synthesizePreview(
  d: Diagnostic,
  fix: QuickFix,
): { before: string; after: string } {
  const site = `${d.location.file}:${d.location.line}`;
  const before = [
    `// site: ${site}`,
    `// rule: ${d.ruleId}`,
    `// (no explicit preview — current code at this site)`,
    `${d.scope || '<scope>'}`,
  ].join('\n');
  const after = [
    `// site: ${site}`,
    `// rule: ${d.ruleId}`,
    `// fix: ${fix.title}`,
    fix.description ? `// note: ${fix.description}` : `// note: applied (mock)`,
  ].join('\n');
  return { before, after };
}
