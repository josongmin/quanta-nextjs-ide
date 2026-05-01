/**
 * Critical-flow store.
 *
 * Holds:
 *  - the latest auto-detected flows (rebuilt on demand by callers)
 *  - the user's manual tags + strict toggles (persisted to localStorage)
 *
 * Manual tags survive route/action churn because we key them by
 * stable id (`flow_<kind>` for auto, or `manual_<nanoid>` for user-added).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CriticalFlow, CriticalFlowKind } from './types';

const STORAGE_KEY = 'quanta.criticalFlows';

interface PersistedTag {
  id: string;
  kind: CriticalFlowKind;
  label?: string;
  routes: string[];
  actions: string[];
  strict?: boolean;
}

interface CriticalFlowState {
  /** Auto-detected flows (NOT persisted — rebuilt from analyzers). */
  detected: CriticalFlow[];
  /** Manual tags (persisted). */
  manual: PersistedTag[];
  /** Strict overrides keyed by flow id (persisted). */
  strictOverrides: Record<string, boolean>;
  setDetected(flows: CriticalFlow[]): void;
  addManualTag(tag: Omit<PersistedTag, 'id'> & { id?: string }): string;
  removeManualTag(id: string): void;
  toggleStrict(flowId: string): void;
  /** Merged view: detected + manual, with strict overrides applied. */
  all(): CriticalFlow[];
}

function severityFor(kind: CriticalFlowKind): CriticalFlow['severity'] {
  if (kind === 'payment' || kind === 'auth') return 'high';
  return 'medium';
}

export const useCriticalFlowStore = create<CriticalFlowState>()(
  persist(
    (set, get) => ({
      detected: [],
      manual: [],
      strictOverrides: {},
      setDetected: (flows) => set({ detected: flows }),
      addManualTag: (input) => {
        const id =
          input.id ??
          `manual_${Math.random().toString(36).slice(2, 10)}`;
        set((s) => ({
          manual: [
            ...s.manual.filter((t) => t.id !== id),
            {
              id,
              kind: input.kind,
              label: input.label,
              routes: input.routes,
              actions: input.actions,
              strict: input.strict,
            },
          ],
        }));
        return id;
      },
      removeManualTag: (id) =>
        set((s) => ({ manual: s.manual.filter((t) => t.id !== id) })),
      toggleStrict: (flowId) =>
        set((s) => ({
          strictOverrides: {
            ...s.strictOverrides,
            [flowId]: !(s.strictOverrides[flowId] ?? false),
          },
        })),
      all: () => {
        const s = get();
        const detected = s.detected.map((f) => ({
          ...f,
          strict: s.strictOverrides[f.id] ?? f.strict ?? false,
        }));
        const manual: CriticalFlow[] = s.manual.map((t) => ({
          id: t.id,
          kind: t.kind,
          label: t.label ?? `${t.kind} (manual)`,
          routes: t.routes,
          actions: t.actions,
          confidence: 1,
          severity: severityFor(t.kind),
          signals: [
            { source: 'user', matched: 'manual-tag', weight: 1 },
          ],
          manual: true,
          strict: s.strictOverrides[t.id] ?? t.strict ?? false,
        }));
        // Merge: manual entries with the same id as a detected flow override.
        const merged = new Map<string, CriticalFlow>();
        for (const f of detected) merged.set(f.id, f);
        for (const f of manual) merged.set(f.id, f);
        return [...merged.values()];
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        manual: s.manual,
        strictOverrides: s.strictOverrides,
      }),
    },
  ),
);
