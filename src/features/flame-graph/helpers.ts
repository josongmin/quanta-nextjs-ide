export type FrameKind = 'react' | 'app' | 'lib' | 'browser' | 'gc';

export interface FlameFrame {
  id: string;
  parentId: string | null;
  name: string;
  selfMs: number;
  totalMs: number;
  kind: FrameKind;
}

interface DraftFrame {
  name: string;
  kind: FrameKind;
  selfMs: number;
  children?: ReadonlyArray<DraftFrame>;
}

function flatten(
  draft: DraftFrame,
  parentId: string | null,
  prefix: string,
  acc: FlameFrame[],
): FlameFrame {
  const id = prefix;
  const children = (draft.children ?? []).map((c, i) =>
    flatten(c, id, `${prefix}_${i}`, acc),
  );
  const totalMs =
    draft.selfMs + children.reduce((sum, c) => sum + c.totalMs, 0);
  const node: FlameFrame = {
    id,
    parentId,
    name: draft.name,
    selfMs: draft.selfMs,
    totalMs,
    kind: draft.kind,
  };
  acc.push(node);
  return node;
}

const tree: DraftFrame = {
  name: '(root)',
  kind: 'browser',
  selfMs: 4,
  children: [
    {
      name: 'App.render',
      kind: 'react',
      selfMs: 14,
      children: [
        {
          name: 'Layout.render',
          kind: 'react',
          selfMs: 8,
          children: [
            {
              name: 'Header.render',
              kind: 'react',
              selfMs: 6,
              children: [
                { name: 'Logo.render', kind: 'react', selfMs: 1.5 },
                {
                  name: 'NavMenu.render',
                  kind: 'react',
                  selfMs: 4,
                  children: [
                    { name: 'NavItem.render×6', kind: 'react', selfMs: 12 },
                    { name: 'measureText', kind: 'browser', selfMs: 3 },
                  ],
                },
                { name: 'Avatar.render', kind: 'react', selfMs: 2 },
              ],
            },
            {
              name: 'Main.render',
              kind: 'react',
              selfMs: 9,
              children: [
                {
                  name: 'ProductGrid.render',
                  kind: 'react',
                  selfMs: 18,
                  children: [
                    { name: 'ProductCard.render×24', kind: 'react', selfMs: 64 },
                    { name: 'lodash.sortBy', kind: 'lib', selfMs: 22 },
                    { name: 'date-fns.format', kind: 'lib', selfMs: 6 },
                  ],
                },
                {
                  name: 'Sidebar.render',
                  kind: 'react',
                  selfMs: 7,
                  children: [
                    { name: 'FilterPanel.render', kind: 'react', selfMs: 12 },
                    { name: 'parseFilters', kind: 'app', selfMs: 8 },
                  ],
                },
              ],
            },
            { name: 'Footer.render', kind: 'react', selfMs: 3 },
          ],
        },
      ],
    },
    {
      name: 'Suspense.read',
      kind: 'react',
      selfMs: 6,
      children: [
        {
          name: 'cache.read',
          kind: 'app',
          selfMs: 4,
          children: [
            { name: 'unwrapPromise', kind: 'react', selfMs: 3 },
            { name: 'JSON.parse', kind: 'browser', selfMs: 14 },
          ],
        },
        {
          name: 'fallback.render',
          kind: 'react',
          selfMs: 5,
          children: [
            { name: 'Spinner.render', kind: 'react', selfMs: 2 },
            { name: 'Skeleton.render×8', kind: 'react', selfMs: 12 },
          ],
        },
      ],
    },
    {
      name: 'fetch_resolve',
      kind: 'browser',
      selfMs: 8,
      children: [
        {
          name: 'parseResponseBody',
          kind: 'browser',
          selfMs: 22,
          children: [
            { name: 'TextDecoder.decode', kind: 'browser', selfMs: 9 },
            { name: 'JSON.parse', kind: 'browser', selfMs: 28 },
            { name: 'normalize', kind: 'app', selfMs: 14 },
          ],
        },
        {
          name: 'invalidateQueries',
          kind: 'lib',
          selfMs: 12,
          children: [
            { name: 'subscribers.notify', kind: 'lib', selfMs: 9 },
            { name: 'shallowEqual', kind: 'lib', selfMs: 4 },
          ],
        },
      ],
    },
    {
      name: 'commitWork',
      kind: 'react',
      selfMs: 14,
      children: [
        {
          name: 'commitMutationEffects',
          kind: 'react',
          selfMs: 10,
          children: [
            { name: 'commitPlacement', kind: 'react', selfMs: 16 },
            { name: 'commitDeletion', kind: 'react', selfMs: 4 },
            { name: 'safelyCallDestroy', kind: 'react', selfMs: 6 },
          ],
        },
        { name: 'commitLayoutEffects', kind: 'react', selfMs: 18 },
        {
          name: 'flushPassiveEffects',
          kind: 'react',
          selfMs: 22,
          children: [
            { name: 'useEffect cb', kind: 'app', selfMs: 14 },
            { name: 'subscribe', kind: 'lib', selfMs: 6 },
          ],
        },
      ],
    },
    {
      name: 'paint',
      kind: 'browser',
      selfMs: 26,
      children: [
        { name: 'recalcStyle', kind: 'browser', selfMs: 18 },
        { name: 'layout', kind: 'browser', selfMs: 22 },
        { name: 'rasterize', kind: 'browser', selfMs: 14 },
      ],
    },
    {
      name: 'gc',
      kind: 'gc',
      selfMs: 32,
      children: [
        { name: 'minorGC', kind: 'gc', selfMs: 14 },
        { name: 'majorGC.markSweep', kind: 'gc', selfMs: 36 },
      ],
    },
  ],
};

const flat: FlameFrame[] = [];
flatten(tree, null, 'f', flat);

export const FRAMES: ReadonlyArray<FlameFrame> = flat;
export const ROOT_ID = 'f';
export const TOTAL_MS = flat.find((f) => f.id === ROOT_ID)?.totalMs ?? 0;

export const ALL_KINDS: ReadonlyArray<FrameKind> = [
  'react',
  'app',
  'lib',
  'browser',
  'gc',
];

export function childrenOf(id: string): ReadonlyArray<FlameFrame> {
  return FRAMES.filter((f) => f.parentId === id);
}

export function frameById(id: string): FlameFrame | undefined {
  return FRAMES.find((f) => f.id === id);
}

export function depthOf(id: string): number {
  let d = 0;
  let cur = frameById(id);
  while (cur && cur.parentId !== null) {
    d += 1;
    cur = frameById(cur.parentId);
  }
  return d;
}

export function descendantsOf(id: string): ReadonlyArray<FlameFrame> {
  const queue: string[] = [id];
  const out: FlameFrame[] = [];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const node = frameById(cur);
    if (node) out.push(node);
    for (const c of childrenOf(cur)) queue.push(c.id);
  }
  return out;
}

export function isDescendant(id: string, ancestorId: string): boolean {
  let cur = frameById(id);
  while (cur) {
    if (cur.id === ancestorId) return true;
    if (cur.parentId === null) return false;
    cur = frameById(cur.parentId);
  }
  return false;
}

export function topChildrenByTotal(
  id: string,
  n: number,
): ReadonlyArray<FlameFrame> {
  return [...childrenOf(id)]
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, n);
}

export function longestFrame(): FlameFrame {
  return [...FRAMES]
    .filter((f) => f.id !== ROOT_ID)
    .sort((a, b) => b.totalMs - a.totalMs)[0]!;
}
