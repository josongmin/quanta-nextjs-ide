/**
 * SEO scanner.
 *
 * Designed to be driven by ts-morph in production: walks `app/**\/page.tsx`
 * and `app/**\/layout.tsx`, resolves `export const metadata` and
 * `generateMetadata`, and builds a {@link RouteMetadata} per route.
 *
 * In the IDE we run with mock fixtures so we can render the UI without a
 * live workspace.  The scanner itself is pure — given a list of source
 * stubs, it produces deterministic reports.
 */

import { match } from 'ts-pattern';
import type {
  RouteMetadata,
  RouteSeoReport,
  SeoIssue,
  SeoSeverity,
} from './types';

interface ScanInput {
  readonly routes: ReadonlyArray<RouteMetadata>;
}

const SEVERITY_WEIGHT: Record<SeoSeverity, number> = {
  info: 4,
  warn: 12,
  error: 22,
};

function makeIssue(
  route: string,
  partial: Omit<SeoIssue, 'id' | 'route'>,
): SeoIssue {
  return { id: `${route}::${partial.kind}`, route, ...partial };
}

function findRouteIssues(meta: RouteMetadata): SeoIssue[] {
  const issues: SeoIssue[] = [];
  if (!meta.title)
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-title',
        severity: 'error',
        suggestion:
          'Add `export const metadata = { title }` or implement `generateMetadata`.',
      }),
    );
  if (!meta.description)
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-description',
        severity: 'warn',
        suggestion:
          'Add `description` to metadata — used by Google and AI crawlers as snippet.',
      }),
    );
  if (!meta.canonical)
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-canonical',
        severity: 'warn',
        suggestion: 'Add `alternates.canonical` to dedupe duplicate URL surfaces.',
      }),
    );
  if (!meta.ogImage)
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-og-image',
        severity: 'warn',
        suggestion:
          'Add `opengraph-image.tsx` (Next file convention) or `openGraph.images`.',
      }),
    );
  if (!meta.twitterCard)
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-twitter-card',
        severity: 'info',
        suggestion: 'Add `twitter.card = "summary_large_image"` for X.com previews.',
      }),
    );
  if (meta.dynamicFromCookies)
    issues.push(
      makeIssue(meta.route, {
        kind: 'dynamic-from-cookies',
        severity: 'error',
        suggestion:
          'Metadata derived from cookies() will be different per-user — crawlers may index empty cards.',
      }),
    );
  if (meta.dynamicFromHeaders)
    issues.push(
      makeIssue(meta.route, {
        kind: 'dynamic-from-headers',
        severity: 'warn',
        suggestion:
          'Metadata derived from headers() prevents static optimization.',
      }),
    );
  if (meta.locales.length > 1) {
    // hreflang heuristic — caller should plug in actual alternates.languages
    // detection.  For mock we flag it visually to demonstrate the wiring.
    issues.push(
      makeIssue(meta.route, {
        kind: 'missing-hreflang',
        severity: 'warn',
        suggestion: `Add alternates.languages for ${meta.locales.join(', ')}.`,
      }),
    );
  }

  // AEO — structured data on critical pages
  if (meta.critical) {
    const wantedType = match(meta.critical)
      .with('product', () => 'Product')
      .with('article', () => 'Article')
      .with('faq', () => 'FAQPage')
      .with('howto', () => 'HowTo')
      .exhaustive();
    const has = meta.jsonLd.some((j) => j.type === wantedType && j.valid);
    if (!has) {
      const kind = match(meta.critical)
        .with('product', () => 'aeo-missing-product' as const)
        .with('article', () => 'aeo-missing-article' as const)
        .with('faq', () => 'aeo-missing-faq' as const)
        .with('howto', () => 'aeo-missing-howto' as const)
        .exhaustive();
      issues.push(
        makeIssue(meta.route, {
          kind,
          severity: 'error',
          suggestion: `Add JSON-LD schema.org/${wantedType} to expose this route to AI search & rich results.`,
        }),
      );
    }
  }

  return issues;
}

export function scoreRoute(meta: RouteMetadata, issues: SeoIssue[]): number {
  let score = 100;
  for (const i of issues) score -= SEVERITY_WEIGHT[i.severity];
  // bonus for JSON-LD presence on non-critical pages
  if (!meta.critical && meta.jsonLd.length > 0) score += 4;
  return Math.max(0, Math.min(100, score));
}

export function scanRoutes(input: ScanInput): RouteSeoReport[] {
  const titleCounts = new Map<string, number>();
  for (const r of input.routes) {
    if (r.title) titleCounts.set(r.title, (titleCounts.get(r.title) ?? 0) + 1);
  }

  return input.routes.map((meta) => {
    const issues = findRouteIssues(meta);
    if (meta.title && (titleCounts.get(meta.title) ?? 0) > 1) {
      issues.push(
        makeIssue(meta.route, {
          kind: 'duplicate-title',
          severity: 'warn',
          suggestion: `Title "${meta.title}" is reused on ${
            titleCounts.get(meta.title) ?? 0
          } routes — make titles unique for crawl ranking.`,
        }),
      );
    }
    return {
      route: meta.route,
      metadata: meta,
      issues,
      score: scoreRoute(meta, issues),
    };
  });
}

/**
 * Mock fixtures.  Useful for the IDE's preview surface.
 */
export const MOCK_ROUTES: ReadonlyArray<RouteMetadata> = [
  {
    route: '/',
    title: 'Acme — Home',
    description: 'The demo storefront for the Quanta Next Studio.',
    canonical: 'https://acme.example/',
    ogImage: '/opengraph-image.png',
    ogTitle: 'Acme',
    ogDescription: 'Quality goods, fast.',
    twitterCard: 'summary_large_image',
    robots: 'index,follow',
    dynamicFromCookies: false,
    dynamicFromHeaders: false,
    generated: false,
    jsonLd: [
      {
        type: 'Organization',
        source: 'app/page.tsx:14',
        valid: true,
        missingFields: [],
      },
    ],
    locales: ['en'],
    critical: null,
    provenance: [
      { field: 'title', chain: ['static "Acme — Home"'], origin: 'static' },
    ],
  },
  {
    route: '/products/[id]',
    title: 'Product detail',
    description: null,
    canonical: null,
    ogImage: null,
    ogTitle: null,
    ogDescription: null,
    twitterCard: null,
    robots: null,
    dynamicFromCookies: true,
    dynamicFromHeaders: false,
    generated: true,
    jsonLd: [],
    locales: ['en'],
    critical: 'product',
    provenance: [
      {
        field: 'title',
        chain: [
          'product.name',
          'DB.products.name',
          'prisma.product.findUnique({ where: { id } })',
        ],
        origin: 'db',
      },
      {
        field: 'description',
        chain: ['product.summary', 'DB.products.summary'],
        origin: 'db',
      },
    ],
  },
  {
    route: '/blog/[slug]',
    title: 'Blog post',
    description: 'Read the latest from the team.',
    canonical: 'https://acme.example/blog/[slug]',
    ogImage: '/blog/opengraph-image.png',
    ogTitle: 'Blog post',
    ogDescription: null,
    twitterCard: 'summary_large_image',
    robots: 'index,follow',
    dynamicFromCookies: false,
    dynamicFromHeaders: false,
    generated: true,
    jsonLd: [],
    locales: ['en', 'fr', 'de'],
    critical: 'article',
    provenance: [
      {
        field: 'title',
        chain: ['post.title', 'CMS.posts.title'],
        origin: 'cms',
      },
    ],
  },
  {
    route: '/faq',
    title: 'Frequently asked questions',
    description: 'Answers to common questions.',
    canonical: 'https://acme.example/faq',
    ogImage: '/opengraph-image.png',
    ogTitle: 'FAQ',
    ogDescription: 'Common questions about Acme.',
    twitterCard: 'summary',
    robots: 'index,follow',
    dynamicFromCookies: false,
    dynamicFromHeaders: false,
    generated: false,
    jsonLd: [],
    locales: ['en'],
    critical: 'faq',
    provenance: [
      { field: 'title', chain: ['static'], origin: 'static' },
    ],
  },
  {
    route: '/account',
    title: 'Product detail',
    description: 'Manage your account.',
    canonical: null,
    ogImage: null,
    ogTitle: null,
    ogDescription: null,
    twitterCard: null,
    robots: 'noindex',
    dynamicFromCookies: true,
    dynamicFromHeaders: true,
    generated: true,
    jsonLd: [],
    locales: ['en'],
    critical: null,
    provenance: [
      {
        field: 'title',
        chain: ['session.user.name', 'cookies().get("session")'],
        origin: 'cookie',
      },
    ],
  },
];
