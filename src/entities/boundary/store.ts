import { create } from 'zustand';
import type { ClientIsland, EnvVar, LayoutInfo, MiddlewareInfo } from '@shared/types';
import {
  mockClientIslands,
  mockEnvVars,
  mockLayoutInfos,
  mockMiddleware,
} from '@shared/mocks/boundary';

interface BoundaryStore {
  islands: ClientIsland[];
  layouts: LayoutInfo[];
  envVars: EnvVar[];
  middleware: MiddlewareInfo;
  selectedIslandId: string | null;
  selectedLayoutId: string | null;
  setSelectedIsland(id: string | null): void;
  setSelectedLayout(id: string | null): void;
  islandById(id: string): ClientIsland | undefined;
  islandsForRoute(routeId: string): ClientIsland[];
  excessiveIslands(): ClientIsland[];
}

export const useBoundaryStore = create<BoundaryStore>((set, get) => ({
  islands: mockClientIslands,
  layouts: mockLayoutInfos,
  envVars: mockEnvVars,
  middleware: mockMiddleware,
  selectedIslandId: null,
  selectedLayoutId: null,
  setSelectedIsland: (id) => set({ selectedIslandId: id }),
  setSelectedLayout: (id) => set({ selectedLayoutId: id }),
  islandById: (id) => get().islands.find((i) => i.id === id),
  islandsForRoute: (routeId) =>
    get().islands.filter((i) => i.affectedRouteIds.includes(routeId)),
  excessiveIslands: () => get().islands.filter((i) => i.excessive),
}));

// Standalone selectors
export const selectIslands = (s: BoundaryStore): ClientIsland[] => s.islands;
export const selectIslandById =
  (id: string) =>
  (s: BoundaryStore): ClientIsland | undefined =>
    s.islands.find((i) => i.id === id);
export const selectIslandsForRoute =
  (routeId: string) =>
  (s: BoundaryStore): ClientIsland[] =>
    s.islands.filter((i) => i.affectedRouteIds.includes(routeId));
export const selectExcessiveIslands = (s: BoundaryStore): ClientIsland[] =>
  s.islands.filter((i) => i.excessive);
