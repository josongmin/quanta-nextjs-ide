import type { PayloadSource, SourceEvent, SourceKind, SourceListener } from './types';

export abstract class BaseSource implements PayloadSource {
  abstract readonly id: SourceKind;
  abstract readonly label: string;
  protected listeners = new Set<SourceListener>();

  abstract start(): void;
  abstract stop(): void;

  subscribe(listener: SourceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected emit(event: SourceEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
