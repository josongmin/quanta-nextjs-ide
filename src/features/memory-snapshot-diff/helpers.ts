export interface RetainerStep {
  label: string;
  hint?: string;
}

export interface SnapshotGroup {
  constructor: string;
  count: number;
  retainedSize: number; // bytes
  retainerChain: ReadonlyArray<ReadonlyArray<RetainerStep>>;
}

export interface Snapshot {
  id: string;
  label: string;
  capturedAt: string;
  groups: ReadonlyArray<SnapshotGroup>;
}

export interface DiffRow {
  constructor: string;
  beforeCount: number;
  afterCount: number;
  deltaCount: number;
  beforeSize: number;
  afterSize: number;
  deltaSize: number;
  retainerChains: ReadonlyArray<ReadonlyArray<RetainerStep>>;
  leakHint?: { kind: 'detached' | 'listener' | 'cache' | 'closure'; reason: string };
}

const CONSTRUCTORS: ReadonlyArray<{
  name: string;
  base: number;
  countBase: number;
  growth: number;
  countGrowth: number;
  chains: ReadonlyArray<ReadonlyArray<RetainerStep>>;
  leak?: DiffRow['leakHint'];
}> = [
  {
    name: 'HTMLDivElement',
    base: 24_500,
    countBase: 410,
    growth: 88_400,
    countGrowth: 1_240,
    chains: [
      [
        { label: 'window' },
        { label: 'document' },
        { label: '#virtualized-list' },
        { label: 'div.row[2840]', hint: 'detached subtree' },
      ],
      [
        { label: 'ReactRoot' },
        { label: 'FiberNode (List)' },
        { label: 'stateNode<HTMLDivElement>' },
      ],
    ],
    leak: {
      kind: 'detached',
      reason: 'Detached DOM held by virtualized list cache map',
    },
  },
  {
    name: 'Function',
    base: 18_900,
    countBase: 2_100,
    growth: 36_400,
    countGrowth: 4_120,
    chains: [
      [
        { label: 'EventTarget#button' },
        { label: 'listeners["click"]' },
        { label: 'fn handleClick' },
      ],
      [
        { label: 'closure: useEffect' },
        { label: 'cb: subscribe' },
      ],
    ],
    leak: {
      kind: 'listener',
      reason: 'click handlers attached without removeEventListener on unmount',
    },
  },
  {
    name: 'Array',
    base: 64_200,
    countBase: 880,
    growth: 22_100,
    countGrowth: 240,
    chains: [
      [
        { label: 'queryClient' },
        { label: 'cache.queries' },
        { label: 'Array<QueryObserver>' },
      ],
    ],
  },
  {
    name: 'Object',
    base: 132_400,
    countBase: 5_640,
    growth: 14_200,
    countGrowth: 340,
    chains: [[{ label: 'Module<react>' }, { label: 'shared internals' }]],
  },
  {
    name: 'String',
    base: 84_800,
    countBase: 9_240,
    growth: 9_400,
    countGrowth: 740,
    chains: [[{ label: 'cache.responses' }, { label: 'JSON text' }]],
  },
  {
    name: 'Map',
    base: 12_400,
    countBase: 84,
    growth: 28_900,
    countGrowth: 220,
    chains: [
      [
        { label: 'window' },
        { label: '__cache__' },
        { label: 'Map<id, ProductCard>' },
      ],
    ],
    leak: {
      kind: 'cache',
      reason: 'Unbounded cache: Map grows but never evicts.',
    },
  },
  {
    name: 'Promise',
    base: 9_400,
    countBase: 320,
    growth: 14_800,
    countGrowth: 480,
    chains: [
      [
        { label: 'fetch_resolve' },
        { label: 'pendingPromises[]' },
        { label: 'Promise(resolved)' },
      ],
    ],
  },
  {
    name: 'FiberNode',
    base: 22_100,
    countBase: 920,
    growth: 4_800,
    countGrowth: 80,
    chains: [
      [
        { label: 'ReactRoot' },
        { label: 'current' },
        { label: 'child.sibling…' },
      ],
    ],
  },
  {
    name: 'ImageBitmap',
    base: 86_400,
    countBase: 24,
    growth: 64_800,
    countGrowth: 18,
    chains: [
      [
        { label: 'ImageGallery' },
        { label: 'cachedBitmaps[]' },
        { label: 'ImageBitmap(2048x1536)' },
      ],
    ],
    leak: {
      kind: 'cache',
      reason: 'High-res ImageBitmaps retained beyond viewport.',
    },
  },
  {
    name: 'Canvas',
    base: 16_800,
    countBase: 6,
    growth: 12_400,
    countGrowth: 4,
    chains: [
      [{ label: 'ChartView' }, { label: 'offscreenCanvasPool' }],
    ],
  },
  {
    name: 'WeakMap',
    base: 4_800,
    countBase: 24,
    growth: 1_200,
    countGrowth: 6,
    chains: [[{ label: 'react-internals' }, { label: 'fiber metadata' }]],
  },
  {
    name: 'Set',
    base: 6_200,
    countBase: 38,
    growth: 8_900,
    countGrowth: 78,
    chains: [
      [
        { label: 'subscribers' },
        { label: 'Set<Listener>' },
      ],
    ],
  },
  {
    name: 'RegExp',
    base: 2_400,
    countBase: 64,
    growth: 800,
    countGrowth: 12,
    chains: [[{ label: 'router' }, { label: 'route patterns[]' }]],
  },
  {
    name: 'AbortSignal',
    base: 1_200,
    countBase: 18,
    growth: 6_400,
    countGrowth: 88,
    chains: [
      [
        { label: 'fetchController' },
        { label: 'AbortSignal.none' },
        { label: 'subscribers Set' },
      ],
    ],
    leak: {
      kind: 'listener',
      reason: 'Abort signal subscribers not cleared between requests.',
    },
  },
  {
    name: 'Worker',
    base: 8_400,
    countBase: 4,
    growth: 4_200,
    countGrowth: 2,
    chains: [[{ label: 'app.workerPool' }, { label: 'Worker(comlink)' }]],
  },
  {
    name: 'WebSocket',
    base: 6_400,
    countBase: 2,
    growth: 0,
    countGrowth: 0,
    chains: [[{ label: 'realtime' }, { label: 'WebSocket' }]],
  },
  {
    name: 'Intl.NumberFormat',
    base: 4_800,
    countBase: 12,
    growth: 9_800,
    countGrowth: 24,
    chains: [
      [
        { label: 'PriceCell.render' },
        { label: 'closure formatter' },
      ],
    ],
    leak: {
      kind: 'closure',
      reason:
        'Intl formatters created per render — keep a module-level singleton.',
    },
  },
  {
    name: 'Date',
    base: 1_400,
    countBase: 88,
    growth: 600,
    countGrowth: 24,
    chains: [[{ label: 'Timeline' }, { label: 'Date[]' }]],
  },
  {
    name: 'Symbol',
    base: 200,
    countBase: 12,
    growth: 100,
    countGrowth: 4,
    chains: [[{ label: 'react-symbols' }]],
  },
  {
    name: 'ArrayBuffer',
    base: 14_800,
    countBase: 6,
    growth: -2_400,
    countGrowth: -2,
    chains: [[{ label: 'wasm.heap' }]],
  },
  {
    name: 'Int8Array',
    base: 3_200,
    countBase: 2,
    growth: 0,
    countGrowth: 0,
    chains: [[{ label: 'codec' }]],
  },
  {
    name: 'Float32Array',
    base: 2_800,
    countBase: 4,
    growth: 1_200,
    countGrowth: 2,
    chains: [[{ label: 'glRenderer' }, { label: 'vertex buffers' }]],
  },
];

function buildSnapshot(
  id: string,
  label: string,
  capturedAt: string,
  scale: number,
  countScale: number,
): Snapshot {
  return {
    id,
    label,
    capturedAt,
    groups: CONSTRUCTORS.map((c) => ({
      constructor: c.name,
      count: Math.round(c.countBase + c.countGrowth * countScale),
      retainedSize: Math.round(c.base + c.growth * scale),
      retainerChain: c.chains,
    })),
  };
}

export const SNAPSHOTS: ReadonlyArray<Snapshot> = [
  buildSnapshot('s_t0', 'Initial mount', '12:04:21', 0, 0),
  buildSnapshot('s_t1', 'After 1m idle', '12:05:18', 0.25, 0.2),
  buildSnapshot('s_t2', 'After 30 navigations', '12:09:03', 0.7, 0.7),
  buildSnapshot('s_t3', 'After stress run', '12:14:46', 1, 1),
];

export function diffSnapshots(
  beforeId: string,
  afterId: string,
): ReadonlyArray<DiffRow> {
  const before = SNAPSHOTS.find((s) => s.id === beforeId) ?? SNAPSHOTS[0]!;
  const after = SNAPSHOTS.find((s) => s.id === afterId) ?? SNAPSHOTS[0]!;
  return CONSTRUCTORS.map((c, i) => {
    const b = before.groups[i]!;
    const a = after.groups[i]!;
    return {
      constructor: c.name,
      beforeCount: b.count,
      afterCount: a.count,
      deltaCount: a.count - b.count,
      beforeSize: b.retainedSize,
      afterSize: a.retainedSize,
      deltaSize: a.retainedSize - b.retainedSize,
      retainerChains: c.chains,
      ...(c.leak ? { leakHint: c.leak } : {}),
    };
  });
}

export function formatKb(bytes: number): string {
  if (Math.abs(bytes) >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function signedKb(bytes: number): string {
  const sign = bytes > 0 ? '+' : bytes < 0 ? '−' : '';
  return `${sign}${formatKb(Math.abs(bytes))}`;
}
