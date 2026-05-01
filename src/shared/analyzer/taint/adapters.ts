/**
 * Adapters around external (Phase 1) analyzer exports.
 *
 * The use-client analyzer's public shape may evolve; this file is the only
 * place in the taint module that imports it. If the shape changes we only
 * touch this file rather than the solver itself.
 */

import {
  analyzeUseClientServer,
  type DirectiveFinding,
  type DirectiveInputFile,
} from '../use-client';

export interface ClientComponentInfo {
  /** Workspace-relative path of a file with `'use client'` directive. */
  file: string;
  /** Names of exports declared in this file. */
  exports: ReadonlyArray<string>;
}

export interface ServerComponentInfo {
  file: string;
  /** Files this server component imports (workspace-relative). */
  imports: ReadonlyArray<string>;
}

/**
 * Filter directive findings down to client components.
 */
export function toClientComponents(
  findings: ReadonlyArray<DirectiveFinding>,
): ClientComponentInfo[] {
  return findings
    .filter((f) => f.kind === 'use-client')
    .map((f) => ({ file: f.file, exports: f.exportNames }));
}

/**
 * Convenience: invoke the use-client analyzer over an arbitrary corpus.
 * Wraps it so the solver doesn't import the analyzer directly.
 */
export function analyzeBoundaries(
  files: ReadonlyArray<DirectiveInputFile>,
): { clientComponents: ClientComponentInfo[]; raw: ReadonlyArray<DirectiveFinding> } {
  const report = analyzeUseClientServer(files);
  return {
    clientComponents: toClientComponents(report.findings),
    raw: report.findings,
  };
}

export type { DirectiveInputFile };
