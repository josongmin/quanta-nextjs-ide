/**
 * Code-graph entity: combines static AST analysis with Probe runtime data.
 *
 * Two halves of the truth:
 *  - **AST**: which files declare `'use client'` / `'use server'`
 *    (regex-lite analyzer over the corpus).
 *  - **Probe**: which modules the runtime actually shipped to the client
 *    (RSC stream → analyzeClientModules).
 *
 * Combining them yields **ground truth** instead of either half's heuristic.
 */

export type {
  DirectiveFinding,
  DirectiveInputFile,
  DirectiveKind,
  DirectiveReport,
} from '@shared/analyzer/use-client-lite';
export {
  analyzeDirectives,
  detectDirective,
  detectExports,
} from '@shared/analyzer/use-client-lite';

export type { CodeGraph, GroundTruthClientModule } from './model/code-graph';
export { buildCodeGraph } from './model/code-graph';
export { useCodeGraphStore } from './model/code-graph.store';
