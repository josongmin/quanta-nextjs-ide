/**
 * Safe Refactor wizard store.
 */

import { create } from 'zustand';
import type { AdmissionVerdict } from '@entities/evidence';
import type {
  ExecutionResult,
  RefactorPlan,
  SafeRefactorState,
  WizardStep,
} from './types';

interface SafeRefactorStore extends SafeRefactorState {
  setStep(step: WizardStep): void;
  setPlan(plan: RefactorPlan | null): void;
  setVerdict(verdict: AdmissionVerdict | null): void;
  setExecuting(executing: boolean): void;
  setResult(result: ExecutionResult | null): void;
  reset(): void;
}

export const useSafeRefactorStore = create<SafeRefactorStore>()((set) => ({
  plan: null,
  verdict: null,
  step: 'pick-op',
  executing: false,
  result: null,
  setStep: (step) => set({ step }),
  setPlan: (plan) => set({ plan }),
  setVerdict: (verdict) => set({ verdict }),
  setExecuting: (executing) => set({ executing }),
  setResult: (result) => set({ result }),
  reset: () => set({
    plan: null,
    verdict: null,
    step: 'pick-op',
    executing: false,
    result: null,
  }),
}));
