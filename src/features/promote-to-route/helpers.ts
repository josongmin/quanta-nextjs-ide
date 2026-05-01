export type Archetype = 'page' | 'page+layout' | 'page+loading+error';

export interface ArchetypeOption {
  readonly value: Archetype;
  readonly label: string;
  readonly hint: string;
}

export interface GeneratedFile {
  readonly id: string;
  readonly path: string;
  readonly name: string;
  readonly code: string;
  readonly archetypes: ReadonlyArray<Archetype>;
}

export interface RedirectSite {
  readonly id: string;
  readonly file: string;
  readonly oldImport: string;
  readonly newHref: string;
}

export interface PromoteTarget {
  readonly sourceFile: string;
  readonly defaultPath: string;
  readonly files: ReadonlyArray<GeneratedFile>;
  readonly redirects: ReadonlyArray<RedirectSite>;
}

export const ARCHETYPES: ReadonlyArray<ArchetypeOption> = [
  { value: 'page', label: 'page only', hint: 'just page.tsx' },
  {
    value: 'page+layout',
    label: 'page + layout',
    hint: 'shared chrome around segment',
  },
  {
    value: 'page+loading+error',
    label: 'page + loading + error',
    hint: 'streaming + error boundary',
  },
];

const PAGE_CODE = `import { OrderDetails } from '@/features/orders/order-details';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetails id={id} />;
}`;

const LAYOUT_CODE = `import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl p-4">
      {children}
    </section>
  );
}`;

const LOADING_CODE = `export default function Loading() {
  return <div className="animate-pulse">Loading order…</div>;
}`;

const ERROR_CODE = `'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  );
}`;

export const TARGET: PromoteTarget = {
  sourceFile: 'src/features/orders/order-details.tsx',
  defaultPath: '/orders/[id]/details',
  files: [
    {
      id: 'g1',
      name: 'page.tsx',
      path: 'src/app/orders/[id]/details/page.tsx',
      code: PAGE_CODE,
      archetypes: ['page', 'page+layout', 'page+loading+error'],
    },
    {
      id: 'g2',
      name: 'layout.tsx',
      path: 'src/app/orders/[id]/details/layout.tsx',
      code: LAYOUT_CODE,
      archetypes: ['page+layout'],
    },
    {
      id: 'g3',
      name: 'loading.tsx',
      path: 'src/app/orders/[id]/details/loading.tsx',
      code: LOADING_CODE,
      archetypes: ['page+loading+error'],
    },
    {
      id: 'g4',
      name: 'error.tsx',
      path: 'src/app/orders/[id]/details/error.tsx',
      code: ERROR_CODE,
      archetypes: ['page+loading+error'],
    },
  ],
  redirects: [
    {
      id: 'r1',
      file: 'src/features/orders/order-list.tsx',
      oldImport: "import { OrderDetails } from './order-details';",
      newHref: "router.push(`/orders/${id}/details`)",
    },
    {
      id: 'r2',
      file: 'src/widgets/header/recent-orders.tsx',
      oldImport: "import { OrderDetails } from '@/features/orders/order-details';",
      newHref: "<Link href={`/orders/${id}/details`}/>",
    },
    {
      id: 'r3',
      file: 'src/pages/orders/page.tsx',
      oldImport: "import { OrderDetails } from '@/features/orders/order-details';",
      newHref: "redirect(`/orders/${id}/details`)",
    },
  ],
};
