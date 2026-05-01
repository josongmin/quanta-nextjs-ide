export type SnapshotKind = 'jsx' | 'json' | 'image';

export interface SnapshotCase {
  id: string;
  testName: string;
  file: string;
  kind: SnapshotKind;
  beforeText: string;
  afterText: string;
  addedLines: number;
  removedLines: number;
}

export type LineDiffOp = 'eq' | 'add' | 'del';

export interface LineDiffEntry {
  op: LineDiffOp;
  beforeNo: number | null;
  afterNo: number | null;
  text: string;
}

/**
 * Simple line-by-line equality diff. Equal-length runs preserved; otherwise
 * lines are paired greedily and the longer side gets remaining add/del rows.
 */
export function lineDiff(a: string, b: string): ReadonlyArray<LineDiffEntry> {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const out: Array<LineDiffEntry> = [];
  const max = Math.max(aLines.length, bLines.length);
  let aNo = 0;
  let bNo = 0;
  for (let i = 0; i < max; i++) {
    const al = i < aLines.length ? aLines[i] : undefined;
    const bl = i < bLines.length ? bLines[i] : undefined;
    if (al !== undefined && bl !== undefined) {
      if (al === bl) {
        aNo += 1;
        bNo += 1;
        out.push({ op: 'eq', beforeNo: aNo, afterNo: bNo, text: al });
      } else {
        aNo += 1;
        bNo += 1;
        out.push({ op: 'del', beforeNo: aNo, afterNo: null, text: al });
        out.push({ op: 'add', beforeNo: null, afterNo: bNo, text: bl });
      }
    } else if (al !== undefined) {
      aNo += 1;
      out.push({ op: 'del', beforeNo: aNo, afterNo: null, text: al });
    } else if (bl !== undefined) {
      bNo += 1;
      out.push({ op: 'add', beforeNo: null, afterNo: bNo, text: bl });
    }
  }
  return out;
}

const PC_BEFORE = `<article class="card">
  <h3>Coffee Mug</h3>
  <p class="price">$12.00</p>
  <button>Add</button>
</article>`;

const PC_AFTER = `<article class="card">
  <h3>Coffee Mug</h3>
  <p class="price">$12.50</p>
  <button data-test="add-cart">Add to cart</button>
</article>`;

const ORDER_BEFORE = `{
  "id": "ord_001",
  "total": 24.0,
  "items": [
    { "sku": "MUG", "qty": 2 }
  ],
  "status": "pending"
}`;

const ORDER_AFTER = `{
  "id": "ord_001",
  "total": 25.0,
  "currency": "USD",
  "items": [
    { "sku": "MUG", "qty": 2 }
  ],
  "status": "paid"
}`;

const HEADER_BEFORE = `<header>
  <a href="/">Home</a>
  <a href="/products">Shop</a>
  <a href="/cart">Cart</a>
</header>`;

const HEADER_AFTER = `<header>
  <a href="/">Home</a>
  <a href="/products">Shop</a>
  <a href="/orders">Orders</a>
  <a href="/cart">Cart (2)</a>
</header>`;

const ERR_BEFORE = `{
  "ok": true,
  "data": []
}`;

const ERR_AFTER = `{
  "ok": false,
  "error": "rate_limited",
  "retryAfter": 30
}`;

export const snapshots: ReadonlyArray<SnapshotCase> = [
  {
    id: 'snap_pc',
    testName: 'ProductCard renders with price',
    file: 'src/components/__tests__/product-card.test.tsx',
    kind: 'jsx',
    beforeText: PC_BEFORE,
    afterText: PC_AFTER,
    addedLines: 2,
    removedLines: 2,
  },
  {
    id: 'snap_order',
    testName: 'orderApi.createOrder response',
    file: 'src/server/__tests__/orders.test.ts',
    kind: 'json',
    beforeText: ORDER_BEFORE,
    afterText: ORDER_AFTER,
    addedLines: 2,
    removedLines: 2,
  },
  {
    id: 'snap_header',
    testName: 'Header layout',
    file: 'src/components/__tests__/header.test.tsx',
    kind: 'jsx',
    beforeText: HEADER_BEFORE,
    afterText: HEADER_AFTER,
    addedLines: 2,
    removedLines: 1,
  },
  {
    id: 'snap_err',
    testName: 'rateLimit serializer',
    file: 'src/server/__tests__/rate-limit.test.ts',
    kind: 'json',
    beforeText: ERR_BEFORE,
    afterText: ERR_AFTER,
    addedLines: 3,
    removedLines: 2,
  },
  {
    id: 'snap_hero',
    testName: 'Hero image diff',
    file: 'src/components/__tests__/hero.visual.test.tsx',
    kind: 'image',
    beforeText: '',
    afterText: '',
    addedLines: 0,
    removedLines: 0,
  },
  {
    id: 'snap_logo',
    testName: 'Logo SVG visual',
    file: 'src/components/__tests__/logo.visual.test.tsx',
    kind: 'image',
    beforeText: '',
    afterText: '',
    addedLines: 0,
    removedLines: 0,
  },
];
