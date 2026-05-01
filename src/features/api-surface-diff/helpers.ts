export type SurfaceKind = 'fn' | 'type' | 'component' | 'hook' | 'const';
export type Severity = 'major' | 'minor' | 'patch';

export interface SurfaceItem {
  readonly id: string;
  readonly name: string;
  readonly kind: SurfaceKind;
  readonly signature: string;
  readonly since: string;
  readonly deprecated: boolean;
  readonly removed: boolean;
}

const COMMON: ReadonlyArray<SurfaceItem> = [
  { id: 'cart-useCart', name: 'useCart', kind: 'hook', signature: 'useCart(): CartApi', since: '0.1.0', deprecated: false, removed: false },
  { id: 'cart-CartProvider', name: 'CartProvider', kind: 'component', signature: 'CartProvider(props: { children: ReactNode }): JSX.Element', since: '0.1.0', deprecated: false, removed: false },
  { id: 'cart-Order', name: 'Order', kind: 'type', signature: 'type Order = { id: string; total: number; lines: Line[] }', since: '0.2.0', deprecated: false, removed: false },
  { id: 'auth-signIn', name: 'signInAction', kind: 'fn', signature: 'signInAction(form: FormData): Promise<void>', since: '0.2.0', deprecated: false, removed: false },
  { id: 'auth-useSession', name: 'useSession', kind: 'hook', signature: 'useSession(): Session | null', since: '0.2.0', deprecated: false, removed: false },
  { id: 'fmt-formatDate', name: 'formatDate', kind: 'fn', signature: 'formatDate(d: Date): string', since: '0.1.0', deprecated: false, removed: false },
  { id: 'search-useSearch', name: 'useSearch', kind: 'hook', signature: 'useSearch(query: string): SearchHits', since: '0.3.0', deprecated: false, removed: false },
  { id: 'products-fetchProduct', name: 'fetchProduct', kind: 'fn', signature: 'fetchProduct(id: string): Promise<Product>', since: '0.1.0', deprecated: false, removed: false },
  { id: 'products-Product', name: 'Product', kind: 'type', signature: 'type Product = { id: string; name: string; price: number }', since: '0.1.0', deprecated: false, removed: false },
  { id: 'cache-memo', name: 'memo', kind: 'fn', signature: 'memo<T>(fn: () => T, key: string): () => T', since: '0.2.0', deprecated: false, removed: false },
  { id: 'cache-invalidate', name: 'invalidate', kind: 'fn', signature: 'invalidate(prefix: string): void', since: '0.2.0', deprecated: false, removed: false },
  { id: 'route-VERSION', name: 'VERSION', kind: 'const', signature: 'const VERSION: string', since: '0.1.0', deprecated: false, removed: false },
];

export const V1_SURFACE: ReadonlyArray<SurfaceItem> = [
  ...COMMON,
  { id: 'fmt-formatPrice', name: 'formatPrice', kind: 'fn', signature: 'formatPrice(cents: number): string', since: '0.1.0', deprecated: false, removed: false },
  { id: 'cart-checkout', name: 'checkout', kind: 'fn', signature: 'checkout(input: CheckoutInput): Promise<Order>', since: '0.2.0', deprecated: false, removed: false },
  { id: 'legacy-formatLegacyDate', name: 'formatLegacyDate', kind: 'fn', signature: 'formatLegacyDate(d: Date): string', since: '0.1.0', deprecated: true, removed: false },
  { id: 'legacy-LegacyOrderShape', name: 'LegacyOrderShape', kind: 'type', signature: 'type LegacyOrderShape = { id: string; subtotal: number }', since: '0.1.0', deprecated: true, removed: false },
  { id: 'auth-parseLegacyToken', name: 'parseLegacyToken', kind: 'fn', signature: 'parseLegacyToken(t: string): { uid: string }', since: '0.1.0', deprecated: true, removed: false },
  { id: 'cart-applyLegacyCoupon', name: 'applyLegacyCoupon', kind: 'fn', signature: 'applyLegacyCoupon(code: string): number', since: '0.1.0', deprecated: false, removed: false },
];

export const V2_SURFACE: ReadonlyArray<SurfaceItem> = [
  ...COMMON,
  // changed signature
  { id: 'fmt-formatPrice', name: 'formatPrice', kind: 'fn', signature: 'formatPrice(cents: number, currency?: string): string', since: '0.1.0', deprecated: false, removed: false },
  { id: 'cart-checkout', name: 'checkout', kind: 'fn', signature: 'checkout(input: CheckoutInput): Promise<{ order: Order; receipt: Receipt }>', since: '0.2.0', deprecated: false, removed: false },
  // newly deprecated
  { id: 'cart-applyLegacyCoupon', name: 'applyLegacyCoupon', kind: 'fn', signature: 'applyLegacyCoupon(code: string): number', since: '0.1.0', deprecated: true, removed: false },
  // removed
  { id: 'legacy-formatLegacyDate', name: 'formatLegacyDate', kind: 'fn', signature: 'formatLegacyDate(d: Date): string', since: '0.1.0', deprecated: true, removed: true },
  { id: 'legacy-LegacyOrderShape', name: 'LegacyOrderShape', kind: 'type', signature: 'type LegacyOrderShape = { id: string; subtotal: number }', since: '0.1.0', deprecated: true, removed: true },
  { id: 'auth-parseLegacyToken', name: 'parseLegacyToken', kind: 'fn', signature: 'parseLegacyToken(t: string): { uid: string }', since: '0.1.0', deprecated: true, removed: true },
  // additions
  { id: 'cart-useCartTotal', name: 'useCartTotal', kind: 'hook', signature: 'useCartTotal(): { cents: number; formatted: string }', since: '1.0.0', deprecated: false, removed: false },
  { id: 'billing-listInvoices', name: 'listInvoices', kind: 'fn', signature: 'listInvoices(uid: string): Promise<Invoice[]>', since: '1.0.0', deprecated: false, removed: false },
  { id: 'billing-Invoice', name: 'Invoice', kind: 'type', signature: 'type Invoice = { id: string; amount: number; status: "paid" | "open" }', since: '1.0.0', deprecated: false, removed: false },
];

export interface DiffChange {
  readonly id: string;
  readonly name: string;
  readonly kind: SurfaceKind;
  readonly severity: Severity;
  readonly before?: SurfaceItem;
  readonly after?: SurfaceItem;
  readonly type: 'added' | 'removed' | 'changed' | 'deprecated';
}

export function diffSurfaces(
  v1: ReadonlyArray<SurfaceItem>,
  v2: ReadonlyArray<SurfaceItem>,
): {
  added: ReadonlyArray<DiffChange>;
  removed: ReadonlyArray<DiffChange>;
  changed: ReadonlyArray<DiffChange>;
  deprecated: ReadonlyArray<DiffChange>;
} {
  const v1Map = new Map(v1.filter((i) => !i.removed).map((i) => [i.id, i]));
  const v2Map = new Map(v2.filter((i) => !i.removed).map((i) => [i.id, i]));
  const added: DiffChange[] = [];
  const removed: DiffChange[] = [];
  const changed: DiffChange[] = [];
  const deprecated: DiffChange[] = [];

  for (const [id, after] of v2Map) {
    const before = v1Map.get(id);
    if (before === undefined) {
      added.push({ id, name: after.name, kind: after.kind, severity: 'minor', after, type: 'added' });
    } else {
      if (before.signature !== after.signature) {
        changed.push({
          id,
          name: after.name,
          kind: after.kind,
          severity: 'major',
          before,
          after,
          type: 'changed',
        });
      }
      if (!before.deprecated && after.deprecated) {
        deprecated.push({
          id,
          name: after.name,
          kind: after.kind,
          severity: 'minor',
          before,
          after,
          type: 'deprecated',
        });
      }
    }
  }
  for (const [id, before] of v1Map) {
    if (!v2Map.has(id)) {
      removed.push({ id, name: before.name, kind: before.kind, severity: 'major', before, type: 'removed' });
    }
  }

  return { added, removed, changed, deprecated };
}

export type DiffTab = 'added' | 'removed' | 'changed' | 'deprecated' | 'all';

export const TABS: ReadonlyArray<{ key: DiffTab; label: string }> = [
  { key: 'added', label: 'Added' },
  { key: 'removed', label: 'Removed' },
  { key: 'changed', label: 'Changed' },
  { key: 'deprecated', label: 'Deprecated' },
  { key: 'all', label: 'All' },
];

export function semverVerdict(d: ReturnType<typeof diffSurfaces>): {
  bump: 'major' | 'minor' | 'patch';
  reason: string;
} {
  const breaking = d.removed.length + d.changed.length;
  if (breaking > 0) {
    return {
      bump: 'major',
      reason: `MAJOR bump required: ${d.removed.length} breaking removal${d.removed.length === 1 ? '' : 's'}, ${d.changed.length} signature change${d.changed.length === 1 ? '' : 's'}.`,
    };
  }
  if (d.added.length + d.deprecated.length > 0) {
    return {
      bump: 'minor',
      reason: `MINOR bump: ${d.added.length} addition${d.added.length === 1 ? '' : 's'}, ${d.deprecated.length} new deprecation${d.deprecated.length === 1 ? '' : 's'}.`,
    };
  }
  return { bump: 'patch', reason: 'No surface changes — patch bump only.' };
}

export function buildChangelog(d: ReturnType<typeof diffSurfaces>): string {
  const lines: string[] = ['# Changelog', ''];
  if (d.removed.length > 0) {
    lines.push('## Removed (breaking)');
    for (const r of d.removed) lines.push(`- \`${r.name}\` (${r.kind})`);
    lines.push('');
  }
  if (d.changed.length > 0) {
    lines.push('## Changed (breaking)');
    for (const c of d.changed) {
      lines.push(`- \`${c.name}\``);
      if (c.before) lines.push(`    before: ${c.before.signature}`);
      if (c.after) lines.push(`    after:  ${c.after.signature}`);
    }
    lines.push('');
  }
  if (d.added.length > 0) {
    lines.push('## Added');
    for (const a of d.added) lines.push(`- \`${a.name}\` (${a.kind})`);
    lines.push('');
  }
  if (d.deprecated.length > 0) {
    lines.push('## Deprecated');
    for (const x of d.deprecated) lines.push(`- \`${x.name}\` (${x.kind})`);
    lines.push('');
  }
  return lines.join('\n');
}

export const SEVERITY_TONE: Record<Severity, 'err' | 'warn' | 'info'> = {
  major: 'err',
  minor: 'warn',
  patch: 'info',
};

export const KIND_TONE: Record<SurfaceKind, 'accent' | 'info' | 'static' | 'hint' | 'muted'> = {
  fn: 'accent',
  type: 'info',
  component: 'static',
  hook: 'hint',
  const: 'muted',
};
