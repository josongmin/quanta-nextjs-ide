export interface DbColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: { table: string; column: string };
  nullable?: boolean;
}

export interface DbTable {
  name: string;
  columns: ReadonlyArray<DbColumn>;
  rowCount: number;
  rows: ReadonlyArray<ReadonlyArray<string | number>>;
}

export const TABLES: ReadonlyArray<DbTable> = [
  {
    name: 'users',
    rowCount: 1284,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'email', type: 'text' },
      { name: 'name', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz' },
    ],
    rows: [
      ['u_001', 'ada@example.com', 'Ada', '2025-04-12'],
      ['u_002', 'lin@example.com', 'Lin', '2025-04-13'],
      ['u_003', 'mei@example.com', 'Mei', '2025-04-14'],
      ['u_004', 'ben@example.com', 'Ben', '2025-04-15'],
      ['u_005', 'kai@example.com', 'Kai', '2025-04-16'],
      ['u_006', 'noa@example.com', 'Noa', '2025-04-17'],
      ['u_007', 'rio@example.com', 'Rio', '2025-04-18'],
      ['u_008', 'sky@example.com', 'Sky', '2025-04-19'],
      ['u_009', 'tom@example.com', 'Tom', '2025-04-20'],
      ['u_010', 'val@example.com', 'Val', '2025-04-21'],
      ['u_011', 'wen@example.com', 'Wen', '2025-04-22'],
      ['u_012', 'xio@example.com', 'Xio', '2025-04-23'],
    ],
  },
  {
    name: 'orders',
    rowCount: 9421,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'user_id', type: 'uuid', fk: { table: 'users', column: 'id' } },
      { name: 'total', type: 'numeric(10,2)' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'timestamptz' },
    ],
    rows: [
      ['o_001', 'u_001', 49.5, 'paid', '2025-04-22'],
      ['o_002', 'u_002', 19.99, 'paid', '2025-04-22'],
      ['o_003', 'u_001', 12.0, 'refunded', '2025-04-23'],
      ['o_004', 'u_003', 89.0, 'paid', '2025-04-23'],
      ['o_005', 'u_004', 32.5, 'pending', '2025-04-24'],
      ['o_006', 'u_005', 15.0, 'paid', '2025-04-24'],
      ['o_007', 'u_006', 99.0, 'paid', '2025-04-25'],
      ['o_008', 'u_002', 24.0, 'paid', '2025-04-25'],
      ['o_009', 'u_007', 7.5, 'paid', '2025-04-26'],
      ['o_010', 'u_008', 60.0, 'paid', '2025-04-26'],
      ['o_011', 'u_009', 110.0, 'pending', '2025-04-27'],
      ['o_012', 'u_010', 18.5, 'paid', '2025-04-27'],
    ],
  },
  {
    name: 'products',
    rowCount: 218,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'name', type: 'text' },
      { name: 'price', type: 'numeric(10,2)' },
      { name: 'stock', type: 'integer' },
    ],
    rows: [
      ['p_001', 'Hex Mug', 19.99, 42],
      ['p_002', 'Slate Tee', 24.0, 81],
      ['p_003', 'Wool Hat', 32.5, 9],
      ['p_004', 'Linen Tote', 28.0, 25],
      ['p_005', 'Lab Notebook', 12.0, 130],
      ['p_006', 'Pin Set', 8.0, 240],
      ['p_007', 'Glass Bottle', 18.5, 60],
      ['p_008', 'Leather Tag', 14.0, 33],
      ['p_009', 'Trail Cap', 22.0, 18],
      ['p_010', 'Coffee Bag', 16.0, 75],
      ['p_011', 'Thermal Mug', 26.5, 12],
      ['p_012', 'Wax Cloth', 11.0, 90],
    ],
  },
  {
    name: 'order_items',
    rowCount: 21540,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'order_id', type: 'uuid', fk: { table: 'orders', column: 'id' } },
      { name: 'product_id', type: 'uuid', fk: { table: 'products', column: 'id' } },
      { name: 'qty', type: 'integer' },
      { name: 'unit_price', type: 'numeric(10,2)' },
    ],
    rows: [
      ['oi_01', 'o_001', 'p_001', 2, 19.99],
      ['oi_02', 'o_001', 'p_005', 1, 12.0],
      ['oi_03', 'o_002', 'p_002', 1, 24.0],
      ['oi_04', 'o_003', 'p_006', 3, 8.0],
      ['oi_05', 'o_004', 'p_003', 2, 32.5],
      ['oi_06', 'o_005', 'p_007', 1, 18.5],
      ['oi_07', 'o_006', 'p_008', 1, 14.0],
      ['oi_08', 'o_007', 'p_009', 4, 22.0],
      ['oi_09', 'o_008', 'p_010', 1, 16.0],
      ['oi_10', 'o_009', 'p_011', 1, 26.5],
      ['oi_11', 'o_010', 'p_012', 5, 11.0],
      ['oi_12', 'o_011', 'p_001', 1, 19.99],
    ],
  },
];

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  ms: number;
  rowCount: number;
  rows: ReadonlyArray<ReadonlyArray<string | number>>;
  cols: ReadonlyArray<string>;
  plan: string;
}

export const SAVED_QUERIES: ReadonlyArray<SavedQuery> = [
  {
    id: 'q_top_users',
    name: 'Top users by revenue',
    sql: `SELECT u.name, SUM(o.total) AS revenue
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid'
GROUP BY u.name
ORDER BY revenue DESC
LIMIT 10;`,
    ms: 42,
    rowCount: 10,
    cols: ['name', 'revenue'],
    rows: [
      ['Ada', 320.5],
      ['Lin', 280.0],
      ['Mei', 220.0],
      ['Ben', 199.5],
      ['Kai', 180.0],
      ['Noa', 175.0],
      ['Rio', 160.0],
      ['Sky', 150.0],
      ['Tom', 142.5],
      ['Val', 130.0],
    ],
    plan:
      'HashAggregate  (cost=412.10..422.50 rows=10)\n  ->  Hash Join  (cost=120.00..380.00)\n        Hash Cond: (o.user_id = u.id)\n        ->  Seq Scan on orders o\n        ->  Hash\n              ->  Seq Scan on users u',
  },
  {
    id: 'q_low_stock',
    name: 'Low-stock products',
    sql: 'SELECT name, stock FROM products WHERE stock < 20 ORDER BY stock ASC;',
    ms: 8,
    rowCount: 4,
    cols: ['name', 'stock'],
    rows: [
      ['Wool Hat', 9],
      ['Thermal Mug', 12],
      ['Trail Cap', 18],
      ['Glass Bottle', 60],
    ],
    plan: 'Sort  (cost=20.00..20.10 rows=20)\n  ->  Seq Scan on products  Filter: (stock < 20)',
  },
  {
    id: 'q_pending',
    name: 'Pending orders',
    sql: "SELECT id, total FROM orders WHERE status = 'pending';",
    ms: 12,
    rowCount: 2,
    cols: ['id', 'total'],
    rows: [
      ['o_005', 32.5],
      ['o_011', 110.0],
    ],
    plan: 'Index Scan using orders_status_idx on orders',
  },
  {
    id: 'q_avg_order',
    name: 'Avg order total',
    sql: 'SELECT AVG(total)::numeric(10,2) AS avg FROM orders;',
    ms: 5,
    rowCount: 1,
    cols: ['avg'],
    rows: [[42.83]],
    plan: 'Aggregate  ->  Seq Scan on orders',
  },
  {
    id: 'q_orders_by_day',
    name: 'Orders by day',
    sql: "SELECT created_at::date AS day, COUNT(*) FROM orders GROUP BY day;",
    ms: 14,
    rowCount: 6,
    cols: ['day', 'count'],
    rows: [
      ['2025-04-22', 2],
      ['2025-04-23', 2],
      ['2025-04-24', 2],
      ['2025-04-25', 2],
      ['2025-04-26', 2],
      ['2025-04-27', 2],
    ],
    plan: 'GroupAggregate  ->  Sort  ->  Seq Scan on orders',
  },
  {
    id: 'q_users_no_orders',
    name: 'Users with no orders',
    sql: `SELECT u.id, u.email
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;`,
    ms: 22,
    rowCount: 2,
    cols: ['id', 'email'],
    rows: [
      ['u_011', 'wen@example.com'],
      ['u_012', 'xio@example.com'],
    ],
    plan: 'Hash Anti Join  ->  Seq Scan on users  ->  Hash  ->  Seq Scan on orders',
  },
];

// Schema versions A and B for diff tab
export interface SchemaDiffEntry {
  table: string;
  kind: 'added' | 'removed' | 'changed';
  column: string;
  oldType?: string;
  newType?: string;
  note?: string;
}

export const SCHEMA_DIFF: ReadonlyArray<SchemaDiffEntry> = [
  {
    table: 'users',
    kind: 'added',
    column: 'phone',
    newType: 'text NULL',
    note: 'optional contact field',
  },
  {
    table: 'users',
    kind: 'changed',
    column: 'name',
    oldType: 'text NULL',
    newType: 'text NOT NULL',
    note: 'tighten constraint',
  },
  {
    table: 'orders',
    kind: 'added',
    column: 'currency',
    newType: 'text NOT NULL DEFAULT \'USD\'',
  },
  {
    table: 'orders',
    kind: 'removed',
    column: 'legacy_ref',
    oldType: 'text NULL',
    note: 'unused since v0.7',
  },
  {
    table: 'orders',
    kind: 'changed',
    column: 'total',
    oldType: 'numeric(8,2)',
    newType: 'numeric(10,2)',
    note: 'support larger orders',
  },
  {
    table: 'products',
    kind: 'added',
    column: 'sku',
    newType: 'text UNIQUE',
  },
  {
    table: 'order_items',
    kind: 'changed',
    column: 'qty',
    oldType: 'integer',
    newType: 'integer CHECK (qty > 0)',
  },
];

export function diffKindTone(k: SchemaDiffEntry['kind']): 'static' | 'err' | 'warn' {
  return k === 'added' ? 'static' : k === 'removed' ? 'err' : 'warn';
}

export function diffSign(k: SchemaDiffEntry['kind']): string {
  return k === 'added' ? '+' : k === 'removed' ? '−' : '~';
}

export const SQL_KEYWORDS = new Set<string>([
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'GROUP',
  'BY',
  'ORDER',
  'LIMIT',
  'AS',
  'ON',
  'AND',
  'OR',
  'NULL',
  'IS',
  'NOT',
  'COUNT',
  'SUM',
  'AVG',
  'DISTINCT',
  'IN',
]);

export interface JoinSuggestion {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  cardinality: 'one-to-many' | 'many-to-one' | 'many-to-many';
  sql: string;
}

export function suggestJoin(a: string, b: string): JoinSuggestion | undefined {
  if (a === b) return undefined;
  // try fk from a -> b
  const ta = TABLES.find((t) => t.name === a);
  const tb = TABLES.find((t) => t.name === b);
  if (!ta || !tb) return undefined;
  const fkAB = ta.columns.find((c) => c.fk?.table === b);
  if (fkAB && fkAB.fk) {
    return {
      fromTable: a,
      fromCol: fkAB.name,
      toTable: b,
      toCol: fkAB.fk.column,
      cardinality: 'many-to-one',
      sql: `SELECT *\nFROM ${a}\nJOIN ${b} ON ${b}.${fkAB.fk.column} = ${a}.${fkAB.name};`,
    };
  }
  const fkBA = tb.columns.find((c) => c.fk?.table === a);
  if (fkBA && fkBA.fk) {
    return {
      fromTable: a,
      fromCol: fkBA.fk.column,
      toTable: b,
      toCol: fkBA.name,
      cardinality: 'one-to-many',
      sql: `SELECT *\nFROM ${a}\nJOIN ${b} ON ${b}.${fkBA.name} = ${a}.${fkBA.fk.column};`,
    };
  }
  return undefined;
}
