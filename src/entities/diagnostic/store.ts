import { create } from 'zustand';
import type { Confidence, Diagnostic, Severity } from '@shared/types';
import { mockDiagnostics } from '@shared/mocks/diagnostics';
import { mockTypescriptDiagnostics } from '@shared/mocks/diagnostics-typescript';
import { mockReactDiagnostics } from '@shared/mocks/diagnostics-react';
import { mockCssDiagnostics } from '@shared/mocks/diagnostics-css';
import { mockA11yDiagnostics } from '@shared/mocks/diagnostics-a11y';
import { mockPerfDiagnostics } from '@shared/mocks/diagnostics-perf';
import { mockDbDiagnostics } from '@shared/mocks/diagnostics-db';
import { mockFlowDiagnostics } from '@shared/mocks/diagnostics-flow';
import { mockWebDiagnostics } from '@shared/mocks/diagnostics-web';

const allDiagnostics: Diagnostic[] = [
  ...mockDiagnostics,
  ...mockTypescriptDiagnostics,
  ...mockReactDiagnostics,
  ...mockCssDiagnostics,
  ...mockA11yDiagnostics,
  ...mockPerfDiagnostics,
  ...mockDbDiagnostics,
  ...mockFlowDiagnostics,
  ...mockWebDiagnostics,
];

type GroupBy = 'route' | 'rule' | 'severity' | 'file';

interface Filters {
  severity: Set<Severity> | null;
  confidence: Set<Confidence> | null;
  inDiff: boolean;
  autofixOnly: boolean;
}

interface DiagnosticStore {
  diagnostics: Diagnostic[];
  groupBy: GroupBy;
  filters: Filters;
  mutedRuleIds: Set<string>;
  mutedDiagnosticIds: Set<string>;
  ruleSeverityOverrides: Record<string, Severity>;
  selectedDiagnosticIds: Set<string>;
  setGroupBy(g: GroupBy): void;
  toggleSeverity(s: Severity): void;
  toggleConfidence(c: Confidence): void;
  toggleInDiff(): void;
  toggleAutofixOnly(): void;
  muteRule(id: string): void;
  unmuteRule(id: string): void;
  muteDiagnostic(id: string): void;
  unmuteDiagnostic(id: string): void;
  setRuleSeverity(ruleId: string, severity: Severity | null): void;
  toggleSelected(id: string): void;
  selectMany(ids: string[]): void;
  clearSelection(): void;
  byId(id: string): Diagnostic | undefined;
  bySeverity(severity: Severity): Diagnostic[];
  byRule(ruleId: string): Diagnostic[];
  forRoute(routeId: string): Diagnostic[];
  forFile(file: string): Diagnostic[];
  unmuted(): Diagnostic[];
  groupedByRule(): Map<string, Diagnostic[]>;
}

export const useDiagnosticStore = create<DiagnosticStore>((set, get) => ({
  diagnostics: allDiagnostics,
  groupBy: 'route',
  filters: { severity: null, confidence: null, inDiff: false, autofixOnly: false },
  mutedRuleIds: new Set<string>(),
  mutedDiagnosticIds: new Set<string>(),
  ruleSeverityOverrides: {},
  selectedDiagnosticIds: new Set<string>(),
  setGroupBy: (g) => set({ groupBy: g }),
  toggleSeverity: (s) =>
    set((st) => {
      const next = new Set(st.filters.severity ?? []);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return { filters: { ...st.filters, severity: next.size ? next : null } };
    }),
  toggleConfidence: (c) =>
    set((st) => {
      const next = new Set(st.filters.confidence ?? []);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { filters: { ...st.filters, confidence: next.size ? next : null } };
    }),
  toggleInDiff: () =>
    set((st) => ({ filters: { ...st.filters, inDiff: !st.filters.inDiff } })),
  toggleAutofixOnly: () =>
    set((st) => ({
      filters: { ...st.filters, autofixOnly: !st.filters.autofixOnly },
    })),
  muteRule: (id) =>
    set((st) => {
      const next = new Set(st.mutedRuleIds);
      next.add(id);
      return { mutedRuleIds: next };
    }),
  unmuteRule: (id) =>
    set((st) => {
      const next = new Set(st.mutedRuleIds);
      next.delete(id);
      return { mutedRuleIds: next };
    }),
  muteDiagnostic: (id) =>
    set((st) => {
      const next = new Set(st.mutedDiagnosticIds);
      next.add(id);
      return { mutedDiagnosticIds: next };
    }),
  unmuteDiagnostic: (id) =>
    set((st) => {
      const next = new Set(st.mutedDiagnosticIds);
      next.delete(id);
      return { mutedDiagnosticIds: next };
    }),
  setRuleSeverity: (ruleId, severity) =>
    set((st) => {
      const next = { ...st.ruleSeverityOverrides };
      if (severity == null) delete next[ruleId];
      else next[ruleId] = severity;
      return { ruleSeverityOverrides: next };
    }),
  toggleSelected: (id) =>
    set((st) => {
      const next = new Set(st.selectedDiagnosticIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedDiagnosticIds: next };
    }),
  selectMany: (ids) =>
    set(() => ({ selectedDiagnosticIds: new Set(ids) })),
  clearSelection: () => set({ selectedDiagnosticIds: new Set() }),
  byId: (id) => get().diagnostics.find((d) => d.id === id),
  bySeverity: (severity) =>
    get().diagnostics.filter((d) => d.severity === severity),
  byRule: (ruleId) => get().diagnostics.filter((d) => d.ruleId === ruleId),
  forRoute: (routeId) =>
    get().diagnostics.filter((d) => d.routeId === routeId),
  forFile: (file) =>
    get().diagnostics.filter((d) => d.location.file === file),
  unmuted: () => {
    const { diagnostics, mutedRuleIds, mutedDiagnosticIds } = get();
    return diagnostics.filter(
      (d) => !mutedRuleIds.has(d.ruleId) && !mutedDiagnosticIds.has(d.id),
    );
  },
  groupedByRule: () => {
    const out = new Map<string, Diagnostic[]>();
    for (const d of get().diagnostics) {
      const arr = out.get(d.ruleId);
      if (arr) arr.push(d);
      else out.set(d.ruleId, [d]);
    }
    return out;
  },
}));

// Standalone selectors
export const selectDiagnostics = (s: DiagnosticStore): Diagnostic[] =>
  s.diagnostics;
export const selectDiagnosticById =
  (id: string) =>
  (s: DiagnosticStore): Diagnostic | undefined =>
    s.diagnostics.find((d) => d.id === id);
export const selectDiagnosticsBySeverity =
  (severity: Severity) =>
  (s: DiagnosticStore): Diagnostic[] =>
    s.diagnostics.filter((d) => d.severity === severity);
export const selectDiagnosticsByRule =
  (ruleId: string) =>
  (s: DiagnosticStore): Diagnostic[] =>
    s.diagnostics.filter((d) => d.ruleId === ruleId);
export const selectDiagnosticsForRoute =
  (routeId: string) =>
  (s: DiagnosticStore): Diagnostic[] =>
    s.diagnostics.filter((d) => d.routeId === routeId);
export const selectUnmutedDiagnostics = (s: DiagnosticStore): Diagnostic[] =>
  s.diagnostics.filter(
    (d) => !s.mutedRuleIds.has(d.ruleId) && !s.mutedDiagnosticIds.has(d.id),
  );
