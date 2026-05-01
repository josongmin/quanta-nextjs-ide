/**
 * Zustand store keeping a small ring-buffer of recent EvidencePackets.
 *
 * Phase 4 (AI patch gate) and the diagnostics UI both read from this
 * store; the admission gate writes to it via `record()`.
 */

import { create } from 'zustand';
import type { EvidencePacket } from './types';

const DEFAULT_CAP = 50;

interface EvidenceState {
  packets: EvidencePacket[];
  cap: number;
  record(packet: EvidencePacket): void;
  clear(): void;
  byId(id: string): EvidencePacket | undefined;
  recent(n?: number): EvidencePacket[];
  setCap(cap: number): void;
}

export const useEvidenceStore = create<EvidenceState>((set, get) => ({
  packets: [],
  cap: DEFAULT_CAP,
  record: (packet) =>
    set((s) => {
      const next = [packet, ...s.packets.filter((p) => p.id !== packet.id)];
      if (next.length > s.cap) next.length = s.cap;
      return { packets: next };
    }),
  clear: () => set({ packets: [] }),
  byId: (id) => get().packets.find((p) => p.id === id),
  recent: (n) => (n ? get().packets.slice(0, n) : get().packets.slice()),
  setCap: (cap) =>
    set((s) => ({
      cap,
      packets: s.packets.slice(0, cap),
    })),
}));

// Standalone selectors for use with useEvidenceStore(selectX)
export const selectEvidencePackets = (s: EvidenceState): EvidencePacket[] => s.packets;
export const selectEvidenceById =
  (id: string) =>
  (s: EvidenceState): EvidencePacket | undefined =>
    s.packets.find((p) => p.id === id);
