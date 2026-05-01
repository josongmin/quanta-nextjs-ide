// Shape types live in `shared/types`; mock data lives in `shared/mocks`.
// This helper re-exports them and adds feature-local query helpers.
export type {
  AuthHopKind,
  AuthHop,
  CookieFlags,
  AuthFlow,
} from '@shared/types';

import type { AuthFlow } from '@shared/types';
import { mockAuthFlows } from '@shared/mocks/auth-flow';

export const flows: ReadonlyArray<AuthFlow> = mockAuthFlows;

export function findFlow(routeId?: string): AuthFlow {
  if (routeId) {
    const found = flows.find((f) => f.routeId === routeId);
    if (found) return found;
  }
  // flows is a non-empty literal; assert via tuple read.
  const head = flows[0] as AuthFlow;
  return head;
}
