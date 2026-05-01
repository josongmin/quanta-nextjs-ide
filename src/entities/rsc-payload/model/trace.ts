import type { RscChunk } from './types';

/**
 * On-disk format for a captured RSC stream. Designed for JSON round-trip.
 * Bumping `version` is a breaking change — older importers should reject.
 */
export interface RscTrace {
  version: 1;
  capturedAt: number;
  url: string;
  totalMs: number;
  totalBytes: number;
  chunks: ReadonlyArray<RscChunk>;
}

export interface ImportResult {
  ok: boolean;
  trace?: RscTrace;
  error?: string;
}

export function exportTrace(input: {
  url: string;
  chunks: ReadonlyArray<RscChunk>;
  totalMs: number;
  totalBytes: number;
}): RscTrace {
  return {
    version: 1,
    capturedAt: Date.now(),
    url: input.url,
    totalMs: input.totalMs,
    totalBytes: input.totalBytes,
    chunks: input.chunks,
  };
}

export function parseTrace(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (!isObject(parsed)) return { ok: false, error: 'Not an object' };
  const v = (parsed as { version?: unknown }).version;
  if (v !== 1) return { ok: false, error: `Unsupported version: ${String(v)}` };
  const chunks = (parsed as { chunks?: unknown }).chunks;
  if (!Array.isArray(chunks)) return { ok: false, error: 'Missing chunks array' };
  for (const c of chunks) {
    if (!isObject(c)) return { ok: false, error: 'Chunk is not an object' };
    if (typeof (c as { id?: unknown }).id !== 'string') {
      return { ok: false, error: 'Chunk.id is not a string' };
    }
  }
  return { ok: true, trace: parsed as unknown as RscTrace };
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
