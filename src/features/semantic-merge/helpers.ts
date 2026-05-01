export type CollisionSeverity = 'none' | 'soft' | 'medium' | 'hard';

export interface SemanticEdit {
  file: string;
  kind:
    | 'cache-directive'
    | 'use-client'
    | 'route-segment'
    | 'server-action'
    | 'layout-shell'
    | 'middleware'
    | 'fetch-options';
  description: string;
  diffBefore: string;
  diffAfter: string;
  line: number;
}

export interface MockPR {
  id: string;
  number: number;
  title: string;
  branch: string;
  author: string;
  files: ReadonlyArray<string>;
  edits: ReadonlyArray<SemanticEdit>;
}

export interface Collision {
  prA: string;
  prB: string;
  file: string;
  severity: CollisionSeverity;
  description: string;
  interpretation: string;
  suggestedResolver: string;
  hunkA: SemanticEdit;
  hunkB: SemanticEdit;
}

export const PRS: ReadonlyArray<MockPR> = [
  {
    id: 'pr-114',
    number: 114,
    title: 'Tighten product cache TTL',
    branch: 'feat/product-revalidate-60',
    author: 'avery',
    files: ['app/products/[id]/page.tsx'],
    edits: [
      {
        file: 'app/products/[id]/page.tsx',
        kind: 'cache-directive',
        description: "set revalidate=3600 → 60",
        diffBefore: 'export const revalidate = 3600;',
        diffAfter: 'export const revalidate = 60;',
        line: 12,
      },
    ],
  },
  {
    id: 'pr-122',
    number: 122,
    title: 'Force static for product pages',
    branch: 'perf/product-force-static',
    author: 'bao',
    files: ['app/products/[id]/page.tsx', 'next.config.ts'],
    edits: [
      {
        file: 'app/products/[id]/page.tsx',
        kind: 'cache-directive',
        description: "revalidate → 'force-cache' + dynamic = 'force-static'",
        diffBefore: 'export const revalidate = 3600;',
        diffAfter:
          "export const revalidate = 'force-cache';\nexport const dynamic = 'force-static';",
        line: 12,
      },
      {
        file: 'app/products/[id]/page.tsx',
        kind: 'fetch-options',
        description: 'add { cache: "force-cache" } to getProduct fetch',
        diffBefore: 'await fetch(`/api/product/${id}`)',
        diffAfter:
          'await fetch(`/api/product/${id}`, { cache: "force-cache" })',
        line: 28,
      },
    ],
  },
  {
    id: 'pr-130',
    number: 130,
    title: 'Convert ProductGallery to client component',
    branch: 'feat/gallery-client',
    author: 'cleo',
    files: ['widgets/product/gallery.tsx'],
    edits: [
      {
        file: 'widgets/product/gallery.tsx',
        kind: 'use-client',
        description: "add 'use client' directive at top of file",
        diffBefore: 'import Image from "next/image";',
        diffAfter: '"use client";\nimport Image from "next/image";',
        line: 1,
      },
    ],
  },
  {
    id: 'pr-141',
    number: 141,
    title: 'Async params for dynamic routes (Next 15)',
    branch: 'chore/next15-async-params',
    author: 'dani',
    files: ['app/products/[id]/page.tsx', 'app/products/[id]/layout.tsx'],
    edits: [
      {
        file: 'app/products/[id]/page.tsx',
        kind: 'route-segment',
        description: 'change params type to Promise + await it',
        diffBefore:
          'export default async function Page({ params }: { params: { id: string } })',
        diffAfter:
          'export default async function Page({ params }: { params: Promise<{ id: string }> })',
        line: 18,
      },
    ],
  },
  {
    id: 'pr-152',
    number: 152,
    title: 'Add addToCart server action with revalidateTag',
    branch: 'feat/cart-action-revalidate-tag',
    author: 'ezra',
    files: ['entities/cart/actions.ts', 'app/products/[id]/page.tsx'],
    edits: [
      {
        file: 'entities/cart/actions.ts',
        kind: 'server-action',
        description: 'add new server action exporting addToCart',
        diffBefore: '// (none)',
        diffAfter:
          "'use server';\nexport async function addToCart(input) { revalidateTag('cart'); }",
        line: 1,
      },
      {
        file: 'app/products/[id]/page.tsx',
        kind: 'layout-shell',
        description: 'wrap buy box with new <CartProvider>',
        diffBefore: '<ProductBuyBox product={product} />',
        diffAfter:
          '<CartProvider>\n  <ProductBuyBox product={product} />\n</CartProvider>',
        line: 30,
      },
    ],
  },
];

const SEVERITY_RANK: Record<CollisionSeverity, number> = {
  none: 0,
  soft: 1,
  medium: 2,
  hard: 3,
};

function maxSeverity(
  a: CollisionSeverity,
  b: CollisionSeverity,
): CollisionSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

export const COLLISIONS: ReadonlyArray<Collision> = [
  {
    prA: 'pr-114',
    prB: 'pr-122',
    file: 'app/products/[id]/page.tsx',
    severity: 'hard',
    description:
      'Both PRs change cache directive on the same file (line 12).',
    interpretation:
      'Cache invalidation conflict — PR-114 wants 60s ISR while PR-122 forces static caching. The two strategies are mutually exclusive at the route segment level.',
    suggestedResolver: 'manual: pick one cache strategy',
    hunkA: PRS[0]!.edits[0]!,
    hunkB: PRS[1]!.edits[0]!,
  },
  {
    prA: 'pr-114',
    prB: 'pr-141',
    file: 'app/products/[id]/page.tsx',
    severity: 'soft',
    description:
      'PR-114 edits cache directive; PR-141 changes the same file’s params signature.',
    interpretation:
      'Distinct concerns on the same file — cache TTL vs. async params boundary. Sequential merge applies cleanly.',
    suggestedResolver: 'merge order: pr-114 then pr-141',
    hunkA: PRS[0]!.edits[0]!,
    hunkB: PRS[3]!.edits[0]!,
  },
  {
    prA: 'pr-122',
    prB: 'pr-141',
    file: 'app/products/[id]/page.tsx',
    severity: 'medium',
    description:
      'force-static + async params land in the same route segment.',
    interpretation:
      'Forcing static rendering and migrating to async params both touch route segment config. Async params is purely a type/runtime change; combined safely with manual review.',
    suggestedResolver: 'merge order: pr-141 then pr-122',
    hunkA: PRS[1]!.edits[0]!,
    hunkB: PRS[3]!.edits[0]!,
  },
  {
    prA: 'pr-122',
    prB: 'pr-152',
    file: 'app/products/[id]/page.tsx',
    severity: 'medium',
    description:
      'force-static caching collides with revalidateTag invalidations from cart action.',
    interpretation:
      'A force-static page cannot be invalidated by tag — the new revalidateTag("cart") becomes a no-op for this route.',
    suggestedResolver: 'manual: relax to revalidate=60 OR scope CartProvider to a client island',
    hunkA: PRS[1]!.edits[0]!,
    hunkB: PRS[4]!.edits[1]!,
  },
  {
    prA: 'pr-130',
    prB: 'pr-152',
    file: 'widgets/product/gallery.tsx',
    severity: 'soft',
    description: '"use client" boundary widens; cart action stays server-side.',
    interpretation:
      "Adding 'use client' to gallery is fine; cart action remains server-side. Watch that gallery does not import the action directly — must go through prop drilling or a wrapper.",
    suggestedResolver: 'auto: split into separate boundaries',
    hunkA: PRS[2]!.edits[0]!,
    hunkB: PRS[4]!.edits[0]!,
  },
  {
    prA: 'pr-141',
    prB: 'pr-152',
    file: 'app/products/[id]/page.tsx',
    severity: 'soft',
    description:
      'Both PRs touch the page.tsx render tree but in different lines.',
    interpretation:
      'Async params migration and CartProvider wrap occur in separate hunks; rebase resolves cleanly.',
    suggestedResolver: 'auto: rebase pr-152 on pr-141',
    hunkA: PRS[3]!.edits[0]!,
    hunkB: PRS[4]!.edits[1]!,
  },
];

export function collisionMatrix(
  prIds: ReadonlyArray<string>,
  collisions: ReadonlyArray<Collision>,
): ReadonlyArray<ReadonlyArray<CollisionSeverity>> {
  const matrix: CollisionSeverity[][] = prIds.map(() => prIds.map(() => 'none'));
  for (const c of collisions) {
    if (!prIds.includes(c.prA) || !prIds.includes(c.prB)) continue;
    const i = prIds.indexOf(c.prA);
    const j = prIds.indexOf(c.prB);
    if (i < 0 || j < 0) continue;
    const cur = matrix[i]?.[j] ?? 'none';
    const sev = maxSeverity(cur, c.severity);
    if (matrix[i]) matrix[i]![j] = sev;
    if (matrix[j]) matrix[j]![i] = sev;
  }
  return matrix;
}

export const SEVERITY_FILL: Record<CollisionSeverity, string> = {
  none: '#f3f4f6',
  soft: '#dbeafe',
  medium: '#fde68a',
  hard: '#fecaca',
};

export const SEVERITY_STROKE: Record<CollisionSeverity, string> = {
  none: '#e5e7eb',
  soft: '#93c5fd',
  medium: '#f59e0b',
  hard: '#f87171',
};

export const SEVERITY_TONE: Record<CollisionSeverity, 'muted' | 'info' | 'warn' | 'err'> = {
  none: 'muted',
  soft: 'info',
  medium: 'warn',
  hard: 'err',
};

export const SEVERITY_LABEL: Record<CollisionSeverity, string> = {
  none: 'none',
  soft: 'soft',
  medium: 'medium',
  hard: 'hard',
};
