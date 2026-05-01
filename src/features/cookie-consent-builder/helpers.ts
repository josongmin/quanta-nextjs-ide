export type Category =
  | 'strictly-necessary'
  | 'functional'
  | 'analytics'
  | 'marketing';
export type BannerStyle = 'bottom-sheet' | 'center-modal' | 'corner-tile';
export type Region = 'EU' | 'US' | 'KR' | 'Global';

export interface Tracker {
  readonly id: string;
  readonly vendor: string;
  readonly category: Category;
  readonly purpose: string;
  readonly expires: string;
  readonly regions: ReadonlyArray<Region>;
}

export const CATEGORIES: ReadonlyArray<Category> = [
  'strictly-necessary',
  'functional',
  'analytics',
  'marketing',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  'strictly-necessary': 'Strictly Necessary',
  functional: 'Functional',
  analytics: 'Analytics',
  marketing: 'Marketing',
};

export const CATEGORY_TONE: Record<Category, 'info' | 'accent' | 'warn' | 'err'> = {
  'strictly-necessary': 'info',
  functional: 'accent',
  analytics: 'warn',
  marketing: 'err',
};

export const STYLES: ReadonlyArray<BannerStyle> = [
  'bottom-sheet',
  'center-modal',
  'corner-tile',
];

export const REGIONS: ReadonlyArray<Region> = ['EU', 'US', 'KR', 'Global'];

export const TRACKERS: ReadonlyArray<Tracker> = [
  {
    id: 'sess',
    vendor: 'auth-session',
    category: 'strictly-necessary',
    purpose: 'Maintain authenticated session',
    expires: '24h',
    regions: ['Global'],
  },
  {
    id: 'csrf',
    vendor: 'csrf-token',
    category: 'strictly-necessary',
    purpose: 'CSRF protection',
    expires: 'session',
    regions: ['Global'],
  },
  {
    id: 'cart',
    vendor: 'cart-id',
    category: 'strictly-necessary',
    purpose: 'Persist shopping cart',
    expires: '30d',
    regions: ['Global'],
  },
  {
    id: 'lang',
    vendor: 'locale-pref',
    category: 'functional',
    purpose: 'Remember language preference',
    expires: '1y',
    regions: ['Global'],
  },
  {
    id: 'theme',
    vendor: 'theme-pref',
    category: 'functional',
    purpose: 'Remember light/dark theme',
    expires: '1y',
    regions: ['Global'],
  },
  {
    id: 'help',
    vendor: 'intercom',
    category: 'functional',
    purpose: 'Customer support chat',
    expires: '90d',
    regions: ['Global'],
  },
  {
    id: 'cf-bm',
    vendor: 'cloudflare-bm',
    category: 'functional',
    purpose: 'Bot mitigation',
    expires: '7d',
    regions: ['Global'],
  },
  {
    id: 'ga',
    vendor: 'google-analytics',
    category: 'analytics',
    purpose: 'Anonymous usage analytics',
    expires: '13mo',
    regions: ['EU', 'US', 'KR', 'Global'],
  },
  {
    id: 'ph',
    vendor: 'posthog',
    category: 'analytics',
    purpose: 'Product analytics + funnels',
    expires: '12mo',
    regions: ['Global'],
  },
  {
    id: 'mixpanel',
    vendor: 'mixpanel',
    category: 'analytics',
    purpose: 'Behavior cohorts',
    expires: '12mo',
    regions: ['US', 'Global'],
  },
  {
    id: 'sentry',
    vendor: 'sentry',
    category: 'analytics',
    purpose: 'Error monitoring',
    expires: '90d',
    regions: ['Global'],
  },
  {
    id: 'hotjar',
    vendor: 'hotjar',
    category: 'analytics',
    purpose: 'Session recording',
    expires: '6mo',
    regions: ['EU', 'US'],
  },
  {
    id: 'fb-pixel',
    vendor: 'meta-pixel',
    category: 'marketing',
    purpose: 'Audience pixel + retargeting',
    expires: '180d',
    regions: ['US', 'Global'],
  },
  {
    id: 'g-ads',
    vendor: 'google-ads',
    category: 'marketing',
    purpose: 'Conversion tracking',
    expires: '90d',
    regions: ['EU', 'US', 'KR', 'Global'],
  },
  {
    id: 'tiktok',
    vendor: 'tiktok-pixel',
    category: 'marketing',
    purpose: 'Audience pixel',
    expires: '180d',
    regions: ['US', 'KR'],
  },
  {
    id: 'linkedin',
    vendor: 'linkedin-insight',
    category: 'marketing',
    purpose: 'B2B retargeting',
    expires: '180d',
    regions: ['EU', 'US'],
  },
];

export interface BannerConfig {
  readonly style: BannerStyle;
  readonly region: Region;
  readonly headline: string;
  readonly body: string;
  readonly acceptAll: boolean;
  readonly rejectAll: boolean;
  readonly customize: boolean;
  readonly geoTarget: boolean;
  readonly perCategoryDescriptions: Readonly<Record<Category, string>>;
  readonly enabledTrackers: ReadonlyArray<string>;
}

export const DEFAULT_DESCRIPTIONS: Record<Category, string> = {
  'strictly-necessary':
    'These cookies are required for the site to function and cannot be disabled.',
  functional:
    'Improve your experience by remembering preferences such as language and theme.',
  analytics:
    'Help us measure and improve the product through anonymous usage analytics.',
  marketing:
    'Allow us to deliver more relevant ads and measure campaign performance.',
};

export function defaultConfig(): BannerConfig {
  return {
    style: 'bottom-sheet',
    region: 'EU',
    headline: 'We use cookies',
    body: 'We use cookies to operate our site, analyze usage, and personalize content. You can choose which categories to allow.',
    acceptAll: true,
    rejectAll: true,
    customize: true,
    geoTarget: true,
    perCategoryDescriptions: { ...DEFAULT_DESCRIPTIONS },
    enabledTrackers: TRACKERS.filter(
      (t) => t.category !== 'marketing',
    ).map((t) => t.id),
  };
}

export function configToJson(c: BannerConfig): string {
  const byCat: Record<string, ReadonlyArray<string>> = {};
  for (const cat of CATEGORIES) {
    byCat[cat] = TRACKERS.filter(
      (t) => t.category === cat && c.enabledTrackers.includes(t.id),
    ).map((t) => t.vendor);
  }
  const obj = {
    cmp: 'next-static-studio',
    region: c.region,
    style: c.style,
    text: {
      headline: c.headline,
      body: c.body,
      descriptions: c.perCategoryDescriptions,
    },
    actions: {
      acceptAll: c.acceptAll,
      rejectAll: c.rejectAll,
      customize: c.customize,
    },
    geoTarget: c.geoTarget,
    categories: byCat,
  };
  return JSON.stringify(obj, null, 2);
}

export const TCF_SNIPPET = `// IAB TCF v2 stub
__tcfapi('addEventListener', 2, (data, success) => {
  if (!success) return;
  if (data.eventStatus === 'tcloaded') {
    window.__cmp.publish(data);
  }
});`;

export const IAB_SNIPPET = `// IAB Standard
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ event: 'cmp_init' });`;

export const GDPRK_SNIPPET = `// GDPR-K (Korea PIPA compliant)
gdprK.init({
  region: 'KR',
  optIn: true,
  retentionMonths: 12,
});`;
