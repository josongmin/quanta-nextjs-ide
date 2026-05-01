export type Runtime = 'node' | 'edge' | 'browser';

export interface StackFrame {
  id: string;
  fn: string;
  file: string;
  line: number;
  col: number;
  runtime: Runtime;
  isAsync: boolean;
  isUserCode: boolean;
}

export interface ThreadStatus {
  id: string;
  label: string;
  state: 'running' | 'paused' | 'idle' | 'blocked';
  ms: number;
}

export interface LoadedScript {
  id: string;
  name: string;
  runtime: Runtime;
}

export interface DebugSession {
  id: string;
  status: 'paused' | 'running';
  reason: string;
  activeFrameIndex: number;
  frames: ReadonlyArray<StackFrame>;
  threads: ReadonlyArray<ThreadStatus>;
  scripts: ReadonlyArray<LoadedScript>;
  pauseOnUncaught: boolean;
}

export const RUNTIMES: ReadonlyArray<Runtime> = ['node', 'edge', 'browser'];

export const RUNTIME_LABEL: Record<Runtime, string> = {
  node: 'Node',
  edge: 'Edge',
  browser: 'Browser',
};

export const RUNTIME_TONE: Record<
  Runtime,
  'server' | 'edge' | 'client'
> = {
  node: 'server',
  edge: 'edge',
  browser: 'client',
};

export const mockSession: DebugSession = {
  id: 'sess_01',
  status: 'paused',
  reason: 'Breakpoint hit · src/app/(commerce)/products/[id]/page.tsx:42',
  activeFrameIndex: 0,
  pauseOnUncaught: true,
  frames: [
    {
      id: 'fr_0',
      fn: 'ProductPage',
      file: 'src/app/(commerce)/products/[id]/page.tsx',
      line: 42,
      col: 12,
      runtime: 'node',
      isAsync: true,
      isUserCode: true,
    },
    {
      id: 'fr_1',
      fn: 'fetchProduct',
      file: 'src/features/catalog/fetch-product.ts',
      line: 17,
      col: 4,
      runtime: 'node',
      isAsync: true,
      isUserCode: true,
    },
    {
      id: 'fr_2',
      fn: 'cachedFetch',
      file: 'src/shared/lib/cache.ts',
      line: 88,
      col: 22,
      runtime: 'node',
      isAsync: true,
      isUserCode: true,
    },
    {
      id: 'fr_3',
      fn: 'middleware',
      file: 'src/middleware.ts',
      line: 31,
      col: 2,
      runtime: 'edge',
      isAsync: true,
      isUserCode: true,
    },
    {
      id: 'fr_4',
      fn: 'createRSCStream',
      file: 'next/dist/server/app-render/create-rsc-stream.js',
      line: 211,
      col: 5,
      runtime: 'node',
      isAsync: true,
      isUserCode: false,
    },
    {
      id: 'fr_5',
      fn: 'renderToReadableStream',
      file: 'react-server-dom-webpack/server.edge.js',
      line: 442,
      col: 1,
      runtime: 'edge',
      isAsync: false,
      isUserCode: false,
    },
    {
      id: 'fr_6',
      fn: 'processTicksAndRejections',
      file: 'node:internal/process/task_queues',
      line: 95,
      col: 5,
      runtime: 'node',
      isAsync: false,
      isUserCode: false,
    },
    {
      id: 'fr_7',
      fn: '<anonymous>',
      file: 'node:internal/main/run_main_module',
      line: 23,
      col: 47,
      runtime: 'node',
      isAsync: false,
      isUserCode: false,
    },
  ],
  threads: [
    { id: 'th_main', label: 'main', state: 'paused', ms: 0 },
    { id: 'th_w1', label: 'worker:render-1', state: 'running', ms: 142 },
    { id: 'th_w2', label: 'worker:render-2', state: 'idle', ms: 0 },
    { id: 'th_io', label: 'io-bridge', state: 'blocked', ms: 88 },
  ],
  scripts: [
    { id: 's_1', name: 'page.tsx', runtime: 'node' },
    { id: 's_2', name: 'middleware.ts', runtime: 'edge' },
    { id: 's_3', name: 'fetch-product.ts', runtime: 'node' },
    { id: 's_4', name: 'cache.ts', runtime: 'node' },
    { id: 's_5', name: 'app-render.js', runtime: 'node' },
    { id: 's_6', name: 'server.edge.js', runtime: 'edge' },
    { id: 's_7', name: 'route-handlers.js', runtime: 'node' },
    { id: 's_8', name: 'rsc-payload.js', runtime: 'node' },
  ],
};

export const SOURCE_PREVIEW: ReadonlyArray<string> = [
  '  const { id } = await params;',
  '  const session = await getSession();',
  '  if (!session?.user) {',
  '    return notFound();',
  '  }',
  '',
  '  // Fetch product (CACHE: tag=product:${id})',
  '  const product = await fetchProduct(id, {',
  '    next: { tags: [`product:${id}`] },',
  '  });',
  '',
  '  if (!product) return notFound();',
];

export const ACTIVE_LINE_OFFSET_FROM_START = 5; // 0-based index of "current" line in preview
