/**
 * Pricing model for the cost predictor.
 *
 * Numbers are *rough* public list prices for the platforms we support.
 * They're tunable in the UI but ship with sane defaults so you can paste
 * a project and see something useful in 1 click.
 */

import type { RenderingClass } from '@shared/types';

export type Provider = 'vercel' | 'aws-lambda' | 'cloudflare';

/** Pricing per million requests / invocations, in USD. */
export interface ProviderPricing {
  id: Provider;
  label: string;
  /** Static (CDN) cost per million requests. */
  staticPerM: number;
  /** SSR / dynamic cost per million requests. */
  ssrPerM: number;
  /** ISR regen cost per million regens. */
  isrPerM: number;
  /** Edge runtime cost per million requests. */
  edgePerM: number;
  /** GB-seconds compute factored into ssr cost (display hint). */
  computeNote: string;
}

export const PROVIDERS: ReadonlyArray<ProviderPricing> = [
  {
    id: 'vercel',
    label: 'Vercel',
    staticPerM: 0.4,
    ssrPerM: 6.5,
    isrPerM: 1.0,
    edgePerM: 2.0,
    computeNote: '1 GB-s ≈ $0.18',
  },
  {
    id: 'aws-lambda',
    label: 'AWS Lambda + CloudFront',
    staticPerM: 0.0,
    ssrPerM: 4.2,
    isrPerM: 0.7,
    edgePerM: 3.5,
    computeNote: '$0.20 / 1M req, $16.67 / 1M GB-s',
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare Workers + Pages',
    staticPerM: 0.0,
    ssrPerM: 3.0,
    isrPerM: 0.5,
    edgePerM: 0.5,
    computeNote: 'Workers: $0.30 / 1M req',
  },
];

export const DEFAULT_PROVIDER: Provider = 'vercel';

export function findProvider(id: Provider): ProviderPricing {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]!;
}

export type CostBucket = 'static' | 'isr' | 'ssr' | 'edge';

export function bucketFor(
  rendering: RenderingClass,
  isEdge: boolean,
): CostBucket {
  if (isEdge) return 'edge';
  if (rendering === 'static') return 'static';
  if (rendering === 'isr') return 'isr';
  if (rendering === 'dynamic') return 'ssr';
  return 'ssr';
}

export function ratePerMillion(p: ProviderPricing, bucket: CostBucket): number {
  switch (bucket) {
    case 'static':
      return p.staticPerM;
    case 'isr':
      return p.isrPerM;
    case 'ssr':
      return p.ssrPerM;
    case 'edge':
      return p.edgePerM;
  }
}
