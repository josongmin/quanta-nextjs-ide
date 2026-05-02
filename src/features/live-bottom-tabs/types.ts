/**
 * Phase 19 — Live, Cache, Trace bottom tabs
 *
 * Shared event + state types used by the dev-server source, the cache-snapshot
 * source, the otel-collector source, and all three tab UIs.
 *
 * The IDE turns into a Next.js telemetry surface: chronologically streamed
 * dev-time events, a live cache-tag tree with TTL countdown, and per-route
 * flame graphs/waterfalls.
 */

export type LiveEventKind =
  | 'rsc-chunk'
  | 'server-action'
  | 'revalidate'
  | 'mutation'
  | 'error';

export interface LiveEventBase {
  /** Unique id for stable list keys; never reused. */
  id: string;
  /** Wall-clock ms when the event was observed. */
  ts: number;
  kind: LiveEventKind;
  /** One-line summary, ready for display. */
  summary: string;
  /** Optional structured detail rendered in the expanded row. */
  detail?: Record<string, string | number | boolean>;
  /** Optional route id / pathname (for filtering / correlation). */
  route?: string;
}

export interface RscChunkEvent extends LiveEventBase {
  kind: 'rsc-chunk';
  bytes: number;
  durationMs: number;
}

export interface ServerActionEvent extends LiveEventBase {
  kind: 'server-action';
  actionName: string;
  durationMs: number;
  status: 'ok' | 'err';
}

export interface RevalidateEvent extends LiveEventBase {
  kind: 'revalidate';
  tag: string;
  routesAffected: number;
}

export interface MutationEvent extends LiveEventBase {
  kind: 'mutation';
  target: string;
}

export interface ErrorEvent extends LiveEventBase {
  kind: 'error';
  message: string;
  where?: string;
}

export type LiveEvent =
  | RscChunkEvent
  | ServerActionEvent
  | RevalidateEvent
  | MutationEvent
  | ErrorEvent;

export type CacheState = 'fresh' | 'stale' | 'revalidating';

/** Synthesized "live" view of one cache tag. */
export interface CacheTagLive {
  /** From useCacheTagStore. */
  id: string;
  /** Tag name (e.g. "product"). */
  name: string;
  state: CacheState;
  /** Wall-clock ms when this entry was last fresh-stamped. */
  freshAt: number;
  /** Configured TTL in ms (synthesized; default 60_000). */
  ttlMs: number;
  /** ms remaining until stale; clamps at 0. */
  remainingMs: number;
  /** When state was last transitioned. */
  changedAt: number;
  /** Recent invalidations against this tag — newest first, capped to 5. */
  recentInvalidations: Array<{ at: number; source: string }>;
}

export interface CacheAggregate {
  total: number;
  fresh: number;
  stale: number;
  revalidating: number;
}

/** Trace+route correlation produced by the otel collector source. */
export interface TraceCorrelation {
  traceId: string;
  /** Inferred route from `http.route` attribute or root span name. */
  route: string | null;
  /** Total trace duration in microseconds. */
  totalUs: number;
  /** Wall-clock ms when this trace was first ingested locally. */
  ingestedAt: number;
}
