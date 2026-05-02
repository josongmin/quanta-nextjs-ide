/**
 * Phase 17 — Gutter Cause Glyphs.
 *
 * A "cause glyph" is a 1-3px vertical bar painted in Monaco's glyphMargin for
 * lines that carry Next.js semantic weight. Unlike diagnostics, glyphs aren't
 * problems — they're causal markers that explain WHY a route behaves the way
 * it does (dynamic, leaks, secrets, etc.).
 */

/**
 * Five canonical kinds. Color-coded so eyes triage at a glance.
 *
 *   static-safe      — green   — positive caching signal (e.g. `revalidate` const).
 *   dynamic-trigger  — orange  — `cookies()`/`headers()`/`searchParams`/`force-dynamic`.
 *   cache-mutation   — blue    — `revalidateTag`/`revalidatePath`/`cacheTag`.
 *   client-leak-source — pink  — server-only import inside a `'use client'` file.
 *   secret-flow      — red     — `process.env.SECRET_*` taint source.
 */
export type CauseKind =
  | 'static-safe'
  | 'dynamic-trigger'
  | 'cache-mutation'
  | 'client-leak-source'
  | 'secret-flow';

export type GlyphSeverity = 'info' | 'warn' | 'err';

export type GlyphConfidence = 'high' | 'medium' | 'low';

export interface CauseGlyph {
  /** 1-based line number in the open file. */
  line: number;
  kind: CauseKind;
  /** One-sentence explanation shown in the Monaco hover. */
  message: string;
  /** Optional code snippet or evidence label for the hover. */
  evidence?: string;
  severity: GlyphSeverity;
  confidence: GlyphConfidence;
  /** Stable identity used for suppression, animations, and dedupe. */
  id: string;
}

export interface DetectorStores {
  /** Diagnostic store findings, used as a heuristic fallback. */
  diagnostics?: ReadonlyArray<{
    location?: { file: string; line: number };
    severity?: GlyphSeverity;
    category?: string;
    title?: string;
    message?: string;
  }>;
}
