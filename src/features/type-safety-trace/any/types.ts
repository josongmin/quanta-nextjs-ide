/**
 * Any Leakage detector types — spec #21.
 */

import type { SymbolRef, SeverityLevel } from '../types';

export type AnySourceKind =
  | 'json-parse'
  | 'untyped-lib'
  | 'as-any'
  | 'implicit'
  | 'untyped-api';

export interface AnyLeak {
  /** Where the `any` enters the program. */
  sourceLocation: SymbolRef;
  /** Why this is `any`. */
  sourceKind: AnySourceKind;
  /** Identifiers that inherit `any` downstream. */
  propagation: ReadonlyArray<SymbolRef>;
  /** Heuristic severity. */
  severity: SeverityLevel;
  /** Short description rendered in the panel + hover. */
  message: string;
}
