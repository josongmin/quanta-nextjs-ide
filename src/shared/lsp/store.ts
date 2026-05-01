import { create } from 'zustand';
import type { TsDiagnostic } from './types';

export type LspDiagnosticKind = 'semantic' | 'syntax' | 'suggestion';

export type LspDiagnosticBucket = {
  semantic: TsDiagnostic[];
  syntax: TsDiagnostic[];
  suggestion: TsDiagnostic[];
};

export type LspState = {
  /** Map of file path -> diagnostics by kind. */
  byFile: Record<string, LspDiagnosticBucket>;
  /** True when tsserver is up. */
  ready: boolean;
  /** Workspace root the running tsserver was started against. */
  workspaceRoot: string | null;
  setReady: (ready: boolean, root?: string | null) => void;
  setDiagnostics: (file: string, kind: LspDiagnosticKind, diags: TsDiagnostic[]) => void;
  clearFile: (file: string) => void;
  clearAll: () => void;
};

const emptyBucket = (): LspDiagnosticBucket => ({
  semantic: [],
  syntax: [],
  suggestion: [],
});

export const useLspStore = create<LspState>((set) => ({
  byFile: {},
  ready: false,
  workspaceRoot: null,
  setReady: (ready, root) =>
    set((s) => ({
      ready,
      workspaceRoot: root === undefined ? s.workspaceRoot : root,
    })),
  setDiagnostics: (file, kind, diags) =>
    set((s) => {
      const prev = s.byFile[file] ?? emptyBucket();
      return {
        byFile: {
          ...s.byFile,
          [file]: { ...prev, [kind]: diags },
        },
      };
    }),
  clearFile: (file) =>
    set((s) => {
      const next = { ...s.byFile };
      delete next[file];
      return { byFile: next };
    }),
  clearAll: () => set({ byFile: {} }),
}));

/** Combined diagnostics for a file across all kinds. */
export function selectAllDiagnostics(file: string) {
  return (s: LspState): TsDiagnostic[] => {
    const b = s.byFile[file];
    if (!b) return [];
    return [...b.syntax, ...b.semantic, ...b.suggestion];
  };
}
