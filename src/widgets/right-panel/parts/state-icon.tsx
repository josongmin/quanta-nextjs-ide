import { cn } from '@shared/lib/cn';

export type IconState = 'ok' | 'missing' | 'partial' | 'unknown' | 'warn';

interface Props {
  state: IconState;
  className?: string;
}

/**
 * Single-character status glyph used in checklists and rows.
 * ok=✓ green, missing=✗ red, partial=◐ amber, unknown=· gray, warn=⚠ amber.
 */
export function StateIcon({ state, className }: Props) {
  const glyph: Record<IconState, string> = {
    ok: '✓',
    missing: '✗',
    partial: '◐',
    unknown: '·',
    warn: '⚠',
  };
  const tone: Record<IconState, string> = {
    ok: 'text-sem-static',
    missing: 'text-sev-err',
    partial: 'text-sev-warn',
    unknown: 'text-ink-3',
    warn: 'text-sev-warn',
  };
  return (
    <span
      role="img"
      aria-label={`state ${state}`}
      className={cn(
        'inline-flex h-4 w-4 select-none items-center justify-center text-sm leading-none',
        tone[state],
        className,
      )}
    >
      {glyph[state]}
    </span>
  );
}
