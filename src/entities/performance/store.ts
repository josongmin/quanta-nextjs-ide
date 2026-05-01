import { create } from 'zustand';
import type { BundleNode, PerfBudget, RouteVitals, WebVitalsScore } from '@shared/types';
import { flattenBundle, mockBundleRoot } from '@shared/mocks/bundle';
import { mockRouteVitals } from '@shared/mocks/web-vitals';
import { mockPerfBudgets } from '@shared/mocks/perf-budget';

export type BundleSideFilter = 'client' | 'server' | 'shared';
export type BundleUnit = 'gzip' | 'raw';
export type VitalMetric = keyof WebVitalsScore;

interface PerformanceStore {
  bundle: BundleNode;
  vitals: RouteVitals[];
  budgets: PerfBudget[];

  selectedNodeId: string | null;
  sideFilter: BundleSideFilter;
  unit: BundleUnit;

  setSelectedNodeId(id: string | null): void;
  setSideFilter(side: BundleSideFilter): void;
  setUnit(unit: BundleUnit): void;

  byRoute(routeId: string): { vitals: RouteVitals | null; budget: PerfBudget | null };
  vitalsForRoute(routeId: string): RouteVitals | null;
  budgetForRoute(routeId: string): PerfBudget | null;
  flatBundle(): BundleNode[];
  heaviestPackages(limit?: number): BundleNode[];
  worstByMetric(metric: VitalMetric, limit?: number): RouteVitals[];
  budgetsViolated(): PerfBudget[];
}

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  bundle: mockBundleRoot,
  vitals: mockRouteVitals,
  budgets: mockPerfBudgets,

  selectedNodeId: null,
  sideFilter: 'client',
  unit: 'gzip',

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSideFilter: (side) => set({ sideFilter: side, selectedNodeId: null }),
  setUnit: (unit) => set({ unit }),

  byRoute: (routeId) => ({
    vitals: get().vitalsForRoute(routeId),
    budget: get().budgetForRoute(routeId),
  }),

  vitalsForRoute: (routeId) =>
    get().vitals.find((v) => v.routeId === routeId) ?? null,

  budgetForRoute: (routeId) =>
    get().budgets.find((b) => b.routeId === routeId) ?? null,

  flatBundle: () => flattenBundle(get().bundle),

  heaviestPackages: (limit = 5) =>
    flattenBundle(get().bundle)
      .filter((n) => n.kind === 'package')
      .sort((a, b) => b.size - a.size)
      .slice(0, limit),

  worstByMetric: (metric, limit = 5) =>
    [...get().vitals]
      .sort((a, b) => b.estimated[metric] - a.estimated[metric])
      .slice(0, limit),

  budgetsViolated: () => get().budgets.filter((b) => b.violations.length > 0),
}));

// Standalone selectors
export const selectVitals = (s: PerformanceStore): RouteVitals[] => s.vitals;
export const selectBudgets = (s: PerformanceStore): PerfBudget[] => s.budgets;
export const selectVitalsForRoute =
  (routeId: string) =>
  (s: PerformanceStore): RouteVitals | null =>
    s.vitals.find((v) => v.routeId === routeId) ?? null;
export const selectBudgetForRoute =
  (routeId: string) =>
  (s: PerformanceStore): PerfBudget | null =>
    s.budgets.find((b) => b.routeId === routeId) ?? null;
export const selectWorstByMetric =
  (metric: VitalMetric, limit = 5) =>
  (s: PerformanceStore): RouteVitals[] =>
    [...s.vitals]
      .sort((a, b) => b.estimated[metric] - a.estimated[metric])
      .slice(0, limit);
export const selectViolatedBudgets = (s: PerformanceStore): PerfBudget[] =>
  s.budgets.filter((b) => b.violations.length > 0);
