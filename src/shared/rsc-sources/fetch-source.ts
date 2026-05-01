import { parseRscLine } from '@entities/rsc-payload';
import { BaseSource } from './base-source';
import type { SourceKind } from './types';

export class FetchSource extends BaseSource {
  readonly id: SourceKind = 'fetch';
  readonly label = 'Live (fetch)';
  private abort?: AbortController;

  constructor(private readonly url: string) {
    super();
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
      const res = await fetch(this.url, {
        method: 'GET',
        headers: {
          RSC: '1',
          Accept: 'text/x-component',
        },
        signal,
      });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('No response body');
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
          const chunk = parseRscLine(line, arrivedAtMs);
          if (chunk) this.emit({ type: 'chunk', chunk });
        }
      }

      if (buffer.trim()) {
        const arrivedAtMs = performance.now() - t0;
        const chunk = parseRscLine(buffer, arrivedAtMs);
        if (chunk) this.emit({ type: 'chunk', chunk });
      }

      this.emit({
        type: 'complete',
        totalMs: performance.now() - t0,
        totalBytes,
      });
    } catch (err) {
      if (signal.aborted) return;
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit({ type: 'error', error });
    }
  }
}
