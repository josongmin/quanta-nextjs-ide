export type IntentId = 'profile' | 'admin-orders' | 'landing' | 'checkout';
export type Runtime = 'node' | 'edge';
export type CacheMode = 'force-cache' | 'no-store' | 'revalidate-60';
export type Locale = 'en' | 'fr' | 'ja' | 'ko';

export interface ScaffoldFile {
  name: string;
  language: string;
  content: string;
}

export interface RouteIntent {
  id: IntentId;
  label: string;
  prompt: string;
  basePath: string;
  tradeoffs: string;
  files: ReadonlyArray<ScaffoldFile>;
}

const fmt = (s: string): string => s.replace(/^\n/, '').replace(/\n$/, '');

export const INTENTS: ReadonlyArray<RouteIntent> = [
  {
    id: 'profile',
    label: 'User profile detail',
    prompt: 'A user profile page at /users/[id] with avatar and recent orders.',
    basePath: 'app/users/[id]',
    tradeoffs:
      'Dynamic params force per-request rendering. Cache user reads briefly to absorb refresh storms.',
    files: [
      {
        name: 'page.tsx',
        language: 'tsx',
        content: fmt(`
import { Suspense } from 'react';
import { getUser } from '@/server/users';
import { Profile } from '@/widgets/profile';
import { RecentOrders } from '@/widgets/recent-orders';

interface Props { params: { id: string } }

export default async function UserPage({ params }: Props) {
  const user = await getUser(params.id);
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Profile user={user} />
      <Suspense fallback={<div>Loading orders…</div>}>
        <RecentOrders userId={user.id} />
      </Suspense>
    </main>
  );
}
`),
      },
      {
        name: 'loading.tsx',
        language: 'tsx',
        content: fmt(`
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse p-6">
      <div className="h-12 w-12 rounded-full bg-bg-subtle" />
      <div className="mt-4 h-4 w-40 bg-bg-subtle" />
      <div className="mt-2 h-3 w-64 bg-bg-subtle" />
    </div>
  );
}
`),
      },
      {
        name: 'error.tsx',
        language: 'tsx',
        content: fmt(`
'use client';

interface Props { error: Error; reset: () => void }

export default function Error({ error, reset }: Props) {
  return (
    <div className="p-6 text-sev-err">
      <p>Failed to load profile: {error.message}</p>
      <button onClick={reset} className="mt-2 underline">Retry</button>
    </div>
  );
}
`),
      },
    ],
  },
  {
    id: 'admin-orders',
    label: 'Admin orders list',
    prompt:
      'Admin-only orders dashboard at /admin/orders with filtering and CSV export.',
    basePath: 'app/admin/orders',
    tradeoffs:
      'Auth required. Always dynamic — no caching of admin reads. Server actions for CSV export.',
    files: [
      {
        name: 'layout.tsx',
        language: 'tsx',
        content: fmt(`
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/server/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  if (!session) redirect('/login');
  return <section className="min-h-screen bg-bg">{children}</section>;
}
`),
      },
      {
        name: 'page.tsx',
        language: 'tsx',
        content: fmt(`
import { listOrders } from '@/server/orders';
import { OrdersTable } from '@/widgets/orders-table';
import { exportOrdersCsv } from './actions';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const orders = await listOrders({ status: searchParams.status });
  return (
    <main className="p-6">
      <OrdersTable orders={orders} onExport={exportOrdersCsv} />
    </main>
  );
}
`),
      },
      {
        name: 'actions.ts',
        language: 'ts',
        content: fmt(`
'use server';
import { listOrders } from '@/server/orders';
import { toCsv } from '@/shared/lib/csv';

export async function exportOrdersCsv(filter: { status?: string }) {
  const rows = await listOrders(filter);
  return toCsv(rows);
}
`),
      },
      {
        name: 'loading.tsx',
        language: 'tsx',
        content: fmt(`
export default function Loading() {
  return <div className="p-6 text-ink-3">Loading orders…</div>;
}
`),
      },
    ],
  },
  {
    id: 'landing',
    label: 'Public landing',
    prompt: 'A marketing landing page at / with hero, features, and CTA.',
    basePath: 'app/(public)',
    tradeoffs:
      'Fully static. Use force-cache and prerender at build time. Edge runtime for low TTFB.',
    files: [
      {
        name: 'page.tsx',
        language: 'tsx',
        content: fmt(`
import { Hero } from '@/widgets/hero';
import { Features } from '@/widgets/features';
import { Cta } from '@/widgets/cta';

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <main>
      <Hero title="Ship faster" body="The Next-native studio for static-first apps." />
      <Features />
      <Cta href="/signup" label="Get started" />
    </main>
  );
}
`),
      },
      {
        name: 'layout.tsx',
        language: 'tsx',
        content: fmt(`
import type { ReactNode } from 'react';
import { MarketingNav } from '@/widgets/marketing-nav';
import { Footer } from '@/widgets/footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNav />
      {children}
      <Footer />
    </>
  );
}
`),
      },
      {
        name: 'loading.tsx',
        language: 'tsx',
        content: fmt(`
export default function Loading() {
  return null;
}
`),
      },
    ],
  },
  {
    id: 'checkout',
    label: 'Checkout summary',
    prompt:
      'Checkout summary at /checkout/[sessionId] with totals and a place-order action.',
    basePath: 'app/checkout/[sessionId]',
    tradeoffs:
      'Per-session, never cache. Server action for placing the order. Run on node for payment SDK.',
    files: [
      {
        name: 'page.tsx',
        language: 'tsx',
        content: fmt(`
import { getCheckout } from '@/server/checkout';
import { Summary } from '@/widgets/checkout-summary';
import { placeOrder } from './actions';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const session = await getCheckout(params.sessionId);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Summary session={session} onPlace={placeOrder} />
    </main>
  );
}
`),
      },
      {
        name: 'route.ts',
        language: 'ts',
        content: fmt(`
import { NextResponse } from 'next/server';
import { getCheckout } from '@/server/checkout';

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const session = await getCheckout(params.sessionId);
  return NextResponse.json(session);
}
`),
      },
      {
        name: 'actions.ts',
        language: 'ts',
        content: fmt(`
'use server';
import { redirect } from 'next/navigation';
import { placeOrderForSession } from '@/server/checkout';

export async function placeOrder(sessionId: string) {
  const orderId = await placeOrderForSession(sessionId);
  redirect(\`/orders/\${orderId}\`);
}
`),
      },
      {
        name: 'error.tsx',
        language: 'tsx',
        content: fmt(`
'use client';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6 text-sev-err">
      Checkout failed: {error.message}
    </div>
  );
}
`),
      },
    ],
  },
];

export function intentById(id: IntentId): RouteIntent {
  return INTENTS.find((i) => i.id === id) ?? INTENTS[0]!;
}

export function chunkContent(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (line.length === 0) {
      out.push('\n');
      continue;
    }
    // Stream by 8-16 char slices.
    let i = 0;
    while (i < line.length) {
      const size = 8 + ((i + line.length) % 9); // 8..16
      const end = Math.min(line.length, i + size);
      out.push(line.slice(i, end));
      i = end;
    }
    out.push('\n');
  }
  return out;
}

export const RUNTIME_OPTS: ReadonlyArray<{ value: Runtime; label: string }> = [
  { value: 'node', label: 'node' },
  { value: 'edge', label: 'edge' },
];

export const CACHE_OPTS: ReadonlyArray<{ value: CacheMode; label: string }> = [
  { value: 'force-cache', label: 'force-cache' },
  { value: 'no-store', label: 'no-store' },
  { value: 'revalidate-60', label: 'revalidate 60s' },
];

export const LOCALE_OPTS: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'en' },
  { value: 'fr', label: 'fr' },
  { value: 'ja', label: 'ja' },
  { value: 'ko', label: 'ko' },
];

export type FileStatus = 'pending' | 'streaming' | 'done';

export interface StreamState {
  byFile: Record<string, string>;
  status: Record<string, FileStatus>;
  activeFile: string | null;
}
