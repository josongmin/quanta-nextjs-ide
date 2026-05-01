import { create } from 'zustand';
import type { DirectiveInputFile } from '@shared/analyzer/use-client-lite';

/**
 * Holds the corpus of source files we have available for AST analysis.
 *
 * Today: snapshotted from the fixture next-app at module load via
 * `import.meta.glob`. Tomorrow (Tauri): read from the user's open project
 * via the shell bridge. Either way the entity downstream just consumes
 * `DirectiveInputFile[]` — UI doesn't care where the bytes came from.
 */
interface CodeGraphState {
  files: ReadonlyArray<DirectiveInputFile>;
  setFiles(next: ReadonlyArray<DirectiveInputFile>): void;
}

// Snapshot fixture sources. Same glob pattern the routes analyzer uses.
const RAW = import.meta.glob<string>(
  '../../../../e2e/fixtures/next-app/app/**/*.{ts,tsx,js,jsx}',
  { query: '?raw', import: 'default', eager: true },
);

const PREFIX = '../../../../e2e/fixtures/next-app/';
function normalize(globPath: string): string {
  return globPath.startsWith(PREFIX) ? globPath.slice(PREFIX.length) : globPath;
}

const initialFiles: ReadonlyArray<DirectiveInputFile> = Object.entries(RAW).map(
  ([path, source]) => ({ file: normalize(path), source }),
);

export const useCodeGraphStore = create<CodeGraphState>((set) => ({
  files: initialFiles,
  setFiles: (next) => set({ files: next }),
}));
