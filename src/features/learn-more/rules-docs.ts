import type { Confidence, RuleId, Severity } from '@shared/types';

export interface RuleDocEntry {
  ruleId: RuleId;
  title: string;
  category: string;
  severityBaseline: Severity;
  confidenceBaseline: Confidence;
  what: string;
  why: string[];
  examples: { bad: string; good: string };
  suppression: string;
  relatedRuleIds: RuleId[];
  reference: string;
}

const docs: Partial<Record<RuleId, RuleDocEntry>> = {
  'why-dynamic': {
    ruleId: 'why-dynamic',
    title: 'Why is this route dynamic?',
    category: 'Rendering',
    severityBaseline: 'warn',
    confidenceBaseline: 'medium',
    what: 'Detects request-time APIs (cookies, headers, searchParams, dynamic = "force-dynamic") that promote a route from static or ISR to SSR. Surfaces the originating call along with every route that inherits the change.',
    why: [
      'Dynamic routes lose CDN caching, increasing tail latency and server cost.',
      'Many promotions are accidental — a helper grew a cookies() call and cascaded through the layout tree.',
      'Surfacing the cause turns "why is my page slow now?" into a 5-second answer.',
    ],
    examples: {
      bad: `// app/(shop)/layout.tsx
export default async function Layout({ children }) {
  const session = await getSession(); // calls cookies() inside
  return <Shell session={session}>{children}</Shell>;
}`,
      good: `// app/(shop)/layout.tsx — keep the layout static
export default function Layout({ children }) {
  return <Shell>{children}</Shell>;
}

// app/(shop)/_components/SessionBadge.tsx — read cookies in a leaf
'use client';
export function SessionBadge() { /* fetch /api/me */ }`,
    },
    suppression:
      'Add `// next-ignore: why-dynamic` above the offending call when dynamic rendering is intentional, or set the rule severity to "info" project-wide.',
    relatedRuleIds: ['static-feasibility', 'cost-regression', 'fetch-policy'],
    reference: 'https://nextjs.org/docs/app/building-your-application/rendering',
  },
  'use-client-blast': {
    ruleId: 'use-client-blast',
    title: '"use client" blast radius',
    category: 'Boundary',
    severityBaseline: 'err',
    confidenceBaseline: 'high',
    what: 'Detects when a "use client" directive lives high in the tree (root layout, shared shells), pulling otherwise server-only subtrees into the client bundle.',
    why: [
      'Promotes hundreds of components to the client, ballooning JS shipped on every route.',
      'Server-only modules in the subtree may now leak to the browser.',
      'Hydration cost grows linearly with subtree size — first input delay regresses.',
    ],
    examples: {
      bad: `// app/layout.tsx
'use client';
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>;
}`,
      good: `// app/layout.tsx — server component
export default function RootLayout({ children }) {
  return <html><body><Shell>{children}</Shell></body></html>;
}

// app/_components/Theme.tsx
'use client';
export function Theme({ children }) { /* useTheme(), etc */ }`,
    },
    suppression:
      'Use `// next-ignore: use-client-blast` only at single-file scope when the boundary is genuinely required at the root. Prefer extracting the client logic into a child island.',
    relatedRuleIds: ['can-be-server', 'browser-api-in-server', 'non-serializable-prop'],
    reference: 'https://nextjs.org/docs/app/building-your-application/rendering/client-components',
  },
  'fetch-policy': {
    ruleId: 'fetch-policy',
    title: 'fetch cache policy mismatch',
    category: 'Cache',
    severityBaseline: 'warn',
    confidenceBaseline: 'high',
    what: 'Compares declared route rendering with each fetch\'s cache directive. Flags `cache: "no-store"` in static routes, missing `next.revalidate` in ISR, and wide cache surfaces without a tag.',
    why: [
      'Mismatched cache policies are the #1 cause of "stale data" bugs and surprise SSR.',
      'Tagless caches cannot be revalidated surgically — invalidation explodes.',
      'Explicit policy makes cache lineage reviewable and auditable.',
    ],
    examples: {
      bad: `const res = await fetch('/api/products');`,
      good: `const res = await fetch('/api/products', {
  next: { tags: ['products'], revalidate: 300 },
});`,
    },
    suppression:
      'For one-off ad-hoc fetches use `// next-ignore: fetch-policy`. For project-wide opt-out, configure the cache profile.',
    relatedRuleIds: ['revalidate-pair', 'tag-taxonomy', 'react-cache-advisor'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/fetch',
  },
  'revalidate-pair': {
    ruleId: 'revalidate-pair',
    title: 'Cache tag has no invalidator',
    category: 'Cache',
    severityBaseline: 'warn',
    confidenceBaseline: 'high',
    what: 'For each tag declared on a fetch or unstable_cache, verify a matching `revalidateTag` or `revalidatePath` exists in a server action or route handler. Surfaces orphan tags and orphan invalidators.',
    why: [
      'Without an invalidator, ISR data goes stale forever.',
      'Without a tag, invalidators are dead code.',
      'Cache lineage should be a closed loop visible in the inspector.',
    ],
    examples: {
      bad: `// fetch with tag — but nothing invalidates it
fetch(url, { next: { tags: ['products'] } });`,
      good: `// pair the producer with a consumer
fetch(url, { next: { tags: ['products'] } });

'use server';
export async function updateProduct() {
  await db.update(...);
  revalidateTag('products');
}`,
    },
    suppression:
      'Use `// next-ignore: revalidate-pair` when the tag is intentionally used only for diagnostic grouping.',
    relatedRuleIds: ['fetch-policy', 'tag-taxonomy', 'action-safety'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/revalidateTag',
  },
  'action-safety': {
    ruleId: 'action-safety',
    title: 'Server action safety',
    category: 'Action',
    severityBaseline: 'err',
    confidenceBaseline: 'high',
    what: 'Audits server actions for: zod validation of inputs, auth guard, idempotency key on mutating actions, redirect/revalidate placement, and proper error boundaries.',
    why: [
      'Server actions are public POST endpoints — missing validation is a CSRF-adjacent risk.',
      'Mutating without idempotency means double-submit creates duplicate data.',
      'Most regressions ship as `delete-row.ts` "cleanup" PRs that drop the role check.',
    ],
    examples: {
      bad: `'use server';
export async function deleteUser(id: string) {
  await db.users.delete(id);
}`,
      good: `'use server';
import { z } from 'zod';

const Input = z.object({ id: z.string().uuid(), idempotencyKey: z.string() });

export async function deleteUser(raw: unknown) {
  await requireRole('admin');
  const input = Input.parse(raw);
  await db.users.delete(input.id, { idempotencyKey: input.idempotencyKey });
  revalidateTag('users');
}`,
    },
    suppression:
      '`// next-ignore: action-safety` for genuinely public endpoints — strongly prefer fixing.',
    relatedRuleIds: ['action-closure', 'special-throw-guard', 'csrf-allowed-origins', 'auth-detector'],
    reference: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions',
  },
  'special-throw-guard': {
    ruleId: 'special-throw-guard',
    title: 'redirect()/notFound() inside try/catch',
    category: 'Action',
    severityBaseline: 'err',
    confidenceBaseline: 'high',
    what: 'Detects calls to redirect(), notFound(), and unauthorized() that may be caught by surrounding try/catch — Next throws sentinel errors which must escape to the framework.',
    why: [
      'Catching the sentinel turns a redirect into a silent no-op.',
      'Caught notFound() renders the page anyway with broken state.',
      'These bugs are invisible until production traffic hits them.',
    ],
    examples: {
      bad: `try {
  if (!user) notFound();
  await db.update(...);
} catch (err) {
  console.error(err); // swallows notFound!
}`,
      good: `if (!user) notFound();
try {
  await db.update(...);
} catch (err) {
  logger.error(err);
}`,
    },
    suppression:
      'Use `// next-ignore: special-throw-guard` only after re-throwing the sentinel via `if (isRedirectError(err)) throw err;`.',
    relatedRuleIds: ['action-safety', 'post-stream-special'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/redirect',
  },
  'secret-flow': {
    ruleId: 'secret-flow',
    title: 'Secret reaches the client',
    category: 'Security',
    severityBaseline: 'err',
    confidenceBaseline: 'high',
    what: 'Tracks symbols defined as `process.env.<SECRET>` (without `NEXT_PUBLIC_`) into client component closures, server action return values, and serialized props.',
    why: [
      'Anything reachable from a client component is shipped to the browser.',
      'Returning a secret from a server action exposes it via the network response.',
      'Most leaks happen via "convenient" prop drilling through a shared util.',
    ],
    examples: {
      bad: `// Server util used by client island
export const apiKey = process.env.STRIPE_SECRET;

// Client component
import { apiKey } from '@/lib/stripe';
export function PayButton() { /* ... */ }`,
      good: `// Server-only util
import 'server-only';
export const apiKey = process.env.STRIPE_SECRET;

// Client island calls a server action that uses the secret server-side`,
    },
    suppression:
      'Never suppress without a security review. If the value really is public, rename to `NEXT_PUBLIC_*` to make intent explicit.',
    relatedRuleIds: ['server-only-leak', 'pii-boundary', 'auth-detector'],
    reference: 'https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns',
  },
  'metadata-base': {
    ruleId: 'metadata-base',
    title: 'metadataBase missing',
    category: 'Metadata',
    severityBaseline: 'warn',
    confidenceBaseline: 'high',
    what: 'Verifies the root layout exports `metadata.metadataBase` so OpenGraph and Twitter image URLs resolve correctly during SSR and at build time.',
    why: [
      'Without metadataBase, relative og:image URLs become broken in social previews.',
      'Build emits a warning every time, drowning out real signal.',
      'A single root export fixes the entire site.',
    ],
    examples: {
      bad: `export const metadata = {
  title: 'Acme',
  openGraph: { images: ['/og.png'] },
};`,
      good: `export const metadata = {
  metadataBase: new URL('https://acme.com'),
  title: 'Acme',
  openGraph: { images: ['/og.png'] },
};`,
    },
    suppression:
      'Suppression is rarely correct — fix the root layout instead.',
    relatedRuleIds: ['metadata-coverage', 'static-meta-dynamic-params', 'meta-file-convention'],
    reference: 'https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase',
  },
  'react-hook-deps': {
    ruleId: 'react-hook-deps',
    title: 'Missing or excessive hook dependencies',
    category: 'React',
    severityBaseline: 'warn',
    confidenceBaseline: 'medium',
    what: 'Static analysis of useEffect/useMemo/useCallback dependency arrays — flags missing reactive values, unnecessary deps, and stale closures over refs.',
    why: [
      'Stale closures cause "why does my form keep submitting old data?" bugs.',
      'Missing deps are the leading cause of intermittent prod issues.',
      'Excessive deps re-run effects more than necessary, wasting work.',
    ],
    examples: {
      bad: `useEffect(() => {
  fetchUser(userId);
}, []); // missing userId`,
      good: `useEffect(() => {
  fetchUser(userId);
}, [userId]);`,
    },
    suppression:
      'Use `// eslint-disable-next-line react-hooks/exhaustive-deps` with a code comment explaining why.',
    relatedRuleIds: ['react-effect-cleanup', 'react-conditional-hook', 'react-rerender-hotspot'],
    reference: 'https://react.dev/reference/react/useEffect#specifying-reactive-dependencies',
  },
  'ts-any-usage': {
    ruleId: 'ts-any-usage',
    title: 'Explicit `any` usage',
    category: 'TypeScript',
    severityBaseline: 'warn',
    confidenceBaseline: 'high',
    what: 'Flags explicit `any` annotations, `as any` assertions, and arguments inferred as `any` from untyped libraries.',
    why: [
      'Each `any` punches a hole in type-checking — refactors silently break.',
      'Better alternatives almost always exist: `unknown`, generics, branded types.',
      'Codebase-wide `any` density correlates strongly with prod bug rate.',
    ],
    examples: {
      bad: `function handle(payload: any) {
  return payload.user.name;
}`,
      good: `function handle(payload: unknown) {
  if (!isUser(payload)) throw new Error('bad payload');
  return payload.user.name;
}`,
    },
    suppression:
      'Prefer `unknown` + a type guard. If you must, comment with `// next-ignore: ts-any-usage — <reason>`.',
    relatedRuleIds: ['ts-as-assertion', 'ts-ignore-comment', 'ts-strict-gap'],
    reference: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any',
  },
  'css-tailwind-drift': {
    ruleId: 'css-tailwind-drift',
    title: 'Tailwind recipe drift',
    category: 'CSS / Tailwind',
    severityBaseline: 'hint',
    confidenceBaseline: 'medium',
    what: 'Detects identical (or near-identical) class strings repeated across components — candidates for extraction into a `cva` recipe or shared component.',
    why: [
      'Drift makes design changes O(n) instead of O(1).',
      'Recipes encode design intent, raw classes encode implementation.',
      'Concentration improves dark-mode coverage by removing copies.',
    ],
    examples: {
      bad: `<button className="inline-flex h-8 px-3 rounded-md bg-accent text-white hover:bg-accent/90 ...">A</button>
<button className="inline-flex h-8 px-3 rounded-md bg-accent text-white hover:bg-accent/90 ...">B</button>`,
      good: `// shared/ui/button.tsx
const button = cva('inline-flex h-8 px-3 rounded-md', { ... });
export const Button = (...) => <button className={button({ tone })}>...</button>;`,
    },
    suppression:
      '`// next-ignore: css-tailwind-drift` per file — but extraction is almost always cheaper than living with the drift.',
    relatedRuleIds: ['css-token-violation', 'css-raw-color', 'css-raw-spacing'],
    reference: 'https://cva.style/docs',
  },
  'a11y-missing-alt': {
    ruleId: 'a11y-missing-alt',
    title: 'Image missing alt attribute',
    category: 'Accessibility',
    severityBaseline: 'err',
    confidenceBaseline: 'high',
    what: 'Detects `<img>` and `<Image>` elements without an `alt` prop. Decorative images must use `alt=""`; meaningful images must describe content.',
    why: [
      'Screen readers cannot describe imageless alt — content becomes inaccessible.',
      'WCAG 2.1 SC 1.1.1 (Non-text Content) failure.',
      'Lighthouse and many regulatory audits gate on this.',
    ],
    examples: {
      bad: `<Image src="/hero.png" width={800} height={400} />`,
      good: `<Image src="/hero.png" width={800} height={400} alt="Sunset over mountain range" />
{/* decorative */}
<Image src="/divider.svg" width={1} height={1} alt="" />`,
    },
    suppression:
      'Decorative images should use `alt=""`. Suppression is almost never the right answer.',
    relatedRuleIds: ['a11y-form-label', 'a11y-button-name', 'a11y-aria-misuse'],
    reference: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
  },
};

const genericDoc = (ruleId: RuleId): RuleDocEntry => ({
  ruleId,
  title: ruleId.replaceAll('-', ' '),
  category: 'General',
  severityBaseline: 'info',
  confidenceBaseline: 'medium',
  what:
    'Documentation for this rule has not been authored yet. The default behavior tracks the rule baseline severity defined in the project rule manager.',
  why: [
    'Rules without explicit docs are still enforced when they fire.',
    'Open the rule manager to tune severity or add a project-wide note.',
  ],
  examples: {
    bad: `// example pending`,
    good: `// example pending`,
  },
  suppression: `// next-ignore: ${ruleId}`,
  relatedRuleIds: [],
  reference: 'https://nextjs.org/docs',
});

export const RULE_DOCS = new Proxy(docs as Record<RuleId, RuleDocEntry>, {
  get(target, prop: string): RuleDocEntry {
    const existing = (target as Record<string, RuleDocEntry | undefined>)[prop];
    if (existing) return existing;
    return genericDoc(prop as RuleId);
  },
});

export function getRuleDoc(ruleId: RuleId): RuleDocEntry {
  return docs[ruleId] ?? genericDoc(ruleId);
}
