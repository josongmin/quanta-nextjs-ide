export type Verdict = 'relevant' | 'borderline' | 'off-topic';

export interface RagChunk {
  readonly id: string;
  readonly rank: number;
  readonly score: number;
  readonly distance: number;
  readonly verdict: Verdict;
  readonly sourceFile: string;
  readonly snippet: string;
  readonly tokens: number;
}

export const DEFAULT_QUERY = 'How to add Stripe to my checkout';

export const CHUNKS: ReadonlyArray<RagChunk> = [
  {
    id: 'c1',
    rank: 1,
    score: 0.94,
    distance: 0.06,
    verdict: 'relevant',
    sourceFile: 'docs/payments/stripe.md',
    snippet:
      'To add Stripe Checkout, create a server action that calls `stripe.checkout.sessions.create({ ... })` and redirects to the returned URL.',
    tokens: 280,
  },
  {
    id: 'c2',
    rank: 2,
    score: 0.91,
    distance: 0.09,
    verdict: 'relevant',
    sourceFile: 'src/app/api/checkout/route.ts',
    snippet:
      'export async function POST(req) { const session = await stripe.checkout.sessions.create({ mode: "payment", line_items, success_url }); return Response.json({ url: session.url }); }',
    tokens: 240,
  },
  {
    id: 'c3',
    rank: 3,
    score: 0.87,
    distance: 0.13,
    verdict: 'relevant',
    sourceFile: 'docs/payments/webhooks.md',
    snippet:
      'Verify Stripe webhook signatures using `stripe.webhooks.constructEvent(body, signature, secret)` and dispatch by event.type.',
    tokens: 310,
  },
  {
    id: 'c4',
    rank: 4,
    score: 0.83,
    distance: 0.17,
    verdict: 'relevant',
    sourceFile: 'docs/payments/setup.md',
    snippet:
      'Configure STRIPE_SECRET_KEY in your env. Use `loadStripe` on the client only when you need redirectToCheckout.',
    tokens: 220,
  },
  {
    id: 'c5',
    rank: 5,
    score: 0.78,
    distance: 0.22,
    verdict: 'relevant',
    sourceFile: 'examples/checkout/page.tsx',
    snippet:
      'export default function CheckoutPage() { return <form action={createCheckoutSession}><button>Subscribe</button></form>; }',
    tokens: 180,
  },
  {
    id: 'c6',
    rank: 6,
    score: 0.71,
    distance: 0.29,
    verdict: 'borderline',
    sourceFile: 'docs/auth/sessions.md',
    snippet:
      'Sessions cookies are httpOnly. They are not Stripe-specific but are required for authenticated checkout flows.',
    tokens: 260,
  },
  {
    id: 'c7',
    rank: 7,
    score: 0.66,
    distance: 0.34,
    verdict: 'borderline',
    sourceFile: 'docs/edge/runtime.md',
    snippet:
      'Edge runtime has limited Node APIs. Stripe SDK calls should run on the Node runtime for full feature parity.',
    tokens: 290,
  },
  {
    id: 'c8',
    rank: 8,
    score: 0.6,
    distance: 0.4,
    verdict: 'borderline',
    sourceFile: 'docs/forms/server-actions.md',
    snippet:
      'Server actions can be used to create payment sessions; they are RPC calls invoked from forms.',
    tokens: 240,
  },
  {
    id: 'c9',
    rank: 9,
    score: 0.55,
    distance: 0.45,
    verdict: 'borderline',
    sourceFile: 'docs/observability/logs.md',
    snippet:
      'Stripe webhook handlers should emit structured logs to make payment incidents debuggable.',
    tokens: 210,
  },
  {
    id: 'c10',
    rank: 10,
    score: 0.41,
    distance: 0.59,
    verdict: 'off-topic',
    sourceFile: 'docs/i18n/locales.md',
    snippet:
      'Locales are configured in next.config.ts. Not directly relevant to payment integrations.',
    tokens: 200,
  },
  {
    id: 'c11',
    rank: 11,
    score: 0.34,
    distance: 0.66,
    verdict: 'off-topic',
    sourceFile: 'docs/seo/meta.md',
    snippet:
      'Use `generateMetadata` to set per-route meta tags. Off-topic for checkout integration.',
    tokens: 180,
  },
  {
    id: 'c12',
    rank: 12,
    score: 0.28,
    distance: 0.72,
    verdict: 'off-topic',
    sourceFile: 'docs/styles/tokens.md',
    snippet: 'Color tokens follow OKLCH and live in app/styles/tokens.css.',
    tokens: 160,
  },
];

export const VERDICT_TONE: Record<Verdict, 'info' | 'warn' | 'muted'> = {
  relevant: 'info',
  borderline: 'warn',
  'off-topic': 'muted',
};

export function pickIncluded(
  chunks: ReadonlyArray<RagChunk>,
  topK: number,
  budget: number,
): ReadonlyArray<string> {
  const sorted = [...chunks].sort((a, b) => b.score - a.score).slice(0, topK);
  let used = 0;
  const ids: string[] = [];
  for (const c of sorted) {
    if (used + c.tokens > budget) break;
    used += c.tokens;
    ids.push(c.id);
  }
  return ids;
}

export const SYSTEM_PROMPT =
  'You are a helpful coding assistant. Use the provided context to answer the user question. Cite source files inline as [source].';
