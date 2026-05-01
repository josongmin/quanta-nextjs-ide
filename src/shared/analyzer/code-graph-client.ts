import type { DirectiveInputFile } from './use-client-lite';
import type {
  CodeGraphAnalyzeRequest,
  CodeGraphReport,
  WorkerOutbound,
} from './code-graph.worker';

type Pending = {
  resolve: (report: CodeGraphReport) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./code-graph.worker.ts', import.meta.url), {
    type: 'module',
    name: 'code-graph-analyzer',
  });
  worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
    const data = event.data;
    if (!data || (data.type !== 'result' && data.type !== 'error')) return;
    const slot = pending.get(data.id);
    if (!slot) return;
    pending.delete(data.id);
    if (data.type === 'result') slot.resolve(data.report);
    else slot.reject(new Error(data.message));
  });
  worker.addEventListener('error', (event) => {
    const message = event.message || 'code-graph analyzer worker crashed';
    for (const slot of pending.values()) slot.reject(new Error(message));
    pending.clear();
    worker?.terminate();
    worker = null;
  });
  return worker;
}

export function analyzeCodeGraphAsync(
  files: ReadonlyArray<DirectiveInputFile>,
): Promise<CodeGraphReport> {
  const w = getWorker();
  const id = nextId++;
  return new Promise<CodeGraphReport>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const msg: CodeGraphAnalyzeRequest = { type: 'analyze', id, files };
    w.postMessage(msg);
  });
}
