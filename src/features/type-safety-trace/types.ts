/**
 * Phase 13 — Type Safety Trace shared types.
 *
 * These are the cross-feature primitives consumed by Props Origin (#20),
 * Any Leakage (#21), Unsafe Cast (#22), and Import Cost Hover (#23).
 *
 * The shapes are intentionally additive and serializable so they can flow
 * into the unified store + zustand slices without coupling the panels to
 * their producers.
 */

export interface SymbolRef {
  /** Logical file path (workspace-relative when possible). */
  file: string;
  /** 1-based line. */
  line: number;
  /** 1-based column. */
  column: number;
  /** Display name of the symbol or expression text. */
  name: string;
  /** Optional ts-morph kind label. */
  kind?: string;
}

/** A directional edge in a type-flow graph (e.g. parent -> child). */
export interface FlowEdge {
  from: SymbolRef;
  to: SymbolRef;
  /** Why these two are connected. */
  via?: 'jsx-attr' | 'parameter' | 'return' | 'assignment' | 'spread' | 'destructure' | 'import';
}

export interface TypeFlow {
  origin: SymbolRef;
  edges: ReadonlyArray<FlowEdge>;
  /** All symbols visited along the way. */
  visited: ReadonlyArray<SymbolRef>;
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RangeRef {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
