import { create } from 'zustand';
import type {
  ApiEndpoint,
  ApiEndpointKind,
  DbQuery,
  DbTransaction,
  PrismaModel,
} from '@shared/types';
import { mockPrismaModels } from '@shared/mocks/database';
import { mockDbQueries, mockDbTransactions } from '@shared/mocks/db-queries';
import { mockApiEndpoints } from '@shared/mocks/api-surface';

interface DatabaseStore {
  models: PrismaModel[];
  queries: DbQuery[];
  transactions: DbTransaction[];
  endpoints: ApiEndpoint[];
  selectedModelId: string | null;
  selectedQueryId: string | null;
  setSelectedModel(id: string | null): void;
  setSelectedQuery(id: string | null): void;
  byModel(id: string): PrismaModel | undefined;
  byQuery(id: string): DbQuery | undefined;
  queriesForModel(modelId: string): DbQuery[];
  queriesForRoute(routeId: string): DbQuery[];
  slowQueries(): DbQuery[];
  endpointsByKind(kind: ApiEndpointKind | 'all'): ApiEndpoint[];
}

const isSlowQuery = (q: DbQuery): boolean =>
  q.nPlusOne || q.missingIndex || q.unbounded;

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  models: mockPrismaModels,
  queries: mockDbQueries,
  transactions: mockDbTransactions,
  endpoints: mockApiEndpoints,
  selectedModelId: mockPrismaModels[0]?.id ?? null,
  selectedQueryId: null,
  setSelectedModel: (id) => set({ selectedModelId: id }),
  setSelectedQuery: (id) => set({ selectedQueryId: id }),
  byModel: (id) => get().models.find((m) => m.id === id),
  byQuery: (id) => get().queries.find((q) => q.id === id),
  queriesForModel: (modelId) =>
    get().queries.filter((q) => q.modelId === modelId),
  queriesForRoute: (routeId) =>
    get().queries.filter((q) => q.routeIds.includes(routeId)),
  slowQueries: () => get().queries.filter(isSlowQuery),
  endpointsByKind: (kind) =>
    kind === 'all'
      ? get().endpoints
      : get().endpoints.filter((e) => e.kind === kind),
}));

// Standalone selectors
export const selectModels = (s: DatabaseStore): PrismaModel[] => s.models;
export const selectQueries = (s: DatabaseStore): DbQuery[] => s.queries;
export const selectModelById =
  (id: string) =>
  (s: DatabaseStore): PrismaModel | undefined =>
    s.models.find((m) => m.id === id);
export const selectQueriesForModel =
  (modelId: string) =>
  (s: DatabaseStore): DbQuery[] =>
    s.queries.filter((q) => q.modelId === modelId);
export const selectQueriesForRoute =
  (routeId: string) =>
  (s: DatabaseStore): DbQuery[] =>
    s.queries.filter((q) => q.routeIds.includes(routeId));
export const selectSlowQueries = (s: DatabaseStore): DbQuery[] =>
  s.queries.filter(isSlowQuery);
