/**
 * Inline chip decorations for unsafe casts.
 *
 * For each cast: render a small "⚠ unsafe cast" pill at the end of the
 * line, severity-tinted. Hover shows the full From → To and downstream
 * count.
 */

import type { TypeSafetyDecoration } from '../editor-decorations';
import type { UnsafeCast } from './types';

const KIND_LABEL: Record<UnsafeCast['kind'], string> = {
  'as-any': 'as any',
  'double-assert': 'double assert',
  'non-null': 'non-null !',
  'unknown-cast': 'as unknown',
};

function tone(s: UnsafeCast['severity']): TypeSafetyDecoration['severity'] {
  if (s === 'critical' || s === 'high') return 'err';
  if (s === 'medium') return 'warn';
  return 'info';
}

export function decorationsForFile(
  file: string,
  casts: ReadonlyArray<UnsafeCast>,
): TypeSafetyDecoration[] {
  return casts
    .filter((c) => c.location.file === file)
    .map((c) => {
      const md = [
        `**unsafe cast** — ${KIND_LABEL[c.kind]}`,
        '',
        `\`${c.fromType}\` → \`${c.toType}\``,
        '',
        `Downstream: **${c.downstream.length}** symbol${c.downstream.length === 1 ? '' : 's'}.`,
      ].join('\n');
      return {
        range: {
          startLine: c.location.line,
          startColumn: c.location.column,
          endLine: c.location.line,
          endColumn: c.location.column + Math.max(1, c.location.name.length),
        },
        kind: 'inline-chip' as const,
        severity: tone(c.severity),
        inlineText: `⚠ ${KIND_LABEL[c.kind]}`,
        hoverMarkdown: md,
      };
    });
}
