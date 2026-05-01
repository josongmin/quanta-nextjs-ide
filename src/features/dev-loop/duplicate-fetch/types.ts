/**
 * Duplicate Fetch Detector — types.
 *
 * A FetchCall is the normalized representation of a `fetch(...)` invocation
 * captured either at static-analysis time (AST) or at runtime via the
 * request-waterfall snapshot.
 */

export type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

/** Cache directives that materially change identity for deduplication. */
export interface FetchCacheOptions {
  /** Next.js fetch cache mode. */
  cache?: 'force-cache' | 'no-store' | 'default';
  /** Next.js revalidate seconds. */
  revalidate?: number | false;
  /** Next.js tags for revalidation (sorted). */
  tags?: ReadonlyArray<string>;
}

export interface FetchCall {
  /** Stable id assigned by the detector. */
  id: string;
  /** Source file (relative to workspace root). */
  file: string;
  /** Line number in source where the fetch() call lives. */
  line: number;
  /** HTTP method (default GET). */
  method: FetchMethod;
  /** URL string (literal or normalized template). */
  url: string;
  /** Cache options that affect identity. */
  cache: FetchCacheOptions;
  /** Route the fetch belongs to (best-effort). */
  routeId?: string;
}

export interface DuplicateGroup {
  /** Stable cache key identifying this group. */
  key: string;
  /** All calls that share this key. */
  calls: ReadonlyArray<FetchCall>;
  /** Distinct files calling this URL+options. */
  callerCount: number;
  /** Suggested hoist target file (closest common ancestor by path). */
  suggestedLoader: string;
  /** Severity heuristic. */
  severity: 'info' | 'warn' | 'err';
}
