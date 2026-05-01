import { create } from 'zustand';
import { mockRuntimeLogs, type LogEntry } from '@shared/mocks/runtime';

interface RuntimeStore {
  logs: LogEntry[];
  paused: boolean;
  push(entry: LogEntry): void;
  pause(): void;
  resume(): void;
  clear(): void;
}

const MAX_LOGS = 400;

export const useRuntimeStore = create<RuntimeStore>((set) => ({
  logs: [...mockRuntimeLogs].sort((a, b) => b.ts - a.ts),
  paused: true,
  push: (entry) =>
    set((s) => {
      const next = [entry, ...s.logs];
      if (next.length > MAX_LOGS) next.length = MAX_LOGS;
      return { logs: next };
    }),
  pause: () => set({ paused: true }),
  resume: () => set({ paused: false }),
  clear: () => set({ logs: [] }),
}));
