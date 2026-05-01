/**
 * Taint / dataflow solver types.
 *
 * The MVP solver tracks symbolic flow from a small set of sources
 * (e.g. process.env.SECRET_X) to a small set of sinks (e.g. props
 * passed to a 'use client' component). Witnesses are recorded as a
 * list of TaintEdge values so callers can render the path in the UI.
 *
 * Node references are kept as opaque structural records (file + range)
 * to avoid leaking ts-morph internals across module boundaries.
 */

export type TaintSourceKind =
  | 'env-secret'
  | 'db-row'
  | 'session'
  | 'request-headers';

export type TaintSinkKind =
  | 'client-component-prop'
  | 'serialized-response'
  | 'log'
  | 'fetch-body';

export type TaintEdgeKind =
  | 'assignment'
  | 'call-arg'
  | 'return'
  | 'destructure'
  | 'spread'
  | 'jsx-prop';

export type TaintConfidence = 'high' | 'medium' | 'low';

/** Lightweight, serialisable reference to a node in source. */
export interface TaintNodeRef {
  /** Workspace-relative file path. */
  file: string;
  /** 1-based line. */
  line: number;
  /** 1-based column. */
  column?: number;
  /** Kind of AST node, for display only (e.g. 'Identifier', 'PropertyAccessExpression'). */
  syntaxKind?: string;
}

export interface TaintSource {
  kind: TaintSourceKind;
  node: TaintNodeRef;
  file: string;
  /** The originating expression text, e.g. `process.env.STRIPE_SECRET_KEY`. */
  expr: string;
}

export interface TaintSink {
  kind: TaintSinkKind;
  node: TaintNodeRef;
  file: string;
  /** The expression text being fed into the sink. */
  expr: string;
  /**
   * Sink-kind-specific metadata. For 'client-component-prop' this is the
   * client component file path and prop name. Optional and best-effort.
   */
  meta?: Record<string, string>;
}

export interface TaintEdge {
  from: TaintNodeRef;
  to: TaintNodeRef;
  kind: TaintEdgeKind;
  /** Human readable explanation, e.g. `assigned to local "secret"`. */
  note?: string;
}

export interface TaintPath {
  source: TaintSource;
  sink: TaintSink;
  edges: TaintEdge[];
  confidence: TaintConfidence;
}
