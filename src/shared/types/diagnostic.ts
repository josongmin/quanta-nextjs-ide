import { z } from 'zod';
import { codeLocationZ } from './code-location';
import { confidenceZ, severityZ } from './severity';

export const evidenceItemZ = z.object({
  id: z.string(),
  label: z.string(),
  location: codeLocationZ.optional(),
  kind: z.enum(['direct', 'indirect', 'heuristic']),
});
export type EvidenceItem = z.infer<typeof evidenceItemZ>;

export const ruleIdZ = z.enum([
  // Rendering
  'why-dynamic',
  'static-feasibility',
  'cost-regression',
  'ppr-shell',
  // Migration
  'async-request-api',
  'use-cache-analyzer',
  'cache-handler-migrate',
  'server-external-pkg-rename',
  // Boundary
  'use-client-blast',
  'server-only-leak',
  'browser-api-in-server',
  'non-serializable-prop',
  'can-be-server',
  // Cache
  'fetch-policy',
  'revalidate-pair',
  'tag-taxonomy',
  'data-classification',
  'react-cache-advisor',
  // Action
  'action-safety',
  'action-closure',
  'special-throw-guard',
  'form-action-link',
  'csrf-allowed-origins',
  // Conventions
  'boundary-coverage',
  'parallel-default-missing',
  'intercepting-validity',
  'notfound-correctness',
  // Metadata
  'metadata-base',
  'static-meta-dynamic-params',
  'metadata-coverage',
  'meta-file-convention',
  // Image / Font / Script
  'image-misuse',
  'image-blur',
  'font-weight-waste',
  'script-strategy',
  // Security
  'secret-flow',
  'pii-boundary',
  'auth-detector',
  'open-redirect',
  // PPR / Streaming
  'suspense-search-params',
  'sequential-fetch',
  'post-stream-special',
  // Hydration
  'hydration-mismatch',
  'theme-fouc',
  // Diff / Review
  'behavior-change',
  'pr-comment',
  'pre-commit-gate',
  'ai-patch-gate',
  // Handler-specific
  'webhook-route-guard',
  'rate-limit-missing',
  'cors-policy',
  'response-cache-header',
  // TypeScript
  'ts-any-usage',
  'ts-as-assertion',
  'ts-ignore-comment',
  'ts-unused-export',
  'ts-missing-return-type',
  'ts-type-complexity',
  'ts-strict-gap',
  'ts-import-type-mix',
  'ts-conditional-explosion',
  // React
  'react-missing-key',
  'react-hook-deps',
  'react-conditional-hook',
  'react-effect-cleanup',
  'react-context-memo',
  'react-rerender-hotspot',
  'react-children-typing',
  'react-forward-ref',
  'react-suspense-placement',
  'react-error-boundary',
  'react-19-action-state',
  // CSS / Tailwind
  'css-tailwind-drift',
  'css-raw-color',
  'css-raw-spacing',
  'css-zindex-inflation',
  'css-important',
  'css-dark-mode-gap',
  'css-responsive-gap',
  'css-module-unused',
  'css-token-violation',
  // Accessibility
  'a11y-missing-alt',
  'a11y-form-label',
  'a11y-heading-order',
  'a11y-button-name',
  'a11y-color-contrast',
  'a11y-focus-order',
  'a11y-aria-misuse',
  'a11y-tabindex-abuse',
  // Performance
  'perf-heavy-package',
  'perf-bundle-bloat',
  'perf-image-optimization',
  'perf-long-task',
  'perf-lcp-candidate',
  'perf-cls-source',
  'perf-network-waterfall',
  'perf-budget-violation',
  // Database / ORM
  'db-n-plus-one',
  'db-missing-index',
  'db-no-transaction',
  'db-large-result',
  'db-unbounded-query',
  'db-select-star',
  'db-raw-sql-injection',
  // API contracts
  'api-contract-drift',
  'api-missing-version',
  'api-missing-types',
  'api-trpc-misuse',
  // Auth flow
  'auth-flow-cookie-leak',
  'auth-flow-missing-csrf',
  'auth-flow-session-refresh',
  'auth-flow-jwt-rotate',
  // Form pipeline
  'form-schema-drift',
  'form-progressive-enhancement',
  'form-error-mapping',
  'form-server-state',
  // i18n
  'i18n-missing-key',
  'i18n-orphan-key',
  'i18n-locale-coverage',
  'i18n-rtl-support',
  // Lighthouse-class web perf
  'lh-lcp-candidate',
  'lh-cls-source',
  'lh-tbt-source',
  'lh-render-blocking',
  'lh-unused-css',
  'lh-unused-js',
  // Critical CSS / render path
  'css-critical-missing',
  'css-render-blocking-font',
  'css-layout-thrash',
  'css-animation-cost',
  // Image / asset
  'img-format-suboptimal',
  'img-lazy-missing',
  'img-srcset-missing',
  'asset-preload-advisor',
]);
export type RuleId = z.infer<typeof ruleIdZ>;

export const quickFixZ = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  applyToAll: z.boolean().optional(),
  preview: z
    .object({
      before: z.string(),
      after: z.string(),
      behaviorDiff: z.array(
        z.object({
          field: z.string(),
          before: z.string(),
          after: z.string(),
        }),
      ),
    })
    .optional(),
});
export type QuickFix = z.infer<typeof quickFixZ>;

export const diagnosticZ = z.object({
  id: z.string(),
  ruleId: ruleIdZ,
  title: z.string(),
  message: z.string(),
  severity: severityZ,
  confidence: confidenceZ,
  scope: z.string(),
  routeId: z.string().nullable().optional(),
  location: codeLocationZ,
  evidence: z.array(evidenceItemZ).default([]),
  impact: z.array(z.string()).default([]),
  affectedRouteIds: z.array(z.string()).default([]),
  fixes: z.array(quickFixZ).default([]),
  introducedInCurrentDiff: z.boolean().default(false),
  category: z.enum([
    'rendering',
    'cache',
    'boundary',
    'action',
    'metadata',
    'security',
    'ppr',
    'hydration',
    'migration',
    'convention',
    'review',
    'typescript',
    'react',
    'css',
    'a11y',
    'perf',
    'dx',
    'db',
    'api-contract',
    'auth-flow',
    'form',
    'i18n',
    'lighthouse',
    'asset',
  ]),
});
export type Diagnostic = z.infer<typeof diagnosticZ>;
