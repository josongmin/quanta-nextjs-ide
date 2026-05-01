/**
 * Build Monaco decorations for an array of AnyLeaks.
 *
 * - Gutter dot at every leak source (severity-coloured)
 * - On hover: chip that says "any starts here → spreads to N places"
 *
 * The decoration array is consumed by `useTypeSafetyEditorIntegration`,
 * which applies it via `editor-decorations.applyDecorations`.
 */

import type { TypeSafetyDecoration } from '../editor-decorations';
import { SOURCE_LABEL } from './sources';
import type { AnyLeak } from './types';

function severityToTone(s: AnyLeak['severity']): TypeSafetyDecoration['severity'] {
  if (s === 'critical' || s === 'high') return 'err';
  if (s === 'medium') return 'warn';
  return 'info';
}

export function decorationsForFile(
  file: string,
  leaks: ReadonlyArray<AnyLeak>,
): TypeSafetyDecoration[] {
  return leaks
    .filter((l) => l.sourceLocation.file === file)
    .map((l) => {
      const tone = severityToTone(l.severity);
      const md = [
        `**any leak** — ${SOURCE_LABEL[l.sourceKind]}`,
        '',
        l.message,
        '',
        `Spreads to **${l.propagation.length}** symbol${l.propagation.length === 1 ? '' : 's'}.`,
      ].join('\n');
      return {
        range: {
          startLine: l.sourceLocation.line,
          startColumn: l.sourceLocation.column,
          endLine: l.sourceLocation.line,
          endColumn: l.sourceLocation.column + Math.max(1, l.sourceLocation.name.length),
        },
        kind: 'gutter-dot' as const,
        severity: tone,
        hoverMarkdown: md,
      };
    });
}
