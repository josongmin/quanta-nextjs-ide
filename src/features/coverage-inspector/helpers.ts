export interface LineHit {
  line: number;
  text: string;
  hits: number;
  branchTotal: number;
  branchCovered: number;
}

export interface FileCoverage {
  file: string;
  lines: ReadonlyArray<LineHit>;
  summary: {
    statements: number; // 0..100
    branches: number;
    functions: number;
    lines: number;
  };
}

const cartLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function addItem(cart: Cart, item: Item): Cart {', hits: 24, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  if (!item) return cart;', hits: 24, branchTotal: 2, branchCovered: 1 },
  { line: 3, text: '  const existing = cart.items.find(i => i.id === item.id);', hits: 24, branchTotal: 0, branchCovered: 0 },
  { line: 4, text: '  if (existing) {', hits: 24, branchTotal: 2, branchCovered: 2 },
  { line: 5, text: '    existing.qty += item.qty;', hits: 11, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '    return cart;', hits: 11, branchTotal: 0, branchCovered: 0 },
  { line: 7, text: '  }', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 8, text: '  cart.items.push(item);', hits: 13, branchTotal: 0, branchCovered: 0 },
  { line: 9, text: '  return cart;', hits: 13, branchTotal: 0, branchCovered: 0 },
  { line: 10, text: '}', hits: 24, branchTotal: 0, branchCovered: 0 },
  { line: 11, text: '', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 12, text: 'export function removeItem(cart: Cart, id: string): Cart {', hits: 8, branchTotal: 0, branchCovered: 0 },
  { line: 13, text: '  cart.items = cart.items.filter(i => i.id !== id);', hits: 8, branchTotal: 0, branchCovered: 0 },
  { line: 14, text: '  return cart;', hits: 8, branchTotal: 0, branchCovered: 0 },
  { line: 15, text: '}', hits: 8, branchTotal: 0, branchCovered: 0 },
  { line: 16, text: '', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 17, text: 'export function total(cart: Cart): number {', hits: 6, branchTotal: 0, branchCovered: 0 },
  { line: 18, text: '  return cart.items.reduce((s, i) => s + i.price * i.qty, 0);', hits: 6, branchTotal: 0, branchCovered: 0 },
  { line: 19, text: '}', hits: 6, branchTotal: 0, branchCovered: 0 },
  { line: 20, text: '', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 21, text: 'export function applyDiscount(cart: Cart, code: string): Cart {', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 22, text: '  if (code === "SUMMER10") cart.discount = 0.1;', hits: 0, branchTotal: 2, branchCovered: 0 },
  { line: 23, text: '  else if (code === "VIP20") cart.discount = 0.2;', hits: 0, branchTotal: 2, branchCovered: 0 },
  { line: 24, text: '  return cart;', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 25, text: '}', hits: 0, branchTotal: 0, branchCovered: 0 },
];

const checkoutLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export async function checkout(cart: Cart, user: User) {', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  if (!user.email) throw new Error("missing_email");', hits: 4, branchTotal: 2, branchCovered: 1 },
  { line: 3, text: '  const total = sum(cart);', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 4, text: '  const charge = await stripe.charge(total);', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 5, text: '  if (charge.status !== "ok") {', hits: 4, branchTotal: 2, branchCovered: 1 },
  { line: 6, text: '    throw new Error("charge_failed");', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 7, text: '  }', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 8, text: '  return await db.orders.insert({ user, total });', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 9, text: '}', hits: 4, branchTotal: 0, branchCovered: 0 },
];

const formatLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function money(n: number, ccy = "USD"): string {', hits: 50, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  return new Intl.NumberFormat("en", { style: "currency", currency: ccy }).format(n);', hits: 50, branchTotal: 0, branchCovered: 0 },
  { line: 3, text: '}', hits: 50, branchTotal: 0, branchCovered: 0 },
  { line: 4, text: 'export function pct(n: number): string {', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 5, text: '  return `${(n * 100).toFixed(0)}%`;', hits: 4, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '}', hits: 4, branchTotal: 0, branchCovered: 0 },
];

const productCardLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function ProductCard({ product, onAdd }: Props) {', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  const sale = product.salePrice != null;', hits: 18, branchTotal: 2, branchCovered: 1 },
  { line: 3, text: '  return (', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 4, text: '    <article className="card">', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 5, text: '      <h3>{product.name}</h3>', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '      <p className="price">{sale ? money(product.salePrice!) : money(product.price)}</p>', hits: 18, branchTotal: 2, branchCovered: 1 },
  { line: 7, text: '      <button onClick={() => onAdd(product)}>Add</button>', hits: 6, branchTotal: 0, branchCovered: 0 },
  { line: 8, text: '    </article>', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 9, text: '  );', hits: 18, branchTotal: 0, branchCovered: 0 },
  { line: 10, text: '}', hits: 18, branchTotal: 0, branchCovered: 0 },
];

const ordersApiLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export default async function handler(req, res) {', hits: 7, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  if (req.method !== "POST") return res.status(405).end();', hits: 7, branchTotal: 2, branchCovered: 1 },
  { line: 3, text: '  if (!req.headers.authorization) return res.status(401).end();', hits: 7, branchTotal: 2, branchCovered: 2 },
  { line: 4, text: '  const order = await checkout(req.body.cart, req.body.user);', hits: 5, branchTotal: 0, branchCovered: 0 },
  { line: 5, text: '  return res.json(order);', hits: 5, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '}', hits: 5, branchTotal: 0, branchCovered: 0 },
];

const authLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function login(email: string, password: string) {', hits: 12, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  const user = db.users.find(u => u.email === email);', hits: 12, branchTotal: 0, branchCovered: 0 },
  { line: 3, text: '  if (!user) throw new Error("not_found");', hits: 12, branchTotal: 2, branchCovered: 2 },
  { line: 4, text: '  if (!verify(user, password)) throw new Error("bad_pw");', hits: 9, branchTotal: 2, branchCovered: 2 },
  { line: 5, text: '  return token(user);', hits: 6, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '}', hits: 12, branchTotal: 0, branchCovered: 0 },
];

const flagsLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function flag(key: string): boolean {', hits: 30, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  const f = registry[key];', hits: 30, branchTotal: 0, branchCovered: 0 },
  { line: 3, text: '  if (!f) return false;', hits: 30, branchTotal: 2, branchCovered: 1 },
  { line: 4, text: '  if (f.expiresAt && f.expiresAt < Date.now()) return false;', hits: 28, branchTotal: 4, branchCovered: 1 },
  { line: 5, text: '  return f.enabled;', hits: 22, branchTotal: 0, branchCovered: 0 },
  { line: 6, text: '}', hits: 30, branchTotal: 0, branchCovered: 0 },
];

const legacyLines: ReadonlyArray<LineHit> = [
  { line: 1, text: 'export function legacyHelper() {', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 2, text: '  // TODO: remove', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 3, text: '  return null;', hits: 0, branchTotal: 0, branchCovered: 0 },
  { line: 4, text: '}', hits: 0, branchTotal: 0, branchCovered: 0 },
];

export const fileCoverages: ReadonlyArray<FileCoverage> = [
  { file: 'src/lib/cart.ts', lines: cartLines, summary: { statements: 78, branches: 50, functions: 75, lines: 76 } },
  { file: 'src/server/checkout.ts', lines: checkoutLines, summary: { statements: 86, branches: 50, functions: 100, lines: 88 } },
  { file: 'src/utils/format.ts', lines: formatLines, summary: { statements: 100, branches: 100, functions: 100, lines: 100 } },
  { file: 'src/components/ProductCard.tsx', lines: productCardLines, summary: { statements: 92, branches: 50, functions: 100, lines: 90 } },
  { file: 'src/pages/api/orders.ts', lines: ordersApiLines, summary: { statements: 95, branches: 75, functions: 100, lines: 95 } },
  { file: 'src/server/auth.ts', lines: authLines, summary: { statements: 100, branches: 100, functions: 100, lines: 100 } },
  { file: 'src/lib/flags.ts', lines: flagsLines, summary: { statements: 100, branches: 33, functions: 100, lines: 100 } },
  { file: 'src/lib/legacy.ts', lines: legacyLines, summary: { statements: 0, branches: 0, functions: 0, lines: 0 } },
];

export type LineState = 'covered' | 'partial' | 'uncovered' | 'blank';

export function lineState(l: LineHit): LineState {
  if (l.text.trim() === '') return 'blank';
  if (l.hits === 0) return 'uncovered';
  if (l.branchTotal > 0 && l.branchCovered < l.branchTotal) return 'partial';
  return 'covered';
}

export function fileCoveredPct(f: FileCoverage): number {
  return f.summary.lines;
}
