/**
 * Enrich resolved frames with project context the IDE already knows about.
 *
 * For each frame we surface:
 *   - **route**: which Next route's files contain this path (page/layout/etc.)
 *   - **diagnostics**: recent unmuted diagnostics on the same file
 *   - **tests**: test files that depend on this source file
 *
 * This is pure: the inputs are passed in (we don't reach into stores here)
 * so the enricher is testable and so the UI can swap fixtures freely.
 */

import type { Diagnostic, Route } from '@shared/types';
import type { ResolvedFrame } from './sourcemap';

export interface TestCoverageInput {
  /** Test file path. */
  file: string;
  /** Source files this test directly depends on. */
  deps: ReadonlyArray<string>;
  name?: string;
}

export interface EnrichedFrame extends ResolvedFrame {
  fn?: string;
  synthetic: boolean;
  routeId?: string;
  routePath?: string;
  diagnosticIds: ReadonlyArray<string>;
  testFiles: ReadonlyArray<string>;
}

function fileMatchesRoute(file: string, route: Route): boolean {
  const f = route.files;
  return Boolean(
    (f.page && file.endsWith(f.page)) ||
      (f.layout && file.endsWith(f.layout)) ||
      (f.loading && file.endsWith(f.loading)) ||
      (f.error && file.endsWith(f.error)) ||
      (f.notFound && file.endsWith(f.notFound)) ||
      (f.default && file.endsWith(f.default)) ||
      (f.template && file.endsWith(f.template)),
  );
}

/** Strip leading `./` and any drive prefix to get a stable suffix. */
function tail(p: string): string {
  return p.replace(/^\.\//, '').replace(/^[A-Za-z]:\\/, '').replace(/\\/g, '/');
}

/** Fuzzy file equality: either is a tail-suffix of the other. */
function sameFile(a: string, b: string): boolean {
  const ta = tail(a);
  const tb = tail(b);
  if (ta === tb) return true;
  if (ta.endsWith('/' + tb) || tb.endsWith('/' + ta)) return true;
  return false;
}

export interface EnrichInputs {
  routes: ReadonlyArray<Route>;
  diagnostics: ReadonlyArray<Diagnostic>;
  tests: ReadonlyArray<TestCoverageInput>;
}

export function enrichFrame(
  frame: ResolvedFrame & { fn?: string; synthetic: boolean },
  inputs: EnrichInputs,
): EnrichedFrame {
  const matchedRoute = inputs.routes.find((r) => fileMatchesRoute(frame.file, r));
  const diagnosticIds = inputs.diagnostics
    .filter((d) => sameFile(d.location.file, frame.file))
    .map((d) => d.id);
  const testFiles = inputs.tests
    .filter((t) => t.deps.some((dep) => sameFile(dep, frame.file)))
    .map((t) => t.file);

  const result: EnrichedFrame = {
    file: frame.file,
    line: frame.line,
    mapped: frame.mapped,
    synthetic: frame.synthetic,
    diagnosticIds,
    testFiles,
  };
  if (frame.column !== undefined) result.column = frame.column;
  if (frame.symbol !== undefined) result.symbol = frame.symbol;
  if (frame.fn !== undefined) result.fn = frame.fn;
  if (matchedRoute) {
    result.routeId = matchedRoute.id;
    result.routePath = matchedRoute.path;
  }
  return result;
}
