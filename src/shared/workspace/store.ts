/**
 * Workspace store — single source of truth for the currently open project
 * folder. Other features should read `useWorkspaceStore.getState().root` to
 * locate files (or call `workspace.readFile`).
 *
 * Lifecycle:
 *   1. UI calls `openWorkspace(path)` → invokes the Tauri command, which
 *      starts the Rust file watcher and returns project metadata.
 *   2. Store fans out to the analyzer bus (`runAll`) so all registered
 *      analyzers do an initial pass.
 *   3. Subsequent `fs:changed` events flow through the bus and only the
 *      relevant analyzers re-run.
 */

import { create } from 'zustand';
import * as workspaceApi from './api';
import type { WorkspaceInfo } from './types';
import { DEMO_WORKSPACE_ROOT } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface WorkspaceStore {
  status: Status;
  info: WorkspaceInfo | null;
  /** Last error message, if any. */
  error: string | null;
  /**
   * The active workspace root. Either an absolute POSIX path under Tauri,
   * or `__demo__` when no workspace is open and we're falling back to the
   * bundled fixture (used by Storybook / tests / web preview).
   */
  root: string;
  openWorkspace: (path: string) => Promise<WorkspaceInfo | null>;
  closeWorkspace: () => Promise<void>;
  setDemoMode: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  status: 'idle',
  info: null,
  error: null,
  root: DEMO_WORKSPACE_ROOT,

  openWorkspace: async (path: string) => {
    set({ status: 'loading', error: null });
    try {
      const info = await workspaceApi.openWorkspace(path);
      set({ status: 'ready', info, root: info.root, error: null });

      // Lazy-load the analyzer bus to avoid a circular import at module
      // initialization (the bus imports analyzers which may import from
      // workspace).
      try {
        const { analyzerBus } = await import('@shared/analyzer/bus');
        await analyzerBus.runAll(info.root);
      } catch (e) {
        // Bus failures should not break workspace opening — surface as warn.
        console.warn('analyzer bus runAll failed', e);
      }
      return info;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: 'error', error: msg });
      return null;
    }
  },

  closeWorkspace: async () => {
    try {
      await workspaceApi.closeWorkspace();
    } catch {
      // ignore
    }
    set({
      status: 'idle',
      info: null,
      error: null,
      root: DEMO_WORKSPACE_ROOT,
    });
  },

  setDemoMode: () => set({ root: DEMO_WORKSPACE_ROOT }),
}));

export const selectWorkspaceRoot = (s: WorkspaceStore): string => s.root;
export const selectWorkspaceInfo = (s: WorkspaceStore): WorkspaceInfo | null =>
  s.info;
export const selectIsNextProject = (s: WorkspaceStore): boolean =>
  !!s.info?.isNextProject;
