/**
 * Streaming-visualizer shape types.
 *
 * Lives in `shared/types` so the `streaming-visualizer` feature and the
 * `shared/mocks/runtime.ts` mock data can both reference these without
 * a shared-to-feature import.
 *
 * Note: this `RscChunk` is the *streaming visualizer* notion of a chunk
 * (componentName / startMs / endMs). It is distinct from the
 * `RscChunk` exported by `entities/rsc-payload`, which models a parsed
 * RSC wire-format line.
 */

export interface StreamingRscChunk {
  id: string;
  componentName: string;
  startMs: number;
  endMs: number;
  bytes: number;
  pendingFallback?: string;
  parentId?: string;
}

export interface StreamingTrace {
  routeId: string;
  chunks: StreamingRscChunk[];
  htmlMs: number;
}
