/**
 * Mode resolver.
 *
 * Given a snapshot of route signals (collected by the workspace indexer),
 * compute the final {@link ResolvedMode}.  Pure / deterministic so the
 * resolver can be unit-tested without a Next runtime.
 *
 * Precedence (matches Next 14/15 semantics):
 *
 *   1. `force-dynamic`              → dynamic
 *   2. cookies()/headers() in tree  → dynamic (stronger reason wins)
 *   3. `force-static`               → static (overrides ISR via fetch)
 *   4. `revalidate = N`             → ISR
 *   5. fetch with `no-store`        → dynamic-noStore
 *   6. Suspense boundary present    → streaming overlay (mode unchanged
 *                                     except when otherwise static)
 *   7. else                         → static
 */

import { match, P } from 'ts-pattern';
import type { ModeSignal, RenderMode, ResolvedMode } from './types';

export interface ResolveInput {
  readonly route: string;
  readonly signals: ReadonlyArray<ModeSignal>;
}

export function resolveMode(input: ResolveInput): ResolvedMode {
  const { route, signals } = input;
  const has = (k: ModeSignal['kind']): ModeSignal | undefined =>
    signals.find((s) => s.kind === k);

  const forceDynamic = has('force-dynamic');
  const forceStatic = has('force-static');
  const cookies = has('cookies');
  const headers = has('headers');
  const noStore = has('noStore') ?? has('fetch-no-store');
  const revalidate = has('revalidate');
  const suspense = has('suspense');
  const overrides: string[] = [];
  if (forceDynamic) overrides.push('force-dynamic');
  if (forceStatic) overrides.push('force-static');
  if (revalidate) overrides.push(`revalidate=${revalidateSeconds(revalidate)}`);

  let mode: RenderMode;
  let cause: string;
  let confidence: ResolvedMode['confidence'] = 'high';

  if (forceDynamic) {
    mode = 'dynamic-headers';
    cause = 'route segment exports `dynamic = "force-dynamic"`';
  } else if (cookies) {
    mode = 'dynamic-cookies';
    cause = `cookies() called in ${cookies.file}:${cookies.line}`;
  } else if (headers) {
    mode = 'dynamic-headers';
    cause = `headers() called in ${headers.file}:${headers.line}`;
  } else if (forceStatic) {
    mode = 'static';
    cause = 'force-static suppresses dynamic fallback';
  } else if (revalidate) {
    mode = 'isr';
    cause = `revalidate=${revalidateSeconds(revalidate)} declared`;
  } else if (noStore) {
    mode = 'dynamic-noStore';
    cause = `${noStore.kind} opts route out of caching`;
    confidence = 'medium';
  } else if (suspense) {
    mode = 'streaming';
    cause = `Suspense boundary at ${suspense.file}:${suspense.line}`;
    confidence = 'medium';
  } else {
    mode = 'static';
    cause = 'no dynamic markers detected';
    confidence = 'medium';
  }

  // streaming may overlay any non-static mode; for visual surface we promote
  // to 'streaming' only when the dominant reason is the suspense boundary.

  const rev = revalidate ? revalidateSeconds(revalidate) : null;
  return {
    route,
    mode,
    revalidate: rev,
    signals,
    cause,
    behavior: behaviorFor(mode, rev),
    overrides,
    confidence,
  };
}

function revalidateSeconds(s: ModeSignal): number {
  const m = /\b(\d+)\b/.exec(s.snippet);
  return m ? Number(m[1]) : 0;
}

function behaviorFor(mode: RenderMode, revalidate: number | null): string {
  return match(mode)
    .with('static', () => 'Pre-rendered at build, served from CDN.')
    .with(
      'isr',
      () =>
        `Cached HTML, revalidated every ${revalidate ?? 0}s on next request.`,
    )
    .with(
      'dynamic-cookies',
      () => 'Rendered per request — cookies() forces request-time render.',
    )
    .with(
      'dynamic-headers',
      () => 'Rendered per request — headers/force-dynamic in segment chain.',
    )
    .with(
      'dynamic-noStore',
      () => 'Rendered per request — fetch opted out of cache.',
    )
    .with(
      'streaming',
      () =>
        'Streamed via Suspense — outer shell static, inner boundaries hydrated progressively.',
    )
    .exhaustive();
}

export function modeLabel(mode: RenderMode): string {
  return match(mode)
    .with('static', () => 'Static')
    .with('isr', () => 'ISR')
    .with('dynamic-cookies', () => 'Dynamic · cookies')
    .with('dynamic-headers', () => 'Dynamic · headers')
    .with('dynamic-noStore', () => 'Dynamic · no-store')
    .with('streaming', () => 'Streaming')
    .exhaustive();
}

export function modeFamily(
  mode: RenderMode,
): 'static' | 'isr' | 'dynamic' | 'streaming' {
  return match(mode)
    .with('static', () => 'static' as const)
    .with('isr', () => 'isr' as const)
    .with('streaming', () => 'streaming' as const)
    .with(
      P.union('dynamic-cookies', 'dynamic-headers', 'dynamic-noStore'),
      () => 'dynamic' as const,
    )
    .exhaustive();
}

/* Mock fixtures — keyed by route path. */

export const MOCK_RESOLVED: ReadonlyArray<ResolvedMode> = [
  resolveMode({
    route: '/',
    signals: [],
  }),
  resolveMode({
    route: '/products/[id]',
    signals: [
      {
        kind: 'cookies',
        file: 'app/products/[id]/page.tsx',
        line: 12,
        snippet: 'const c = cookies()',
        effect: 'Forces dynamic rendering',
      },
    ],
  }),
  resolveMode({
    route: '/blog/[slug]',
    signals: [
      {
        kind: 'revalidate',
        file: 'app/blog/[slug]/page.tsx',
        line: 4,
        snippet: 'export const revalidate = 60',
        effect: 'ISR window of 60s',
      },
      {
        kind: 'suspense',
        file: 'app/blog/[slug]/page.tsx',
        line: 41,
        snippet: '<Suspense fallback={<Loading/>}>',
        effect: 'Adds streaming boundary',
      },
    ],
  }),
  resolveMode({
    route: '/feed',
    signals: [
      {
        kind: 'fetch-no-store',
        file: 'app/feed/page.tsx',
        line: 8,
        snippet: "fetch('/api/feed', { cache: 'no-store' })",
        effect: 'Opts request out of caching',
      },
    ],
  }),
];

export function findMode(route: string): ResolvedMode | undefined {
  return MOCK_RESOLVED.find((r) => r.route === route);
}
