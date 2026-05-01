/**
 * Public surface for the live workspace loader (Phase 1).
 *
 * Other phases consume:
 *   - `useWorkspaceStore` — current open folder + metadata.
 *   - `workspace.readFile(rel)` — read any file under the open root.
 *   - `workspace.listFiles(glob)` — list workspace files matching a glob.
 *   - `workspace.onFsChanged(cb)` — raw watcher events. Most callers should
 *     instead register an analyzer with `analyzerBus.register(...)` (see
 *     `@shared/analyzer/bus`).
 */

import {
  closeWorkspace,
  getCurrentWorkspace,
  listWorkspaceFiles,
  onFsChanged,
  openWorkspace,
  pickFolder,
  readWorkspaceFile,
} from './api';

export const workspace = {
  open: openWorkspace,
  close: closeWorkspace,
  readFile: readWorkspaceFile,
  listFiles: listWorkspaceFiles,
  current: getCurrentWorkspace,
  onFsChanged,
  pickFolder,
};

export {
  useWorkspaceStore,
  selectWorkspaceRoot,
  selectWorkspaceInfo,
  selectIsNextProject,
} from './store';
export type { WorkspaceInfo, FsChangedPayload } from './types';
export { DEMO_WORKSPACE_ROOT } from './types';
