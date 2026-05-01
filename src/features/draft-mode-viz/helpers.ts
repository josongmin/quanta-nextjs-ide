export type CacheOption = 'force-cache' | 'no-store' | 'default' | 'force-cache-revalidate';
export type EffectiveCache = 'static' | 'dynamic' | 'no-store';

export interface DraftFetch {
  readonly id: string;
  readonly url: string;
  readonly resource: string; // shorthand label
  readonly prodCache: CacheOption;
  readonly draftCache: CacheOption;
  readonly revalidate?: number;
}

export interface DraftRoute {
  readonly id: string;
  readonly path: string;
  readonly consumesDraft: boolean;
  readonly cookieSet: boolean;
  readonly rerendersOnEachReq: boolean;
  readonly bypassesCdnCache: boolean;
  readonly fetches: ReadonlyArray<DraftFetch>;
}

function fetches(routePath: string, useDraft: boolean): DraftFetch[] {
  const id = (n: number) => `${routePath}-${n}`;
  return [
    {
      id: id(1),
      url: 'cms.api/posts',
      resource: 'getAllPosts()',
      prodCache: 'force-cache',
      draftCache: useDraft ? 'no-store' : 'force-cache',
    },
    {
      id: id(2),
      url: 'cms.api/posts/[slug]',
      resource: 'getPost(slug)',
      prodCache: 'force-cache',
      draftCache: useDraft ? 'no-store' : 'force-cache',
      revalidate: 3600,
    },
    {
      id: id(3),
      url: 'cms.api/menu',
      resource: 'getMenu()',
      prodCache: 'force-cache',
      draftCache: 'force-cache',
    },
    {
      id: id(4),
      url: 'cms.api/preview-banner',
      resource: 'getBanner()',
      prodCache: 'default',
      draftCache: useDraft ? 'no-store' : 'default',
    },
    {
      id: id(5),
      url: 'analytics.io/track',
      resource: 'track()',
      prodCache: 'no-store',
      draftCache: 'no-store',
    },
    {
      id: id(6),
      url: 'cms.api/related',
      resource: 'getRelated()',
      prodCache: 'force-cache',
      draftCache: useDraft ? 'no-store' : 'force-cache',
      revalidate: 600,
    },
  ];
}

export const DRAFT_ROUTES: ReadonlyArray<DraftRoute> = [
  { id: 'r1', path: '/blog/[slug]', consumesDraft: true, cookieSet: true, rerendersOnEachReq: true, bypassesCdnCache: true, fetches: fetches('/blog/[slug]', true) },
  { id: 'r2', path: '/preview/[token]', consumesDraft: true, cookieSet: true, rerendersOnEachReq: true, bypassesCdnCache: true, fetches: fetches('/preview/[token]', true) },
  { id: 'r3', path: '/products/[id]', consumesDraft: true, cookieSet: true, rerendersOnEachReq: true, bypassesCdnCache: true, fetches: fetches('/products/[id]', true) },
  { id: 'r4', path: '/page/[slug]', consumesDraft: true, cookieSet: true, rerendersOnEachReq: true, bypassesCdnCache: true, fetches: fetches('/page/[slug]', true) },
  { id: 'r5', path: '/about', consumesDraft: false, cookieSet: false, rerendersOnEachReq: false, bypassesCdnCache: false, fetches: fetches('/about', false) },
  { id: 'r6', path: '/api/cms-webhook', consumesDraft: false, cookieSet: false, rerendersOnEachReq: false, bypassesCdnCache: false, fetches: fetches('/api/cms-webhook', false) },
  { id: 'r7', path: '/dashboard', consumesDraft: false, cookieSet: false, rerendersOnEachReq: true, bypassesCdnCache: false, fetches: fetches('/dashboard', false) },
  { id: 'r8', path: '/changelog', consumesDraft: false, cookieSet: false, rerendersOnEachReq: false, bypassesCdnCache: false, fetches: fetches('/changelog', false) },
];

export function effective(option: CacheOption, revalidate?: number): EffectiveCache {
  if (option === 'no-store') return 'no-store';
  if (option === 'default') return revalidate !== undefined ? 'static' : 'dynamic';
  if (option === 'force-cache' || option === 'force-cache-revalidate') return 'static';
  return 'dynamic';
}

export const ENABLE_DRAFT_HANDLER = `// app/api/draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const slug = url.searchParams.get('slug');

  if (secret !== process.env.DRAFT_SECRET || !slug) {
    return new Response('Invalid token', { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(\`/blog/\${slug}\`);
}
`;

export const DISABLE_DRAFT_HANDLER = `// app/api/draft/disable/route.ts
import { draftMode } from 'next/headers';

export async function GET() {
  const draft = await draftMode();
  draft.disable();
  return new Response('Draft mode disabled');
}
`;

export const COOKIE_BEHAVIOR = `// What gets set
Set-Cookie: __prerender_bypass=<random>; Path=/; HttpOnly; SameSite=Lax

// On any request with this cookie:
// - Static cache is bypassed
// - fetch(..., { cache: 'force-cache' }) → effectively 'no-store'
// - generateStaticParams() output is ignored
// - Each request hits the origin and re-renders the RSC tree

// Disable
GET /api/draft/disable
`;

export function effClass(e: EffectiveCache): { tone: string; bg: string; label: string } {
  switch (e) {
    case 'static':
      return { tone: 'text-sem-static', bg: 'bg-sem-static-soft', label: 'static' };
    case 'dynamic':
      return { tone: 'text-sem-dynamic', bg: 'bg-sem-dynamic-soft', label: 'dynamic' };
    case 'no-store':
      return { tone: 'text-sev-err', bg: 'bg-sev-err-soft', label: 'no-store' };
  }
}
