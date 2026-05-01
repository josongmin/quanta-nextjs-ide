import { create } from 'zustand';
import {
  createSnapshot,
  type PayloadSnapshot,
  type RscChunk,
} from '@entities/rsc-payload';
import { kvGet, kvSet } from '@shared/persistence';

const MAX_SNAPSHOTS = 12;
const PERSIST_KEY = 'quanta.snapshots.v1';

let hydrated = false;
function hydrate(set: (next: Partial<SnapshotsState>) => void): void {
  if (hydrated) return;
  hydrated = true;
  void kvGet<{ snapshots: PayloadSnapshot[] }>(PERSIST_KEY).then((data) => {
    if (data && Array.isArray(data.snapshots) && data.snapshots.length) {
      set({ snapshots: data.snapshots.slice(0, MAX_SNAPSHOTS) });
    }
  });
}

function persist(snapshots: ReadonlyArray<PayloadSnapshot>): void {
  void kvSet(PERSIST_KEY, { snapshots: snapshots.slice(0, MAX_SNAPSHOTS) });
}

interface SnapshotsState {
  snapshots: PayloadSnapshot[];
  selectedAId: string | null;
  selectedBId: string | null;
  capture(input: {
    url: string;
    chunks: ReadonlyArray<RscChunk>;
    totalMs: number;
    totalBytes: number;
    label?: string;
  }): PayloadSnapshot;
  remove(id: string): void;
  clear(): void;
  selectA(id: string | null): void;
  selectB(id: string | null): void;
  rename(id: string, label: string): void;
}

export const useSnapshotsStore = create<SnapshotsState>((set, get) => {
  // Lazy hydrate from IndexedDB on first store access.
  hydrate((next) => set(next));

  return {
    snapshots: [],
    selectedAId: null,
    selectedBId: null,
    capture: (input) => {
      const snap = createSnapshot(input);
      set((state) => {
        const next = [snap, ...state.snapshots].slice(0, MAX_SNAPSHOTS);
        const second = next[1];
        persist(next);
        return {
          snapshots: next,
          selectedAId: second ? second.id : state.selectedAId,
          selectedBId: snap.id,
        };
      });
      return snap;
    },
    remove: (id) => {
      const next = get().snapshots.filter((s) => s.id !== id);
      persist(next);
      set((state) => ({
        snapshots: next,
        selectedAId: state.selectedAId === id ? null : state.selectedAId,
        selectedBId: state.selectedBId === id ? null : state.selectedBId,
      }));
    },
    clear: () => {
      persist([]);
      set({ snapshots: [], selectedAId: null, selectedBId: null });
    },
    selectA: (id) => set({ selectedAId: id }),
    selectB: (id) => set({ selectedBId: id }),
    rename: (id, label) => {
      set((state) => {
        const next = state.snapshots.map((s) =>
          s.id === id ? { ...s, label } : s,
        );
        persist(next);
        return { snapshots: next };
      });
    },
  };
});
