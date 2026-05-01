export interface ClientFlag {
  readonly id: string;
  readonly label: string;
  readonly detected: boolean;
  readonly detail: string;
}

export interface ConvertTarget {
  readonly file: string;
  readonly beforeCode: string;
  readonly afterCode: string;
  readonly flags: ReadonlyArray<ClientFlag>;
  readonly safetyReasons: ReadonlyArray<string>;
}

const BEFORE = `'use client';

import { fetchProduct } from '@/lib/data';

interface Props {
  id: string;
  product: { title: string; price: number };
}

export function ProductHeader({ id, product }: Props) {
  return (
    <header className="border-b">
      <h1>{product.title}</h1>
      <p>{product.price}</p>
      <p className="text-xs">id: {id}</p>
    </header>
  );
}`;

const AFTER = `import { fetchProduct } from '@/lib/data';

interface Props {
  id: string;
  product: { title: string; price: number };
}

export function ProductHeader({ id, product }: Props) {
  return (
    <header className="border-b">
      <h1>{product.title}</h1>
      <p>{product.price}</p>
      <p className="text-xs">id: {id}</p>
    </header>
  );
}`;

export const TARGET: ConvertTarget = {
  file: 'src/features/catalog/product-header.tsx',
  beforeCode: BEFORE,
  afterCode: AFTER,
  flags: [
    { id: 'f1', label: 'useState', detected: false, detail: 'no state hooks' },
    { id: 'f2', label: 'useEffect', detected: false, detail: 'no effects' },
    { id: 'f3', label: 'event handlers', detected: false, detail: 'no onClick / onChange' },
    { id: 'f4', label: 'window / document', detected: false, detail: 'no browser API' },
    { id: 'f5', label: 'useRouter', detected: false, detail: 'no client router hooks' },
  ],
  safetyReasons: [
    'No client-only hooks used',
    'No event handlers in JSX',
    'No browser globals referenced',
    'All props serializable',
  ],
};
