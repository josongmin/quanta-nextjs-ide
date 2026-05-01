/**
 * Cache-key normalizer for fetch() identity.
 *
 * Two calls collide iff their normalized key matches. We deliberately ignore
 * options that DON'T affect server-side identity (signal, headers, body shape,
 * credentials, mode, etc.) and only key on:
 *   - method
 *   - URL (with query params alphabetized so `?b=2&a=1` === `?a=1&b=2`)
 *   - cache mode
 *   - revalidate window
 *   - sorted tags
 */

import type { FetchCacheOptions, FetchMethod } from './types';

export interface NormalizeInput {
  url: string;
  method?: FetchMethod;
  cache?: FetchCacheOptions['cache'];
  revalidate?: number | false;
  tags?: ReadonlyArray<string>;
}

function sortedQuery(url: string): string {
  // Best-effort URL normalizer — handles relative URLs by parsing against a
  // sentinel base, then strips that base back off.
  try {
    const base = 'https://__quanta__/';
    const u = new URL(url, base);
    const params = Array.from(u.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const search = params.length
      ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    if (u.origin === 'https://__quanta__') {
      return u.pathname + search;
    }
    return u.origin + u.pathname + search;
  } catch {
    return url;
  }
}

export function normalizeFetchKey(input: NormalizeInput): string {
  const method = (input.method ?? 'GET').toUpperCase();
  const url = sortedQuery(input.url.trim());
  const cache = input.cache ?? 'default';
  const revalidate =
    input.revalidate === false
      ? 'never'
      : input.revalidate == null
        ? 'auto'
        : String(input.revalidate);
  const tags = input.tags && input.tags.length > 0
    ? [...input.tags].sort().join(',')
    : '';
  return `${method}|${url}|${cache}|${revalidate}|${tags}`;
}
