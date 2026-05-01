export type FallbackKind = 'spinner' | 'skeleton' | 'empty' | 'custom';

export interface FallbackOption {
  readonly value: FallbackKind;
  readonly label: string;
  readonly snippet: string;
}

export interface WrapTarget {
  readonly file: string;
  readonly beforeCode: string;
  readonly buildAfterCode: (kind: FallbackKind) => string;
}

export const FALLBACKS: ReadonlyArray<FallbackOption> = [
  { value: 'spinner', label: 'Spinner', snippet: '<Spinner />' },
  { value: 'skeleton', label: 'Skeleton', snippet: '<CardSkeleton />' },
  { value: 'empty', label: 'Empty', snippet: 'null' },
  { value: 'custom', label: 'Custom…', snippet: '<MyFallback />' },
];

const BEFORE = `import { OrderHistory } from './order-history';

export function ProfilePage() {
  return (
    <main>
      <h1>Profile</h1>
      <OrderHistory />
    </main>
  );
}`;

const AFTER_TEMPLATE = (snippet: string): string => `import { Suspense } from 'react';
import { OrderHistory } from './order-history';

export function ProfilePage() {
  return (
    <main>
      <h1>Profile</h1>
      <Suspense fallback={${snippet}}>
        <OrderHistory />
      </Suspense>
    </main>
  );
}`;

export const TARGET: WrapTarget = {
  file: 'src/features/profile/profile-page.tsx',
  beforeCode: BEFORE,
  buildAfterCode: (kind) => {
    const opt = FALLBACKS.find((f) => f.value === kind) ?? FALLBACKS[0]!;
    return AFTER_TEMPLATE(opt.snippet);
  },
};

export interface StreamingBenefit {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone: 'static' | 'info' | 'accent';
}

export const BENEFITS: ReadonlyArray<StreamingBenefit> = [
  { id: 'b1', label: 'LCP', value: '−320 ms', tone: 'static' },
  { id: 'b2', label: 'TTFB → first byte of <main>', value: 'unblocked', tone: 'info' },
  { id: 'b3', label: 'Async island', value: 'streams independently', tone: 'accent' },
];
