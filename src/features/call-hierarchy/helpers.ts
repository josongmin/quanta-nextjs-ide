export interface FnNode {
  readonly id: string;
  readonly name: string;
  readonly signature: string;
  readonly file: string;
  readonly line: number;
  readonly returnType: string;
  readonly callers: ReadonlyArray<string>;
  readonly callees: ReadonlyArray<string>;
  readonly callCount: number;
  /** mock body preview (3-5 lines) */
  readonly preview: string;
}

export const FNS: ReadonlyArray<FnNode> = [
  {
    id: 'submitOrder',
    name: 'submitOrder',
    signature: '(payload: OrderPayload) => Promise<OrderResult>',
    file: 'src/features/checkout/checkout.tsx',
    line: 138,
    returnType: 'Promise<OrderResult>',
    callers: ['CheckoutForm', 'useCheckout'],
    callees: ['validatePayload', 'chargeCard', 'persistOrder', 'sendReceipt'],
    callCount: 12,
    preview:
      "async function submitOrder(payload) {\n  const v = await validatePayload(payload);\n  const charge = await chargeCard(v);\n  const order = await persistOrder(charge);\n  return sendReceipt(order);\n}",
  },
  {
    id: 'CheckoutForm',
    name: 'CheckoutForm',
    signature: '() => JSX.Element',
    file: 'src/features/checkout/checkout.tsx',
    line: 18,
    returnType: 'JSX.Element',
    callers: ['CheckoutPage'],
    callees: ['submitOrder', 'useCheckout', 'AddressFields'],
    callCount: 4,
    preview:
      "function CheckoutForm() {\n  const handlers = useCheckout();\n  return (\n    <form onSubmit={handlers.onSubmit}>...</form>\n  );\n}",
  },
  {
    id: 'useCheckout',
    name: 'useCheckout',
    signature: '() => CheckoutHandlers',
    file: 'src/features/checkout/checkout.tsx',
    line: 110,
    returnType: 'CheckoutHandlers',
    callers: ['CheckoutForm'],
    callees: ['submitOrder', 'useCart'],
    callCount: 4,
    preview:
      "function useCheckout() {\n  const cart = useCart();\n  const onSubmit = (e) => submitOrder(cart.payload);\n  return { onSubmit };\n}",
  },
  {
    id: 'CheckoutPage',
    name: 'CheckoutPage',
    signature: '() => JSX.Element',
    file: 'src/pages/checkout/page.tsx',
    line: 8,
    returnType: 'JSX.Element',
    callers: [],
    callees: ['CheckoutForm', 'SiteHeader'],
    callCount: 1,
    preview:
      "export default function CheckoutPage() {\n  return (\n    <main><CheckoutForm /></main>\n  );\n}",
  },
  {
    id: 'validatePayload',
    name: 'validatePayload',
    signature: '(p: OrderPayload) => Promise<ValidPayload>',
    file: 'src/features/checkout/validate.ts',
    line: 12,
    returnType: 'Promise<ValidPayload>',
    callers: ['submitOrder'],
    callees: ['ensureAddress', 'ensureItems'],
    callCount: 12,
    preview:
      "async function validatePayload(p) {\n  await ensureAddress(p.address);\n  await ensureItems(p.items);\n  return p as ValidPayload;\n}",
  },
  {
    id: 'chargeCard',
    name: 'chargeCard',
    signature: '(p: ValidPayload) => Promise<Charge>',
    file: 'src/features/checkout/charge.ts',
    line: 22,
    returnType: 'Promise<Charge>',
    callers: ['submitOrder'],
    callees: ['stripeClient'],
    callCount: 12,
    preview:
      "async function chargeCard(p) {\n  const intent = await stripeClient.create(p);\n  return stripeClient.confirm(intent);\n}",
  },
  {
    id: 'persistOrder',
    name: 'persistOrder',
    signature: '(c: Charge) => Promise<Order>',
    file: 'src/features/checkout/persist.ts',
    line: 14,
    returnType: 'Promise<Order>',
    callers: ['submitOrder'],
    callees: ['db'],
    callCount: 12,
    preview:
      "async function persistOrder(c) {\n  return db.orders.insert({\n    chargeId: c.id,\n    total: c.total,\n  });\n}",
  },
  {
    id: 'sendReceipt',
    name: 'sendReceipt',
    signature: '(o: Order) => Promise<OrderResult>',
    file: 'src/features/checkout/notify.ts',
    line: 9,
    returnType: 'Promise<OrderResult>',
    callers: ['submitOrder'],
    callees: ['mailer'],
    callCount: 12,
    preview:
      "async function sendReceipt(order) {\n  await mailer.send({ to: order.email });\n  return { ok: true, orderId: order.id };\n}",
  },
  {
    id: 'useCart',
    name: 'useCart',
    signature: '() => CartState',
    file: 'src/features/cart/cart.tsx',
    line: 132,
    returnType: 'CartState',
    callers: ['useCheckout', 'CartDrawer', 'CartButton'],
    callees: ['CartStore.read'],
    callCount: 28,
    preview:
      "function useCart() {\n  return useSyncExternalStore(\n    cartStore.subscribe,\n    cartStore.read,\n  );\n}",
  },
  {
    id: 'AddressFields',
    name: 'AddressFields',
    signature: '({ value, onChange }) => JSX.Element',
    file: 'src/features/checkout/checkout.tsx',
    line: 64,
    returnType: 'JSX.Element',
    callers: ['CheckoutForm'],
    callees: [],
    callCount: 4,
    preview:
      "function AddressFields({ value, onChange }) {\n  return (\n    <div className='grid'>...</div>\n  );\n}",
  },
  {
    id: 'CartDrawer',
    name: 'CartDrawer',
    signature: '() => JSX.Element',
    file: 'src/features/cart/cart.tsx',
    line: 24,
    returnType: 'JSX.Element',
    callers: ['SiteHeader'],
    callees: ['useCart', 'CartLine'],
    callCount: 6,
    preview:
      "function CartDrawer() {\n  const { items } = useCart();\n  return items.map((i) => <CartLine item={i} />);\n}",
  },
  {
    id: 'CartButton',
    name: 'CartButton',
    signature: '() => JSX.Element',
    file: 'src/widgets/header/header.tsx',
    line: 92,
    returnType: 'JSX.Element',
    callers: ['SiteHeader'],
    callees: ['useCart'],
    callCount: 6,
    preview:
      "function CartButton() {\n  const { items } = useCart();\n  return <Button>{items.length}</Button>;\n}",
  },
  {
    id: 'CartLine',
    name: 'CartLine',
    signature: '({ item }) => JSX.Element',
    file: 'src/features/cart/cart.tsx',
    line: 88,
    returnType: 'JSX.Element',
    callers: ['CartDrawer'],
    callees: [],
    callCount: 6,
    preview:
      "function CartLine({ item }) {\n  return <div>{item.name}</div>;\n}",
  },
  {
    id: 'SiteHeader',
    name: 'SiteHeader',
    signature: '() => JSX.Element',
    file: 'src/widgets/header/header.tsx',
    line: 22,
    returnType: 'JSX.Element',
    callers: ['CheckoutPage', 'HomePage'],
    callees: ['HeaderNav', 'CartButton', 'CartDrawer'],
    callCount: 2,
    preview:
      "function SiteHeader() {\n  return (\n    <header>...</header>\n  );\n}",
  },
  {
    id: 'HeaderNav',
    name: 'HeaderNav',
    signature: '({ links }) => JSX.Element',
    file: 'src/widgets/header/header.tsx',
    line: 58,
    returnType: 'JSX.Element',
    callers: ['SiteHeader'],
    callees: [],
    callCount: 2,
    preview:
      "function HeaderNav({ links }) {\n  return links.map((l) => <a key={l.href}>{l.label}</a>);\n}",
  },
  {
    id: 'HomePage',
    name: 'HomePage',
    signature: '() => JSX.Element',
    file: 'src/pages/home/page.tsx',
    line: 6,
    returnType: 'JSX.Element',
    callers: [],
    callees: ['SiteHeader'],
    callCount: 1,
    preview:
      "export default function HomePage() {\n  return <main>...</main>;\n}",
  },
  {
    id: 'ensureAddress',
    name: 'ensureAddress',
    signature: '(addr: Address) => Promise<void>',
    file: 'src/features/checkout/validate.ts',
    line: 24,
    returnType: 'Promise<void>',
    callers: ['validatePayload'],
    callees: [],
    callCount: 12,
    preview:
      "async function ensureAddress(addr) {\n  if (!addr.zip) throw new Error('zip required');\n}",
  },
  {
    id: 'ensureItems',
    name: 'ensureItems',
    signature: '(items: CartItem[]) => Promise<void>',
    file: 'src/features/checkout/validate.ts',
    line: 32,
    returnType: 'Promise<void>',
    callers: ['validatePayload'],
    callees: [],
    callCount: 12,
    preview:
      "async function ensureItems(items) {\n  if (items.length === 0) throw new Error('empty cart');\n}",
  },
];

export const ROOT_ID = 'submitOrder';

export type Direction = 'callers' | 'callees';

export interface TreeNode {
  readonly id: string;
  readonly fn: FnNode;
  readonly children: ReadonlyArray<TreeNode>;
}

export function buildTree(
  rootId: string,
  direction: Direction,
  maxDepth: number,
): TreeNode | null {
  const byId = new Map(FNS.map((f) => [f.id, f] as const));
  const root = byId.get(rootId);
  if (!root) return null;
  const seen = new Set<string>();
  const build = (id: string, depth: number): TreeNode | null => {
    const fn = byId.get(id);
    if (!fn) return null;
    if (seen.has(id)) {
      return { id, fn, children: [] };
    }
    seen.add(id);
    if (depth >= maxDepth) return { id, fn, children: [] };
    const next = direction === 'callers' ? fn.callers : fn.callees;
    const children = next
      .map((nid) => build(nid, depth + 1))
      .filter((n): n is TreeNode => n !== null);
    seen.delete(id);
    return { id, fn, children };
  };
  return build(rootId, 0);
}

export function findFn(id: string): FnNode | undefined {
  return FNS.find((f) => f.id === id);
}
