import { create } from 'zustand';
import type { ImportEdge, ImportGraph, Module, ModuleId, ModuleKind } from './types';

const EMPTY_GRAPH: ImportGraph = { modules: [], edges: [] };

interface ModuleStore {
  graph: ImportGraph;
  setGraph(graph: ImportGraph): void;
  byId(id: ModuleId): Module | undefined;
  byKind(kind: ModuleKind): ReadonlyArray<Module>;
  inEdges(id: ModuleId): ReadonlyArray<ImportEdge>;
  outEdges(id: ModuleId): ReadonlyArray<ImportEdge>;
}

export const useModuleStore = create<ModuleStore>((set, get) => ({
  graph: EMPTY_GRAPH,
  setGraph: (graph) => set({ graph }),
  byId: (id) => get().graph.modules.find((m) => m.id === id),
  byKind: (kind) => get().graph.modules.filter((m) => m.kind === kind),
  inEdges: (id) => get().graph.edges.filter((e) => e.to === id),
  outEdges: (id) => get().graph.edges.filter((e) => e.from === id),
}));
