/**
 * JSON-LD structured-data validation against a small set of schema.org types
 * that matter for AEO (AI/answer-engine) exposure.
 *
 * The lookup is intentionally minimal — we don't try to ship the full
 * schema.org vocabulary in-browser.  Instead we cover the high-leverage
 * types and their *required* fields per Google's rich result rules.
 */

export type SchemaOrgType =
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'BreadcrumbList'
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'Product'
  | 'Offer'
  | 'AggregateRating'
  | 'Review'
  | 'FAQPage'
  | 'HowTo'
  | 'Recipe'
  | 'Event'
  | 'LocalBusiness'
  | 'Person'
  | 'VideoObject';

export interface SchemaShape {
  readonly type: SchemaOrgType;
  /** Fields required by Google rich results / AEO best practice. */
  readonly required: ReadonlyArray<string>;
  /** Fields that significantly boost AEO when present. */
  readonly recommended: ReadonlyArray<string>;
  readonly aeoCritical: boolean;
}

export const SCHEMAS: Record<SchemaOrgType, SchemaShape> = {
  Organization: {
    type: 'Organization',
    required: ['name', 'url'],
    recommended: ['logo', 'sameAs', 'contactPoint'],
    aeoCritical: true,
  },
  WebSite: {
    type: 'WebSite',
    required: ['name', 'url'],
    recommended: ['potentialAction'],
    aeoCritical: false,
  },
  WebPage: {
    type: 'WebPage',
    required: ['name'],
    recommended: ['breadcrumb', 'primaryImageOfPage'],
    aeoCritical: false,
  },
  BreadcrumbList: {
    type: 'BreadcrumbList',
    required: ['itemListElement'],
    recommended: [],
    aeoCritical: false,
  },
  Article: {
    type: 'Article',
    required: ['headline', 'author', 'datePublished'],
    recommended: ['image', 'publisher', 'dateModified'],
    aeoCritical: true,
  },
  NewsArticle: {
    type: 'NewsArticle',
    required: ['headline', 'author', 'datePublished'],
    recommended: ['image', 'publisher'],
    aeoCritical: true,
  },
  BlogPosting: {
    type: 'BlogPosting',
    required: ['headline', 'author', 'datePublished'],
    recommended: ['image', 'publisher'],
    aeoCritical: true,
  },
  Product: {
    type: 'Product',
    required: ['name', 'image'],
    recommended: ['offers', 'aggregateRating', 'review', 'brand', 'sku'],
    aeoCritical: true,
  },
  Offer: {
    type: 'Offer',
    required: ['price', 'priceCurrency'],
    recommended: ['availability', 'url'],
    aeoCritical: false,
  },
  AggregateRating: {
    type: 'AggregateRating',
    required: ['ratingValue', 'reviewCount'],
    recommended: ['bestRating', 'worstRating'],
    aeoCritical: false,
  },
  Review: {
    type: 'Review',
    required: ['reviewRating', 'author'],
    recommended: ['datePublished'],
    aeoCritical: false,
  },
  FAQPage: {
    type: 'FAQPage',
    required: ['mainEntity'],
    recommended: [],
    aeoCritical: true,
  },
  HowTo: {
    type: 'HowTo',
    required: ['name', 'step'],
    recommended: ['totalTime', 'tool', 'supply'],
    aeoCritical: true,
  },
  Recipe: {
    type: 'Recipe',
    required: ['name', 'recipeIngredient', 'recipeInstructions'],
    recommended: ['image', 'cookTime', 'nutrition'],
    aeoCritical: true,
  },
  Event: {
    type: 'Event',
    required: ['name', 'startDate', 'location'],
    recommended: ['endDate', 'image', 'offers'],
    aeoCritical: true,
  },
  LocalBusiness: {
    type: 'LocalBusiness',
    required: ['name', 'address'],
    recommended: ['telephone', 'openingHours', 'image'],
    aeoCritical: true,
  },
  Person: {
    type: 'Person',
    required: ['name'],
    recommended: ['url', 'image', 'sameAs'],
    aeoCritical: false,
  },
  VideoObject: {
    type: 'VideoObject',
    required: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
    recommended: ['contentUrl', 'duration'],
    aeoCritical: true,
  },
};

export interface JsonLdValidation {
  readonly type: string;
  readonly known: boolean;
  readonly aeoCritical: boolean;
  readonly missingRequired: ReadonlyArray<string>;
  readonly missingRecommended: ReadonlyArray<string>;
  readonly score: number;
}

/**
 * Validate a single JSON-LD object against {@link SCHEMAS}.
 *
 * Pure / deterministic.  Unknown types return `known:false` with a
 * neutral score so the UI can surface "we don't validate this type" and
 * still show the pill.
 */
export function validateJsonLd(
  raw: Record<string, unknown>,
): JsonLdValidation {
  const t =
    typeof raw['@type'] === 'string'
      ? (raw['@type'] as string)
      : Array.isArray(raw['@type']) && typeof raw['@type'][0] === 'string'
        ? (raw['@type'][0] as string)
        : 'Unknown';
  const shape = SCHEMAS[t as SchemaOrgType];
  if (!shape) {
    return {
      type: t,
      known: false,
      aeoCritical: false,
      missingRequired: [],
      missingRecommended: [],
      score: 50,
    };
  }
  const has = (k: string): boolean => raw[k] != null && raw[k] !== '';
  const missingRequired = shape.required.filter((k) => !has(k));
  const missingRecommended = shape.recommended.filter((k) => !has(k));
  const reqScore =
    shape.required.length === 0
      ? 100
      : ((shape.required.length - missingRequired.length) /
          shape.required.length) *
        70;
  const recScore =
    shape.recommended.length === 0
      ? 30
      : ((shape.recommended.length - missingRecommended.length) /
          shape.recommended.length) *
        30;
  return {
    type: t,
    known: true,
    aeoCritical: shape.aeoCritical,
    missingRequired,
    missingRecommended,
    score: Math.round(reqScore + recScore),
  };
}

export function aeoOpportunities(
  presentTypes: ReadonlyArray<string>,
): ReadonlyArray<SchemaOrgType> {
  const present = new Set(presentTypes);
  return (Object.values(SCHEMAS) as SchemaShape[])
    .filter((s) => s.aeoCritical && !present.has(s.type))
    .map((s) => s.type);
}
