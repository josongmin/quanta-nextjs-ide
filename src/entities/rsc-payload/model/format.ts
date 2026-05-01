import type { RscChunk } from './types';

/**
 * Best-effort pretty-printer for chunk payloads.
 *
 * Flight payloads are mostly compact JSON (or `I[...]`, `M{...}`, etc).
 * If the payload parses as JSON, return a 2-space-indented version so users
 * can read 800-byte server-component metadata without manual unwrapping.
 * Otherwise return the original.
 */
export function prettyPayload(chunk: Pick<RscChunk, 'payload' | 'kind'>): string {
  const raw = chunk.payload;
  // Don't bother with short payloads — already readable.
  if (raw.length < 80) return raw;
  // Only attempt JSON pretty-print on payloads that start like JSON.
  const first = raw[0];
  if (first !== '{' && first !== '[' && first !== '"') return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}
