export interface SideEdit {
  author: string;
  added: ReadonlyArray<string>;
  removed: ReadonlyArray<string>;
}

export interface Conflict {
  id: string;
  startLine: number;
  endLine: number;
  base: ReadonlyArray<string>;
  yours: SideEdit;
  theirs: SideEdit;
  resolutionHint: string;
}

export interface ConflictFile {
  file: string;
  conflictCount: number;
  conflicts: ReadonlyArray<Conflict>;
}

export const FILES: ReadonlyArray<ConflictFile> = [
  {
    file: 'app/api/orders/route.ts',
    conflictCount: 2,
    conflicts: [
      {
        id: 'c1',
        startLine: 14,
        endLine: 22,
        base: [
          'export async function POST(req: Request) {',
          '  const body = await req.json();',
          '  const order = await createOrder(body);',
          '  return Response.json(order);',
          '}',
        ],
        yours: {
          author: 'Avery Chen',
          added: [
            'export async function POST(req: Request) {',
            '  const body = orderSchema.parse(await req.json());',
            '  const order = await createOrder(body);',
            '  return Response.json(order, { status: 201 });',
            '}',
          ],
          removed: [
            'export async function POST(req: Request) {',
            '  const body = await req.json();',
            '  const order = await createOrder(body);',
            '  return Response.json(order);',
            '}',
          ],
        },
        theirs: {
          author: 'Bao Nguyen',
          added: [
            'export async function POST(req: Request) {',
            '  const body = await req.json();',
            '  const trace = startTrace("orders.create");',
            '  const order = await createOrder(body);',
            '  trace.end();',
            '  return Response.json(order);',
            '}',
          ],
          removed: [
            'export async function POST(req: Request) {',
            '  const body = await req.json();',
            '  const order = await createOrder(body);',
            '  return Response.json(order);',
            '}',
          ],
        },
        resolutionHint:
          'Both edits are additive — keep your zod parse AND their tracing. AI can synthesize a merged block.',
      },
      {
        id: 'c2',
        startLine: 56,
        endLine: 63,
        base: [
          'function applyDiscount(total: number, code: string) {',
          '  const pct = lookupCode(code);',
          '  return total * (1 - pct);',
          '}',
        ],
        yours: {
          author: 'Avery Chen',
          added: [
            'function applyDiscount(total: number, code: string) {',
            '  const pct = lookupCode(code);',
            '  return Math.max(0, total * (1 - pct));',
            '}',
          ],
          removed: [
            'function applyDiscount(total: number, code: string) {',
            '  const pct = lookupCode(code);',
            '  return total * (1 - pct);',
            '}',
          ],
        },
        theirs: {
          author: 'Dani Park',
          added: [
            'function applyDiscount(total: number, code: string | null) {',
            '  if (!code) return total;',
            '  const pct = lookupCode(code);',
            '  return total * (1 - pct);',
            '}',
          ],
          removed: [
            'function applyDiscount(total: number, code: string) {',
            '  const pct = lookupCode(code);',
            '  return total * (1 - pct);',
            '}',
          ],
        },
        resolutionHint:
          'Combine: relax `code` to `string | null` AND clamp the result at zero.',
      },
    ],
  },
  {
    file: 'app/(shop)/cart/page.tsx',
    conflictCount: 1,
    conflicts: [
      {
        id: 'c3',
        startLine: 30,
        endLine: 38,
        base: [
          'export default function CartPage() {',
          '  const items = useCartItems();',
          '  return (',
          '    <CartList items={items} />',
          '  );',
          '}',
        ],
        yours: {
          author: 'Cleo Diaz',
          added: [
            'export default function CartPage() {',
            '  const items = useCartItems();',
            '  return (',
            '    <CartList items={items} variant="compact" />',
            '  );',
            '}',
          ],
          removed: [
            'export default function CartPage() {',
            '  const items = useCartItems();',
            '  return (',
            '    <CartList items={items} />',
            '  );',
            '}',
          ],
        },
        theirs: {
          author: 'Farah Lin',
          added: [
            'export default function CartPage() {',
            '  const items = useCartItems();',
            '  if (items.length === 0) return <EmptyCart />;',
            '  return (',
            '    <CartList items={items} />',
            '  );',
            '}',
          ],
          removed: [
            'export default function CartPage() {',
            '  const items = useCartItems();',
            '  return (',
            '    <CartList items={items} />',
            '  );',
            '}',
          ],
        },
        resolutionHint:
          'Add the empty-state guard AND keep the new variant prop on `CartList`.',
      },
    ],
  },
  {
    file: 'entities/user/queries.ts',
    conflictCount: 1,
    conflicts: [
      {
        id: 'c4',
        startLine: 8,
        endLine: 15,
        base: [
          'export async function getUser(id: string) {',
          '  return db.user.findUnique({ where: { id } });',
          '}',
        ],
        yours: {
          author: 'Ezra Patel',
          added: [
            'export async function getUser(id: string) {',
            '  return db.user.findUnique({',
            '    where: { id },',
            '    include: { orders: true },',
            '  });',
            '}',
          ],
          removed: [
            'export async function getUser(id: string) {',
            '  return db.user.findUnique({ where: { id } });',
            '}',
          ],
        },
        theirs: {
          author: 'Bao Nguyen',
          added: [
            'export const getUser = cache(async (id: string) => {',
            '  return db.user.findUnique({ where: { id } });',
            '});',
          ],
          removed: [
            'export async function getUser(id: string) {',
            '  return db.user.findUnique({ where: { id } });',
            '}',
          ],
        },
        resolutionHint:
          'Prefer wrapping with `cache` AND including orders — the include can live inside the cached function.',
      },
    ],
  },
];
