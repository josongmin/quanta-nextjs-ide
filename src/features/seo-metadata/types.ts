/**
 * SEO / Metadata / AEO validator types.
 *
 * Spec area 44 (SEO/Metadata/AEO).  Pure types — no runtime deps.
 */

export type SeoSeverity = 'info' | 'warn' | 'error';

export type SeoIssueKind =
  | 'missing-title'
  | 'missing-description'
  | 'missing-canonical'
  | 'missing-og-image'
  | 'missing-twitter-card'
  | 'missing-json-ld'
  | 'duplicate-title'
  | 'dynamic-from-cookies'
  | 'dynamic-from-headers'
  | 'missing-sitemap-entry'
  | 'missing-robots'
  | 'missing-hreflang'
  | 'aeo-missing-faq'
  | 'aeo-missing-howto'
  | 'aeo-missing-product'
  | 'aeo-missing-article'
  | 'aeo-missing-organization';

export interface SeoIssue {
  readonly id: string;
  readonly route: string;
  readonly kind: SeoIssueKind;
  readonly severity: SeoSeverity;
  readonly suggestion: string;
  readonly source?: string;
}

/**
 * Snapshot of a route's resolved metadata.  This is the thing the scanner
 * produces (after merging layout + page + dynamic sources).
 */
export interface RouteMetadata {
  readonly route: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly canonical: string | null;
  readonly ogImage: string | null;
  readonly ogTitle: string | null;
  readonly ogDescription: string | null;
  readonly twitterCard: 'summary' | 'summary_large_image' | null;
  readonly robots: string | null;
  /** True when metadata depends on cookies()/headers() — risk for crawlers. */
  readonly dynamicFromCookies: boolean;
  readonly dynamicFromHeaders: boolean;
  /** True when the route uses a `generateMetadata` async function. */
  readonly generated: boolean;
  /** Detected JSON-LD schema.org @types embedded in the page. */
  readonly jsonLd: ReadonlyArray<JsonLdRef>;
  /** Locale segments — used to flag missing hreflang. */
  readonly locales: ReadonlyArray<string>;
  /** Whether this is a critical/AEO-relevant page (product, article, etc). */
  readonly critical: 'product' | 'article' | 'faq' | 'howto' | null;
  /** Backing data sources (provenance hooks). */
  readonly provenance: ReadonlyArray<MetadataFieldProvenance>;
}

export interface JsonLdRef {
  readonly type: string;
  readonly source: string;
  readonly valid: boolean;
  readonly missingFields: ReadonlyArray<string>;
}

export interface MetadataFieldProvenance {
  /** Which metadata field this provenance is for (e.g. 'title'). */
  readonly field: keyof Omit<
    RouteMetadata,
    'route' | 'jsonLd' | 'locales' | 'critical' | 'provenance'
  >;
  /** Human-readable chain: ["product.name", "DB.products.name", "prisma.product.findUnique"] */
  readonly chain: ReadonlyArray<string>;
  readonly origin: 'static' | 'db' | 'cms' | 'env' | 'cookie' | 'header';
}

export interface RouteSeoReport {
  readonly route: string;
  readonly metadata: RouteMetadata;
  readonly issues: ReadonlyArray<SeoIssue>;
  /** 0..100. */
  readonly score: number;
}

export interface SitemapEntry {
  readonly route: string;
  readonly lastmod: string;
  readonly changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  readonly priority: number;
}

export interface SitemapSnapshot {
  readonly hasSitemap: boolean;
  readonly hasRobots: boolean;
  readonly entries: ReadonlyArray<SitemapEntry>;
}
