export type QuickDocCategory = 'next' | 'react' | 'ts' | 'css';

export interface QuickDocEntry {
  symbol: string;
  category: QuickDocCategory;
  oneLiner: string;
  signature?: string;
  example: string;
  caveats?: string[];
  reference: string;
}

export const QUICK_DOC_INDEX: Record<string, QuickDocEntry> = {
  // ── Next.js ────────────────────────────────────────────────
  cookies: {
    symbol: 'cookies',
    category: 'next',
    oneLiner: 'Reads and writes cookies on the request — opts the route into dynamic rendering.',
    signature: `import { cookies } from 'next/headers';\nfunction cookies(): Promise<ReadonlyRequestCookies>`,
    example: `import { cookies } from 'next/headers';
export default async function Page() {
  const jar = await cookies();
  const session = jar.get('session')?.value;
  return <p>{session ? 'Hi' : 'Sign in'}</p>;
}`,
    caveats: [
      'Calling cookies() forces dynamic rendering for the entire route.',
      'In server actions, cookies().set() is allowed; in pages it is read-only.',
    ],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/cookies',
  },
  headers: {
    symbol: 'headers',
    category: 'next',
    oneLiner: 'Reads request headers — opts the route into dynamic rendering.',
    signature: `import { headers } from 'next/headers';\nfunction headers(): Promise<ReadonlyHeaders>`,
    example: `const h = await headers();\nconst ua = h.get('user-agent');`,
    caveats: ['headers() is read-only and forces dynamic rendering.'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/headers',
  },
  redirect: {
    symbol: 'redirect',
    category: 'next',
    oneLiner: 'Throws a special redirect that aborts rendering and navigates the user.',
    signature: `function redirect(url: string, type?: 'replace' | 'push'): never`,
    example: `if (!user) redirect('/login');`,
    caveats: [
      'redirect() throws — do not wrap it in try/catch.',
      'Server Components only. Use useRouter().replace() on the client.',
    ],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/redirect',
  },
  notFound: {
    symbol: 'notFound',
    category: 'next',
    oneLiner: 'Triggers the nearest not-found.tsx boundary.',
    signature: `function notFound(): never`,
    example: `const post = await db.posts.find(slug);\nif (!post) notFound();`,
    caveats: ['Like redirect(), notFound() throws and must not be caught.'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/not-found',
  },
  revalidateTag: {
    symbol: 'revalidateTag',
    category: 'next',
    oneLiner: 'Invalidates the data cache for entries tagged with the given tag.',
    signature: `function revalidateTag(tag: string): void`,
    example: `'use server';
export async function publish() {
  await db.posts.update(...);
  revalidateTag('posts');
}`,
    caveats: ['Only effective when fetch() calls used the same tag.'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/revalidateTag',
  },
  revalidatePath: {
    symbol: 'revalidatePath',
    category: 'next',
    oneLiner: 'Invalidates the cache for a route segment by path.',
    signature: `function revalidatePath(path: string, type?: 'page' | 'layout'): void`,
    example: `revalidatePath('/products/[id]', 'page');`,
    reference: 'https://nextjs.org/docs/app/api-reference/functions/revalidatePath',
    caveats: ['For dynamic routes, pass the route pattern, not a concrete URL.'],
  },
  generateMetadata: {
    symbol: 'generateMetadata',
    category: 'next',
    oneLiner: 'Async function exported from a layout/page to compute metadata at request time.',
    signature: `export function generateMetadata(props): Promise<Metadata>`,
    example: `export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return { title: post.title, description: post.excerpt };
}`,
    caveats: [
      'Cannot coexist with a static metadata export in the same file.',
      'Runs in parallel with the page itself.',
    ],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/generate-metadata',
  },
  generateStaticParams: {
    symbol: 'generateStaticParams',
    category: 'next',
    oneLiner: 'Returns the param sets that should be pre-rendered for a dynamic segment.',
    signature: `export function generateStaticParams(): Promise<Array<Record<string, string>>>`,
    example: `export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}`,
    reference: 'https://nextjs.org/docs/app/api-reference/functions/generate-static-params',
  },
  'force-dynamic': {
    symbol: "export const dynamic = 'force-dynamic'",
    category: 'next',
    oneLiner: 'Route segment config that forces every request to be rendered dynamically.',
    example: `export const dynamic = 'force-dynamic';`,
    caveats: ['Disables static rendering and ISR for the segment.'],
    reference: 'https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config',
  },
  "'use client'": {
    symbol: "'use client'",
    category: 'next',
    oneLiner: 'Marks the file (and its imports) as part of the client component graph.',
    example: `'use client';
export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}`,
    caveats: ['Must be the first non-comment line in the file.'],
    reference: 'https://react.dev/reference/rsc/use-client',
  },
  "'use server'": {
    symbol: "'use server'",
    category: 'next',
    oneLiner: 'Marks a function (or whole file) as a Server Action callable from the client.',
    example: `'use server';
export async function addToCart(id: string) {
  // ...
}`,
    caveats: [
      'Action arguments must be serializable.',
      'Always validate input — actions are public POST endpoints.',
    ],
    reference: 'https://react.dev/reference/rsc/use-server',
  },
  'next/dynamic': {
    symbol: 'next/dynamic',
    category: 'next',
    oneLiner: 'Code-splits a component so its bundle is fetched lazily.',
    signature: `function dynamic<T>(loader: () => Promise<{default: T}>, opts?): T`,
    example: `const Chart = dynamic(() => import('./Chart'), { ssr: false });`,
    caveats: ['ssr:false skips server rendering — only use for browser-only widgets.'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/dynamic',
  },
  'next/image': {
    symbol: 'next/image',
    category: 'next',
    oneLiner: 'Automatically optimizes responsive images with srcset, lazy-loading, and modern formats.',
    example: `import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />`,
    caveats: [
      'Always provide width/height (or fill + parent with size) to avoid CLS.',
      'Mark the LCP image with priority.',
    ],
    reference: 'https://nextjs.org/docs/app/api-reference/components/image',
  },
  'next/font': {
    symbol: 'next/font',
    category: 'next',
    oneLiner: 'Self-hosts and preloads fonts with zero layout shift.',
    example: `import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
<html className={inter.className}>...</html>`,
    reference: 'https://nextjs.org/docs/app/api-reference/components/font',
  },
  '<Link>': {
    symbol: '<Link>',
    category: 'next',
    oneLiner: 'Client-side navigation with prefetching and shallow routing.',
    example: `import Link from 'next/link';
<Link href="/products/123" prefetch>View product</Link>`,
    caveats: [
      'Avoid wrapping <Link> around <a> manually — Next 13+ handles the anchor.',
    ],
    reference: 'https://nextjs.org/docs/app/api-reference/components/link',
  },
  '<Script>': {
    symbol: '<Script>',
    category: 'next',
    oneLiner: 'Loads third-party scripts with strategy hints (beforeInteractive, afterInteractive, lazyOnload, worker).',
    example: `import Script from 'next/script';
<Script src="https://example.com/a.js" strategy="lazyOnload" />`,
    caveats: ['beforeInteractive blocks interactivity — use sparingly.'],
    reference: 'https://nextjs.org/docs/app/api-reference/components/script',
  },

  // ── React ──────────────────────────────────────────────────
  useState: {
    symbol: 'useState',
    category: 'react',
    oneLiner: 'Adds local state to a component.',
    signature: `function useState<T>(initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>]`,
    example: `const [count, setCount] = useState(0);`,
    reference: 'https://react.dev/reference/react/useState',
  },
  useEffect: {
    symbol: 'useEffect',
    category: 'react',
    oneLiner: 'Synchronizes a component with an external system after render.',
    signature: `function useEffect(setup: () => void | (() => void), deps?: any[]): void`,
    example: `useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);`,
    caveats: [
      'Avoid useEffect for derived state — compute during render.',
      'Cleanup runs before each next effect and on unmount.',
    ],
    reference: 'https://react.dev/reference/react/useEffect',
  },
  useTransition: {
    symbol: 'useTransition',
    category: 'react',
    oneLiner: 'Marks state updates as non-urgent; lets React keep the UI responsive.',
    signature: `function useTransition(): [pending: boolean, startTransition]`,
    example: `const [pending, start] = useTransition();
start(() => setQuery(input));`,
    reference: 'https://react.dev/reference/react/useTransition',
  },
  useDeferredValue: {
    symbol: 'useDeferredValue',
    category: 'react',
    oneLiner: 'Returns a deferred copy of a value that lags behind during heavy renders.',
    signature: `function useDeferredValue<T>(value: T): T`,
    example: `const deferred = useDeferredValue(query);`,
    reference: 'https://react.dev/reference/react/useDeferredValue',
  },
  useActionState: {
    symbol: 'useActionState',
    category: 'react',
    oneLiner: 'Wraps a form action and exposes [state, formAction, isPending].',
    signature: `function useActionState<S, P>(action, initial): [S, (p: P) => void, boolean]`,
    example: `const [state, formAction, pending] = useActionState(submit, null);`,
    reference: 'https://react.dev/reference/react/useActionState',
  },
  useOptimistic: {
    symbol: 'useOptimistic',
    category: 'react',
    oneLiner: 'Lets you display an optimistic state while a transition is pending.',
    signature: `function useOptimistic<T, A>(state: T, reducer): [T, (action: A) => void]`,
    example: `const [optimistic, addOptimistic] = useOptimistic(items, (s, n: Item) => [...s, n]);`,
    reference: 'https://react.dev/reference/react/useOptimistic',
  },
  useFormStatus: {
    symbol: 'useFormStatus',
    category: 'react',
    oneLiner: 'Reads the pending state of the parent <form>.',
    signature: `function useFormStatus(): { pending: boolean; data: FormData | null; method: string; action: any }`,
    example: `const { pending } = useFormStatus();
return <button disabled={pending}>Save</button>;`,
    reference: 'https://react.dev/reference/react-dom/hooks/useFormStatus',
  },
  Suspense: {
    symbol: '<Suspense>',
    category: 'react',
    oneLiner: 'Shows a fallback while a child is loading data or code.',
    example: `<Suspense fallback={<Skeleton />}>
  <Reviews />
</Suspense>`,
    caveats: ['In RSC, every fetch read inside a server component can suspend.'],
    reference: 'https://react.dev/reference/react/Suspense',
  },
  ErrorBoundary: {
    symbol: 'ErrorBoundary',
    category: 'react',
    oneLiner: 'Catches render-phase errors below it and shows a fallback.',
    example: `<ErrorBoundary fallback={<ErrorView />}>
  <App />
</ErrorBoundary>`,
    caveats: ['Does not catch async errors thrown outside render.'],
    reference: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
  },

  // ── TypeScript ─────────────────────────────────────────────
  'as const': {
    symbol: 'as const',
    category: 'ts',
    oneLiner: 'Treats the expression as a literal/readonly tuple.',
    example: `const COLORS = ['red', 'green'] as const;
type Color = typeof COLORS[number];`,
    reference: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions',
  },
  satisfies: {
    symbol: 'satisfies',
    category: 'ts',
    oneLiner: 'Asserts a value matches a type without widening or narrowing it.',
    example: `const config = {
  port: 3000,
} satisfies { port: number };`,
    reference: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html',
  },
  infer: {
    symbol: 'infer',
    category: 'ts',
    oneLiner: 'Names a type captured during conditional type matching.',
    example: `type ReturnT<F> = F extends (...args: any[]) => infer R ? R : never;`,
    reference: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types',
  },
  keyof: {
    symbol: 'keyof',
    category: 'ts',
    oneLiner: 'Produces a union of the property keys of a type.',
    example: `type Keys = keyof { a: 1; b: 2 }; // 'a' | 'b'`,
    reference: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html',
  },
  Pick: {
    symbol: 'Pick',
    category: 'ts',
    oneLiner: 'Subset of T with only the keys K.',
    signature: `type Pick<T, K extends keyof T>`,
    example: `type UserPreview = Pick<User, 'id' | 'name'>;`,
    reference: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  },
  Omit: {
    symbol: 'Omit',
    category: 'ts',
    oneLiner: 'Object type T with the keys K removed.',
    signature: `type Omit<T, K extends string | number | symbol>`,
    example: `type UserNoEmail = Omit<User, 'email'>;`,
    reference: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  },

  // ── CSS ────────────────────────────────────────────────────
  'position: sticky': {
    symbol: 'position: sticky',
    category: 'css',
    oneLiner: 'Behaves as relative until a threshold, then sticks to its containing block.',
    example: `.header { position: sticky; top: 0; }`,
    caveats: [
      'Has no effect inside an ancestor with overflow: hidden / auto — that becomes the scroll container.',
    ],
    reference: 'https://developer.mozilla.org/docs/Web/CSS/position#sticky_positioning',
  },
  'container queries': {
    symbol: 'container queries',
    category: 'css',
    oneLiner: 'Style elements based on their container size, not the viewport.',
    example: `.card { container-type: inline-size; }
@container (min-width: 480px) {
  .card-title { font-size: 1.25rem; }
}`,
    reference: 'https://developer.mozilla.org/docs/Web/CSS/CSS_containment/Container_queries',
  },
  ':has()': {
    symbol: ':has()',
    category: 'css',
    oneLiner: 'Parent selector — matches an element that contains the given selector.',
    example: `article:has(img) { padding-top: 0; }`,
    caveats: ['Polyfill or fallback for older browsers if needed.'],
    reference: 'https://developer.mozilla.org/docs/Web/CSS/:has',
  },
  'aspect-ratio': {
    symbol: 'aspect-ratio',
    category: 'css',
    oneLiner: 'Reserves intrinsic ratio for an element to prevent layout shift.',
    example: `img { aspect-ratio: 16 / 9; width: 100%; height: auto; }`,
    reference: 'https://developer.mozilla.org/docs/Web/CSS/aspect-ratio',
  },
  'backdrop-filter': {
    symbol: 'backdrop-filter',
    category: 'css',
    oneLiner: 'Applies effects (blur, saturate) to the area behind the element.',
    example: `.dialog { backdrop-filter: blur(8px) saturate(1.4); }`,
    caveats: ['Heavy on the GPU — avoid on large continuous areas.'],
    reference: 'https://developer.mozilla.org/docs/Web/CSS/backdrop-filter',
  },
};

export const QUICK_DOC_SYMBOLS: ReadonlyArray<string> = Object.keys(QUICK_DOC_INDEX);

export function lookupDoc(symbol: string): QuickDocEntry | undefined {
  if (QUICK_DOC_INDEX[symbol]) return QUICK_DOC_INDEX[symbol];
  const lower = symbol.toLowerCase();
  for (const k of Object.keys(QUICK_DOC_INDEX)) {
    if (k.toLowerCase() === lower) return QUICK_DOC_INDEX[k];
  }
  return undefined;
}

export const CATEGORY_LABEL: Record<QuickDocCategory, string> = {
  next: 'Next.js',
  react: 'React',
  ts: 'TypeScript',
  css: 'CSS',
};
