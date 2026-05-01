import type { RscChunk } from '@entities/rsc-payload';
import { BaseSource } from './base-source';
import type { SourceKind } from './types';

/**
 * Replay a previously-captured trace at original timing.
 *
 * Used by the "Import trace" UI: load a .rsc-trace.json and watch it stream
 * back at the speed it originally arrived.
 */
export class RecordedSource extends BaseSource {
  readonly id: SourceKind = 'recorded';
  readonly label: string;
  private timers: number[] = [];

  constructor(
    private readonly chunks: ReadonlyArray<RscChunk>,
    private readonly totalMs: number,
    private readonly totalBytes: number,
    private readonly speed = 1,
    label = 'Recorded',
  ) {
    super();
    this.label = label;
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
    const completeTimer = window.setTimeout(() => {
      this.emit({
        type: 'complete',
        totalMs: this.totalMs,
        totalBytes: this.totalBytes,
      });
    }, this.totalMs / speed + 1);
    this.timers.push(completeTimer);
  }

  stop(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
