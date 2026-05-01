import { create } from 'zustand';
import type { CodeSymbol, CodeSymbolKind } from './types';

interface CodeSymbolStore {
  symbols: CodeSymbol[];
  byFile(file: string): CodeSymbol[];
  byKind(kind: CodeSymbolKind): CodeSymbol[];
  setSymbols(next: CodeSymbol[]): void;
}

/**
 * Canonical code-symbol store.
 *
 * Seeded empty by design — each feature owns its own richer mock data inside
 * its `helpers.ts`. This store exists so future cross-feature work
 * (find-references, call-hierarchy, etc.) has a single canonical source.
 */
export const useCodeSymbolStore = create<CodeSymbolStore>((set, get) => ({
  symbols: [],
  byFile: (file) => get().symbols.filter((s) => s.file === file),
  byKind: (kind) => get().symbols.filter((s) => s.kind === kind),
  setSymbols: (next) => set({ symbols: next }),
}));
