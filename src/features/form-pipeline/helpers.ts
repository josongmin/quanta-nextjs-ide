// Shape types live in `shared/types`; mock data lives in `shared/mocks`.
// This helper re-exports them and adds feature-local query helpers.
export type { FormStageKind, FormStage, FormFlow } from '@shared/types';

import type { FormFlow } from '@shared/types';
import { mockFormFlows } from '@shared/mocks/forms';

export const forms: ReadonlyArray<FormFlow> = mockFormFlows;

export function findForm(formId?: string): FormFlow {
  if (formId) {
    const f = forms.find((x) => x.id === formId);
    if (f) return f;
  }
  return forms[0] as FormFlow;
}

export function countIssues(flow: FormFlow): number {
  return flow.stages.reduce((acc, s) => acc + s.warnings.length, 0);
}

export function totalIssues(): number {
  return forms.reduce((acc, f) => acc + countIssues(f), 0);
}
