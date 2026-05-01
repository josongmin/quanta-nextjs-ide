import { mockRscChunks } from '@shared/mocks/rsc-payload';
import { BatchSource } from './batch-source';
import { FetchSource } from './fetch-source';
import { MockSource } from './mock-source';
import { RecordedSource } from './recorded-source';
import type { PayloadSource, SourceConfig } from './types';

export type {
  PayloadSource,
  SourceConfig,
  SourceEvent,
  SourceKind,
  SourceListener,
} from './types';
export { MockSource } from './mock-source';
export { FetchSource } from './fetch-source';
export { RecordedSource } from './recorded-source';
export { BatchSource } from './batch-source';

export function createSource(config: SourceConfig): PayloadSource {
  switch (config.kind) {
    case 'mock':
      return new MockSource(mockRscChunks, config.speed);
    case 'fetch':
      if (!config.url) throw new Error('FetchSource requires a url');
      return new FetchSource(config.url);
    case 'recorded':
      if (!config.recorded) throw new Error('RecordedSource requires recorded data');
      return new RecordedSource(
        config.recorded.chunks,
        config.recorded.totalMs,
        config.recorded.totalBytes,
        config.speed,
        config.recorded.label,
      );
    case 'batch':
      if (!config.batch?.length) throw new Error('BatchSource requires batch URLs');
      return new BatchSource(config.batch);
    case 'ws':
      throw new Error('WebSocketSource not implemented yet');
  }
}
