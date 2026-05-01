import { create } from 'zustand';
import type { RscChunk } from './types';

/**
 * Last successful RSC capture, shared across surfaces.
 *
 * RSC payload step writes here whenever a fetch completes (or a snapshot is
 * captured). Other surfaces (server-only tracker, client-islands tab,
 * bundle/vitals) read from here to power "real data" panels.
 */
interface LastTraceState {
  url: string | null;
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  totalBytes: number;
  capturedAt: number | null;
  set(input: {
    url: string;
    chunks: ReadonlyArray<RscChunk>;
    totalMs: number;
    totalBytes: number;
  }): void;
  clear(): void;
}

export const useLastTraceStore = create<LastTraceState>((set) => ({
  url: null,
  chunks: [],
  totalMs: 0,
  totalBytes: 0,
  capturedAt: null,
  set: (input) =>
    set({
      url: input.url,
      chunks: input.chunks,
      totalMs: input.totalMs,
      totalBytes: input.totalBytes,
      capturedAt: Date.now(),
    }),
  clear: () =>
    set({ url: null, chunks: [], totalMs: 0, totalBytes: 0, capturedAt: null }),
}));
