import type { CodeSymbolKind } from '@entities/code-symbol';

/**
 * Subset of {@link CodeSymbolKind} that go-to-symbol's outline supports.
 * Aligned to the canonical entity to prevent type drift.
 */
export type SymbolKind = Extract<
  CodeSymbolKind,
  'fn' | 'class' | 'hook' | 'const' | 'component' | 'type' | 'prop'
>;

/**
 * Lucide icon name (loose string — features render via icon map).
 */
export type KindIconName =
  | 'Code'
  | 'Box'
  | 'Zap'
  | 'Hash'
  | 'Layers'
  | 'Tag'
  | 'Hex';

export interface SymbolEntry {
  readonly id: string;
  readonly name: string;
  readonly kind: SymbolKind;
  readonly file: string;
  readonly line: number;
  readonly signature: string;
  readonly kindIcon: KindIconName;
  /** parent id when nested in outline (class -> method, fn -> inner). */
  readonly parentId?: string;
}

export const KIND_LABEL: Record<SymbolKind, string> = {
  fn: 'function',
  class: 'class',
  hook: 'hook',
  const: 'const',
  component: 'component',
  type: 'type',
  prop: 'prop',
};

export const KIND_ICON: Record<SymbolKind, KindIconName> = {
  fn: 'Code',
  class: 'Box',
  hook: 'Zap',
  const: 'Hash',
  component: 'Layers',
  type: 'Tag',
  prop: 'Hex',
};

export const KIND_TONE: Record<
  SymbolKind,
  'accent' | 'static' | 'isr' | 'dynamic' | 'edge' | 'client' | 'server'
> = {
  fn: 'accent',
  class: 'static',
  hook: 'isr',
  const: 'dynamic',
  component: 'edge',
  type: 'client',
  prop: 'server',
};

export const ALL_KINDS: ReadonlyArray<SymbolKind> = [
  'fn',
  'class',
  'hook',
  'const',
  'component',
  'type',
  'prop',
];

export const SYMBOLS: ReadonlyArray<SymbolEntry> = [
  // file 1: src/features/cart/cart.tsx
  {
    id: 's1',
    name: 'CartDrawer',
    kind: 'component',
    file: 'src/features/cart/cart.tsx',
    line: 24,
    signature: '(props: CartDrawerProps) => JSX.Element',
    kindIcon: 'Layers',
  },
  {
    id: 's2',
    name: 'CartLine',
    kind: 'component',
    file: 'src/features/cart/cart.tsx',
    line: 88,
    signature: '({ item }: { item: CartItem }) => JSX.Element',
    kindIcon: 'Layers',
  },
  {
    id: 's3',
    name: 'useCart',
    kind: 'hook',
    file: 'src/features/cart/cart.tsx',
    line: 132,
    signature: '() => CartState',
    kindIcon: 'Zap',
  },
  {
    id: 's4',
    name: 'addItem',
    kind: 'fn',
    file: 'src/features/cart/cart.tsx',
    line: 156,
    signature: '(item: CartItem, qty?: number) => void',
    kindIcon: 'Code',
    parentId: 's5',
  },
  {
    id: 's5',
    name: 'CartStore',
    kind: 'class',
    file: 'src/features/cart/cart.tsx',
    line: 144,
    signature: 'class CartStore extends Store<CartState>',
    kindIcon: 'Box',
  },
  {
    id: 's6',
    name: 'removeItem',
    kind: 'fn',
    file: 'src/features/cart/cart.tsx',
    line: 178,
    signature: '(itemId: string) => void',
    kindIcon: 'Code',
    parentId: 's5',
  },
  {
    id: 's7',
    name: 'CART_TAX_RATE',
    kind: 'const',
    file: 'src/features/cart/cart.tsx',
    line: 12,
    signature: 'const CART_TAX_RATE = 0.0875',
    kindIcon: 'Hash',
  },
  {
    id: 's8',
    name: 'CartItem',
    kind: 'type',
    file: 'src/features/cart/cart.tsx',
    line: 4,
    signature: 'type CartItem = { id: string; name: string; qty: number }',
    kindIcon: 'Tag',
  },

  // file 2: src/features/checkout/checkout.tsx
  {
    id: 's9',
    name: 'CheckoutForm',
    kind: 'component',
    file: 'src/features/checkout/checkout.tsx',
    line: 18,
    signature: '() => JSX.Element',
    kindIcon: 'Layers',
  },
  {
    id: 's10',
    name: 'AddressFields',
    kind: 'component',
    file: 'src/features/checkout/checkout.tsx',
    line: 64,
    signature: '({ value, onChange }: AddressFieldsProps) => JSX.Element',
    kindIcon: 'Layers',
    parentId: 's9',
  },
  {
    id: 's11',
    name: 'useCheckout',
    kind: 'hook',
    file: 'src/features/checkout/checkout.tsx',
    line: 110,
    signature: '() => CheckoutHandlers',
    kindIcon: 'Zap',
  },
  {
    id: 's12',
    name: 'submitOrder',
    kind: 'fn',
    file: 'src/features/checkout/checkout.tsx',
    line: 138,
    signature: '(payload: OrderPayload) => Promise<OrderResult>',
    kindIcon: 'Code',
  },
  {
    id: 's13',
    name: 'OrderPayload',
    kind: 'type',
    file: 'src/features/checkout/checkout.tsx',
    line: 6,
    signature: 'type OrderPayload = { items: CartItem[]; address: Address }',
    kindIcon: 'Tag',
  },
  {
    id: 's14',
    name: 'PAYMENT_PROVIDERS',
    kind: 'const',
    file: 'src/features/checkout/checkout.tsx',
    line: 14,
    signature: "const PAYMENT_PROVIDERS = ['stripe', 'paypal'] as const",
    kindIcon: 'Hash',
  },
  {
    id: 's15',
    name: 'autoFocus',
    kind: 'prop',
    file: 'src/features/checkout/checkout.tsx',
    line: 65,
    signature: 'autoFocus?: boolean',
    kindIcon: 'Hex',
    parentId: 's10',
  },

  // file 3: src/widgets/header/header.tsx
  {
    id: 's16',
    name: 'SiteHeader',
    kind: 'component',
    file: 'src/widgets/header/header.tsx',
    line: 22,
    signature: '() => JSX.Element',
    kindIcon: 'Layers',
  },
  {
    id: 's17',
    name: 'HeaderNav',
    kind: 'component',
    file: 'src/widgets/header/header.tsx',
    line: 58,
    signature: '({ links }: HeaderNavProps) => JSX.Element',
    kindIcon: 'Layers',
    parentId: 's16',
  },
  {
    id: 's18',
    name: 'CartButton',
    kind: 'component',
    file: 'src/widgets/header/header.tsx',
    line: 92,
    signature: '() => JSX.Element',
    kindIcon: 'Layers',
    parentId: 's16',
  },
  {
    id: 's19',
    name: 'useHeaderShadow',
    kind: 'hook',
    file: 'src/widgets/header/header.tsx',
    line: 120,
    signature: '() => boolean',
    kindIcon: 'Zap',
  },
  {
    id: 's20',
    name: 'NAV_LINKS',
    kind: 'const',
    file: 'src/widgets/header/header.tsx',
    line: 8,
    signature: 'const NAV_LINKS: ReadonlyArray<NavLink>',
    kindIcon: 'Hash',
  },
  {
    id: 's21',
    name: 'HeaderNavProps',
    kind: 'type',
    file: 'src/widgets/header/header.tsx',
    line: 12,
    signature: 'type HeaderNavProps = { links: NavLink[] }',
    kindIcon: 'Tag',
  },
  {
    id: 's22',
    name: 'sticky',
    kind: 'prop',
    file: 'src/widgets/header/header.tsx',
    line: 23,
    signature: 'sticky?: boolean',
    kindIcon: 'Hex',
    parentId: 's16',
  },

  // file 4: src/shared/ui/button.tsx
  {
    id: 's23',
    name: 'Button',
    kind: 'component',
    file: 'src/shared/ui/button.tsx',
    line: 39,
    signature: 'forwardRef<HTMLButtonElement, ButtonProps>',
    kindIcon: 'Layers',
  },
  {
    id: 's24',
    name: 'ButtonProps',
    kind: 'type',
    file: 'src/shared/ui/button.tsx',
    line: 33,
    signature: 'interface ButtonProps extends ButtonHTMLAttributes',
    kindIcon: 'Tag',
  },
  {
    id: 's25',
    name: 'button',
    kind: 'const',
    file: 'src/shared/ui/button.tsx',
    line: 6,
    signature: 'const button = cva(...)',
    kindIcon: 'Hash',
  },
  {
    id: 's26',
    name: 'tone',
    kind: 'prop',
    file: 'src/shared/ui/button.tsx',
    line: 11,
    signature: "tone?: 'default' | 'ghost' | 'accent' | 'soft' | 'warn' | 'err'",
    kindIcon: 'Hex',
    parentId: 's24',
  },
  {
    id: 's27',
    name: 'size',
    kind: 'prop',
    file: 'src/shared/ui/button.tsx',
    line: 18,
    signature: "size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'",
    kindIcon: 'Hex',
    parentId: 's24',
  },
  {
    id: 's28',
    name: 'asChild',
    kind: 'prop',
    file: 'src/shared/ui/button.tsx',
    line: 36,
    signature: 'asChild?: boolean',
    kindIcon: 'Hex',
    parentId: 's24',
  },
  {
    id: 's29',
    name: 'classNames',
    kind: 'fn',
    file: 'src/shared/ui/button.tsx',
    line: 40,
    signature: '(props: ButtonProps) => string',
    kindIcon: 'Code',
  },
  {
    id: 's30',
    name: 'displayName',
    kind: 'const',
    file: 'src/shared/ui/button.tsx',
    line: 51,
    signature: "Button.displayName = 'Button'",
    kindIcon: 'Hash',
  },
];

export interface FileGroup {
  readonly file: string;
  readonly items: ReadonlyArray<SymbolEntry>;
}

export function groupByFile(
  entries: ReadonlyArray<SymbolEntry>,
): ReadonlyArray<FileGroup> {
  const map = new Map<string, SymbolEntry[]>();
  for (const e of entries) {
    const arr = map.get(e.file);
    if (arr) arr.push(e);
    else map.set(e.file, [e]);
  }
  return Array.from(map.entries()).map(([file, items]) => ({ file, items }));
}

export interface OutlineNode {
  readonly entry: SymbolEntry;
  readonly children: ReadonlyArray<OutlineNode>;
}

export function buildOutline(
  entries: ReadonlyArray<SymbolEntry>,
): ReadonlyArray<{ file: string; roots: ReadonlyArray<OutlineNode> }> {
  const groups = groupByFile(entries);
  return groups.map((g) => {
    const byParent = new Map<string | undefined, SymbolEntry[]>();
    for (const e of g.items) {
      const k = e.parentId;
      const arr = byParent.get(k);
      if (arr) arr.push(e);
      else byParent.set(k, [e]);
    }
    const build = (parent: string | undefined): OutlineNode[] => {
      const list = byParent.get(parent) ?? [];
      return list.map((entry) => ({
        entry,
        children: build(entry.id),
      }));
    };
    return { file: g.file, roots: build(undefined) };
  });
}

export function shortFile(file: string): string {
  const parts = file.split('/');
  return parts.slice(-2).join('/');
}
