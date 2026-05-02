/**
 * Phase 18 — Active governed flow store.
 *
 * One flow at a time. The active flow is rebuilt every time the user
 * starts a new request; the previous flow is replaced (no history yet —
 * see TODOs at the end of integration.ts).
 *
 * Subscribers in the panel re-render on every stage transition.
 */

import { create } from 'zustand';
import type { GovernedFlow, ObligationSuppression } from './types';
import { markShipped, recordToolCall, startApply } from './orchestrator';
import type { ToolCallView } from './types';

interface State {
  /** Currently displayed flow, or null when the panel is empty. */
  flow: GovernedFlow | null;
  /** True while the orchestrator is mid-run. */
  isRunning: boolean;
  /** True after the user clicked "Apply with proof". */
  isApplying: boolean;
  /** Filled when the orchestrator throws. */
  errorMessage: string | null;

  setFlow(flow: GovernedFlow | null): void;
  setRunning(v: boolean): void;
  setApplying(v: boolean): void;
  setError(message: string | null): void;
  appendToolCall(stage: GovernedFlow['stages'][number]['stage'], call: ToolCallView): void;
  beginApply(): void;
  finishShipping(): void;
  suppressObligation(obligationId: string, suppression: ObligationSuppression): void;
  reset(): void;
}

export const useGovernedFlowStore = create<State>((set) => ({
  flow: null,
  isRunning: false,
  isApplying: false,
  errorMessage: null,
  setFlow: (flow) => set({ flow }),
  setRunning: (v) => set({ isRunning: v }),
  setApplying: (v) => set({ isApplying: v }),
  setError: (message) => set({ errorMessage: message }),
  appendToolCall: (stage, call) =>
    set((s) => (s.flow ? { flow: recordToolCall(s.flow, stage, call) } : s)),
  beginApply: () =>
    set((s) => (s.flow ? { flow: startApply(s.flow), isApplying: true } : s)),
  finishShipping: () =>
    set((s) =>
      s.flow ? { flow: markShipped(s.flow), isApplying: false } : s,
    ),
  suppressObligation: (obligationId, suppression) =>
    set((s) => {
      if (!s.flow) return s;
      const obligations = s.flow.obligations.map((o) =>
        o.check.obligation.id === obligationId
          ? { ...o, suppressed: suppression }
          : o,
      );
      return { flow: { ...s.flow, obligations } };
    }),
  reset: () =>
    set({
      flow: null,
      isRunning: false,
      isApplying: false,
      errorMessage: null,
    }),
}));
