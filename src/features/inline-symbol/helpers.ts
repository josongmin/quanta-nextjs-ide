export type Scope = 'project' | 'file';

export interface CallSite {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly before: string;
  readonly after: string;
  readonly warning?: string;
}

export interface InlineTarget {
  readonly name: string;
  readonly definition: string;
  readonly file: string;
  readonly callsites: ReadonlyArray<CallSite>;
}

export const TARGET: InlineTarget = {
  name: 'formatPrice',
  file: 'src/shared/lib/format.ts',
  definition: `export const formatPrice = (n: number): string =>
  \`$\${(n / 100).toFixed(2)}\`;`,
  callsites: [
    {
      id: 'c1',
      file: 'src/features/catalog/product-grid.tsx',
      line: 18,
      before: '  <p>{formatPrice(p.price)}</p>',
      after: '  <p>{`$${(p.price / 100).toFixed(2)}`}</p>',
    },
    {
      id: 'c2',
      file: 'src/features/catalog/featured.tsx',
      line: 27,
      before: '  <span>{formatPrice(item.priceCents)}</span>',
      after: '  <span>{`$${(item.priceCents / 100).toFixed(2)}`}</span>',
    },
    {
      id: 'c3',
      file: 'src/features/cart/cart-line.tsx',
      line: 14,
      before: '  return formatPrice(line.totalCents);',
      after: '  return `$${(line.totalCents / 100).toFixed(2)}`;',
    },
    {
      id: 'c4',
      file: 'src/features/cart/cart-line.tsx',
      line: 31,
      before: '  const label = formatPrice(subtotal);',
      after: '  const label = `$${(subtotal / 100).toFixed(2)}`;',
      warning: 'Callsite has additional formatting (toLocaleString chained)',
    },
    {
      id: 'c5',
      file: 'src/features/checkout/totals.tsx',
      line: 12,
      before: '  total: formatPrice(t.cents),',
      after: '  total: `$${(t.cents / 100).toFixed(2)}`,',
    },
    {
      id: 'c6',
      file: 'src/features/checkout/totals.tsx',
      line: 18,
      before: '  tax: formatPrice(t.tax),',
      after: '  tax: `$${(t.tax / 100).toFixed(2)}`,',
    },
    {
      id: 'c7',
      file: 'src/widgets/header/cart-mini.tsx',
      line: 8,
      before: '  <strong>{formatPrice(subtotal)}</strong>',
      after: '  <strong>{`$${(subtotal / 100).toFixed(2)}`}</strong>',
    },
    {
      id: 'c8',
      file: 'src/widgets/header/cart-mini.tsx',
      line: 22,
      before: '  aria-label={formatPrice(amount)}',
      after: '  aria-label={`$${(amount / 100).toFixed(2)}`}',
      warning: 'Callsite has additional formatting (passed to aria-label string)',
    },
    {
      id: 'c9',
      file: 'src/pages/store/page.tsx',
      line: 44,
      before: '  return formatPrice(item.price);',
      after: '  return `$${(item.price / 100).toFixed(2)}`;',
    },
  ],
};

export const SCOPES: ReadonlyArray<{ value: Scope; label: string }> = [
  { value: 'project', label: 'Project' },
  { value: 'file', label: 'This file' },
];
