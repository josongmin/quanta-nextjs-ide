import type { Diagnostic, EvidenceItem } from '@shared/types';
import { getSourceForFile } from '@shared/mocks';

export type EvidenceKind = EvidenceItem['kind'];

export const evidenceKindOrder: readonly EvidenceKind[] = [
  'direct',
  'indirect',
  'heuristic',
] as const;

export const evidenceKindLabel: Record<EvidenceKind, string> = {
  direct: 'Direct',
  indirect: 'Indirect',
  heuristic: 'Heuristic',
};

export const evidenceKindHint: Record<EvidenceKind, string> = {
  direct: 'Found in source code as-is',
  indirect: 'Reached through transitive call/import',
  heuristic: 'Pattern-based guess — may not be exact',
};

export interface EvidenceGroup {
  kind: EvidenceKind;
  items: EvidenceItem[];
}

export function groupEvidence(diagnostic: Diagnostic): EvidenceGroup[] {
  return evidenceKindOrder
    .map<EvidenceGroup>((kind) => ({
      kind,
      items: diagnostic.evidence.filter((e) => e.kind === kind),
    }))
    .filter((g) => g.items.length > 0);
}

export interface CodePeek {
  file: string;
  startLine: number;
  lines: { line: number; text: string }[];
}

/**
 * Returns ~5 lines around the given line for a hover peek.
 */
export function peekFile(file: string, line: number, radius = 2): CodePeek {
  const source = getSourceForFile(file).split('\n');
  const startLine = Math.max(1, line - radius);
  const endLine = Math.min(source.length, line + radius);
  const lines: { line: number; text: string }[] = [];
  for (let i = startLine; i <= endLine; i += 1) {
    lines.push({ line: i, text: source[i - 1] ?? '' });
  }
  return { file, startLine, lines };
}

export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}

export function jumpTabId(file: string): string {
  return `tab-${file}`;
}
