import type { ImportEdge, ModuleKind as CanonicalModuleKind } from '@entities/module';

// Re-export the canonical kind so existing local imports keep working.
export type ModuleKind = CanonicalModuleKind;
export type Bundler = 'turbopack' | 'webpack';

/**
 * Turbopack-graph's view of a module: the canonical `Module` shape from
 * `@entities/module` plus rendering coordinates and the legacy field names
 * (`entryPoint`/`hmrBoundary`) this feature has always used. Kept locally to
 * avoid breaking existing consumers; future consumers should reference
 * `Module` from `@entities/module` directly.
 */
export interface ModuleNode {
  readonly id: string;
  readonly name: string;
  readonly sizeKB: number;
  readonly kind: ModuleKind;
  readonly entryPoint?: boolean;
  readonly hmrBoundary?: boolean;
  readonly treeShakable?: boolean;
  readonly includedReason: string;
  readonly x: number;
  readonly y: number;
}

// Edges are structurally identical to the canonical `ImportEdge`.
export type ModuleEdge = ImportEdge;

export interface DeadExport {
  readonly moduleId: string;
  readonly export: string;
  readonly savingsKB: number;
}

const W = 760;
const H = 500;

interface RawModule {
  readonly id: string;
  readonly name: string;
  readonly sizeKB: number;
  readonly kind: ModuleKind;
  readonly entryPoint?: boolean;
  readonly hmrBoundary?: boolean;
  readonly treeShakable?: boolean;
  readonly includedReason: string;
}

const RAW_MODULES: ReadonlyArray<RawModule> = [
  // entries / pages
  { id: 'm1', name: 'app/layout.tsx', sizeKB: 12, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Root layout entry.' },
  { id: 'm2', name: 'app/page.tsx', sizeKB: 8, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Home route entry.' },
  { id: 'm3', name: 'app/products/page.tsx', sizeKB: 14, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Products list entry.' },
  { id: 'm4', name: 'app/products/[id]/page.tsx', sizeKB: 18, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Product detail entry.' },
  { id: 'm5', name: 'app/checkout/page.tsx', sizeKB: 22, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Checkout entry.' },
  { id: 'm6', name: 'app/account/page.tsx', sizeKB: 16, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Account entry.' },

  // client islands
  { id: 'm7', name: 'features/cart/cart-drawer.tsx', sizeKB: 26, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Used by header & checkout.' },
  { id: 'm8', name: 'features/search/search-bar.tsx', sizeKB: 14, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Header search island.' },
  { id: 'm9', name: 'features/product-gallery/gallery.tsx', sizeKB: 32, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Product detail gallery.' },
  { id: 'm10', name: 'features/checkout/payment-form.tsx', sizeKB: 28, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Checkout payment.' },
  { id: 'm11', name: 'features/auth/sign-in-modal.tsx', sizeKB: 18, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Auth modal island.' },
  { id: 'm12', name: 'features/reviews/review-list.tsx', sizeKB: 12, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Detail reviews.' },

  // shared client
  { id: 'm13', name: 'shared/ui/button.tsx', sizeKB: 3, kind: 'shared', treeShakable: true, includedReason: 'Imported by 18 modules.' },
  { id: 'm14', name: 'shared/ui/dialog.tsx', sizeKB: 7, kind: 'shared', treeShakable: true, includedReason: 'Imported by 4 modules.' },
  { id: 'm15', name: 'shared/ui/icons.tsx', sizeKB: 22, kind: 'shared', treeShakable: true, includedReason: 'Tree-shakable but ~40% used.' },
  { id: 'm16', name: 'shared/lib/cn.ts', sizeKB: 1, kind: 'shared', treeShakable: true, includedReason: 'Tiny utility, 32 importers.' },
  { id: 'm17', name: 'shared/lib/format-date.ts', sizeKB: 4, kind: 'shared', treeShakable: true, includedReason: 'Used by 9 modules.' },

  // server actions
  { id: 'm18', name: 'features/cart/cart.action.ts', sizeKB: 6, kind: 'server', includedReason: 'Server action — cart mutations.' },
  { id: 'm19', name: 'features/checkout/checkout.action.ts', sizeKB: 9, kind: 'server', includedReason: 'Server action — checkout.' },
  { id: 'm20', name: 'features/auth/sign-in.action.ts', sizeKB: 5, kind: 'server', includedReason: 'Server action — sign-in.' },

  // shared server
  { id: 'm21', name: 'shared/db/client.ts', sizeKB: 24, kind: 'server', includedReason: 'DB client singleton.' },
  { id: 'm22', name: 'shared/auth/session.ts', sizeKB: 14, kind: 'server', includedReason: 'Session helper.' },
  { id: 'm23', name: 'shared/queue/job.ts', sizeKB: 8, kind: 'server', includedReason: 'Background queue.' },

  // entities
  { id: 'm24', name: 'entities/product/product.model.ts', sizeKB: 4, kind: 'shared', treeShakable: true, includedReason: 'Used in detail + list.' },
  { id: 'm25', name: 'entities/order/order.model.ts', sizeKB: 5, kind: 'shared', treeShakable: true, includedReason: 'Used in checkout flow.' },
  { id: 'm26', name: 'entities/user/user.model.ts', sizeKB: 3, kind: 'shared', treeShakable: true, includedReason: 'Used in account + auth.' },

  // vendor / heavy
  { id: 'm27', name: 'node_modules/react-dom', sizeKB: 132, kind: 'client', includedReason: 'Framework runtime.' },
  { id: 'm28', name: 'node_modules/react', sizeKB: 18, kind: 'shared', includedReason: 'Framework.' },
  { id: 'm29', name: 'node_modules/zod', sizeKB: 46, kind: 'shared', treeShakable: true, includedReason: 'Schema validation.' },
  { id: 'm30', name: 'node_modules/@radix-ui/react-dialog', sizeKB: 28, kind: 'client', treeShakable: true, includedReason: 'Used by dialog.tsx.' },
  { id: 'm31', name: 'node_modules/lucide-react', sizeKB: 88, kind: 'client', treeShakable: true, includedReason: 'Tree-shakable, 22 icons used.' },
  { id: 'm32', name: 'node_modules/date-fns', sizeKB: 64, kind: 'shared', treeShakable: true, includedReason: 'Used by format-date.ts.' },
  { id: 'm33', name: 'node_modules/sonner', sizeKB: 19, kind: 'client', includedReason: 'Toast runtime.' },

  // misc
  { id: 'm34', name: 'features/blog/post-card.tsx', sizeKB: 9, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Blog list item.' },
  { id: 'm35', name: 'features/blog/post-body.tsx', sizeKB: 14, kind: 'client', hmrBoundary: true, treeShakable: true, includedReason: 'Blog post body.' },
  { id: 'm36', name: 'features/about/team-grid.tsx', sizeKB: 8, kind: 'client', treeShakable: true, includedReason: 'About page island.' },
  { id: 'm37', name: 'shared/api/fetch.ts', sizeKB: 5, kind: 'shared', treeShakable: true, includedReason: 'Used by all data calls.' },
  { id: 'm38', name: 'shared/lib/logger.ts', sizeKB: 3, kind: 'shared', treeShakable: true, includedReason: 'Tiny logger.' },
  { id: 'm39', name: 'app/blog/page.tsx', sizeKB: 11, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'Blog list entry.' },
  { id: 'm40', name: 'app/about/page.tsx', sizeKB: 7, kind: 'server', entryPoint: true, hmrBoundary: true, includedReason: 'About entry.' },
];

// Predeterministic positions: pseudo random based on id index.
function layoutPos(idx: number, total: number): { x: number; y: number } {
  // Group by columns with vertical jitter from index
  const cols: number = 7;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const rows = Math.ceil(total / cols);
  const padX = 60;
  const padY = 50;
  const usableW = W - padX * 2;
  const usableH = H - padY * 2;
  const x = padX + (cols <= 1 ? 0 : (col / (cols - 1)) * usableW);
  const yBase = padY + (rows <= 1 ? 0 : (row / (rows - 1)) * usableH);
  // small deterministic jitter
  const jitter = ((idx * 37) % 13) - 6;
  return { x: Math.round(x + jitter), y: Math.round(yBase) };
}

export const MODULES: ReadonlyArray<ModuleNode> = RAW_MODULES.map((m, i) => {
  const pos = layoutPos(i, RAW_MODULES.length);
  return { ...m, x: pos.x, y: pos.y };
});

export const EDGES: ReadonlyArray<ModuleEdge> = [
  // layout chains
  { from: 'm1', to: 'm2' }, { from: 'm1', to: 'm3' }, { from: 'm1', to: 'm4' },
  { from: 'm1', to: 'm5' }, { from: 'm1', to: 'm6' }, { from: 'm1', to: 'm39' },
  { from: 'm1', to: 'm40' }, { from: 'm1', to: 'm8' }, { from: 'm1', to: 'm7' },
  { from: 'm1', to: 'm33' },

  // home
  { from: 'm2', to: 'm13' }, { from: 'm2', to: 'm15' }, { from: 'm2', to: 'm37' },
  { from: 'm2', to: 'm24' },

  // products list
  { from: 'm3', to: 'm24' }, { from: 'm3', to: 'm37' }, { from: 'm3', to: 'm21' },
  { from: 'm3', to: 'm13' }, { from: 'm3', to: 'm15' },

  // products detail
  { from: 'm4', to: 'm9' }, { from: 'm4', to: 'm12' }, { from: 'm4', to: 'm24' },
  { from: 'm4', to: 'm21' }, { from: 'm4', to: 'm18' }, { from: 'm4', to: 'm13' },

  // checkout
  { from: 'm5', to: 'm10' }, { from: 'm5', to: 'm19' }, { from: 'm5', to: 'm25' },
  { from: 'm5', to: 'm21' }, { from: 'm5', to: 'm22' }, { from: 'm5', to: 'm14' },
  { from: 'm5', to: 'm29' },

  // account
  { from: 'm6', to: 'm26' }, { from: 'm6', to: 'm22' }, { from: 'm6', to: 'm11' },
  { from: 'm6', to: 'm17' },

  // blog
  { from: 'm39', to: 'm34' }, { from: 'm39', to: 'm17' },
  { from: 'm34', to: 'm35' }, { from: 'm35', to: 'm32' }, { from: 'm35', to: 'm17' },

  // about
  { from: 'm40', to: 'm36' }, { from: 'm36', to: 'm15' },

  // client islands deps
  { from: 'm7', to: 'm14' }, { from: 'm7', to: 'm13' }, { from: 'm7', to: 'm15' },
  { from: 'm7', to: 'm18' }, { from: 'm7', to: 'm16' },
  { from: 'm8', to: 'm13' }, { from: 'm8', to: 'm15' }, { from: 'm8', to: 'm37' },
  { from: 'm9', to: 'm13' }, { from: 'm9', to: 'm15' }, { from: 'm9', to: 'm31' },
  { from: 'm10', to: 'm14' }, { from: 'm10', to: 'm29' }, { from: 'm10', to: 'm19' },
  { from: 'm10', to: 'm13' },
  { from: 'm11', to: 'm14' }, { from: 'm11', to: 'm20' }, { from: 'm11', to: 'm26' },
  { from: 'm12', to: 'm17' }, { from: 'm12', to: 'm13' },

  // server stack
  { from: 'm18', to: 'm21' }, { from: 'm19', to: 'm21' }, { from: 'm19', to: 'm23' },
  { from: 'm20', to: 'm22' }, { from: 'm22', to: 'm21' },

  // shared utils
  { from: 'm13', to: 'm16' }, { from: 'm14', to: 'm16' }, { from: 'm14', to: 'm30' },
  { from: 'm15', to: 'm31' }, { from: 'm17', to: 'm32' },
  { from: 'm37', to: 'm38' },

  // framework
  { from: 'm13', to: 'm28' }, { from: 'm14', to: 'm28' }, { from: 'm27', to: 'm28' },
  { from: 'm9', to: 'm27' }, { from: 'm10', to: 'm27' }, { from: 'm7', to: 'm27' },
];

// Webpack snapshot — same modules but bigger sizes & some extra synthetic vendor mods.
export interface BundlerSnapshot {
  readonly id: Bundler;
  readonly label: string;
  readonly sizes: Readonly<Record<string, number>>;
}

const turboSizes: Record<string, number> = Object.fromEntries(
  MODULES.map((m) => [m.id, m.sizeKB]),
);

const webpackSizes: Record<string, number> = Object.fromEntries(
  MODULES.map((m) => {
    // webpack typically a bit heavier per-module, especially vendor
    const factor = m.kind === 'shared' ? 1.18 : m.id.startsWith('m2') && m.sizeKB > 50 ? 1.12 : 1.08;
    return [m.id, Math.round(m.sizeKB * factor)];
  }),
);

export const SNAPSHOTS: ReadonlyArray<BundlerSnapshot> = [
  { id: 'turbopack', label: 'Turbopack', sizes: turboSizes },
  { id: 'webpack', label: 'Webpack', sizes: webpackSizes },
];

export function snapshotFor(b: Bundler): BundlerSnapshot {
  const found = SNAPSHOTS.find((s) => s.id === b);
  if (!found) throw new Error(`unknown bundler ${b}`);
  return found;
}

export function totalKB(b: Bundler): number {
  const snap = snapshotFor(b);
  return Object.values(snap.sizes).reduce((acc, n) => acc + n, 0);
}

export function moduleById(id: string): ModuleNode {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`module ${id} not found`);
  return m;
}

export function importersOf(id: string): ReadonlyArray<string> {
  return EDGES.filter((e) => e.to === id).map((e) => e.from);
}

export function importsOf(id: string): ReadonlyArray<string> {
  return EDGES.filter((e) => e.from === id).map((e) => e.to);
}

/** BFS reachability from an entry. */
export function reachableFrom(rootId: string): ReadonlySet<string> {
  const seen = new Set<string>([rootId]);
  const stack: string[] = [rootId];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === undefined) break;
    for (const e of EDGES) {
      if (e.from === cur && !seen.has(e.to)) {
        seen.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return seen;
}

export function kindColor(kind: ModuleKind): string {
  switch (kind) {
    case 'server':
      return 'fill-sem-server-soft stroke-sem-server';
    case 'client':
      return 'fill-sem-client-soft stroke-sem-client';
    case 'shared':
      return 'fill-bg-subtle stroke-line-strong';
  }
}

export function kindChipTone(kind: ModuleKind): 'server' | 'client' | 'muted' {
  switch (kind) {
    case 'server':
      return 'server';
    case 'client':
      return 'client';
    case 'shared':
      return 'muted';
  }
}

export function radiusFor(sizeKB: number): number {
  return Math.max(5, Math.min(22, Math.round(Math.sqrt(sizeKB) * 1.7)));
}

export const DEAD_EXPORTS: ReadonlyArray<DeadExport> = [
  { moduleId: 'm15', export: 'IconBox', savingsKB: 2 },
  { moduleId: 'm15', export: 'LegacyIconSet', savingsKB: 4 },
  { moduleId: 'm15', export: 'IconAnimations', savingsKB: 3 },
  { moduleId: 'm31', export: 'lucide:UnusedSet', savingsKB: 18 },
  { moduleId: 'm31', export: 'lucide:Animations', savingsKB: 6 },
  { moduleId: 'm32', export: 'date-fns/locale/zh', savingsKB: 8 },
  { moduleId: 'm32', export: 'date-fns/parseISOWithOptions', savingsKB: 4 },
  { moduleId: 'm29', export: 'zod/v3-compat', savingsKB: 5 },
  { moduleId: 'm29', export: 'zod/coerce', savingsKB: 3 },
  { moduleId: 'm9', export: 'GalleryDevTools', savingsKB: 2 },
  { moduleId: 'm9', export: 'GalleryAnalytics', savingsKB: 1 },
  { moduleId: 'm14', export: 'DialogV1', savingsKB: 2 },
  { moduleId: 'm14', export: 'DialogA11yShim', savingsKB: 1 },
  { moduleId: 'm7', export: 'CartLegacyHandler', savingsKB: 3 },
];

export function deadExportsFor(moduleId: string): ReadonlyArray<DeadExport> {
  return DEAD_EXPORTS.filter((d) => d.moduleId === moduleId);
}

export const GRAPH_W = W;
export const GRAPH_H = H;

export const KIND_OPTIONS: ReadonlyArray<{ id: ModuleKind | 'all'; label: string }> = [
  { id: 'all', label: 'all' },
  { id: 'server', label: 'server' },
  { id: 'client', label: 'client' },
  { id: 'shared', label: 'shared' },
];
