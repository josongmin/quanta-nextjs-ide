import { create } from 'zustand';
import type {
  Archetype,
  RenderingClass,
  Route,
  RouteTreeNode,
} from '@shared/types';
import { mockRoutes, mockRouteTree } from '@shared/mocks/routes';

type RouteFilter = 'all' | 'static' | 'dynamic' | 'client-heavy';

interface RouteStore {
  routes: Route[];
  tree: RouteTreeNode;
  selectedRouteId: string | null;
  filter: RouteFilter;
  searchQuery: string;
  setSelected(id: string | null): void;
  setFilter(filter: RouteFilter): void;
  setSearch(query: string): void;
  setRoutes(routes: Route[], tree: RouteTreeNode): void;
  byId(id: string): Route | undefined;
  byArchetype(archetype: Archetype): Route[];
  byRendering(rendering: RenderingClass): Route[];
  pageRoutes(): Route[];
  withCacheTag(tag: string): Route[];
}

const isPageRoute = (r: Route): boolean =>
  r.archetype !== 'api' && r.archetype !== 'webhook';

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: mockRoutes,
  tree: mockRouteTree,
  selectedRouteId: mockRoutes[0]?.id ?? null,
  filter: 'all',
  searchQuery: '',
  setSelected: (id) => set({ selectedRouteId: id }),
  setFilter: (filter) => set({ filter }),
  setSearch: (q) => set({ searchQuery: q }),
  setRoutes: (routes, tree) =>
    set({
      routes,
      tree,
      selectedRouteId: routes[0]?.id ?? null,
    }),
  byId: (id) => get().routes.find((r) => r.id === id),
  byArchetype: (archetype) =>
    get().routes.filter((r) => r.archetype === archetype),
  byRendering: (rendering) =>
    get().routes.filter((r) => r.rendering === rendering),
  pageRoutes: () => get().routes.filter(isPageRoute),
  withCacheTag: (tag) => get().routes.filter((r) => r.cacheTags.includes(tag)),
}));

// Standalone selectors usable with `useRouteStore(selectRouteById('foo'))`.
export const selectRoutes = (s: RouteStore): Route[] => s.routes;
export const selectRouteById =
  (id: string) =>
  (s: RouteStore): Route | undefined =>
    s.routes.find((r) => r.id === id);
export const selectRoutesByArchetype =
  (archetype: Archetype) =>
  (s: RouteStore): Route[] =>
    s.routes.filter((r) => r.archetype === archetype);
export const selectRoutesByRendering =
  (rendering: RenderingClass) =>
  (s: RouteStore): Route[] =>
    s.routes.filter((r) => r.rendering === rendering);
export const selectPageRoutes = (s: RouteStore): Route[] =>
  s.routes.filter(isPageRoute);
export const selectRoutesWithCacheTag =
  (tag: string) =>
  (s: RouteStore): Route[] =>
    s.routes.filter((r) => r.cacheTags.includes(tag));
