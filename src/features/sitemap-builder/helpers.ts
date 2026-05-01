export type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export type SitemapLocale = 'en' | 'ko' | 'ja' | 'es' | 'de';

export interface SitemapRoute {
  readonly id: string;
  readonly path: string;
  readonly dynamic: boolean;
  lastModified: string; // ISO date
  changeFrequency: ChangeFreq;
  priority: number; // 0..1
  locales: SitemapLocale[];
  exclude: boolean;
}

export const CHANGE_FREQ: ReadonlyArray<ChangeFreq> = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
];

export const LOCALES: ReadonlyArray<SitemapLocale> = ['en', 'ko', 'ja', 'es', 'de'];

export const INITIAL_ROUTES: ReadonlyArray<SitemapRoute> = [
  { id: 'home', path: '/', dynamic: false, lastModified: '2026-04-29', changeFrequency: 'daily', priority: 1.0, locales: ['en', 'ko', 'ja', 'es'], exclude: false },
  { id: 'about', path: '/about', dynamic: false, lastModified: '2026-03-10', changeFrequency: 'monthly', priority: 0.6, locales: ['en', 'ko'], exclude: false },
  { id: 'pricing', path: '/pricing', dynamic: false, lastModified: '2026-04-21', changeFrequency: 'weekly', priority: 0.9, locales: ['en', 'ko', 'ja', 'es', 'de'], exclude: false },
  { id: 'contact', path: '/contact', dynamic: false, lastModified: '2026-02-14', changeFrequency: 'yearly', priority: 0.3, locales: ['en'], exclude: false },
  { id: 'blog', path: '/blog', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'daily', priority: 0.8, locales: ['en', 'ko'], exclude: false },
  { id: 'blog-slug', path: '/blog/[slug]', dynamic: true, lastModified: '2026-04-30', changeFrequency: 'weekly', priority: 0.7, locales: ['en', 'ko'], exclude: false },
  { id: 'docs', path: '/docs', dynamic: false, lastModified: '2026-04-28', changeFrequency: 'weekly', priority: 0.85, locales: ['en'], exclude: false },
  { id: 'docs-slug', path: '/docs/[...slug]', dynamic: true, lastModified: '2026-04-28', changeFrequency: 'weekly', priority: 0.7, locales: ['en'], exclude: false },
  { id: 'products', path: '/products', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'hourly', priority: 0.95, locales: ['en', 'ko', 'ja'], exclude: false },
  { id: 'products-id', path: '/products/[id]', dynamic: true, lastModified: '2026-04-30', changeFrequency: 'daily', priority: 0.8, locales: ['en', 'ko', 'ja'], exclude: false },
  { id: 'category', path: '/category/[slug]', dynamic: true, lastModified: '2026-04-29', changeFrequency: 'daily', priority: 0.75, locales: ['en', 'ko', 'ja'], exclude: false },
  { id: 'cart', path: '/cart', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'always', priority: 0.2, locales: ['en'], exclude: true },
  { id: 'checkout', path: '/checkout', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'always', priority: 0.2, locales: ['en'], exclude: true },
  { id: 'login', path: '/login', dynamic: false, lastModified: '2026-01-01', changeFrequency: 'yearly', priority: 0.1, locales: ['en'], exclude: true },
  { id: 'account', path: '/account', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'never', priority: 0.1, locales: ['en'], exclude: true },
  { id: 'sitemap', path: '/sitemap', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'daily', priority: 0.4, locales: ['en'], exclude: false },
  { id: 'rss', path: '/rss.xml', dynamic: false, lastModified: '2026-04-30', changeFrequency: 'daily', priority: 0.4, locales: ['en'], exclude: false },
  { id: 'changelog', path: '/changelog', dynamic: false, lastModified: '2026-04-25', changeFrequency: 'weekly', priority: 0.5, locales: ['en'], exclude: false },
];

const BASE_URL = 'https://example.com';

export function generateSitemapXml(routes: ReadonlyArray<SitemapRoute>): string {
  const include = routes.filter((r) => !r.exclude);
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const r of include) {
    lines.push('  <url>');
    lines.push(`    <loc>${BASE_URL}${r.path}</loc>`);
    lines.push(`    <lastmod>${r.lastModified}</lastmod>`);
    lines.push(`    <changefreq>${r.changeFrequency}</changefreq>`);
    lines.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
    for (const l of r.locales) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${r.path}"/>`,
      );
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

export function summaryByFrequency(
  routes: ReadonlyArray<SitemapRoute>,
): Record<ChangeFreq, number> {
  const init: Record<ChangeFreq, number> = {
    always: 0,
    hourly: 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
    never: 0,
  };
  for (const r of routes) {
    if (r.exclude) continue;
    init[r.changeFrequency] += 1;
  }
  return init;
}

export function topByPriority(
  routes: ReadonlyArray<SitemapRoute>,
  n: number,
): ReadonlyArray<SitemapRoute> {
  return [...routes]
    .filter((r) => !r.exclude)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, n);
}

export function dynamicWarnings(
  routes: ReadonlyArray<SitemapRoute>,
): ReadonlyArray<SitemapRoute> {
  return routes.filter((r) => r.dynamic && !r.exclude);
}
