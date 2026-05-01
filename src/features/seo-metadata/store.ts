/**
 * SEO/metadata store.  Holds the last scan result + selected route id so
 * the route-card and the route table can stay in sync without prop drilling.
 */

import { create } from 'zustand';
import { MOCK_ROUTES, scanRoutes } from './scanner';
import { MOCK_SITEMAP, diffSitemap } from './sitemap-checker';
import type { RouteSeoReport, SitemapSnapshot } from './types';
import type { SitemapDiff } from './sitemap-checker';

interface SeoState {
  reports: ReadonlyArray<RouteSeoReport>;
  sitemap: SitemapSnapshot;
  sitemapDiff: SitemapDiff;
  selectedRoute: string | null;
  rescan(): void;
  select(route: string | null): void;
}

function build(): {
  reports: ReadonlyArray<RouteSeoReport>;
  sitemap: SitemapSnapshot;
  sitemapDiff: SitemapDiff;
} {
  const reports = scanRoutes({ routes: MOCK_ROUTES });
  const sitemap = MOCK_SITEMAP;
  const sitemapDiff = diffSitemap(
    reports.map((r) => r.route),
    sitemap,
  );
  return { reports, sitemap, sitemapDiff };
}

const initial = build();

export const useSeoStore = create<SeoState>((set) => ({
  reports: initial.reports,
  sitemap: initial.sitemap,
  sitemapDiff: initial.sitemapDiff,
  selectedRoute: initial.reports[0]?.route ?? null,
  rescan: () => set({ ...build() }),
  select: (route) => set({ selectedRoute: route }),
}));
