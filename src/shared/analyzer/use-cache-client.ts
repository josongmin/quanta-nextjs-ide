// Main-thread client for the `'use cache'` analyzer worker.
//
// The worker — and through it ts-morph — is instantiated lazily on first
// call. Vite picks up the `new Worker(new URL(..., import.meta.url))`
// pattern and emits the worker (plus its ts-morph dependency) as separate
// chunks, so the main app bundle never pulls ts-morph in.
import type { UseCacheInputFile, UseCacheReport } from './use-cache';
import type {
  AnalyzeRequest,
  WorkerOutbound,
} from './use-cache.worker';

type Pending = {
  resolve: (report: UseCacheReport) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./use-cache.worker.ts', import.meta.url), {
    type: 'module',
    name: 'use-cache-analyzer',
  });
  worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
    const data = event.data;
    if (!data || (data.type !== 'result' && data.type !== 'error')) return;
    const slot = pending.get(data.id);
    if (!slot) return;
    pending.delete(data.id);
    if (data.type === 'result') {
      slot.resolve(data.report);
    } else {
      slot.reject(new Error(data.message));
    }
  });
  worker.addEventListener('error', (event) => {
    // Any pending request fails — the worker is in an unrecoverable state.
    const message = event.message || 'use-cache analyzer worker crashed';
    for (const slot of pending.values()) slot.reject(new Error(message));
    pending.clear();
    worker?.terminate();
    worker = null;
  });
  return worker;
}

/**
 * Run the `'use cache'` analyzer in a Web Worker.
 *
 * Resolves with the same `UseCacheReport` the synchronous analyzer would
 * have produced — but ts-morph never touches the main thread or the main
 * bundle.
 */
export function analyzeUseCacheAsync(
  files: ReadonlyArray<UseCacheInputFile>,
): Promise<UseCacheReport> {
  const w = getWorker();
  const id = nextId++;
  return new Promise<UseCacheReport>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const msg: AnalyzeRequest = { type: 'analyze', id, files };
    w.postMessage(msg);
  });
}
