/**
 * Phase 6 — Full Context Hover (36-1).
 *
 * Type-only file. The aggregator builds a `SymbolContext` by reading every
 * existing zustand store; the card renders sections from the same shape.
 *
 * Pure data — no zustand, no React. Easy to test and reuse from the AI
 * "Ask the codebase" tool surfaces and the FullstackTrace overlay.
 */

import type { CodeSymbolKind } from '@entities/code-symbol';
import type { Diagnostic, Severity } from '@shared/types';

export interface CodeRef {
  /** Workspace-relative or absolute file path; we render basename + line. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** Optional human-readable label (symbol name, route path, …). */
  label?: string;
  /** Optional secondary string ("imports X", "calls Y", …). */
  detail?: string;
}

export interface ConsumerRef extends CodeRef {
  /** Why does it consume the symbol? */
  via: 'import' | 'call' | 'jsx' | 'reference';
}

export interface RouteRef {
  routeId: string;
  path: string;
  rendering: 'static' | 'isr' | 'dynamic' | 'unknown';
  archetype: string;
}

export interface MutationRef {
  /** Server-action id or handler id. */
  id: string;
  name: string;
  routeId?: string;
  mutates: string[];
}

export interface CacheImpactRef {
  tag: string;
  affectedRouteIds: string[];
  hasInvalidator: boolean;
}

export interface PiiNodeRef extends CodeRef {
  classification: 'pii' | 'secret' | 'safe';
}

export interface TestRef extends CodeRef {
  status: 'pass' | 'fail' | 'flaky' | 'unknown';
}

export interface RiskRef {
  id: string;
  ruleId: string;
  severity: Severity;
  title: string;
  file: string;
  line: number;
  /** True if this is an admission Finding (Phase 5) rather than a Diagnostic. */
  fromAdmission?: boolean;
}

export interface BoundaryRef {
  /** "client" / "server" / "edge". */
  surface: 'client' | 'server' | 'edge' | 'unknown';
  /** Why we believe so — useful as a hover sub-tooltip. */
  reason: string;
}

export interface SymbolContext {
  /** Best-effort name. Falls back to the slice of code under the cursor. */
  name: string;
  kind: CodeSymbolKind | 'unknown';
  file: string;
  line: number;
  /** TypeScript signature when known (from quickInfo). */
  signature?: string;
  /** Documentation string when known. */
  docs?: string;
  consumers: ConsumerRef[];
  routes: RouteRef[];
  mutations: MutationRef[];
  cache: CacheImpactRef[];
  pii: PiiNodeRef[];
  tests: TestRef[];
  risks: RiskRef[];
  boundary: BoundaryRef;
  /** Quick numeric summary for the header strip. */
  counts: {
    consumers: number;
    routes: number;
    mutations: number;
    cache: number;
    pii: number;
    tests: number;
    risks: number;
  };
}

/**
 * Lightweight diagnostic adapter. Lets `aggregator` ingest both a UI
 * Diagnostic and an admission Finding while staying decoupled.
 */
export interface DiagnosticLike
  extends Pick<Diagnostic, 'id' | 'ruleId' | 'severity' | 'title'> {
  location: { file: string; line: number };
  fromAdmission?: boolean;
}
