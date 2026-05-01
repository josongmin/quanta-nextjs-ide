export type Placement = 'same' | 'colocated' | 'shared';

export interface PropDef {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
}

export interface UsageSite {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
}

export interface ExtractComponentTarget {
  readonly file: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly defaultName: string;
  readonly beforeCode: string;
  readonly afterCode: string;
  readonly props: ReadonlyArray<PropDef>;
  readonly usages: ReadonlyArray<UsageSite>;
}

const BEFORE = `function ProductGrid({ products, onAdd }: GridProps) {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {products.map((p) => (
        // ── selection start ─────────────────────
        <li
          key={p.id}
          className="rounded-md border border-line bg-bg p-3"
        >
          <img src={p.imageUrl} alt={p.title} className="h-32 w-full" />
          <h3 className="mt-2 text-sm font-medium">{p.title}</h3>
          <p className="text-xs text-ink-3">\${(p.price / 100).toFixed(2)}</p>
          <button
            onClick={() => onAdd(p.id)}
            className="mt-1 rounded-sm bg-accent px-2 py-1 text-xs text-white"
          >
            Add to cart
          </button>
        </li>
        // ── selection end ───────────────────────
      ))}
    </ul>
  );
}`;

const AFTER = `function ProductGrid({ products, onAdd }: GridProps) {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {products.map((p) => (
        <Card
          key={p.id}
          title={p.title}
          price={p.price}
          imageUrl={p.imageUrl}
          onAdd={() => onAdd(p.id)}
        />
      ))}
    </ul>
  );
}

interface CardProps {
  title: string;
  price: number;
  imageUrl: string;
  onAdd: () => void;
}

function Card({ title, price, imageUrl, onAdd }: CardProps) {
  return (
    <li className="rounded-md border border-line bg-bg p-3">
      <img src={imageUrl} alt={title} className="h-32 w-full" />
      <h3 className="mt-2 text-sm font-medium">{title}</h3>
      <p className="text-xs text-ink-3">\${(price / 100).toFixed(2)}</p>
      <button
        onClick={onAdd}
        className="mt-1 rounded-sm bg-accent px-2 py-1 text-xs text-white"
      >
        Add to cart
      </button>
    </li>
  );
}`;

export const TARGET: ExtractComponentTarget = {
  file: 'src/features/catalog/product-grid.tsx',
  startLine: 6,
  endLine: 20,
  defaultName: 'Card',
  beforeCode: BEFORE,
  afterCode: AFTER,
  props: [
    { id: 'p1', name: 'title', type: 'string', required: true },
    { id: 'p2', name: 'price', type: 'number', required: true },
    { id: 'p3', name: 'imageUrl', type: 'string', required: true },
    { id: 'p4', name: 'onAdd', type: '() => void', required: true },
  ],
  usages: [
    {
      id: 'u1',
      file: 'src/features/catalog/featured.tsx',
      line: 22,
      snippet: '<li key={p.id} className="rounded-md border ...">...',
    },
    {
      id: 'u2',
      file: 'src/features/catalog/recommended.tsx',
      line: 41,
      snippet: '<li className="rounded-md border border-line bg-bg p-3">',
    },
    {
      id: 'u3',
      file: 'src/pages/store/page.tsx',
      line: 64,
      snippet: '<li key={item.id} className="rounded-md border ...">',
    },
    {
      id: 'u4',
      file: 'src/widgets/header/cart-mini.tsx',
      line: 18,
      snippet: '<li className="rounded-md border ...">',
    },
  ],
};

export const PLACEMENT_LABEL: Record<Placement, string> = {
  same: 'Same file',
  colocated: './components/Card.tsx',
  shared: 'widgets/card',
};

export const AFFECTED_FILES_BY_PLACEMENT: Record<
  Placement,
  ReadonlyArray<{ path: string; note: string }>
> = {
  same: [{ path: 'src/features/catalog/product-grid.tsx', note: 'edit in place' }],
  colocated: [
    { path: 'src/features/catalog/product-grid.tsx', note: 'replace block' },
    { path: 'src/features/catalog/components/Card.tsx', note: 'create' },
  ],
  shared: [
    { path: 'src/features/catalog/product-grid.tsx', note: 'replace block' },
    { path: 'src/widgets/card/index.tsx', note: 'create' },
    { path: 'src/widgets/card/Card.tsx', note: 'create' },
  ],
};
