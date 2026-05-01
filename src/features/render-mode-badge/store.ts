/**
 * Cache for resolved render modes keyed by route path.  The resolver itself
 * is cheap, but we want stable references across renders so React doesn't
 * recompute the why-card every keystroke in another panel.
 */

import { create } from 'zustand';
import { findMode, MOCK_RESOLVED, resolveMode } from './resolver';
import type { ResolvedMode, ModeSignal } from './types';

interface RenderModeState {
  resolved: Record<string, ResolvedMode>;
  /** Look up (or compute) the mode for a route. */
  get(route: string): ResolvedMode | undefined;
  /** Re-run the resolver for a route given fresh signals. */
  refresh(route: string, signals: ReadonlyArray<ModeSignal>): ResolvedMode;
}

const initialResolved = Object.fromEntries(
  MOCK_RESOLVED.map((r) => [r.route, r] as const),
) as Record<string, ResolvedMode>;

export const useRenderModeStore = create<RenderModeState>((set, get) => ({
  resolved: initialResolved,
  get: (route) => get().resolved[route] ?? findMode(route),
  refresh: (route, signals) => {
    const resolved = resolveMode({ route, signals });
    set((s) => ({ resolved: { ...s.resolved, [route]: resolved } }));
    return resolved;
  },
}));
