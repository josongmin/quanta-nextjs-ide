import type { RscChunk } from './types';

export interface PayloadSnapshot {
  id: string;
  label: string;
  url: string;
  capturedAt: number;
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  totalBytes: number;
}

export type ChunkDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface ChunkDiffEntry {
  id: string;
  status: ChunkDiffStatus;
  before?: RscChunk;
  after?: RscChunk;
  payloadChanged: boolean;
  sizeDeltaBytes: number;
  timeDeltaMs: number;
}

export interface SnapshotDiff {
  before: PayloadSnapshot;
  after: PayloadSnapshot;
  entries: ReadonlyArray<ChunkDiffEntry>;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  totalSizeDelta: number;
  totalTimeDelta: number;
}

export function createSnapshot(input: {
  url: string;
  label?: string;
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  totalBytes: number;
}): PayloadSnapshot {
  const capturedAt = Date.now();
  const fallbackLabel = formatTimestamp(capturedAt);
  return {
    id: `snap_${capturedAt}_${Math.random().toString(36).slice(2, 7)}`,
    label: input.label ?? fallbackLabel,
    url: input.url,
    capturedAt,
    chunks: input.chunks,
    totalMs: input.totalMs,
    totalBytes: input.totalBytes,
  };
}

export function diffSnapshots(
  before: PayloadSnapshot,
  after: PayloadSnapshot,
): SnapshotDiff {
  const beforeMap = new Map(before.chunks.map((c) => [c.id, c]));
  const afterMap = new Map(after.chunks.map((c) => [c.id, c]));
  const allIds = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);

  const entries: ChunkDiffEntry[] = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  let unchanged = 0;

  for (const id of allIds) {
    const b = beforeMap.get(id);
    const a = afterMap.get(id);
    if (b && !a) {
      removed += 1;
      entries.push({
        id,
        status: 'removed',
        before: b,
        payloadChanged: true,
        sizeDeltaBytes: -b.sizeBytes,
        timeDeltaMs: 0,
      });
      continue;
    }
    if (!b && a) {
      added += 1;
      entries.push({
        id,
        status: 'added',
        after: a,
        payloadChanged: true,
        sizeDeltaBytes: a.sizeBytes,
        timeDeltaMs: 0,
      });
      continue;
    }
    if (b && a) {
      const payloadChanged = b.payload !== a.payload;
      const sizeDelta = a.sizeBytes - b.sizeBytes;
      const timeDelta = a.arrivedAtMs - b.arrivedAtMs;
      const isChanged = payloadChanged || sizeDelta !== 0;
      if (isChanged) {
        changed += 1;
        entries.push({
          id,
          status: 'changed',
          before: b,
          after: a,
          payloadChanged,
          sizeDeltaBytes: sizeDelta,
          timeDeltaMs: timeDelta,
        });
      } else {
        unchanged += 1;
        entries.push({
          id,
          status: 'unchanged',
          before: b,
          after: a,
          payloadChanged: false,
          sizeDeltaBytes: 0,
          timeDeltaMs: timeDelta,
        });
      }
    }
  }

  entries.sort((x, y) => parseChunkId(x.id) - parseChunkId(y.id));

  return {
    before,
    after,
    entries,
    added,
    removed,
    changed,
    unchanged,
    totalSizeDelta: after.totalBytes - before.totalBytes,
    totalTimeDelta: after.totalMs - before.totalMs,
  };
}

function parseChunkId(id: string): number {
  const trimmed = id.endsWith(':') ? id.slice(0, -1) : id;
  const n = parseInt(trimmed, 16);
  return Number.isNaN(n) ? 0 : n;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
