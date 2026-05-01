import { parseRscLine, type RscChunk } from '@entities/rsc-payload';
import { BaseSource } from './base-source';
import type { SourceKind } from './types';

export interface BatchEntry {
  url: string;
  /** Optional id prefix to disambiguate chunks across routes. */
  prefix?: string;
}

/**
 * Sequentially fetch a list of URLs and emit all chunks under a unified
 * timeline. Each route's chunk ids are prefixed with the URL path so they
 * don't collide.
 *
 * Use cases:
 *  - "Capture all routes" button → diff entire site bundle
 *  - CI integration: snapshot every route, post diff to PR
 */
export class BatchSource extends BaseSource {
  readonly id: SourceKind = 'batch';
  readonly label: string;
  private abort?: AbortController;

  constructor(
    private readonly entries: ReadonlyArray<BatchEntry>,
    label = 'Batch',
  ) {
    super();
    this.label = label;
  }

  start(): void {
    this.stop();
    this.emit({ type: 'reset' });
    this.abort = new AbortController();
    void this.run(this.abort.signal);
  }

  stop(): void {
    this.abort?.abort();
    this.abort = undefined;
  }

  private async run(signal: AbortSignal): Promise<void> {
    const t0 = performance.now();
    let totalBytes = 0;

    try {
      for (const entry of this.entries) {
        const prefix = entry.prefix ?? deriveLabel(entry.url);
        const res = await fetch(entry.url, {
          method: 'GET',
          headers: { RSC: '1', Accept: 'text/x-component' },
          signal,
        });
        if (!res.ok || !res.body) {
          this.emit({
            type: 'error',
            error: new Error(`Fetch failed (${entry.url}): ${res.status}`),
          });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const arrivedAtMs = performance.now() - t0;
          if (value) totalBytes += value.byteLength;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const c = parseRscLine(line, arrivedAtMs);
            if (c) this.emit({ type: 'chunk', chunk: prefixed(c, prefix) });
          }
        }
        if (buffer.trim()) {
          const c = parseRscLine(buffer, performance.now() - t0);
          if (c) this.emit({ type: 'chunk', chunk: prefixed(c, prefix) });
        }
      }
      this.emit({
        type: 'complete',
        totalMs: performance.now() - t0,
        totalBytes,
      });
    } catch (e) {
      if (signal.aborted) return;
      this.emit({
        type: 'error',
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
  }
}

function prefixed(c: RscChunk, prefix: string): RscChunk {
  return {
    ...c,
    id: `${prefix}/${c.id}`,
    parent: c.parent ? `${prefix}/${c.parent}` : undefined,
    resolvesRefs: c.resolvesRefs?.map((r) => `${prefix}/${r}`),
  };
}

function deriveLabel(url: string): string {
  try {
    const u = new URL(url, 'http://x');
    return u.pathname === '/' ? 'root' : u.pathname.replace(/^\//, '').replace(/\//g, '_') || 'root';
  } catch {
    return url;
  }
}
