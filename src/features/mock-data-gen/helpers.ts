export type Source = 'type' | 'zod' | 'prisma' | 'route';

export interface SourceOption {
  id: string;
  label: string;
  hint?: string;
}

export const TYPE_OPTIONS: ReadonlyArray<SourceOption> = [
  { id: 'User', label: 'User', hint: 'id, email, name, createdAt' },
  { id: 'Product', label: 'Product', hint: 'id, name, price, stock, slug' },
  { id: 'Order', label: 'Order', hint: 'id, userId, total, items[]' },
  { id: 'Review', label: 'Review', hint: 'id, productId, rating, body' },
];

export const ZOD_OPTIONS: ReadonlyArray<SourceOption> = [
  { id: 'CheckoutInput', label: 'CheckoutInput' },
  { id: 'ProductFilter', label: 'ProductFilter' },
  { id: 'PaginationParams', label: 'PaginationParams' },
];

export const PRISMA_OPTIONS: ReadonlyArray<SourceOption> = [
  { id: 'User', label: 'User' },
  { id: 'Product', label: 'Product' },
  { id: 'Order', label: 'Order' },
];

// xorshift32 deterministic PRNG
function rng(seedInput: string | number) {
  let seed =
    typeof seedInput === 'number'
      ? seedInput
      : Array.from(String(seedInput)).reduce(
          (a, c) => (a * 33) ^ c.charCodeAt(0),
          5381,
        );
  if (seed === 0) seed = 1;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return Math.abs(seed % 100000) / 100000;
  };
}

const FIRST_NAMES = ['Ada', 'Lin', 'Ravi', 'Maya', 'Joon', 'Sora', 'Eli', 'Mira', 'Theo', 'Nia'];
const LAST_NAMES = ['Park', 'Kim', 'Patel', 'Liu', 'Costa', 'Singh', 'Reyes', 'Choi', 'Hayes', 'Tan'];
const PRODUCT_NAMES = [
  'Atlas Backpack',
  'Cumulus Mug',
  'Halcyon Headphones',
  'Penumbra Lamp',
  'Quartz Notebook',
  'Vesper Tee',
  'Beacon Chair',
  'Solstice Tote',
];

function pick<T>(arr: ReadonlyArray<T>, r: number): T {
  const i = Math.floor(r * arr.length) % arr.length; return arr[i] as T;
}

function id(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(4, '0')}`;
}

export function generateFromType(
  type: string,
  count: number,
  seed: string,
): unknown[] {
  const r = rng(seed);
  const out: unknown[] = [];
  for (let i = 0; i < count; i++) {
    if (type === 'User') {
      const f = pick(FIRST_NAMES, r());
      const l = pick(LAST_NAMES, r());
      out.push({
        id: id('usr', i + 1),
        email: `${f.toLowerCase()}.${l.toLowerCase()}@example.com`,
        name: `${f} ${l}`,
        createdAt: new Date(2024, Math.floor(r() * 12), Math.floor(r() * 28) + 1).toISOString(),
      });
    } else if (type === 'Product') {
      out.push({
        id: id('prd', i + 1),
        name: pick(PRODUCT_NAMES, r()),
        price: Math.floor(r() * 50000) / 100,
        stock: Math.floor(r() * 200),
        slug: `prd-${i + 1}`,
      });
    } else if (type === 'Order') {
      out.push({
        id: id('ord', i + 1),
        userId: id('usr', Math.floor(r() * 100) + 1),
        total: Math.floor(r() * 100000) / 100,
        items: Array.from({ length: 1 + Math.floor(r() * 3) }).map((_) => ({
          productId: id('prd', Math.floor(r() * 100) + 1),
          quantity: 1 + Math.floor(r() * 3),
        })),
      });
    } else if (type === 'Review') {
      out.push({
        id: id('rvw', i + 1),
        productId: id('prd', Math.floor(r() * 100) + 1),
        rating: 1 + Math.floor(r() * 5),
        body: pick(
          [
            'Loved it.',
            'Solid build.',
            'Decent but pricey.',
            'Would buy again.',
            'Did not match the photos.',
          ],
          r(),
        ),
      });
    } else {
      out.push({ id: id('itm', i + 1) });
    }
  }
  return out;
}

export function generateFromZod(schemaId: string, count: number, seed: string): unknown[] {
  const r = rng(seed + schemaId);
  const out: unknown[] = [];
  for (let i = 0; i < count; i++) {
    if (schemaId === 'CheckoutInput') {
      out.push({
        idempotencyKey: `idmp_${id('ck', i + 1)}`,
        items: [{ productId: id('prd', Math.floor(r() * 50) + 1), qty: 1 }],
        addressId: id('adr', Math.floor(r() * 20) + 1),
      });
    } else if (schemaId === 'ProductFilter') {
      out.push({
        category: pick(['accessories', 'home', 'apparel'], r()),
        priceRange: { min: 0, max: Math.floor(r() * 500) + 50 },
        sort: pick(['price-asc', 'price-desc', 'rating'], r()),
      });
    } else {
      out.push({ page: i + 1, perPage: 20 });
    }
  }
  return out;
}

export function generateFromPrisma(model: string, count: number, seed: string): unknown[] {
  return generateFromType(model, count, seed + 'prisma');
}

export function generateFromRoute(routeId: string, count: number, seed: string): unknown[] {
  const r = rng(seed + routeId);
  const out: unknown[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      params: { id: id('p', Math.floor(r() * 1000)) },
      searchParams: {
        page: 1 + Math.floor(r() * 10),
        sort: pick(['price', 'rating', 'newest'], r()),
      },
    });
  }
  return out;
}

export function formatJson(v: unknown): string {
  return JSON.stringify(v, null, 2);
}
