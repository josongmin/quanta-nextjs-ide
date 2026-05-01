export type FileNodeKind = 'dir' | 'file';

export interface FileNode {
  /** Full path from project root, e.g. `app/(shop)/products/[id]/page.tsx`. */
  path: string;
  /** Last path segment used for display. */
  name: string;
  kind: FileNodeKind;
  /** Only present when kind === 'dir'. */
  children?: FileNode[];
}

interface BuildEntry {
  path: string;
  kind: FileNodeKind;
}

const FILES: BuildEntry[] = [
  // App router routes
  { path: 'app/layout.tsx', kind: 'file' },
  { path: 'app/page.tsx', kind: 'file' },
  { path: 'app/(shop)/layout.tsx', kind: 'file' },
  { path: 'app/(shop)/products/page.tsx', kind: 'file' },
  { path: 'app/(shop)/products/loading.tsx', kind: 'file' },
  { path: 'app/(shop)/products/error.tsx', kind: 'file' },
  { path: 'app/(shop)/products/[id]/page.tsx', kind: 'file' },
  { path: 'app/(shop)/products/[id]/loading.tsx', kind: 'file' },
  { path: 'app/(shop)/products/[id]/error.tsx', kind: 'file' },
  { path: 'app/(shop)/cart/page.tsx', kind: 'file' },
  { path: 'app/(shop)/checkout/page.tsx', kind: 'file' },
  { path: 'app/(shop)/checkout/actions.ts', kind: 'file' },
  { path: 'app/(auth)/login/page.tsx', kind: 'file' },
  { path: 'app/(auth)/register/page.tsx', kind: 'file' },
  { path: 'app/account/layout.tsx', kind: 'file' },
  { path: 'app/account/page.tsx', kind: 'file' },
  { path: 'app/dashboard/layout.tsx', kind: 'file' },
  { path: 'app/dashboard/page.tsx', kind: 'file' },
  { path: 'app/admin/layout.tsx', kind: 'file' },
  { path: 'app/admin/users/page.tsx', kind: 'file' },
  { path: 'app/admin/users/delete/page.tsx', kind: 'file' },
  { path: 'app/admin/users/delete/actions.ts', kind: 'file' },
  { path: 'app/admin/products/page.tsx', kind: 'file' },
  { path: 'app/admin/products/actions.ts', kind: 'file' },
  { path: 'app/blog/layout.tsx', kind: 'file' },
  { path: 'app/blog/page.tsx', kind: 'file' },
  { path: 'app/blog/[slug]/page.tsx', kind: 'file' },
  { path: 'app/blog/[slug]/not-found.tsx', kind: 'file' },
  { path: 'app/@modal/(.)products/[id]/page.tsx', kind: 'file' },
  { path: 'app/api/products/route.ts', kind: 'file' },
  { path: 'app/api/webhooks/stripe/route.ts', kind: 'file' },
  { path: 'app/globals.css', kind: 'file' },
  // Components
  { path: 'components/AppShell.tsx', kind: 'file' },
  { path: 'components/ProductDetail.tsx', kind: 'file' },
  { path: 'components/ProductGrid.tsx', kind: 'file' },
  { path: 'components/AddToCart.client.tsx', kind: 'file' },
  { path: 'components/AddToCartButton.client.tsx', kind: 'file' },
  { path: 'components/CartList.client.tsx', kind: 'file' },
  { path: 'components/CheckoutForm.client.tsx', kind: 'file' },
  { path: 'components/ChartPanel.client.tsx', kind: 'file' },
  { path: 'components/Header.tsx', kind: 'file' },
  { path: 'components/Footer.tsx', kind: 'file' },
  // Lib
  { path: 'lib/auth.ts', kind: 'file' },
  { path: 'lib/db.ts', kind: 'file' },
  { path: 'lib/products.ts', kind: 'file' },
  { path: 'lib/services/order.ts', kind: 'file' },
  { path: 'lib/services/product.ts', kind: 'file' },
  { path: 'lib/utils.ts', kind: 'file' },
  // Public
  { path: 'public/favicon.ico', kind: 'file' },
  { path: 'public/logo.svg', kind: 'file' },
  { path: 'public/og-image.png', kind: 'file' },
  // Tests
  { path: 'tests/products.spec.ts', kind: 'file' },
  { path: 'tests/checkout.spec.ts', kind: 'file' },
  { path: 'tests/auth.spec.ts', kind: 'file' },
  // Root
  { path: 'next.config.js', kind: 'file' },
  { path: 'package.json', kind: 'file' },
  { path: 'tailwind.config.ts', kind: 'file' },
  { path: 'tsconfig.json', kind: 'file' },
  { path: '.env.example', kind: 'file' },
  { path: 'middleware.ts', kind: 'file' },
];

function ensureDir(root: FileNode, parts: string[], fullPathPrefix: string[]): FileNode {
  let cursor = root;
  for (let i = 0; i < parts.length; i += 1) {
    const seg = parts[i]!;
    const segPath = [...fullPathPrefix, ...parts.slice(0, i + 1)].join('/');
    const children = cursor.children ?? [];
    let next = children.find((c) => c.kind === 'dir' && c.name === seg);
    if (!next) {
      next = { path: segPath, name: seg, kind: 'dir', children: [] };
      children.push(next);
      cursor.children = children;
    }
    cursor = next;
  }
  return cursor;
}

function buildTree(): FileNode {
  const root: FileNode = { path: '', name: '', kind: 'dir', children: [] };
  for (const entry of FILES) {
    const parts = entry.path.split('/');
    const file = parts[parts.length - 1]!;
    const dirParts = parts.slice(0, -1);
    const parent = dirParts.length > 0 ? ensureDir(root, dirParts, []) : root;
    parent.children = parent.children ?? [];
    parent.children.push({
      path: entry.path,
      name: file,
      kind: entry.kind,
    });
  }

  const sortRec = (node: FileNode): void => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortRec);
  };
  sortRec(root);
  return root;
}

export const mockFileTree: FileNode = buildTree();

export function flattenFileTree(node: FileNode, acc: FileNode[] = []): FileNode[] {
  if (node.kind === 'file') acc.push(node);
  node.children?.forEach((c) => flattenFileTree(c, acc));
  return acc;
}
