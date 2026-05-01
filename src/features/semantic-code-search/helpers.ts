export type SnippetKind = 'fn' | 'class' | 'hook' | 'component' | 'action' | 'api';

export interface CodeSnippet {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly kind: SnippetKind;
  readonly signature: string;
  readonly neighborhood: string;
  readonly tags: ReadonlyArray<string>;
  readonly mockEmbeddingDistance: number;
}

export const SNIPPETS: ReadonlyArray<CodeSnippet> = [
  {
    id: 's1',
    file: 'src/features/cart/use-cart.ts',
    line: 42,
    kind: 'hook',
    signature: 'export function useCart(): CartApi',
    neighborhood:
      'const cache = new Map<string, CartLine>();\nexport function useCart(): CartApi {\n  useEffect(() => () => cache.clear(), []);',
    tags: ['cart', 'state', 'cache'],
    mockEmbeddingDistance: 0.08,
  },
  {
    id: 's2',
    file: 'src/features/cart/cart-api.ts',
    line: 18,
    kind: 'api',
    signature: 'export async function checkout(input: CheckoutInput): Promise<Order>',
    neighborhood:
      'export async function checkout(input: CheckoutInput): Promise<Order> {\n  const r = await fetch("/api/checkout", { method: "POST" });\n  return r.json();',
    tags: ['checkout', 'fetch', 'order'],
    mockEmbeddingDistance: 0.14,
  },
  {
    id: 's3',
    file: 'src/widgets/header/site-header.tsx',
    line: 12,
    kind: 'component',
    signature: 'export function SiteHeader(props: SiteHeaderProps): JSX.Element',
    neighborhood:
      'export function SiteHeader(props: SiteHeaderProps) {\n  const { items } = useCart();\n  return <header className="...">...</header>;',
    tags: ['header', 'layout', 'cart'],
    mockEmbeddingDistance: 0.21,
  },
  {
    id: 's4',
    file: 'src/features/auth/sign-in.action.ts',
    line: 7,
    kind: 'action',
    signature: 'export async function signInAction(form: FormData): Promise<void>',
    neighborhood:
      '"use server";\nexport async function signInAction(form: FormData) {\n  const session = await createSession(form);\n  cookies().set("sid", session.id);',
    tags: ['auth', 'session', 'server-action'],
    mockEmbeddingDistance: 0.11,
  },
  {
    id: 's5',
    file: 'src/features/auth/session.ts',
    line: 23,
    kind: 'fn',
    signature: 'export function createSession(form: FormData): Session',
    neighborhood:
      'export function createSession(form: FormData): Session {\n  const id = crypto.randomUUID();\n  return { id, userId: form.get("uid") };',
    tags: ['auth', 'session'],
    mockEmbeddingDistance: 0.17,
  },
  {
    id: 's6',
    file: 'src/entities/user/user.model.ts',
    line: 5,
    kind: 'class',
    signature: 'export class User',
    neighborhood:
      'export class User {\n  constructor(readonly id: string, readonly email: string) {}\n  greet() { return `hi ${this.email}`; }',
    tags: ['model', 'user'],
    mockEmbeddingDistance: 0.31,
  },
  {
    id: 's7',
    file: 'src/shared/lib/cache.ts',
    line: 14,
    kind: 'fn',
    signature: 'export function memo<T>(fn: () => T, key: string): () => T',
    neighborhood:
      'const store = new Map<string, unknown>();\nexport function memo<T>(fn: () => T, key: string) {\n  if (!store.has(key)) store.set(key, fn());',
    tags: ['cache', 'memo', 'utils'],
    mockEmbeddingDistance: 0.09,
  },
  {
    id: 's8',
    file: 'src/shared/lib/cache.ts',
    line: 32,
    kind: 'fn',
    signature: 'export function invalidate(prefix: string): void',
    neighborhood:
      'export function invalidate(prefix: string) {\n  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);\n}',
    tags: ['cache', 'invalidate'],
    mockEmbeddingDistance: 0.12,
  },
  {
    id: 's9',
    file: 'src/features/products/product-list.tsx',
    line: 22,
    kind: 'component',
    signature: 'export function ProductList(props: ProductListProps): JSX.Element',
    neighborhood:
      'export function ProductList({ items }: ProductListProps) {\n  return <ul>{items.map(p => <ProductCard key={p.id} p={p} />)}</ul>;\n}',
    tags: ['products', 'list', 'ui'],
    mockEmbeddingDistance: 0.27,
  },
  {
    id: 's10',
    file: 'src/features/products/product-card.tsx',
    line: 9,
    kind: 'component',
    signature: 'export function ProductCard(props: { p: Product }): JSX.Element',
    neighborhood:
      'export function ProductCard({ p }: { p: Product }) {\n  return <article><h3>{p.name}</h3><Price v={p.price} /></article>;\n}',
    tags: ['products', 'card'],
    mockEmbeddingDistance: 0.33,
  },
  {
    id: 's11',
    file: 'src/features/search/use-search.ts',
    line: 11,
    kind: 'hook',
    signature: 'export function useSearch(query: string): SearchHits',
    neighborhood:
      'export function useSearch(query: string) {\n  const [hits, setHits] = useState<SearchHits>([]);\n  useEffect(() => { search(query).then(setHits); }, [query]);',
    tags: ['search', 'hook'],
    mockEmbeddingDistance: 0.06,
  },
  {
    id: 's12',
    file: 'src/features/search/search-api.ts',
    line: 4,
    kind: 'api',
    signature: 'export async function search(q: string): Promise<SearchHits>',
    neighborhood:
      'export async function search(q: string) {\n  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);\n  return r.json();',
    tags: ['search', 'fetch'],
    mockEmbeddingDistance: 0.05,
  },
  {
    id: 's13',
    file: 'src/widgets/footer/site-footer.tsx',
    line: 6,
    kind: 'component',
    signature: 'export function SiteFooter(): JSX.Element',
    neighborhood:
      'export function SiteFooter() {\n  return <footer className="hairline-t py-3 text-ink-3">...</footer>;\n}',
    tags: ['footer', 'layout'],
    mockEmbeddingDistance: 0.42,
  },
  {
    id: 's14',
    file: 'src/features/billing/subscribe.action.ts',
    line: 14,
    kind: 'action',
    signature: 'export async function subscribeAction(input: SubscribeInput): Promise<void>',
    neighborhood:
      '"use server";\nexport async function subscribeAction(input: SubscribeInput) {\n  await stripe.subscriptions.create(input);\n  revalidatePath("/account");',
    tags: ['billing', 'stripe', 'server-action'],
    mockEmbeddingDistance: 0.18,
  },
  {
    id: 's15',
    file: 'src/features/billing/billing-api.ts',
    line: 30,
    kind: 'api',
    signature: 'export async function listInvoices(uid: string): Promise<Invoice[]>',
    neighborhood:
      'export async function listInvoices(uid: string) {\n  const rs = await db.query("select * from invoices where uid=$1", [uid]);\n  return rs.rows;',
    tags: ['billing', 'invoice', 'db'],
    mockEmbeddingDistance: 0.22,
  },
  {
    id: 's16',
    file: 'src/entities/order/order.model.ts',
    line: 3,
    kind: 'class',
    signature: 'export class Order',
    neighborhood:
      'export class Order {\n  constructor(readonly id: string, readonly total: number) {}\n  isPaid() { return this.total >= 0; }',
    tags: ['model', 'order'],
    mockEmbeddingDistance: 0.36,
  },
  {
    id: 's17',
    file: 'src/shared/lib/format.ts',
    line: 8,
    kind: 'fn',
    signature: 'export function formatPrice(cents: number, currency?: string): string',
    neighborhood:
      'export function formatPrice(cents: number, currency = "USD") {\n  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);\n}',
    tags: ['format', 'price'],
    mockEmbeddingDistance: 0.29,
  },
  {
    id: 's18',
    file: 'src/shared/lib/format.ts',
    line: 16,
    kind: 'fn',
    signature: 'export function formatDate(d: Date): string',
    neighborhood:
      'export function formatDate(d: Date) {\n  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);\n}',
    tags: ['format', 'date'],
    mockEmbeddingDistance: 0.34,
  },
  {
    id: 's19',
    file: 'src/features/cart/cart-context.tsx',
    line: 19,
    kind: 'component',
    signature: 'export function CartProvider(props: { children: ReactNode }): JSX.Element',
    neighborhood:
      'export function CartProvider({ children }) {\n  const value = useMemo(() => makeCart(), []);\n  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;',
    tags: ['cart', 'context', 'provider'],
    mockEmbeddingDistance: 0.19,
  },
  {
    id: 's20',
    file: 'src/features/products/use-product.ts',
    line: 8,
    kind: 'hook',
    signature: 'export function useProduct(id: string): Product | undefined',
    neighborhood:
      'export function useProduct(id: string) {\n  const cached = memo(() => fetchProduct(id), `p:${id}`);\n  return cached();',
    tags: ['products', 'hook', 'cache'],
    mockEmbeddingDistance: 0.13,
  },
  {
    id: 's21',
    file: 'src/features/products/product-api.ts',
    line: 5,
    kind: 'api',
    signature: 'export async function fetchProduct(id: string): Promise<Product>',
    neighborhood:
      'export async function fetchProduct(id: string) {\n  const r = await fetch(`/api/products/${id}`);\n  return r.json();',
    tags: ['products', 'fetch'],
    mockEmbeddingDistance: 0.15,
  },
  {
    id: 's22',
    file: 'src/widgets/header/cart-button.tsx',
    line: 4,
    kind: 'component',
    signature: 'export function CartButton(): JSX.Element',
    neighborhood:
      'export function CartButton() {\n  const { items } = useCart();\n  return <button>{items.length}</button>;\n}',
    tags: ['cart', 'header', 'ui'],
    mockEmbeddingDistance: 0.24,
  },
  {
    id: 's23',
    file: 'src/features/auth/use-session.ts',
    line: 6,
    kind: 'hook',
    signature: 'export function useSession(): Session | null',
    neighborhood:
      'export function useSession() {\n  const [s, setS] = useState<Session | null>(null);\n  useEffect(() => readSession().then(setS), []);',
    tags: ['auth', 'session', 'hook'],
    mockEmbeddingDistance: 0.16,
  },
  {
    id: 's24',
    file: 'src/features/cart/cart-line.tsx',
    line: 10,
    kind: 'component',
    signature: 'export function CartLine(props: { line: CartLine }): JSX.Element',
    neighborhood:
      'export function CartLine({ line }: { line: CartLine }) {\n  return <li>{line.name} × {line.qty}</li>;\n}',
    tags: ['cart', 'line', 'ui'],
    mockEmbeddingDistance: 0.26,
  },
];

export interface SearchResult {
  readonly snippet: CodeSnippet;
  readonly relevance: number;
  readonly reason: string;
}

const REASON_TEMPLATES: ReadonlyArray<{
  match: (s: CodeSnippet, q: string) => boolean;
  reason: (s: CodeSnippet, q: string) => string;
}> = [
  {
    match: (s) => s.neighborhood.includes('useEffect'),
    reason: () => 'matches: useEffect cleanup',
  },
  {
    match: (s) => s.neighborhood.includes('cache') || s.tags.includes('cache'),
    reason: () => 'near: cache.set call',
  },
  {
    match: (s) => s.neighborhood.includes('fetch'),
    reason: () => 'matches: fetch call',
  },
  {
    match: (s, q) => s.signature.toLowerCase().includes(q.toLowerCase()),
    reason: (_s, q) => `signature contains "${q}"`,
  },
  {
    match: (s) => s.tags.length > 0,
    reason: (s) => `tags: ${s.tags.slice(0, 2).join(', ')}`,
  },
];

export function searchSemantic(q: string): ReadonlyArray<SearchResult> {
  const query = q.trim().toLowerCase();
  const sorted = [...SNIPPETS].sort(
    (a, b) => a.mockEmbeddingDistance - b.mockEmbeddingDistance,
  );
  return sorted.map((s) => {
    const baseRelevance = Math.round(100 - s.mockEmbeddingDistance * 180);
    const matchBoost =
      query.length > 0 &&
      (s.signature.toLowerCase().includes(query) ||
        s.tags.some((t) => t.includes(query)) ||
        s.file.toLowerCase().includes(query))
        ? 8
        : 0;
    const relevance = Math.max(2, Math.min(100, baseRelevance + matchBoost));
    const tmpl =
      REASON_TEMPLATES.find((r) => r.match(s, query)) ?? REASON_TEMPLATES[REASON_TEMPLATES.length - 1]!;
    return { snippet: s, relevance, reason: tmpl.reason(s, query || (s.tags[0] ?? '')) };
  });
}

export const RECENT_QUERIES: ReadonlyArray<string> = [
  'useEffect cleanup with cache',
  'server action set cookie',
  'fetch product by id',
  'memoized session reader',
  'cart provider context',
  'invalidate prefix',
];

export const KIND_OPTIONS: ReadonlyArray<{ key: SnippetKind | 'all'; label: string }> = [
  { key: 'all', label: 'all' },
  { key: 'fn', label: 'fn' },
  { key: 'class', label: 'class' },
  { key: 'hook', label: 'hook' },
  { key: 'component', label: 'component' },
  { key: 'action', label: 'action' },
  { key: 'api', label: 'api' },
];

export function fileArea(file: string): string {
  const parts = file.split('/');
  if (parts.length < 3) return parts[0] ?? file;
  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}
