/**
 * Unsafe Cast Trace types — spec #22.
 */

import type { SymbolRef, SeverityLevel } from '../types';

export type UnsafeCastKind = 'as-any' | 'double-assert' | 'non-null' | 'unknown-cast';

export interface UnsafeCast {
  kind: UnsafeCastKind;
  /** Cast site (the `as` / `!` / chain). */
  location: SymbolRef;
  /** Original type expression (best-effort). */
  fromType: string;
  /** Target type expression. */
  toType: string;
  /** Symbols that consume the casted value. */
  downstream: ReadonlyArray<SymbolRef>;
  /** Heuristic severity — graded by `severity.ts`. */
  severity: SeverityLevel;
  /** Was the casted value crossing a server/client boundary? */
  crossesBoundary?: boolean;
  /** Was this in a critical flow (consumed via @features/critical-flow)? */
  inCriticalFlow?: boolean;
}
