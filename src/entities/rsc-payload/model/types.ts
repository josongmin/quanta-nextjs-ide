// Shape types now live in `shared/types/rsc-payload` so `shared/mocks` can
// reference them without an upward import. The entity re-exports them so
// existing `@entities/rsc-payload` type imports keep working.
export type {
  ChunkKind,
  ModuleEnvironment,
  RscChunk,
  TreeNode,
} from '@shared/types/rsc-payload';

import type { ChunkKind } from '@shared/types/rsc-payload';

export const KIND_TONE: Record<
  ChunkKind,
  'accent' | 'static' | 'edge' | 'info' | 'muted'
> = {
  module: 'edge',
  element: 'accent',
  reference: 'info',
  hint: 'static',
  text: 'muted',
};

export const KIND_LABEL: Record<ChunkKind, string> = {
  module: 'Module',
  element: 'Element',
  reference: 'Ref',
  hint: 'Hint',
  text: 'Text',
};
