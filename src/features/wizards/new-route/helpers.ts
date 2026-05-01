import type { Archetype } from '@shared/types';

export type AuthGuard = 'none' | 'requireUser' | 'requireRole';
export type CacheStrategy = 'none' | 'static' | 'isr' | 'dynamic';

export interface BoundaryFlags {
  loading: boolean;
  error: boolean;
  notFound: boolean;
  default: boolean;
  template: boolean;
}

export interface NewRouteConfig {
  archetype: Archetype;
  path: string;
  group: string;
  boundaries: BoundaryFlags;
  metadata: boolean;
  authGuard: AuthGuard;
  authRole: string;
  cache: CacheStrategy;
  revalidate: number;
  cacheTags: string[];
}

export interface GeneratedFile {
  path: string;
  source: string;
}

const ARCHETYPES: Archetype[] = [
  'marketing',
  'commerce.list',
  'commerce.product-detail',
  'commerce.cart',
  'commerce.checkout',
  'admin',
  'account',
  'dashboard',
  'auth',
  'blog',
  'docs',
  'api',
  'webhook',
];

export function archetypeOptions(): Archetype[] {
  return ARCHETYPES;
}

export function defaultConfigForArchetype(a: Archetype): NewRouteConfig {
  const base: NewRouteConfig = {
    archetype: a,
    path: '/page',
    group: '',
    boundaries: {
      loading: false,
      error: true,
      notFound: false,
      default: false,
      template: false,
    },
    metadata: true,
    authGuard: 'none',
    authRole: 'admin',
    cache: 'static',
    revalidate: 60,
    cacheTags: [],
  };

  switch (a) {
    case 'marketing':
      return { ...base, path: '/landing', cache: 'static', cacheTags: [] };
    case 'commerce.list':
      return {
        ...base,
        path: '/products',
        group: '(shop)',
        boundaries: { ...base.boundaries, loading: true, error: true },
        cache: 'isr',
        revalidate: 60,
        cacheTags: ['products'],
      };
    case 'commerce.product-detail':
      return {
        ...base,
        path: '/products/[id]',
        group: '(shop)',
        boundaries: {
          loading: true,
          error: true,
          notFound: true,
          default: false,
          template: false,
        },
        metadata: true,
        cache: 'isr',
        revalidate: 60,
        cacheTags: ['products', 'product:{id}'],
      };
    case 'commerce.cart':
      return {
        ...base,
        path: '/cart',
        group: '(shop)',
        boundaries: { ...base.boundaries, loading: true, error: true },
        authGuard: 'requireUser',
        cache: 'dynamic',
      };
    case 'commerce.checkout':
      return {
        ...base,
        path: '/checkout',
        group: '(shop)',
        boundaries: {
          loading: true,
          error: true,
          notFound: false,
          default: false,
          template: false,
        },
        authGuard: 'requireUser',
        cache: 'dynamic',
      };
    case 'admin':
      return {
        ...base,
        path: '/admin/users',
        boundaries: { ...base.boundaries, loading: true, error: true },
        authGuard: 'requireRole',
        authRole: 'admin',
        cache: 'dynamic',
      };
    case 'account':
      return {
        ...base,
        path: '/account',
        boundaries: { ...base.boundaries, loading: true, error: true },
        authGuard: 'requireUser',
        cache: 'dynamic',
      };
    case 'dashboard':
      return {
        ...base,
        path: '/dashboard',
        boundaries: { ...base.boundaries, loading: true, error: true },
        authGuard: 'requireUser',
        cache: 'dynamic',
      };
    case 'auth':
      return {
        ...base,
        path: '/login',
        group: '(auth)',
        boundaries: { ...base.boundaries, error: true },
        cache: 'static',
      };
    case 'blog':
      return {
        ...base,
        path: '/blog/[slug]',
        boundaries: {
          loading: false,
          error: true,
          notFound: true,
          default: false,
          template: false,
        },
        cache: 'static',
      };
    case 'docs':
      return {
        ...base,
        path: '/docs/[...slug]',
        boundaries: { ...base.boundaries, error: true, notFound: true },
        cache: 'static',
      };
    case 'api':
      return {
        ...base,
        path: '/api/example',
        boundaries: {
          loading: false,
          error: false,
          notFound: false,
          default: false,
          template: false,
        },
        metadata: false,
        cache: 'dynamic',
      };
    case 'webhook':
      return {
        ...base,
        path: '/api/webhooks/stripe',
        boundaries: {
          loading: false,
          error: false,
          notFound: false,
          default: false,
          template: false,
        },
        metadata: false,
        cache: 'dynamic',
      };
    default:
      return base;
  }
}

export function generateRouteFiles(c: NewRouteConfig): GeneratedFile[] {
  const segments = c.path.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean);
  const groupSegment = c.group.trim().length > 0 ? c.group.trim() : '';
  const dirSegments = groupSegment ? [groupSegment, ...segments] : segments;
  const dir = `app/${dirSegments.join('/')}`;
  const files: GeneratedFile[] = [];

  if (c.archetype === 'api' || c.archetype === 'webhook') {
    files.push({
      path: `${dir}/route.ts`,
      source: generateApiRoute(c),
    });
    return files;
  }

  files.push({ path: `${dir}/page.tsx`, source: generatePage(c) });

  if (c.boundaries.loading) {
    files.push({ path: `${dir}/loading.tsx`, source: generateLoading() });
  }
  if (c.boundaries.error) {
    files.push({ path: `${dir}/error.tsx`, source: generateError() });
  }
  if (c.boundaries.notFound) {
    files.push({ path: `${dir}/not-found.tsx`, source: generateNotFound() });
  }
  if (c.boundaries.default) {
    files.push({ path: `${dir}/default.tsx`, source: generateDefault() });
  }
  if (c.boundaries.template) {
    files.push({ path: `${dir}/template.tsx`, source: generateTemplate() });
  }

  return files;
}

function paramsTypeFor(path: string): string | null {
  const matches = [...path.matchAll(/\[(\.\.\.)?([^\]]+)\]/g)];
  if (matches.length === 0) return null;
  const fields = matches
    .map((m) => {
      const isCatchAll = m[1] === '...';
      const name = m[2];
      return `  ${name}: ${isCatchAll ? 'string[]' : 'string'};`;
    })
    .join('\n');
  return `interface PageParams {\n${fields}\n}`;
}

function generatePage(c: NewRouteConfig): string {
  const lines: string[] = [];
  const paramsType = paramsTypeFor(c.path);

  if (c.cache === 'static') {
    lines.push(`export const dynamic = 'force-static';`);
  } else if (c.cache === 'isr') {
    lines.push(`export const revalidate = ${c.revalidate};`);
  } else if (c.cache === 'dynamic') {
    lines.push(`export const dynamic = 'force-dynamic';`);
  }

  if (c.authGuard !== 'none') {
    lines.push(`import { redirect } from 'next/navigation';`);
    lines.push(`import { getSession } from '@/lib/auth';`);
  }

  if (c.cache === 'isr' && c.cacheTags.length > 0) {
    lines.push(`import { unstable_cache as cache } from 'next/cache';`);
  }

  if (c.archetype === 'commerce.product-detail') {
    lines.push(`import { notFound } from 'next/navigation';`);
  }

  lines.push('');

  if (paramsType) {
    lines.push(paramsType);
    lines.push('');
  }

  if (c.metadata) {
    lines.push(`import type { Metadata } from 'next';`);
    if (paramsType) {
      lines.push(`export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {`);
      lines.push(`  return {`);
      lines.push(`    title: ${JSON.stringify(titleFor(c))},`);
      lines.push(`    description: ${JSON.stringify(descFor(c))},`);
      lines.push(`  };`);
      lines.push(`}`);
    } else {
      lines.push(`export const metadata: Metadata = {`);
      lines.push(`  title: ${JSON.stringify(titleFor(c))},`);
      lines.push(`  description: ${JSON.stringify(descFor(c))},`);
      lines.push(`};`);
    }
    lines.push('');
  }

  const propsType = paramsType ? `{ params: PageParams }` : '';
  lines.push(`export default async function Page(${propsType ? `props: ${propsType}` : ''}) {`);
  if (paramsType) {
    lines.push(`  const { params } = props;`);
  }

  if (c.authGuard === 'requireUser') {
    lines.push(`  const session = await getSession();`);
    lines.push(`  if (!session?.user) redirect('/login');`);
  } else if (c.authGuard === 'requireRole') {
    lines.push(`  const session = await getSession();`);
    lines.push(`  if (!session?.user) redirect('/login');`);
    lines.push(`  if (session.user.role !== ${JSON.stringify(c.authRole)}) redirect('/');`);
  }

  if (c.archetype === 'commerce.product-detail') {
    lines.push(`  const product = await getProduct(params${paramsType ? '.id' : ''});`);
    lines.push(`  if (!product) notFound();`);
    lines.push('');
    lines.push(`  return <ProductDetail product={product} />;`);
  } else if (c.archetype === 'commerce.list') {
    lines.push(`  const products = await getProducts();`);
    lines.push(`  return <ProductList products={products} />;`);
  } else if (c.archetype === 'dashboard') {
    lines.push(`  return <DashboardShell userId={session.user.id} />;`);
  } else if (c.archetype === 'admin') {
    lines.push(`  return <AdminShell />;`);
  } else if (c.archetype === 'auth') {
    lines.push(`  return <AuthForm />;`);
  } else if (c.archetype === 'blog') {
    lines.push(`  return <BlogPost slug={params${paramsType ? '.slug' : ''}} />;`);
  } else {
    lines.push(`  return (`);
    lines.push(`    <main className="mx-auto max-w-3xl px-6 py-10">`);
    lines.push(`      <h1>${titleFor(c)}</h1>`);
    lines.push(`    </main>`);
    lines.push(`  );`);
  }

  lines.push(`}`);

  if (c.cache === 'isr' && c.cacheTags.length > 0) {
    lines.push('');
    lines.push(`// Suggested fetcher (move to a data module):`);
    lines.push(`// const getProducts = cache(`);
    lines.push(`//   async () => (await fetch(\`\${process.env.API_URL}/products\`)).json(),`);
    lines.push(`//   ['products'],`);
    lines.push(`//   { tags: ${JSON.stringify(c.cacheTags)}, revalidate: ${c.revalidate} },`);
    lines.push(`// );`);
  }

  lines.push('');
  return lines.join('\n');
}

function titleFor(c: NewRouteConfig): string {
  switch (c.archetype) {
    case 'commerce.list':
      return 'Products';
    case 'commerce.product-detail':
      return 'Product · Detail';
    case 'commerce.cart':
      return 'Cart';
    case 'commerce.checkout':
      return 'Checkout';
    case 'admin':
      return 'Admin';
    case 'account':
      return 'Account';
    case 'dashboard':
      return 'Dashboard';
    case 'auth':
      return 'Sign in';
    case 'blog':
      return 'Blog';
    case 'docs':
      return 'Documentation';
    case 'marketing':
      return 'Welcome';
    default:
      return c.path;
  }
}

function descFor(c: NewRouteConfig): string {
  return `Auto-generated ${c.archetype} route for ${c.path}`;
}

function generateLoading(): string {
  return [
    `export default function Loading() {`,
    `  return (`,
    `    <div className="mx-auto max-w-3xl space-y-3 px-6 py-10">`,
    `      <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-200" />`,
    `      <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />`,
    `      <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />`,
    `    </div>`,
    `  );`,
    `}`,
    '',
  ].join('\n');
}

function generateError(): string {
  return [
    `'use client';`,
    '',
    `import { useEffect } from 'react';`,
    '',
    `export default function ErrorBoundary({`,
    `  error,`,
    `  reset,`,
    `}: {`,
    `  error: Error & { digest?: string };`,
    `  reset: () => void;`,
    `}) {`,
    `  useEffect(() => {`,
    `    console.error(error);`,
    `  }, [error]);`,
    '',
    `  return (`,
    `    <div role="alert" className="mx-auto max-w-3xl px-6 py-10">`,
    `      <h2 className="text-lg font-semibold">Something went wrong</h2>`,
    `      <button type="button" onClick={() => reset()}>Try again</button>`,
    `    </div>`,
    `  );`,
    `}`,
    '',
  ].join('\n');
}

function generateNotFound(): string {
  return [
    `export default function NotFound() {`,
    `  return (`,
    `    <div className="mx-auto max-w-3xl px-6 py-10">`,
    `      <h2 className="text-lg font-semibold">Not found</h2>`,
    `      <p className="text-sm text-zinc-500">The page you requested does not exist.</p>`,
    `    </div>`,
    `  );`,
    `}`,
    '',
  ].join('\n');
}

function generateDefault(): string {
  return [
    `export default function Default() {`,
    `  return null;`,
    `}`,
    '',
  ].join('\n');
}

function generateTemplate(): string {
  return [
    `import type { ReactNode } from 'react';`,
    '',
    `export default function Template({ children }: { children: ReactNode }) {`,
    `  return <div data-template="true">{children}</div>;`,
    `}`,
    '',
  ].join('\n');
}

function generateApiRoute(c: NewRouteConfig): string {
  const isWebhook = c.archetype === 'webhook';
  const lines: string[] = [];
  lines.push(`import { NextRequest, NextResponse } from 'next/server';`);
  if (isWebhook) {
    lines.push(`import { verifyStripeSignature } from '@/lib/webhooks/stripe';`);
  }
  lines.push('');
  lines.push(`export const runtime = 'node';`);
  lines.push(`export const dynamic = 'force-dynamic';`);
  lines.push('');
  if (isWebhook) {
    lines.push(`export async function POST(req: NextRequest) {`);
    lines.push(`  const rawBody = await req.text();`);
    lines.push(`  const signature = req.headers.get('stripe-signature') ?? '';`);
    lines.push(`  try {`);
    lines.push(`    const event = await verifyStripeSignature(rawBody, signature);`);
    lines.push(`    // TODO: handle event.type`);
    lines.push(`    return NextResponse.json({ ok: true, received: event.type });`);
    lines.push(`  } catch {`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Bad signature' } },`);
    lines.push(`      { status: 400 },`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push(`}`);
  } else {
    lines.push(`export async function GET(_req: NextRequest) {`);
    lines.push(`  const data = { now: Date.now() };`);
    lines.push(`  return NextResponse.json({ ok: true, data });`);
    lines.push(`}`);
  }
  lines.push('');
  return lines.join('\n');
}
