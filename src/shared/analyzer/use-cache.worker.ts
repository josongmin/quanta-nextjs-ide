/// <reference lib="webworker" />
// Web Worker that hosts the ts-morph powered `'use cache'` analyzer.
//
// Isolating ts-morph in a worker keeps the ~1.6 MB gzipped library out of the
// main app bundle entirely — the worker chunk is only fetched when the
// `use-cache-analyzer` overlay actually triggers a scan.
//
// Protocol (request → response):
//   ← { type: 'analyze', id, files }
//   → { type: 'result',  id, report }      // success
//   → { type: 'error',   id, message }     // failure
import { analyzeUseCache, type UseCacheInputFile, type UseCacheReport } from './use-cache';

export interface AnalyzeRequest {
  type: 'analyze';
  id: number;
  files: ReadonlyArray<UseCacheInputFile>;
}

export interface AnalyzeResultMessage {
  type: 'result';
  id: number;
  report: UseCacheReport;
}

export interface AnalyzeErrorMessage {
  type: 'error';
  id: number;
  message: string;
}

export type WorkerOutbound = AnalyzeResultMessage | AnalyzeErrorMessage;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener('message', (event: MessageEvent<AnalyzeRequest>) => {
  const data = event.data;
  if (!data || data.type !== 'analyze') return;
  const { id, files } = data;
  try {
    const report = analyzeUseCache(files);
    const msg: AnalyzeResultMessage = { type: 'result', id, report };
    ctx.postMessage(msg);
  } catch (err) {
    const msg: AnalyzeErrorMessage = {
      type: 'error',
      id,
      message: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(msg);
  }
});
