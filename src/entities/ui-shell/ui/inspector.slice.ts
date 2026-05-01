import type { StateCreator } from 'zustand';
import type { InspectorContext } from './types';

export interface InspectorSlice {
  inspectorContext: InspectorContext;
  inspectorPinned: boolean;
  setInspectorContext(c: InspectorContext): void;
  toggleInspectorPinned(): void;
}

export const createInspectorSlice: StateCreator<
  InspectorSlice,
  [],
  [],
  InspectorSlice
> = (set) => ({
  inspectorContext: { kind: 'route', routeId: 'route_products_id' },
  inspectorPinned: false,
  setInspectorContext: (c) =>
    set((s) => (s.inspectorPinned ? s : { inspectorContext: c })),
  toggleInspectorPinned: () =>
    set((s) => ({ inspectorPinned: !s.inspectorPinned })),
});
