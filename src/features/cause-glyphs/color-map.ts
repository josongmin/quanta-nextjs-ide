import type { CauseKind } from './types';

/**
 * Maps each cause kind to a CSS variable + a small icon character that
 * appears as a `::after` overlay when the gutter is wide enough.
 */
export const KIND_TO_VAR: Record<CauseKind, string> = {
  'static-safe': '--sem-static',
  'dynamic-trigger': '--sem-dynamic',
  'cache-mutation': '--accent',
  'client-leak-source': '--sem-client',
  'secret-flow': '--err',
};

export const KIND_TO_ICON: Record<CauseKind, string> = {
  'static-safe': '✓', // ✓
  'dynamic-trigger': '⚡', // ⚡
  'cache-mutation': '↻', // ↻
  'client-leak-source': '⮧', // ⮧-ish
  'secret-flow': '⚠', // ⚠
};

export const KIND_TO_LABEL: Record<CauseKind, string> = {
  'static-safe': 'Static-safe',
  'dynamic-trigger': 'Dynamic trigger',
  'cache-mutation': 'Cache mutation',
  'client-leak-source': 'Client leak source',
  'secret-flow': 'Secret flow',
};

export const KIND_TO_DESCRIPTION: Record<CauseKind, string> = {
  'static-safe': 'Positive caching signal — strengthens ISR/SSG.',
  'dynamic-trigger': 'Forces this route to render dynamically per-request.',
  'cache-mutation': 'Mutates Next.js cache; pair with `revalidateTag`/`revalidatePath`.',
  'client-leak-source': "Server-only module imported into a 'use client' file.",
  'secret-flow': 'Sensitive `process.env.*` value flows through this line.',
};

export const ALL_KINDS: ReadonlyArray<CauseKind> = [
  'static-safe',
  'dynamic-trigger',
  'cache-mutation',
  'client-leak-source',
  'secret-flow',
];

export function classFor(kind: CauseKind): string {
  return `cg-glyph cg-glyph--${kind}`;
}
