/**
 * RSC payload (parsed wire-format chunk) shape types.
 *
 * Lives in `shared/types` so both the `entities/rsc-payload` model and the
 * `shared/mocks/rsc-payload.ts` mock data can reference these without
 * `shared` importing from `entities`.
 *
 * The entity's `model/types.ts` re-exports these for backward compatibility.
 */

export type ChunkKind = 'module' | 'element' | 'reference' | 'hint' | 'text';

export type ModuleEnvironment = 'server' | 'client' | 'unknown';

export interface RscChunk {
  id: string;
  kind: ChunkKind;
  parent?: string;
  payload: string;
  arrivedAtMs: number;
  sizeBytes: number;
  resolvesRefs?: ReadonlyArray<string>;
  label?: string;
  /** Best-effort detection from chunk path / manifest hints. */
  environment?: ModuleEnvironment;
}

export interface TreeNode {
  id: string;
  label: string;
  kind: ChunkKind;
  resolvedAt: number;
  children: TreeNode[];
}
