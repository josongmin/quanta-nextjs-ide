import { mockStreamingTraces } from '@shared/mocks/runtime';
import type { StreamingRscChunk, StreamingTrace } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/streaming-visualizer/helpers` consumers keep working.
// `RscChunk` is the historical name; aliasing `StreamingRscChunk` preserves
// it without colliding with the entity's `RscChunk` (parsed wire-format).
export type { StreamingTrace } from '@shared/types';
export type RscChunk = StreamingRscChunk;

export const traces: ReadonlyArray<StreamingTrace> = mockStreamingTraces;

export function traceFor(routeId: string): StreamingTrace | undefined {
  return traces.find((t) => t.routeId === routeId);
}

export function totalMs(trace: StreamingTrace): number {
  return Math.max(trace.htmlMs, ...trace.chunks.map((c) => c.endMs));
}

export function colorForGroup(parentId: string | undefined): string {
  if (!parentId) return '#3b82f6'; // blue
  // hash to one of palette
  let h = 0;
  for (let i = 0; i < parentId.length; i += 1) h = (h * 31 + parentId.charCodeAt(i)) >>> 0;
  const palette = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
  return palette[h % palette.length] ?? '#3b82f6';
}
