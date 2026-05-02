/**
 * Phase 13 — unified Type Safety Trace store.
 *
 * Single zustand store with four sub-slices (props / any / cast / cost) so
 * each panel can subscribe to just the slice it needs without re-rendering
 * on unrelated changes.
 */

import { create } from 'zustand';
import type { PropOrigin } from './props/types';
import type { AnyLeak } from './any/types';
import type { UnsafeCast } from './cast/types';

export interface ImportCostFinding {
  /** Workspace-relative file. */
  file: string;
  /** 1-based line of the `import` statement. */
  line: number;
  /** Module specifier, e.g. `"lodash"`. */
  module: string;
  /** Bytes (gzipped). */
  sizeGzip: number;
  /** Routes the cost lands on. */
  routes: ReadonlyArray<string>;
  /** Threshold band for badge colour. */
  band: 'small' | 'medium' | 'large';
  /** Tree-shaken alternative suggestion, when known. */
  alternative?: string;
}

export interface PropsSlice {
  origins: ReadonlyArray<PropOrigin>;
  /** Currently selected JSX attribute (file:line:column key). */
  selected: string | null;
  set(origins: ReadonlyArray<PropOrigin>): void;
  select(key: string | null): void;
  clear(): void;
}

export interface AnySlice {
  leaks: ReadonlyArray<AnyLeak>;
  set(leaks: ReadonlyArray<AnyLeak>): void;
  clear(): void;
}

export interface CastSlice {
  casts: ReadonlyArray<UnsafeCast>;
  set(casts: ReadonlyArray<UnsafeCast>): void;
  clear(): void;
}

export interface CostSlice {
  imports: ReadonlyArray<ImportCostFinding>;
  set(imports: ReadonlyArray<ImportCostFinding>): void;
  clear(): void;
}

export interface TypeSafetyState {
  props: PropsSlice;
  any: AnySlice;
  cast: CastSlice;
  cost: CostSlice;
  /** 0–100 composite score derived from the four slices. */
  score(): number;
  /** Reset every slice. */
  resetAll(): void;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export const useTypeSafetyStore = create<TypeSafetyState>((set, get) => ({
  props: {
    origins: [],
    selected: null,
    set: (origins) =>
      set((s) => ({ props: { ...s.props, origins } })),
    select: (selected) =>
      set((s) => ({ props: { ...s.props, selected } })),
    clear: () =>
      set((s) => ({ props: { ...s.props, origins: [], selected: null } })),
  },
  any: {
    leaks: [],
    set: (leaks) => set((s) => ({ any: { ...s.any, leaks } })),
    clear: () => set((s) => ({ any: { ...s.any, leaks: [] } })),
  },
  cast: {
    casts: [],
    set: (casts) => set((s) => ({ cast: { ...s.cast, casts } })),
    clear: () => set((s) => ({ cast: { ...s.cast, casts: [] } })),
  },
  cost: {
    imports: [],
    set: (imports) => set((s) => ({ cost: { ...s.cost, imports } })),
    clear: () => set((s) => ({ cost: { ...s.cost, imports: [] } })),
  },
  score() {
    const s = get();
    // Each slice contributes a deduction. Heuristic; tune later.
    const propsRisk = s.props.origins.filter(
      (o) => o.serializationRisk === 'unsafe',
    ).length;
    const anyRisk = s.any.leaks.length;
    const castRisk = s.cast.casts.filter(
      (c) => c.severity === 'high' || c.severity === 'critical',
    ).length;
    const costRisk = s.cost.imports.filter((i) => i.band === 'large').length;
    const deduction = propsRisk * 8 + anyRisk * 4 + castRisk * 6 + costRisk * 3;
    return clamp(100 - deduction);
  },
  resetAll() {
    set((s) => ({
      props: { ...s.props, origins: [], selected: null },
      any: { ...s.any, leaks: [] },
      cast: { ...s.cast, casts: [] },
      cost: { ...s.cost, imports: [] },
    }));
  },
}));
