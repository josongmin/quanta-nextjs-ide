/**
 * Sitemap & robots.txt presence checker.
 *
 * In production this would parse `app/sitemap.ts` (which exports a function
 * returning `MetadataRoute.Sitemap`) and `app/robots.ts`.  Here we accept a
 * snapshot from the workspace indexer and compare it against the route set.
 */

import type { SitemapSnapshot } from './types';

export interface SitemapDiff {
  readonly hasSitemap: boolean;
  readonly hasRobots: boolean;
  /** Routes present in the workspace but not advertised in the sitemap. */
  readonly missingFromSitemap: ReadonlyArray<string>;
  /** Routes in sitemap that no longer exist (rotted entries). */
  readonly orphans: ReadonlyArray<string>;
  /** Coverage 0..1. */
  readonly coverage: number;
}

export function diffSitemap(
  routes: ReadonlyArray<string>,
  snapshot: SitemapSnapshot,
): SitemapDiff {
  const sitemapRoutes = new Set(snapshot.entries.map((e) => e.route));
  const routeSet = new Set(routes);
  const missingFromSitemap = routes.filter(
    (r) => !sitemapRoutes.has(r) && shouldBeIndexed(r),
  );
  const orphans = snapshot.entries
    .filter((e) => !routeSet.has(e.route))
    .map((e) => e.route);
  const matched = routes.filter((r) => sitemapRoutes.has(r)).length;
  const coverage = routes.length === 0 ? 1 : matched / routes.length;
  return {
    hasSitemap: snapshot.hasSitemap,
    hasRobots: snapshot.hasRobots,
    missingFromSitemap,
    orphans,
    coverage,
  };
}

/**
 * Heuristic — segments under `/admin`, `/api`, dynamic catch-all `[...]`,
 * and route groups `(group)` are typically excluded from public indexing.
 */
function shouldBeIndexed(route: string): boolean {
  if (route.startsWith('/admin')) return false;
  if (route.startsWith('/api/')) return false;
  if (route.includes('[...')) return false;
  if (route.includes('/(') && route.includes(')/')) return false;
  return true;
}

export const MOCK_SITEMAP: SitemapSnapshot = {
  hasSitemap: true,
  hasRobots: true,
  entries: [
    {
      route: '/',
      lastmod: '2026-04-01',
      changefreq: 'weekly',
      priority: 1,
    },
    {
      route: '/faq',
      lastmod: '2026-03-12',
      changefreq: 'monthly',
      priority: 0.6,
    },
    {
      route: '/blog/[slug]',
      lastmod: '2026-04-29',
      changefreq: 'daily',
      priority: 0.8,
    },
  ],
};
