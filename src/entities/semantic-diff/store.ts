import { create } from 'zustand';
import type { SemanticDiff } from '@shared/types';
import { mockSemanticDiff } from '@shared/mocks/semantic-diff';

interface SemanticDiffStore {
  diff: SemanticDiff;
  selectedEntryId: string | null;
  setSelected(id: string | null): void;
}

export const useSemanticDiffStore = create<SemanticDiffStore>((set) => ({
  diff: mockSemanticDiff,
  selectedEntryId: null,
  setSelected: (id) => set({ selectedEntryId: id }),
}));
