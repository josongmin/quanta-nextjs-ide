/**
 * Phase 6 — One-click Fullstack Trace (36-2).
 */

import type { Severity } from '@shared/types';

export type TraceNodeKind =
  | 'layout'
  | 'page'
  | 'middleware'
  | 'server-action'
  | 'route-handler'
  | 'fetch'
  | 'db'
  | 'cache-read'
  | 'cache-write'
  | 'revalidate'
  | 'redirect'
  | 'test';

export type TraceRiskLevel = 'low' | 'medium' | 'high';

export interface TraceNode {
  /** Stable id within a single trace. */
  id: string;
  kind: TraceNodeKind;
  /** Display label — e.g. function name, fetch URL, table name. */
  label: string;
  /** File reference for click-to-jump. */
  file?: string;
  /** 1-based line. */
  line?: number;
  /** Brief secondary line — fetch policy, route id, etc. */
  detail?: string;
  /** Computed risk for the row. */
  risk: TraceRiskLevel;
  /** Diagnostics-derived severity (used to color the connector). */
  severity?: Severity;
  /** Optional badges shown next to the label. */
  badges?: string[];
  /** Tests covering this node. */
  tests?: Array<{ file: string; line: number; status: 'pass' | 'fail' | 'flaky' | 'unknown' }>;
}
