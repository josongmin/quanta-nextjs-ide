export type ViolationKind =
  | 'server-only-leaked-to-client'
  | 'client-only-leaked-to-server'
  | 'nondeterministic-import'
  | 'env-leak';

export type Severity = 'err' | 'warn' | 'info';

export interface ImportEdge {
  from: string;
  to: string;
  reason: string;
}

export interface Violation {
  id: string;
  kind: ViolationKind;
  file: string;
  line: number;
  importedFrom: string;
  severity: Severity;
  preview: string;
  fix: string;
  trace: ReadonlyArray<ImportEdge>;
  before: string;
  after: string;
}

export const VIOLATIONS: ReadonlyArray<Violation> = [
  {
    id: 'v1',
    kind: 'server-only-leaked-to-client',
    file: 'components/UserMenu.client.tsx',
    line: 4,
    importedFrom: 'lib/db.ts',
    severity: 'err',
    preview: `import { getUser } from '@/lib/db';`,
    fix: 'Move the data fetch into the parent server component and pass the result as a prop.',
    trace: [
      { from: 'components/UserMenu.client.tsx', to: 'lib/auth.ts', reason: 'top-level import' },
      { from: 'lib/auth.ts', to: 'lib/db.ts', reason: 'getUser() uses db client' },
      { from: 'lib/db.ts', to: 'server-only', reason: "import 'server-only'" },
    ],
    before: `// components/UserMenu.client.tsx
'use client';
import { getUser } from '@/lib/auth';

export function UserMenu() {
  const user = getUser(); // throws at runtime
  return <div>{user.name}</div>;
}`,
    after: `// app/layout.tsx (server)
import { getUser } from '@/lib/auth';
import { UserMenu } from '@/components/UserMenu.client';

export default async function Layout() {
  const user = await getUser();
  return <UserMenu user={user} />;
}`,
  },
  {
    id: 'v2',
    kind: 'server-only-leaked-to-client',
    file: 'components/Pricing.client.tsx',
    line: 3,
    importedFrom: 'lib/stripe-secret.ts',
    severity: 'err',
    preview: `import { stripeSecret } from '@/lib/stripe-secret';`,
    fix: "Replace with a server action that returns only the public price.",
    trace: [
      { from: 'components/Pricing.client.tsx', to: 'lib/stripe-secret.ts', reason: 'top-level import' },
      { from: 'lib/stripe-secret.ts', to: 'server-only', reason: "import 'server-only'" },
    ],
    before: `'use client';
import { stripeSecret } from '@/lib/stripe-secret';
console.log(stripeSecret);`,
    after: `'use client';
import { getPublicPrice } from '@/app/actions';
const price = await getPublicPrice();`,
  },
  {
    id: 'v3',
    kind: 'env-leak',
    file: 'components/AnalyticsBoot.client.tsx',
    line: 9,
    importedFrom: 'process.env.SENTRY_DSN',
    severity: 'err',
    preview: `const dsn = process.env.SENTRY_DSN; // server-only`,
    fix: 'Rename to NEXT_PUBLIC_SENTRY_DSN if it really must be public, or move init to server.',
    trace: [
      {
        from: 'components/AnalyticsBoot.client.tsx',
        to: 'process.env.SENTRY_DSN',
        reason: 'env without NEXT_PUBLIC_ prefix',
      },
    ],
    before: `'use client';
const dsn = process.env.SENTRY_DSN;
init({ dsn });`,
    after: `'use client';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
init({ dsn });`,
  },
  {
    id: 'v4',
    kind: 'client-only-leaked-to-server',
    file: 'app/dashboard/page.tsx',
    line: 5,
    importedFrom: 'components/Chart.client.tsx',
    severity: 'warn',
    preview: `import { useChartHook } from '@/components/Chart.client';`,
    fix: 'Lazy-import behind a server-side feature flag, or convert to a child client component.',
    trace: [
      { from: 'app/dashboard/page.tsx', to: 'components/Chart.client.tsx', reason: 'top-level import' },
      { from: 'components/Chart.client.tsx', to: 'client-only', reason: "import 'client-only'" },
    ],
    before: `// app/dashboard/page.tsx
import { useChartHook } from '@/components/Chart.client';
export default function Page() { return <Chart />; }`,
    after: `// app/dashboard/page.tsx
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('@/components/Chart.client'), { ssr: false });`,
  },
  {
    id: 'v5',
    kind: 'nondeterministic-import',
    file: 'lib/random-id.ts',
    line: 1,
    importedFrom: 'crypto',
    severity: 'warn',
    preview: `export const id = crypto.randomUUID(); // module-scope`,
    fix: 'Wrap in a function so consumers control when randomness is generated.',
    trace: [
      { from: 'lib/random-id.ts', to: 'crypto', reason: 'module-scope randomness' },
    ],
    before: `import crypto from 'node:crypto';
export const id = crypto.randomUUID();`,
    after: `import crypto from 'node:crypto';
export function makeId() { return crypto.randomUUID(); }`,
  },
  {
    id: 'v6',
    kind: 'server-only-leaked-to-client',
    file: 'components/Header.client.tsx',
    line: 7,
    importedFrom: 'lib/admin.ts',
    severity: 'err',
    preview: `import { isAdmin } from '@/lib/admin';`,
    fix: 'Pass `isAdmin` as a prop from the server layout.',
    trace: [
      { from: 'components/Header.client.tsx', to: 'lib/admin.ts', reason: 'top-level import' },
      { from: 'lib/admin.ts', to: 'lib/db.ts', reason: 'reads admin table' },
      { from: 'lib/db.ts', to: 'server-only', reason: "import 'server-only'" },
    ],
    before: `'use client';
import { isAdmin } from '@/lib/admin';
const flag = isAdmin();`,
    after: `'use client';
export function Header({ isAdmin }: { isAdmin: boolean }) { /* ... */ }`,
  },
  {
    id: 'v7',
    kind: 'nondeterministic-import',
    file: 'lib/now.ts',
    line: 1,
    importedFrom: 'Date.now',
    severity: 'info',
    preview: `export const now = Date.now(); // hydration mismatch risk`,
    fix: 'Defer to render time inside a useEffect or a server component prop.',
    trace: [
      { from: 'lib/now.ts', to: 'Date.now', reason: 'module-scope time read' },
    ],
    before: `export const now = Date.now();`,
    after: `export function getNow() { return Date.now(); }`,
  },
  {
    id: 'v8',
    kind: 'env-leak',
    file: 'app/page.tsx',
    line: 12,
    importedFrom: 'process.env.DATABASE_URL',
    severity: 'err',
    preview: `console.log(process.env.DATABASE_URL); // gets bundled into client RSC payload`,
    fix: 'Drop the log or guard with a server-only utility.',
    trace: [
      {
        from: 'app/page.tsx',
        to: 'process.env.DATABASE_URL',
        reason: 'string interpolated in JSX → leaks via RSC payload',
      },
    ],
    before: `export default function Page() {
  return <div>{process.env.DATABASE_URL}</div>;
}`,
    after: `import 'server-only';
import { describe } from '@/lib/db';
export default function Page() { return <div>{describe()}</div>; }`,
  },
];

export const KIND_LABEL: Record<ViolationKind, string> = {
  'server-only-leaked-to-client': 'server → client',
  'client-only-leaked-to-server': 'client → server',
  'nondeterministic-import': 'nondeterministic',
  'env-leak': 'env leak',
};

export const KIND_TONE: Record<ViolationKind, 'err' | 'warn' | 'info'> = {
  'server-only-leaked-to-client': 'err',
  'client-only-leaked-to-server': 'warn',
  'nondeterministic-import': 'warn',
  'env-leak': 'err',
};

export const ALL_KINDS: ReadonlyArray<ViolationKind> = [
  'server-only-leaked-to-client',
  'client-only-leaked-to-server',
  'nondeterministic-import',
  'env-leak',
];
