import { z } from 'zod';

/**
 * Canonical symbol-kind union across the workspace.
 *
 * Aggregates the kinds used by every feature that talks about source-level
 * symbols (peek-definition, go-to-symbol, symbol-popularity, type-flow, ...).
 * Both the long-form ('function') and short-form ('fn') exist because
 * different feature surfaces render them differently.
 *
 * Features may narrow this with `Extract<CodeSymbolKind, 'fn' | 'type' | ...>`
 * when they only care about a subset.
 */
export const codeSymbolKindZ = z.enum([
  'function',
  'fn',
  'class',
  'interface',
  'type',
  'const',
  'component',
  'hook',
  'prop',
]);

export type CodeSymbolKind = z.infer<typeof codeSymbolKindZ>;

/** Canonical, minimal source-symbol shape. Features extend this. */
export const codeSymbolZ = z.object({
  id: z.string(),
  name: z.string(),
  kind: codeSymbolKindZ,
  file: z.string(),
  line: z.number().int().nonnegative(),
  signature: z.string().optional(),
  deprecated: z
    .object({ replacement: z.string().optional() })
    .or(z.boolean())
    .optional(),
  since: z.string().optional(),
});

export type CodeSymbol = z.infer<typeof codeSymbolZ>;

/** A reference to a symbol from another file (import / call-site / usage). */
export const symbolReferenceZ = z.object({
  symbolId: z.string(),
  file: z.string(),
  line: z.number().int().nonnegative(),
  preview: z.string().optional(),
});

export type SymbolReference = z.infer<typeof symbolReferenceZ>;
