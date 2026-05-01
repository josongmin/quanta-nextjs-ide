export type TypeKind = 'interface' | 'class' | 'union' | 'type';

export interface TypeMember {
  readonly name: string;
  readonly kind: 'field' | 'method';
  readonly signature: string;
}

export interface TypeNode {
  readonly id: string;
  readonly name: string;
  readonly kind: TypeKind;
  readonly file: string;
  readonly line: number;
  readonly abstract: boolean;
  readonly extendsIds: ReadonlyArray<string>;
  readonly implementsIds: ReadonlyArray<string>;
  readonly members: ReadonlyArray<TypeMember>;
}

export const TYPES: ReadonlyArray<TypeNode> = [
  {
    id: 'Identifiable',
    name: 'Identifiable',
    kind: 'interface',
    file: 'src/shared/types/base.ts',
    line: 4,
    abstract: true,
    extendsIds: [],
    implementsIds: [],
    members: [{ name: 'id', kind: 'field', signature: 'id: string' }],
  },
  {
    id: 'Timestamped',
    name: 'Timestamped',
    kind: 'interface',
    file: 'src/shared/types/base.ts',
    line: 12,
    abstract: true,
    extendsIds: [],
    implementsIds: [],
    members: [
      { name: 'createdAt', kind: 'field', signature: 'createdAt: number' },
      { name: 'updatedAt', kind: 'field', signature: 'updatedAt: number' },
    ],
  },
  {
    id: 'Entity',
    name: 'Entity',
    kind: 'interface',
    file: 'src/shared/types/base.ts',
    line: 22,
    abstract: true,
    extendsIds: ['Identifiable', 'Timestamped'],
    implementsIds: [],
    members: [],
  },
  {
    id: 'User',
    name: 'User',
    kind: 'interface',
    file: 'src/entities/user/types.ts',
    line: 6,
    abstract: false,
    extendsIds: ['Entity'],
    implementsIds: [],
    members: [
      { name: 'email', kind: 'field', signature: 'email: string' },
      { name: 'name', kind: 'field', signature: 'name: string' },
    ],
  },
  {
    id: 'Customer',
    name: 'Customer',
    kind: 'interface',
    file: 'src/entities/customer/types.ts',
    line: 8,
    abstract: false,
    extendsIds: ['User'],
    implementsIds: [],
    members: [
      { name: 'address', kind: 'field', signature: 'address: Address' },
      { name: 'orders', kind: 'field', signature: 'orders: Order[]' },
    ],
  },
  {
    id: 'AdminUser',
    name: 'AdminUser',
    kind: 'interface',
    file: 'src/entities/user/admin.ts',
    line: 6,
    abstract: false,
    extendsIds: ['User'],
    implementsIds: [],
    members: [
      { name: 'role', kind: 'field', signature: "role: 'admin' | 'super'" },
      { name: 'perms', kind: 'field', signature: 'perms: string[]' },
    ],
  },
  {
    id: 'Order',
    name: 'Order',
    kind: 'interface',
    file: 'src/entities/order/types.ts',
    line: 5,
    abstract: false,
    extendsIds: ['Entity'],
    implementsIds: [],
    members: [
      { name: 'items', kind: 'field', signature: 'items: CartItem[]' },
      { name: 'total', kind: 'field', signature: 'total: number' },
    ],
  },
  {
    id: 'Store',
    name: 'Store',
    kind: 'class',
    file: 'src/shared/store/store.ts',
    line: 9,
    abstract: true,
    extendsIds: [],
    implementsIds: [],
    members: [
      { name: 'subscribe', kind: 'method', signature: 'subscribe(fn: Listener): () => void' },
      { name: 'read', kind: 'method', signature: 'read(): T' },
    ],
  },
  {
    id: 'CartStore',
    name: 'CartStore',
    kind: 'class',
    file: 'src/features/cart/cart.tsx',
    line: 144,
    abstract: false,
    extendsIds: ['Store'],
    implementsIds: [],
    members: [
      { name: 'addItem', kind: 'method', signature: 'addItem(item: CartItem, qty?: number): void' },
      { name: 'removeItem', kind: 'method', signature: 'removeItem(id: string): void' },
      { name: 'clear', kind: 'method', signature: 'clear(): void' },
    ],
  },
  {
    id: 'OrderStore',
    name: 'OrderStore',
    kind: 'class',
    file: 'src/entities/order/store.ts',
    line: 22,
    abstract: false,
    extendsIds: ['Store'],
    implementsIds: [],
    members: [
      { name: 'addOrder', kind: 'method', signature: 'addOrder(o: Order): void' },
    ],
  },
  {
    id: 'Status',
    name: 'Status',
    kind: 'union',
    file: 'src/shared/types/status.ts',
    line: 1,
    abstract: false,
    extendsIds: [],
    implementsIds: [],
    members: [
      { name: 'idle', kind: 'field', signature: "'idle'" },
      { name: 'loading', kind: 'field', signature: "'loading'" },
      { name: 'ready', kind: 'field', signature: "'ready'" },
      { name: 'error', kind: 'field', signature: "'error'" },
    ],
  },
  {
    id: 'OrderStatus',
    name: 'OrderStatus',
    kind: 'union',
    file: 'src/entities/order/status.ts',
    line: 1,
    abstract: false,
    extendsIds: ['Status'],
    implementsIds: [],
    members: [
      { name: 'placed', kind: 'field', signature: "'placed'" },
      { name: 'shipped', kind: 'field', signature: "'shipped'" },
    ],
  },
  {
    id: 'Address',
    name: 'Address',
    kind: 'type',
    file: 'src/shared/types/address.ts',
    line: 1,
    abstract: false,
    extendsIds: [],
    implementsIds: [],
    members: [
      { name: 'street', kind: 'field', signature: 'street: string' },
      { name: 'zip', kind: 'field', signature: 'zip: string' },
    ],
  },
  {
    id: 'CartItem',
    name: 'CartItem',
    kind: 'type',
    file: 'src/features/cart/cart.tsx',
    line: 4,
    abstract: false,
    extendsIds: [],
    implementsIds: [],
    members: [
      { name: 'id', kind: 'field', signature: 'id: string' },
      { name: 'name', kind: 'field', signature: 'name: string' },
      { name: 'qty', kind: 'field', signature: 'qty: number' },
    ],
  },
];

export const ROOT_TYPE_ID = 'Entity';

export type Direction = 'super' | 'sub' | 'both';

export interface LayoutNode {
  readonly id: string;
  readonly node: TypeNode;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly depth: number;
}

export interface LayoutEdge {
  readonly from: string;
  readonly to: string;
}

export interface Layout {
  readonly nodes: ReadonlyArray<LayoutNode>;
  readonly edges: ReadonlyArray<LayoutEdge>;
  readonly width: number;
  readonly height: number;
}

const NODE_W = 160;
const NODE_H = 56;
const X_GAP = 24;
const Y_GAP = 36;

export function findType(id: string): TypeNode | undefined {
  return TYPES.find((t) => t.id === id);
}

function getRelations(
  id: string,
  direction: 'super' | 'sub',
): ReadonlyArray<string> {
  if (direction === 'super') {
    const t = findType(id);
    if (!t) return [];
    return [...t.extendsIds, ...t.implementsIds];
  }
  // subs: any type that extends/implements this
  return TYPES.filter(
    (t) => t.extendsIds.includes(id) || t.implementsIds.includes(id),
  ).map((t) => t.id);
}

interface RawLevel {
  readonly depth: number;
  readonly ids: ReadonlyArray<string>;
}

function gatherLevels(
  rootId: string,
  direction: 'super' | 'sub',
): ReadonlyArray<RawLevel> {
  const visited = new Set<string>();
  const levels: string[][] = [[rootId]];
  visited.add(rootId);
  while (levels[levels.length - 1] && levels[levels.length - 1]!.length > 0) {
    const last = levels[levels.length - 1]!;
    const next: string[] = [];
    for (const id of last) {
      for (const rel of getRelations(id, direction)) {
        if (!visited.has(rel)) {
          visited.add(rel);
          next.push(rel);
        }
      }
    }
    if (next.length === 0) break;
    levels.push(next);
  }
  return levels.map((ids, depth) => ({ depth, ids }));
}

export function layoutTree(
  rootId: string,
  direction: Direction,
  abstractOnly: boolean,
): Layout {
  const filterAbstract = (id: string): boolean => {
    if (!abstractOnly) return true;
    const t = findType(id);
    return t ? t.abstract || id === rootId : false;
  };

  const superLevels = gatherLevels(rootId, 'super');
  const subLevels = gatherLevels(rootId, 'sub');

  // Decide vertical ordering
  // both: super on top (deeper depth = higher), root middle, sub on bottom.
  const placed: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  const filteredSuper = superLevels.map((lv) => ({
    depth: lv.depth,
    ids: lv.ids.filter(filterAbstract),
  }));
  const filteredSub = subLevels.map((lv) => ({
    depth: lv.depth,
    ids: lv.ids.filter(filterAbstract),
  }));

  // Build a stack of rows (top -> bottom) of ids.
  const rows: string[][] = [];

  if (direction === 'super' || direction === 'both') {
    // top first: largest super depth first
    for (let d = filteredSuper.length - 1; d >= 1; d--) {
      const lv = filteredSuper[d];
      if (lv && lv.ids.length > 0) rows.push([...lv.ids]);
    }
  }
  // root row
  rows.push([rootId]);
  if (direction === 'sub' || direction === 'both') {
    for (let d = 1; d < filteredSub.length; d++) {
      const lv = filteredSub[d];
      if (lv && lv.ids.length > 0) rows.push([...lv.ids]);
    }
  }

  if (direction === 'super') {
    // we don't show subs; rows already capped at root row.
  }

  const maxRowLen = rows.reduce((m, r) => Math.max(m, r.length), 1);
  const width = maxRowLen * (NODE_W + X_GAP) + X_GAP;
  const height = rows.length * (NODE_H + Y_GAP) + Y_GAP;

  rows.forEach((row, rowIdx) => {
    const rowWidth = row.length * (NODE_W + X_GAP) - X_GAP;
    const startX = (width - rowWidth) / 2;
    row.forEach((id, colIdx) => {
      const t = findType(id);
      if (!t) return;
      placed.push({
        id,
        node: t,
        x: startX + colIdx * (NODE_W + X_GAP),
        y: Y_GAP / 2 + rowIdx * (NODE_H + Y_GAP),
        w: NODE_W,
        h: NODE_H,
        depth: rowIdx,
      });
    });
  });

  // Edges between adjacent rows (parent above -> child below).
  // For super direction, edge is sub -> super (child arrow pointing up).
  // For sub direction, edge is super -> sub (parent arrow pointing down).
  // We connect every pair where one is a relation of the other.
  for (let r = 0; r < rows.length - 1; r++) {
    const upper = rows[r];
    const lower = rows[r + 1];
    if (!upper || !lower) continue;
    for (const u of upper) {
      for (const l of lower) {
        const lower_t = findType(l);
        const upper_t = findType(u);
        if (!lower_t || !upper_t) continue;
        const lowerExtends = [
          ...lower_t.extendsIds,
          ...lower_t.implementsIds,
        ].includes(u);
        const upperExtends = [
          ...upper_t.extendsIds,
          ...upper_t.implementsIds,
        ].includes(l);
        if (lowerExtends || upperExtends) {
          edges.push({ from: u, to: l });
        }
      }
    }
  }

  return { nodes: placed, edges, width, height };
}

export const KIND_TONE: Record<TypeKind, 'static' | 'isr' | 'dynamic' | 'edge'> =
  {
    interface: 'static',
    class: 'isr',
    union: 'dynamic',
    type: 'edge',
  };
