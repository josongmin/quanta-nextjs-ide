import type { CodeSymbolKind } from '@entities/code-symbol';

/**
 * Subset of {@link CodeSymbolKind} that peek-definition surfaces.
 * Aligned to the canonical entity to prevent type drift.
 */
export type PeekKind = Extract<
  CodeSymbolKind,
  'function' | 'class' | 'interface' | 'type' | 'const' | 'component' | 'hook'
>;

export interface Definition {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  /** 1-based offset within `body` representing the symbol's defining line. */
  readonly highlightOffset: number;
  /** lines before the definition start (3 lines). */
  readonly contextBefore: ReadonlyArray<string>;
  readonly body: ReadonlyArray<string>;
  readonly contextAfter: ReadonlyArray<string>;
}

export interface PeekSymbol {
  readonly id: string;
  readonly name: string;
  readonly kind: PeekKind;
  readonly declaredIn: string;
  readonly since: string;
  readonly deprecated?: { readonly replacement: string };
  readonly usedCount: number;
  readonly definitions: ReadonlyArray<Definition>;
}

export const SYMBOLS: ReadonlyArray<PeekSymbol> = [
  {
    id: 'cn',
    name: 'cn',
    kind: 'function',
    declaredIn: 'src/shared/lib/cn.ts',
    since: '0.1.0',
    usedCount: 412,
    definitions: [
      {
        id: 'cn-1',
        file: 'src/shared/lib/cn.ts',
        line: 5,
        highlightOffset: 1,
        contextBefore: [
          "import { clsx, type ClassValue } from 'clsx';",
          "import { twMerge } from 'tailwind-merge';",
          '',
        ],
        body: [
          'export function cn(...inputs: ClassValue[]): string {',
          '  return twMerge(clsx(inputs));',
          '}',
        ],
        contextAfter: ['', "// re-export helpers", "export type { ClassValue };"],
      },
    ],
  },
  {
    id: 'Button',
    name: 'Button',
    kind: 'component',
    declaredIn: 'src/shared/ui/button.tsx',
    since: '0.2.0',
    usedCount: 318,
    definitions: [
      {
        id: 'Button-1',
        file: 'src/shared/ui/button.tsx',
        line: 39,
        highlightOffset: 1,
        contextBefore: [
          'Button.displayName = undefined;',
          'interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {}',
          '',
        ],
        body: [
          'export const Button = forwardRef<HTMLButtonElement, Props>(',
          '  ({ className, tone, size, asChild, ...rest }, ref) => {',
          "    const Comp = asChild ? Slot : 'button';",
          '    return (',
          '      <Comp ref={ref} className={cn(button({ tone, size }), className)} {...rest} />',
          '    );',
          '  },',
          ');',
        ],
        contextAfter: ["Button.displayName = 'Button';", '', '// end of file'],
      },
      {
        id: 'Button-2',
        file: 'src/shared/ui/button.legacy.tsx',
        line: 12,
        highlightOffset: 1,
        contextBefore: [
          '/** legacy class-based button (pre-cva) */',
          "import React from 'react';",
          '',
        ],
        body: [
          'export class Button extends React.Component<Props> {',
          '  render() {',
          '    return <button className={this.props.className}>{this.props.children}</button>;',
          '  }',
          '}',
        ],
        contextAfter: ['', "// kept for backwards-compat tests"],
      },
    ],
  },
  {
    id: 'useCart',
    name: 'useCart',
    kind: 'hook',
    declaredIn: 'src/features/cart/cart.tsx',
    since: '0.3.0',
    usedCount: 28,
    definitions: [
      {
        id: 'useCart-1',
        file: 'src/features/cart/cart.tsx',
        line: 132,
        highlightOffset: 1,
        contextBefore: [
          'const cartStore = new CartStore();',
          '',
          '/** Subscribes to the cart store and re-renders on change. */',
        ],
        body: [
          'export function useCart(): CartState {',
          '  return useSyncExternalStore(',
          '    cartStore.subscribe,',
          '    cartStore.read,',
          '  );',
          '}',
        ],
        contextAfter: ['', 'export type { CartState };'],
      },
    ],
  },
  {
    id: 'CartItem',
    name: 'CartItem',
    kind: 'type',
    declaredIn: 'src/features/cart/cart.tsx',
    since: '0.1.0',
    usedCount: 76,
    definitions: [
      {
        id: 'CartItem-1',
        file: 'src/features/cart/cart.tsx',
        line: 4,
        highlightOffset: 1,
        contextBefore: [
          "import type { ReactNode } from 'react';",
          '',
          '/** Item displayed in the cart drawer and persisted in store. */',
        ],
        body: [
          'export type CartItem = {',
          '  id: string;',
          '  name: string;',
          '  qty: number;',
          '  price: number;',
          '};',
        ],
        contextAfter: ['', 'export const EMPTY_ITEM: CartItem = {'],
      },
    ],
  },
  {
    id: 'OrderPayload',
    name: 'OrderPayload',
    kind: 'interface',
    declaredIn: 'src/features/checkout/checkout.tsx',
    since: '0.2.0',
    usedCount: 14,
    deprecated: { replacement: 'OrderRequest' },
    definitions: [
      {
        id: 'OrderPayload-1',
        file: 'src/features/checkout/checkout.tsx',
        line: 6,
        highlightOffset: 1,
        contextBefore: [
          "import type { CartItem } from '@features/cart';",
          "import type { Address } from '@shared/types/address';",
          '',
        ],
        body: [
          '/** @deprecated use OrderRequest */',
          'export interface OrderPayload {',
          '  items: CartItem[];',
          '  address: Address;',
          '  notes?: string;',
          '}',
        ],
        contextAfter: ['', 'export interface OrderResult {', '  ok: boolean;'],
      },
    ],
  },
  {
    id: 'CartStore',
    name: 'CartStore',
    kind: 'class',
    declaredIn: 'src/features/cart/cart.tsx',
    since: '0.4.0',
    usedCount: 11,
    definitions: [
      {
        id: 'CartStore-1',
        file: 'src/features/cart/cart.tsx',
        line: 144,
        highlightOffset: 1,
        contextBefore: [
          'const TAX = 0.0875;',
          '',
          '/** In-memory cart store with persistence. */',
        ],
        body: [
          'export class CartStore extends Store<CartState> {',
          '  addItem(item: CartItem, qty = 1): void {',
          '    this.update((s) => ({ ...s, items: [...s.items, { ...item, qty }] }));',
          '  }',
          '  removeItem(id: string): void {',
          '    this.update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));',
          '  }',
          '  clear(): void {',
          '    this.update((s) => ({ ...s, items: [] }));',
          '  }',
          '}',
        ],
        contextAfter: ['', 'export const cartStore = new CartStore();'],
      },
    ],
  },
  {
    id: 'submitOrder',
    name: 'submitOrder',
    kind: 'function',
    declaredIn: 'src/features/checkout/checkout.tsx',
    since: '0.2.0',
    usedCount: 12,
    definitions: [
      {
        id: 'submitOrder-1',
        file: 'src/features/checkout/checkout.tsx',
        line: 138,
        highlightOffset: 1,
        contextBefore: [
          "import { chargeCard } from './charge';",
          "import { persistOrder } from './persist';",
          '',
        ],
        body: [
          'export async function submitOrder(payload: OrderPayload): Promise<OrderResult> {',
          '  const valid = await validatePayload(payload);',
          '  const charge = await chargeCard(valid);',
          '  const order = await persistOrder(charge);',
          '  return sendReceipt(order);',
          '}',
        ],
        contextAfter: ['', 'export type { OrderPayload, OrderResult };'],
      },
      {
        id: 'submitOrder-2',
        file: 'src/features/checkout/checkout.test.ts',
        line: 22,
        highlightOffset: 1,
        contextBefore: [
          '/** Test stub overrides the real impl in dev-mode tests. */',
          "import { vi } from 'vitest';",
          '',
        ],
        body: [
          'export const submitOrder = vi.fn(async () => ({',
          '  ok: true,',
          "  orderId: 'mock-order-1',",
          '}));',
        ],
        contextAfter: ['', "// reset between tests", "afterEach(submitOrder.mockReset);"],
      },
      {
        id: 'submitOrder-3',
        file: 'src/features/checkout/checkout.edge.ts',
        line: 8,
        highlightOffset: 1,
        contextBefore: [
          "// runs at the edge — minimal validation only",
          "import type { OrderPayload } from './checkout';",
          '',
        ],
        body: [
          'export async function submitOrder(payload: OrderPayload) {',
          "  const r = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });",
          '  return r.json();',
          '}',
        ],
        contextAfter: ['', "// edge runtime config", "export const runtime = 'edge';"],
      },
    ],
  },
  {
    id: 'NAV_LINKS',
    name: 'NAV_LINKS',
    kind: 'const',
    declaredIn: 'src/widgets/header/header.tsx',
    since: '0.1.0',
    usedCount: 6,
    definitions: [
      {
        id: 'NAV_LINKS-1',
        file: 'src/widgets/header/header.tsx',
        line: 8,
        highlightOffset: 1,
        contextBefore: [
          "import type { NavLink } from './types';",
          '',
          '/** Top-nav links rendered in the site header. */',
        ],
        body: [
          'export const NAV_LINKS: ReadonlyArray<NavLink> = [',
          "  { href: '/', label: 'Home' },",
          "  { href: '/products', label: 'Products' },",
          "  { href: '/about', label: 'About' },",
          '];',
        ],
        contextAfter: ['', 'export type { NavLink };'],
      },
    ],
  },
  {
    id: 'OverlayPanel',
    name: 'OverlayPanel',
    kind: 'component',
    declaredIn: 'src/shared/ui/overlay-panel.tsx',
    since: '0.3.0',
    usedCount: 92,
    definitions: [
      {
        id: 'OverlayPanel-1',
        file: 'src/shared/ui/overlay-panel.tsx',
        line: 17,
        highlightOffset: 1,
        contextBefore: [
          "import * as Dialog from '@radix-ui/react-dialog';",
          "import { X } from 'lucide-react';",
          "import type { ReactNode } from 'react';",
        ],
        body: [
          'export function OverlayPanel({',
          '  open, onOpenChange, title, subtitle, children, footer,',
          '  width = 720, className,',
          '}: Props) {',
          '  return (',
          '    <Dialog.Root open={open} onOpenChange={onOpenChange}>...</Dialog.Root>',
          '  );',
          '}',
        ],
        contextAfter: ['', '// see overlay-panel.spec.tsx for behavior'],
      },
    ],
  },
  {
    id: 'CART_TAX_RATE',
    name: 'CART_TAX_RATE',
    kind: 'const',
    declaredIn: 'src/features/cart/cart.tsx',
    since: '0.1.0',
    usedCount: 9,
    deprecated: { replacement: 'CART_TAX_TABLE' },
    definitions: [
      {
        id: 'CART_TAX_RATE-1',
        file: 'src/features/cart/cart.tsx',
        line: 12,
        highlightOffset: 1,
        contextBefore: [
          '/** @deprecated use CART_TAX_TABLE */',
          '',
          '',
        ],
        body: [
          'export const CART_TAX_RATE = 0.0875;',
          '',
          '// note: replaced by CART_TAX_TABLE which is region-aware.',
        ],
        contextAfter: ['', 'export const CART_TAX_TABLE: Record<string, number> = {'],
      },
    ],
  },
];

export const ROOT_PEEK_ID = 'submitOrder';

export function findSymbol(id: string): PeekSymbol | undefined {
  return SYMBOLS.find((s) => s.id === id);
}
