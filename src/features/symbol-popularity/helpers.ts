import type { CodeSymbolKind } from '@entities/code-symbol';

/**
 * Subset of {@link CodeSymbolKind} that the symbol-popularity panel ranks.
 * Aligned to the canonical entity to prevent type drift.
 */
export type SymbolKind = Extract<
  CodeSymbolKind,
  'fn' | 'type' | 'component' | 'hook' | 'const'
>;

export interface SymbolEntry {
  readonly id: string;
  readonly name: string;
  readonly kind: SymbolKind;
  readonly count: number;
  readonly fileCount: number;
  /** 8 weekly counts, oldest -> newest */
  readonly recentTrend: ReadonlyArray<number>;
  readonly topImporters: ReadonlyArray<{ file: string; line: number; preview: string }>;
}

export const SYMBOLS: ReadonlyArray<SymbolEntry> = [
  {
    id: 'sy1',
    name: 'cn',
    kind: 'fn',
    count: 412,
    fileCount: 198,
    recentTrend: [40, 42, 45, 48, 50, 52, 55, 58],
    topImporters: [
      { file: 'src/shared/ui/button.tsx', line: 4, preview: "import { cn } from '@shared/lib/cn';" },
      { file: 'src/shared/ui/chip.tsx', line: 3, preview: "import { cn } from '@shared/lib/cn';" },
      { file: 'src/widgets/header/site-header.tsx', line: 2, preview: "import { cn } from '@shared/lib/cn';" },
      { file: 'src/features/cart/cart-line.tsx', line: 1, preview: "import { cn } from '@shared/lib/cn';" },
      { file: 'src/features/products/product-card.tsx', line: 2, preview: "import { cn } from '@shared/lib/cn';" },
    ],
  },
  {
    id: 'sy2',
    name: 'Button',
    kind: 'component',
    count: 318,
    fileCount: 142,
    recentTrend: [38, 38, 39, 41, 41, 42, 43, 45],
    topImporters: [
      { file: 'src/widgets/header/cart-button.tsx', line: 5, preview: "<Button onClick={...}>Open</Button>" },
      { file: 'src/features/products/product-card.tsx', line: 22, preview: "<Button tone='accent'>Buy</Button>" },
      { file: 'src/features/billing/refund.ts', line: 12, preview: "// no usage" },
      { file: 'src/widgets/cart/cart-drawer.tsx', line: 18, preview: "<Button size='xs'>Close</Button>" },
      { file: 'src/widgets/footer/site-footer.tsx', line: 9, preview: "<Button tone='ghost'>Sign up</Button>" },
    ],
  },
  {
    id: 'sy3',
    name: 'OverlayPanel',
    kind: 'component',
    count: 98,
    fileCount: 92,
    recentTrend: [10, 10, 11, 12, 12, 13, 13, 14],
    topImporters: [
      { file: 'src/features/cart/index.tsx', line: 3, preview: "<OverlayPanel open={open}>..." },
      { file: 'src/features/auth/index.tsx', line: 4, preview: "<OverlayPanel open={open}>..." },
      { file: 'src/features/secret-scanner/index.tsx', line: 2, preview: "<OverlayPanel open={open}>..." },
      { file: 'src/features/cve-timeline/index.tsx', line: 2, preview: "<OverlayPanel open={open}>..." },
      { file: 'src/features/sbom-viewer/index.tsx', line: 2, preview: "<OverlayPanel open={open}>..." },
    ],
  },
  {
    id: 'sy4',
    name: 'Chip',
    kind: 'component',
    count: 286,
    fileCount: 124,
    recentTrend: [28, 30, 32, 34, 34, 36, 38, 39],
    topImporters: [
      { file: 'src/widgets/header/site-header.tsx', line: 8, preview: "<Chip tone='accent'>" },
      { file: 'src/features/products/product-card.tsx', line: 14, preview: "<Chip tone='warn'>" },
      { file: 'src/features/billing/coupon.ts', line: 5, preview: "<Chip tone='info'>" },
      { file: 'src/features/cart/cart-line.tsx', line: 11, preview: "<Chip tone='static'>" },
      { file: 'src/features/auth/use-session.ts', line: 9, preview: "<Chip tone='hint'>" },
    ],
  },
  {
    id: 'sy5',
    name: 'useUiStore',
    kind: 'hook',
    count: 174,
    fileCount: 119,
    recentTrend: [20, 22, 22, 23, 24, 24, 24, 24],
    topImporters: [
      { file: 'src/features/notifications/index.tsx', line: 1, preview: "useUiStore((s) => s.overlays.notifications.open)" },
      { file: 'src/features/recents/index.tsx', line: 1, preview: "useUiStore((s) => s.overlays.recents.open)" },
      { file: 'src/widgets/overlays/overlays-host.tsx', line: 1, preview: "useUiStore((s) => s.closeOverlay)" },
      { file: 'src/features/shortcut-help/index.tsx', line: 1, preview: "useUiStore((s) => s.overlays.shortcutHelp.open)" },
      { file: 'src/features/onboarding/index.tsx', line: 1, preview: "useUiStore((s) => s.overlays.onboarding.open)" },
    ],
  },
  {
    id: 'sy6',
    name: 'toast',
    kind: 'fn',
    count: 162,
    fileCount: 96,
    recentTrend: [18, 18, 19, 20, 20, 22, 22, 22],
    topImporters: [
      { file: 'src/features/cart/cart-api.ts', line: 4, preview: "toast.success('Added to cart')" },
      { file: 'src/features/auth/sign-in.action.ts', line: 6, preview: "toast('Signed in')" },
      { file: 'src/features/billing/subscribe.action.ts', line: 8, preview: "toast.success('Subscribed')" },
      { file: 'src/features/notifications/index.tsx', line: 12, preview: "toast('New notification')" },
      { file: 'src/features/secret-scanner/index.tsx', line: 14, preview: "toast('Scan complete')" },
    ],
  },
  {
    id: 'sy7',
    name: 'Icon',
    kind: 'const',
    count: 143,
    fileCount: 87,
    recentTrend: [16, 17, 18, 18, 18, 19, 19, 18],
    topImporters: [
      { file: 'src/widgets/header/site-header.tsx', line: 3, preview: "<Icon.Search />" },
      { file: 'src/widgets/bottom-panel/parts/search-input.tsx', line: 1, preview: "<Icon.Search />" },
      { file: 'src/features/notifications/index.tsx', line: 4, preview: "<Icon.Alert />" },
      { file: 'src/features/cve-timeline/index.tsx', line: 4, preview: "<Icon.Shield />" },
      { file: 'src/features/auth/sign-in.action.ts', line: 8, preview: "<Icon.Lock />" },
    ],
  },
  {
    id: 'sy8',
    name: 'useState',
    kind: 'hook',
    count: 280,
    fileCount: 156,
    recentTrend: [33, 34, 34, 35, 35, 35, 36, 38],
    topImporters: [
      { file: 'src/features/auth/sign-in.tsx', line: 1, preview: "const [email, setEmail] = useState('')" },
      { file: 'src/features/cart/use-cart.ts', line: 4, preview: "const [items, setItems] = useState<Line[]>([])" },
      { file: 'src/features/search/use-search.ts', line: 3, preview: "const [hits, setHits] = useState<SearchHits>([])" },
      { file: 'src/features/billing/refund.ts', line: 6, preview: "const [pending, setPending] = useState(false)" },
      { file: 'src/features/products/product-list.tsx', line: 7, preview: "const [filter, setFilter] = useState('all')" },
    ],
  },
  {
    id: 'sy9',
    name: 'useEffect',
    kind: 'hook',
    count: 248,
    fileCount: 142,
    recentTrend: [30, 31, 31, 31, 32, 32, 32, 32],
    topImporters: [
      { file: 'src/features/cart/use-cart.ts', line: 7, preview: "useEffect(() => () => cache.clear(), [])" },
      { file: 'src/features/auth/use-session.ts', line: 4, preview: "useEffect(() => readSession().then(setS), [])" },
      { file: 'src/features/search/use-search.ts', line: 5, preview: "useEffect(() => { search(query).then(setHits); }, [query])" },
      { file: 'src/features/products/use-product.ts', line: 4, preview: "useEffect(() => fetchProduct(id).then(setP), [id])" },
      { file: 'src/features/notifications/index.tsx', line: 12, preview: "useEffect(() => subscribe(), [])" },
    ],
  },
  {
    id: 'sy10',
    name: 'CodeBlock',
    kind: 'component',
    count: 64,
    fileCount: 38,
    recentTrend: [6, 7, 8, 8, 8, 9, 9, 10],
    topImporters: [
      { file: 'src/features/api-surface-diff/index.tsx', line: 4, preview: "<CodeBlock code={...} />" },
      { file: 'src/features/quick-docs/index.tsx', line: 3, preview: "<CodeBlock code={...} />" },
      { file: 'src/features/sbom-viewer/index.tsx', line: 3, preview: "<CodeBlock code={...} />" },
      { file: 'src/features/seed-builder/index.tsx', line: 4, preview: "<CodeBlock code={...} />" },
      { file: 'src/features/find-references/index.tsx', line: 3, preview: "<CodeBlock code={...} />" },
    ],
  },
  ...mockMore(),
];

function mockMore(): ReadonlyArray<SymbolEntry> {
  const names: ReadonlyArray<{ name: string; kind: SymbolKind }> = [
    { name: 'useMemo', kind: 'hook' },
    { name: 'useCallback', kind: 'hook' },
    { name: 'forwardRef', kind: 'fn' },
    { name: 'createContext', kind: 'fn' },
    { name: 'memo', kind: 'fn' },
    { name: 'fetch', kind: 'fn' },
    { name: 'JSON', kind: 'const' },
    { name: 'Promise', kind: 'const' },
    { name: 'CartLine', kind: 'type' },
    { name: 'Product', kind: 'type' },
    { name: 'Order', kind: 'type' },
    { name: 'User', kind: 'type' },
    { name: 'Session', kind: 'type' },
    { name: 'Tooltip', kind: 'component' },
    { name: 'Popover', kind: 'component' },
    { name: 'ScrollArea', kind: 'component' },
    { name: 'EmptyState', kind: 'component' },
    { name: 'useSession', kind: 'hook' },
    { name: 'useCart', kind: 'hook' },
    { name: 'fetchProduct', kind: 'fn' },
  ];
  return names.map((n, i) => {
    const baseCount = 90 - i * 4;
    const trendDir = i % 3;
    const seedTrend: number[] = [];
    let v = Math.max(2, Math.floor(baseCount / 8));
    for (let w = 0; w < 8; w++) {
      const delta = trendDir === 0 ? 0 : trendDir === 1 ? 1 : -1;
      v = Math.max(0, v + delta);
      seedTrend.push(v);
    }
    return {
      id: `symx-${i}`,
      name: n.name,
      kind: n.kind,
      count: baseCount,
      fileCount: Math.max(2, Math.floor(baseCount / 2)),
      recentTrend: seedTrend,
      topImporters: [
        { file: `src/features/sample-${i}/index.tsx`, line: 4, preview: `import { ${n.name} } from '...';` },
        { file: `src/widgets/sample-${i}/index.tsx`, line: 2, preview: `// uses ${n.name}` },
        { file: `src/shared/lib/sample-${i}.ts`, line: 1, preview: `export { ${n.name} };` },
        { file: `src/entities/sample-${i}/model.ts`, line: 1, preview: `// references ${n.name}` },
        { file: `src/pages/sample-${i}.tsx`, line: 8, preview: `<${n.name}>...</${n.name}>` },
      ],
    };
  });
}

export type SortKey = 'count' | 'trend' | 'fileCount';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'count', label: 'Most used' },
  { value: 'trend', label: 'Trending up' },
  { value: 'fileCount', label: 'Spread across files' },
];

export function trendDirection(trend: ReadonlyArray<number>): 'up' | 'down' | 'flat' {
  if (trend.length < 2) return 'flat';
  const first = trend[0] ?? 0;
  const last = trend[trend.length - 1] ?? 0;
  const delta = last - first;
  if (Math.abs(delta) <= 1) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

export function trendDelta(trend: ReadonlyArray<number>): number {
  if (trend.length < 2) return 0;
  const first = trend[0] ?? 0;
  const last = trend[trend.length - 1] ?? 0;
  return last - first;
}

export const KIND_OPTIONS: ReadonlyArray<{ key: SymbolKind | 'all'; label: string }> = [
  { key: 'all', label: 'all' },
  { key: 'fn', label: 'fn' },
  { key: 'type', label: 'type' },
  { key: 'component', label: 'component' },
  { key: 'hook', label: 'hook' },
  { key: 'const', label: 'const' },
];

export const KIND_TONE: Record<SymbolKind, 'accent' | 'info' | 'static' | 'hint' | 'muted'> = {
  fn: 'accent',
  type: 'info',
  component: 'static',
  hook: 'hint',
  const: 'muted',
};
