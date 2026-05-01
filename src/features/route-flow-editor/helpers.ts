import type { Archetype, RenderingClass, Route } from '@shared/types';
import { mockSources } from '@shared/mocks/source-files';

export interface FlowNodeData {
  routeId: string;
  x: number;
  y: number;
  archetype: Archetype;
  path: string;
  rendering: RenderingClass;
  isApi: boolean;
}

export type EdgeKind = 'link' | 'redirect' | 'parallel' | 'intercepting' | 'api-call';

export interface FlowEdgeData {
  id: string;
  from: string; // routeId
  to: string;
  kind: EdgeKind;
}

export type LayoutMode = 'auto' | 'archetype' | 'depth';
export type RouteFilter = 'all' | 'public' | 'authed' | 'admin' | 'api';

const NODE_W = 220;
const NODE_H = 64;
const COL_GAP = 60;
const ROW_GAP = 28;

export function buildFlow(routes: ReadonlyArray<Route>): {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
} {
  const nodes: FlowNodeData[] = routes.map((r) => ({
    routeId: r.id,
    x: 0,
    y: 0,
    archetype: r.archetype,
    path: r.path,
    rendering: r.rendering,
    isApi: r.archetype === 'api' || r.archetype === 'webhook',
  }));

  const edges: FlowEdgeData[] = [];
  const byPath = new Map(routes.map((r) => [r.path, r] as const));
  const byId = new Map(routes.map((r) => [r.id, r] as const));

  // Discover Link / redirect references in mock sources.
  for (const [file, src] of Object.entries(mockSources)) {
    const owner = routes.find(
      (r) => r.files.page === file || r.files.layout === file,
    );
    if (!owner) continue;
    const linkMatches = Array.from(src.matchAll(/<Link\s+href=["']([^"']+)["']/g));
    for (const m of linkMatches) {
      const href = m[1];
      if (!href) continue;
      const target = byPath.get(href);
      if (target && target.id !== owner.id) {
        edges.push({
          id: `e_${owner.id}_link_${target.id}`,
          from: owner.id,
          to: target.id,
          kind: 'link',
        });
      }
    }
    const redirectMatches = Array.from(src.matchAll(/redirect\(["']([^"']+)["']/g));
    for (const m of redirectMatches) {
      const target = byPath.get(m[1] ?? '');
      if (target && target.id !== owner.id) {
        edges.push({
          id: `e_${owner.id}_redirect_${target.id}`,
          from: owner.id,
          to: target.id,
          kind: 'redirect',
        });
      }
    }
  }

  // Parallel / intercepting edges by route metadata.
  for (const r of routes) {
    if (r.isParallel || r.isIntercepting) {
      // Find a sibling root route to draw the parallel link to.
      const candidate = routes.find(
        (other) =>
          other.id !== r.id &&
          other.archetype === r.archetype &&
          !other.isParallel &&
          !other.isIntercepting,
      );
      if (candidate) {
        edges.push({
          id: `e_${r.id}_parallel_${candidate.id}`,
          from: r.id,
          to: candidate.id,
          kind: r.isIntercepting ? 'intercepting' : 'parallel',
        });
      }
    }
  }

  return { nodes, edges, ...{ byId } } as { nodes: FlowNodeData[]; edges: FlowEdgeData[] };
}

export function applyFilter(
  nodes: FlowNodeData[],
  filter: RouteFilter,
  routesById: Map<string, Route>,
): FlowNodeData[] {
  if (filter === 'all') return nodes;
  return nodes.filter((n) => {
    const r = routesById.get(n.routeId);
    if (!r) return false;
    switch (filter) {
      case 'public':
        return r.auth.archetypeExpected === 'public' && !n.isApi;
      case 'authed':
        return r.auth.archetypeExpected === 'user';
      case 'admin':
        return r.auth.archetypeExpected === 'admin';
      case 'api':
        return n.isApi;
    }
  });
}

// --------- Layout strategies ---------

export function layoutAuto(nodes: FlowNodeData[]): FlowNodeData[] {
  // Tree based on URL hierarchy depth (number of "/").
  const depth = (p: string) => Math.max(1, p.split('/').filter(Boolean).length);
  const groups = new Map<number, FlowNodeData[]>();
  for (const n of nodes) {
    const d = n.path === '/' ? 0 : depth(n.path);
    const arr = groups.get(d) ?? [];
    arr.push(n);
    groups.set(d, arr);
  }
  const out: FlowNodeData[] = [];
  const sortedDepths = [...groups.keys()].sort((a, b) => a - b);
  sortedDepths.forEach((d, col) => {
    const list = groups.get(d) ?? [];
    list.forEach((n, row) => {
      out.push({
        ...n,
        x: 40 + col * (NODE_W + COL_GAP),
        y: 40 + row * (NODE_H + ROW_GAP),
      });
    });
  });
  return out;
}

export function layoutByArchetype(nodes: FlowNodeData[]): FlowNodeData[] {
  const order: Archetype[] = [
    'marketing',
    'commerce.list',
    'commerce.product-detail',
    'commerce.cart',
    'commerce.checkout',
    'auth',
    'account',
    'dashboard',
    'admin',
    'blog',
    'docs',
    'api',
    'webhook',
    'unknown',
  ];
  const out: FlowNodeData[] = [];
  let col = 0;
  for (const a of order) {
    const inGroup = nodes.filter((n) => n.archetype === a);
    if (inGroup.length === 0) continue;
    inGroup.forEach((n, row) => {
      out.push({
        ...n,
        x: 40 + col * (NODE_W + COL_GAP),
        y: 40 + row * (NODE_H + ROW_GAP),
      });
    });
    col += 1;
  }
  return out;
}

export function layoutByDepth(nodes: FlowNodeData[]): FlowNodeData[] {
  const depth = (p: string) =>
    p === '/' ? 0 : p.split('/').filter(Boolean).length;
  const sorted = [...nodes].sort((a, b) => {
    const da = depth(a.path);
    const db = depth(b.path);
    if (da !== db) return da - db;
    return a.path.localeCompare(b.path);
  });
  const groups = new Map<number, FlowNodeData[]>();
  for (const n of sorted) {
    const d = depth(n.path);
    const arr = groups.get(d) ?? [];
    arr.push(n);
    groups.set(d, arr);
  }
  const out: FlowNodeData[] = [];
  for (const [d, list] of groups) {
    list.forEach((n, row) => {
      out.push({
        ...n,
        x: 40 + d * (NODE_W + COL_GAP),
        y: 40 + row * (NODE_H + ROW_GAP),
      });
    });
  }
  return out;
}

export function applyLayout(
  nodes: FlowNodeData[],
  mode: LayoutMode,
): FlowNodeData[] {
  switch (mode) {
    case 'archetype':
      return layoutByArchetype(nodes);
    case 'depth':
      return layoutByDepth(nodes);
    case 'auto':
    default:
      return layoutAuto(nodes);
  }
}

export function bounds(nodes: FlowNodeData[]): { w: number; h: number } {
  if (nodes.length === 0) return { w: 800, h: 400 };
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_W));
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H));
  return { w: maxX + 40, h: maxY + 40 };
}

export const NODE_DIMS = { w: NODE_W, h: NODE_H };

export function edgeColor(kind: EdgeKind): string {
  switch (kind) {
    case 'link':
      return 'hsl(var(--accent))';
    case 'redirect':
      return 'hsl(var(--sev-warn))';
    case 'parallel':
      return 'hsl(var(--sem-edge))';
    case 'intercepting':
      return 'hsl(var(--sem-client))';
    case 'api-call':
      return 'hsl(var(--sev-info))';
  }
}

export function edgeDashed(kind: EdgeKind): boolean {
  return kind === 'parallel' || kind === 'intercepting';
}
