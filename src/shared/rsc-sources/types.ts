import type { RscChunk } from '@entities/rsc-payload';

export type SourceKind = 'mock' | 'fetch' | 'ws' | 'recorded' | 'batch';

export type SourceEvent =
  | { type: 'reset' }
  | { type: 'chunk'; chunk: RscChunk }
  | { type: 'complete'; totalMs: number; totalBytes: number }
  | { type: 'error'; error: Error };

export type SourceListener = (event: SourceEvent) => void;

export interface PayloadSource {
  readonly id: SourceKind;
  readonly label: string;
  start(): void;
  stop(): void;
  subscribe(listener: SourceListener): () => void;
}

export interface SourceConfig {
  kind: SourceKind;
  url?: string;
  speed?: number;
  /** For 'recorded': replay these chunks at original timing. */
  recorded?: {
    chunks: ReadonlyArray<RscChunk>;
    totalMs: number;
    totalBytes: number;
    label?: string;
  };
  /** For 'batch': fetch these URLs sequentially. */
  batch?: ReadonlyArray<{ url: string; prefix?: string }>;
}
