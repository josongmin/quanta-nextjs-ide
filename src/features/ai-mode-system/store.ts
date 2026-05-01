/**
 * AI mode store. Persists the user's chosen mode to localStorage so the
 * preference survives reloads.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AiMode } from './types';

const STORAGE_KEY = 'quanta.aiMode';

interface AiModeState {
  mode: AiMode;
  setMode(mode: AiMode): void;
}

export const useAiModeStore = create<AiModeState>()(
  persist(
    (set) => ({
      mode: 'guided',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Public hook for other features (e.g. the existing ai-panel) to
 * consume the current mode without taking a hard dependency on the
 * persistence layer.
 */
export function useAiMode(): {
  mode: AiMode;
  setMode: (mode: AiMode) => void;
} {
  const mode = useAiModeStore((s) => s.mode);
  const setMode = useAiModeStore((s) => s.setMode);
  return { mode, setMode };
}
