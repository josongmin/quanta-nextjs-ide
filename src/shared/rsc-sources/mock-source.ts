import type { RscChunk } from '@entities/rsc-payload';
import { BaseSource } from './base-source';
import type { SourceKind } from './types';

export class MockSource extends BaseSource {
  readonly id: SourceKind = 'mock';
  readonly label = 'Mock data';
  private timers: number[] = [];

  constructor(
    private readonly chunks: ReadonlyArray<RscChunk>,
    private readonly speed: number = 1,
  ) {
    super();
  }

  start(): void {
    this.stop();
    this.emit({ type: 'reset' });

    const speed = Math.max(0.1, this.speed);
    for (const chunk of this.chunks) {
      const t = window.setTimeout(() => {
        this.emit({ type: 'chunk', chunk });
      }, chunk.arrivedAtMs / speed);
      this.timers.push(t);
    }

    const totalMs = this.chunks.at(-1)?.arrivedAtMs ?? 0;
    const totalBytes = this.chunks.reduce((s, c) => s + c.sizeBytes, 0);
    const completeTimer = window.setTimeout(() => {
      this.emit({ type: 'complete', totalMs, totalBytes });
    }, totalMs / speed + 1);
    this.timers.push(completeTimer);
  }

  stop(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
