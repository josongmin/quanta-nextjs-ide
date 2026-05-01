/**
 * Intent capture store.
 *
 * History is bounded to the last 20 intents. The current intent (if any)
 * is whatever the user just submitted; the gap state is computed on
 * demand by the UI from `current` + the user-supplied changedFiles +
 * recent diagnostics.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Intent } from './schema';

interface IntentCaptureState {
  current: Intent | null;
  history: Intent[];
  /** Optional: actual files the user reports having changed. */
  changedFiles: string[];
  setIntent(intent: Intent | null): void;
  pushHistory(intent: Intent): void;
  setChangedFiles(files: string[]): void;
  clear(): void;
}

const HISTORY_CAP = 20;

export const useIntentCaptureStore = create<IntentCaptureState>()(
  persist(
    (set) => ({
      current: null,
      history: [],
      changedFiles: [],
      setIntent: (intent) => set({ current: intent }),
      pushHistory: (intent) =>
        set((s) => ({
          current: intent,
          history: [intent, ...s.history.filter((i) => i.parsedAt !== intent.parsedAt)].slice(0, HISTORY_CAP),
        })),
      setChangedFiles: (files) => set({ changedFiles: files }),
      clear: () => set({ current: null, changedFiles: [] }),
    }),
    {
      name: 'quanta.intentCapture',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        current: s.current,
        history: s.history,
      }),
    },
  ),
);
