/**
 * Workspace types — mirror of Rust `WorkspaceInfo` in
 * `src-tauri/src/workspace/mod.rs`.
 */

export interface WorkspaceInfo {
  /** Absolute, POSIX-style path to the opened folder. */
  root: string;
  /** Folder basename, used as a default project label. */
  name: string;
  /** Has a `next` dep declared in package.json. */
  isNextProject: boolean;
  /** Has an `app/` (or `src/app/`) directory — App Router. */
  hasAppRouter: boolean;
  /** Parsed package.json (raw shape). */
  packageJson: unknown | null;
  /** Raw next.config.* contents (first found of .ts/.mjs/.js), if any. */
  nextConfig: string | null;
  /** Parsed tsconfig.json, if any. */
  tsconfig: unknown | null;
}

export interface FsChangedPayload {
  /** Workspace-relative POSIX paths. */
  paths: string[];
  kind: 'create' | 'modify' | 'delete';
}

/** Sentinel root used by analyzer "demo mode" — tells analyzers to fall back
 * to the bundled `import.meta.glob` fixture corpus instead of going through
 * Tauri commands. Useful for Storybook + Vitest, which run without Tauri. */
export const DEMO_WORKSPACE_ROOT = '__demo__';
