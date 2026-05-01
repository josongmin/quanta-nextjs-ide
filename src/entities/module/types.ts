/**
 * Canonical "source module + import edge" graph types.
 *
 * Several features previously invented their own micro-graphs for source
 * modules and the imports between them (turbopack-graph, performance bundle
 * tree, boundary inspector imports). This entity is the single source of
 * truth those consumers should converge on.
 *
 * Notes on what is intentionally NOT part of this entity:
 * - architecture-map's `Layer` is an FSD architectural layer (app / pages /
 *   widgets / features / entities / shared) — a different concept than a
 *   source module. It is NOT migrated here.
 * - dead-code-finder's `DeadEntry` references symbols/files (exports), not
 *   modules. It is NOT migrated here.
 */

export type ModuleId = string;

export type ModuleKind = 'server' | 'client' | 'shared';

export interface Module {
  readonly id: ModuleId;
  readonly name: string;
  readonly file?: string;
  readonly sizeKB: number;
  readonly kind: ModuleKind;
  readonly isEntry?: boolean;
  readonly isHmrBoundary?: boolean;
  readonly treeShakable?: boolean;
  readonly includedReason?: string;
}

export type ImportEdgeKind = 'static' | 'dynamic' | 'type-only' | 'side-effect';

export interface ImportEdge {
  readonly from: ModuleId;
  readonly to: ModuleId;
  readonly weight?: number;
  readonly kind?: ImportEdgeKind;
}

export interface ImportGraph {
  readonly modules: ReadonlyArray<Module>;
  readonly edges: ReadonlyArray<ImportEdge>;
}
