import {
  analyzeClientModules,
  type ClientModuleSummary,
  type RscChunk,
} from '@entities/rsc-payload';
import {
  analyzeDirectives,
  type DirectiveFinding,
  type DirectiveInputFile,
} from '@shared/analyzer/use-client-lite';

export interface GroundTruthClientModule {
  /** Probe's chunk id (e.g. "a:"). */
  chunkId: string;
  /** Module path from the I[...] descriptor. */
  modulePath: string;
  /** Best display label (basename or extracted name). */
  label: string;
  /** Bytes of this chunk's wire-format line. */
  sizeBytes: number;
  /** True iff a corresponding `'use client'` directive was found in source. */
  confirmedByAst: boolean;
  /** AST file path that matched (if any). */
  matchedAstFile?: string;
}

export interface CodeGraph {
  /** Static AST findings. */
  directives: ReadonlyArray<DirectiveFinding>;
  /** Probe-detected client modules (raw). */
  probeModules: ReadonlyArray<ClientModuleSummary>;
  /** Joined: every Probe client module annotated with AST confirmation. */
  groundTruth: ReadonlyArray<GroundTruthClientModule>;
  /** AST findings that Probe DID NOT see ship — possibly dead code. */
  declaredButNotShipped: ReadonlyArray<DirectiveFinding>;
  /** Probe modules with no matching AST 'use client' — likely Next internal or 3rd party. */
  shippedButNotDeclared: ReadonlyArray<ClientModuleSummary>;
}

export function buildCodeGraph(
  files: ReadonlyArray<DirectiveInputFile>,
  chunks: ReadonlyArray<RscChunk>,
): CodeGraph {
  const directives = analyzeDirectives(files).findings;
  const probeModules = analyzeClientModules(chunks);

  const useClientFiles = directives.filter((d) => d.kind === 'use-client');

  const groundTruth: GroundTruthClientModule[] = probeModules.map((pm) => {
    const matched = matchProbeModuleToAst(pm.modulePath, useClientFiles);
    return {
      chunkId: pm.id,
      modulePath: pm.modulePath,
      label: pm.label,
      sizeBytes: pm.sizeBytes,
      confirmedByAst: !!matched,
      matchedAstFile: matched?.file,
    };
  });

  const declaredButNotShipped = useClientFiles.filter(
    (d) => !groundTruth.some((g) => g.matchedAstFile === d.file),
  );
  const shippedButNotDeclared = probeModules.filter(
    (pm) => !groundTruth.find((g) => g.chunkId === pm.id)?.confirmedByAst,
  );

  return {
    directives,
    probeModules,
    groundTruth,
    declaredButNotShipped,
    shippedButNotDeclared,
  };
}

/**
 * Heuristic: Probe's modulePath looks like
 *   "(app-pages-browser)/./app/island/Counter.tsx"
 * The fixture file is "app/island/Counter.tsx".
 * We strip Next-emitted prefixes and try to suffix-match.
 */
function matchProbeModuleToAst(
  probeModulePath: string,
  asts: ReadonlyArray<DirectiveFinding>,
): DirectiveFinding | null {
  // Pull the meaningful tail: drop the "(app-pages-browser)/./" prefix.
  let tail = probeModulePath
    .replace(/^\([^)]+\)\//, '')
    .replace(/^\.\//, '');
  // Strip any leading "node_modules/" prefix — those won't match the corpus.
  if (tail.startsWith('node_modules/')) return null;
  // Try exact match, then suffix match.
  const exact = asts.find((a) => a.file === tail);
  if (exact) return exact;
  const suffix = asts.find((a) => tail.endsWith(a.file));
  return suffix ?? null;
}
