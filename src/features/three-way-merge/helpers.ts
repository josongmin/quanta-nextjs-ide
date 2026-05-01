export type ResolutionDefault = 'local' | 'incoming' | 'both' | 'custom';

export interface ConflictRegion {
  id: string;
  startLine: number;
  endLine: number;
  base: ReadonlyArray<string>;
  local: ReadonlyArray<string>;
  incoming: ReadonlyArray<string>;
  resolutionDefault: ResolutionDefault;
  hint: string;
}

export interface MergeFile {
  file: string;
  preamble: ReadonlyArray<string>;
  postamble: ReadonlyArray<string>;
  regions: ReadonlyArray<ConflictRegion>;
}

/**
 * Mock 3-way merge fixture: 3 conflicted files. The "primary" file
 * (`app/products/[id]/page.tsx`) carries 6 conflict regions used by
 * the visual editor.
 */
export const FILES: ReadonlyArray<MergeFile> = [
  {
    file: 'app/products/[id]/page.tsx',
    preamble: [
      "import { notFound } from 'next/navigation';",
      "import { getProduct } from '@/entities/product/queries';",
      "import { ProductGallery } from '@/widgets/product/gallery';",
      "import { ProductBuyBox } from '@/widgets/product/buy-box';",
      '',
    ],
    postamble: [
      '',
      '// shared helpers below',
      'function priceFormat(value: number, locale: string) {',
      "  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);",
      '}',
    ],
    regions: [
      {
        id: 'r1',
        startLine: 6,
        endLine: 8,
        base: ['export const revalidate = 3600;'],
        local: ['export const revalidate = 60;'],
        incoming: ["export const revalidate = 'force-cache';", 'export const dynamic = "force-static";'],
        resolutionDefault: 'local',
        hint: 'Local tightens revalidate to 60s; incoming forces static. Pick one strategy.',
      },
      {
        id: 'r2',
        startLine: 10,
        endLine: 14,
        base: [
          'export async function generateMetadata({ params }: { params: { id: string } }) {',
          '  const product = await getProduct(params.id);',
          '  return { title: product?.title ?? "Product" };',
          '}',
        ],
        local: [
          'export async function generateMetadata({ params }: { params: { id: string } }) {',
          '  const product = await getProduct(params.id);',
          '  return {',
          '    title: product?.title ?? "Product",',
          '    description: product?.summary,',
          '  };',
          '}',
        ],
        incoming: [
          'export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {',
          '  const { id } = await params;',
          '  const product = await getProduct(id);',
          '  return { title: product?.title ?? "Product" };',
          '}',
        ],
        resolutionDefault: 'both',
        hint: 'Local adds description; incoming migrates to async params. Combine both.',
      },
      {
        id: 'r3',
        startLine: 16,
        endLine: 18,
        base: ['export default async function Page({ params }: { params: { id: string } }) {'],
        local: ['export default async function Page({ params }: { params: { id: string } }) {'],
        incoming: ['export default async function Page({ params }: { params: Promise<{ id: string }> }) {', '  const { id } = await params;'],
        resolutionDefault: 'incoming',
        hint: 'Incoming aligns with Next.js 15 async params API.',
      },
      {
        id: 'r4',
        startLine: 20,
        endLine: 24,
        base: [
          '  const product = await getProduct(params.id);',
          '  if (!product) notFound();',
        ],
        local: [
          '  const product = await getProduct(params.id, { include: "variants" });',
          '  if (!product) notFound();',
        ],
        incoming: [
          '  const product = await getProduct(id);',
          '  if (!product) return notFound();',
        ],
        resolutionDefault: 'custom',
        hint: 'Local adds variants include; incoming uses async-resolved id. Merge: include + id.',
      },
      {
        id: 'r5',
        startLine: 26,
        endLine: 32,
        base: [
          '  return (',
          '    <main className="grid grid-cols-2 gap-6">',
          '      <ProductGallery images={product.images} />',
          '      <ProductBuyBox product={product} />',
          '    </main>',
          '  );',
        ],
        local: [
          '  return (',
          '    <main className="grid grid-cols-2 gap-6 p-6">',
          '      <ProductGallery images={product.images} priority />',
          '      <ProductBuyBox product={product} />',
          '    </main>',
          '  );',
        ],
        incoming: [
          '  return (',
          '    <main className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-8 p-4">',
          '      <ProductGallery images={product.images} />',
          '      <ProductBuyBox product={product} variant="compact" />',
          '    </main>',
          '  );',
        ],
        resolutionDefault: 'incoming',
        hint: 'Layout drift — adopt the responsive incoming layout, keep local priority hint.',
      },
      {
        id: 'r6',
        startLine: 34,
        endLine: 36,
        base: ['}'],
        local: ['}', '', "// note: track CTR for buy-box variant"],
        incoming: ['}', '', "export const fetchCache = 'default-no-store';"],
        resolutionDefault: 'both',
        hint: 'Both add trailing concerns — keep both, ordering does not matter.',
      },
    ],
  },
  {
    file: 'app/(marketing)/layout.tsx',
    preamble: [
      "import type { ReactNode } from 'react';",
      "import { SiteHeader } from '@/widgets/site-header';",
    ],
    postamble: ['}'],
    regions: [
      {
        id: 'm1',
        startLine: 4,
        endLine: 9,
        base: [
          'export default function Layout({ children }: { children: ReactNode }) {',
          '  return (',
          '    <>',
          '      <SiteHeader />',
          '      {children}',
          '    </>',
          '  );',
        ],
        local: [
          'export default function Layout({ children }: { children: ReactNode }) {',
          '  return (',
          '    <div className="min-h-dvh">',
          '      <SiteHeader theme="light" />',
          '      {children}',
          '    </div>',
          '  );',
        ],
        incoming: [
          'export default function Layout({ children }: { children: ReactNode }) {',
          '  return (',
          '    <>',
          '      <SiteHeader sticky />',
          '      <main className="pt-14">{children}</main>',
          '    </>',
          '  );',
        ],
        resolutionDefault: 'both',
        hint: 'Layout shell drift — fold sticky header + light theme together.',
      },
    ],
  },
  {
    file: 'entities/cart/actions.ts',
    preamble: [
      "'use server';",
      "import { z } from 'zod';",
      "import { revalidatePath } from 'next/cache';",
    ],
    postamble: ['}'],
    regions: [
      {
        id: 'a1',
        startLine: 5,
        endLine: 11,
        base: [
          'export async function addToCart(input: { id: string; qty: number }) {',
          '  await db.cart.add(input);',
          "  revalidatePath('/cart');",
        ],
        local: [
          'const Schema = z.object({ id: z.string(), qty: z.number().int().positive() });',
          'export async function addToCart(input: unknown) {',
          '  const parsed = Schema.parse(input);',
          '  await db.cart.add(parsed);',
          "  revalidatePath('/cart');",
        ],
        incoming: [
          'export async function addToCart(input: { id: string; qty: number }) {',
          '  await db.cart.add(input);',
          "  revalidatePath('/cart');",
          "  revalidateTag('cart');",
        ],
        resolutionDefault: 'both',
        hint: 'Combine zod validation with the new revalidateTag call.',
      },
    ],
  },
];

export function regionDecision(region: ConflictRegion): ResolutionDefault {
  return region.resolutionDefault;
}

export function applyDecision(
  region: ConflictRegion,
  decision: ResolutionDefault,
  customLines: ReadonlyArray<string>,
): ReadonlyArray<string> {
  switch (decision) {
    case 'local':
      return region.local;
    case 'incoming':
      return region.incoming;
    case 'both':
      return [...region.local, ...region.incoming];
    case 'custom':
      return customLines;
  }
}

export function buildResultText(
  file: MergeFile,
  decisions: Record<string, ResolutionDefault>,
  customLines: Record<string, ReadonlyArray<string>>,
): string {
  const out: string[] = [...file.preamble];
  for (const region of file.regions) {
    const decision = decisions[region.id] ?? region.resolutionDefault;
    const custom = customLines[region.id] ?? region.local;
    const block = applyDecision(region, decision, custom);
    out.push(...block);
  }
  out.push(...file.postamble);
  return out.join('\n');
}
