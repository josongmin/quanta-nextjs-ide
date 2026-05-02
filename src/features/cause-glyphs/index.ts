/**
 * Phase 17 — Gutter Cause Glyphs.
 *
 * Public surface:
 *   • `useCauseGlyphs(opts)` — hook to mount glyph decorations on a Monaco editor.
 *   • `<CauseGlyphsLegend>`  — floating bottom-right legend with per-kind filter pills.
 *   • `detectCauses(input)`  — pure detector usable in tests / other surfaces.
 */

export { useCauseGlyphs } from './hook';
export type { UseCauseGlyphsOptions, UseCauseGlyphsResult } from './hook';
export { CauseGlyphsLegend } from './panel';
export { detectCauses, tallyByKind } from './detector';
export type { DetectorInput } from './detector';
export type {
  CauseGlyph,
  CauseKind,
  GlyphSeverity,
  GlyphConfidence,
} from './types';
export { ALL_KINDS, KIND_TO_LABEL, KIND_TO_DESCRIPTION } from './color-map';
