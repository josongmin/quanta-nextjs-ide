import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RscChunk } from '@entities/rsc-payload';
import { createSource, type SourceConfig } from '@shared/rsc-sources';

export type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface PayloadStreamState {
  chunks: ReadonlyArray<RscChunk>;
  /** Emission count per chunk id (>=1). React Flight emits the same id
   *  multiple times for Suspense follow-ups. */
  occurrences: ReadonlyMap<string, number>;
  status: StreamStatus;
  error: Error | null;
  totalMs: number;
  totalBytes: number;
  restart(): void;
}

export function usePayloadStream(
  config: SourceConfig,
  enabled = true,
): PayloadStreamState {
  const [chunks, setChunks] = useState<RscChunk[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [totalMs, setTotalMs] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [generation, setGeneration] = useState(0);

  const { kind, speed } = config;

  // Latest config is read at start time; non-kind changes do NOT trigger a new
  // fetch — user must explicitly call restart() (Fetch button / Replay).
  const configRef = useRef(config);
  configRef.current = config;

  // Reset state on kind switch so the user gets a clean slate
  // (mock starts streaming automatically; fetch waits for explicit restart).
  useEffect(() => {
    setChunks([]);
    setError(null);
    setStatus('idle');
    setTotalMs(0);
    setTotalBytes(0);
  }, [kind]);

  useEffect(() => {
    if (!enabled) return;
    // Only auto-start mock; fetch waits for restart() to avoid hammering a
    // backend on every keystroke or toggle.
    if (kind !== 'mock' && generation === 0) return;

    const source = createSource(configRef.current);
    const unsubscribe = source.subscribe((event) => {
      switch (event.type) {
        case 'reset':
          setChunks([]);
          setError(null);
          setStatus('streaming');
          setTotalMs(0);
          setTotalBytes(0);
          break;
        case 'chunk':
          setChunks((prev) => [...prev, event.chunk]);
          break;
        case 'complete':
          setStatus('done');
          setTotalMs(event.totalMs);
          setTotalBytes(event.totalBytes);
          break;
        case 'error':
          setError(event.error);
          setStatus('error');
          break;
      }
    });
    source.start();
    return () => {
      source.stop();
      unsubscribe();
    };
  }, [enabled, kind, speed, generation]);

  const restart = useCallback(() => setGeneration((g) => g + 1), []);

  const occurrences = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of chunks) m.set(c.id, (m.get(c.id) ?? 0) + 1);
    return m;
  }, [chunks]);

  return { chunks, occurrences, status, error, totalMs, totalBytes, restart };
}
