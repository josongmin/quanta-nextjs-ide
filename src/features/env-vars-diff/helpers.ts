export type EnvName = 'local' | 'preview' | 'staging' | 'production';
export type VarKind = 'public' | 'private' | 'build';

export const ENVS: ReadonlyArray<EnvName> = ['local', 'preview', 'staging', 'production'];

export interface EnvVarUsage {
  readonly file: string;
  readonly line: number;
}

export interface EnvVar {
  readonly key: string;
  readonly kind: VarKind;
  readonly required: boolean;
  /** undefined = not set in that env */
  readonly values: Readonly<Partial<Record<EnvName, string>>>;
  readonly usedIn: ReadonlyArray<EnvVarUsage>;
  readonly nextRotation?: string;
}

const u = (file: string, line: number): EnvVarUsage => ({ file, line });

export const ENV_VARS: ReadonlyArray<EnvVar> = [
  {
    key: 'NEXT_PUBLIC_APP_URL',
    kind: 'public',
    required: true,
    values: {
      local: 'http://localhost:3000',
      preview: 'https://preview.example.com',
      staging: 'https://staging.example.com',
      production: 'https://app.example.com',
    },
    usedIn: [u('src/app/layout.tsx', 14), u('src/lib/url.ts', 8)],
  },
  {
    key: 'NEXT_PUBLIC_ANALYTICS_ID',
    kind: 'public',
    required: false,
    values: {
      preview: 'G-PREVIEW',
      staging: 'G-STAGING',
      production: 'G-PROD',
    },
    usedIn: [u('src/app/layout.tsx', 22)],
  },
  {
    key: 'DATABASE_URL',
    kind: 'private',
    required: true,
    values: {
      local: 'postgres://localhost/dev',
      preview: 'postgres://preview-host/db',
      staging: 'postgres://staging-host/db',
      production: 'postgres://prod-host/db',
    },
    usedIn: [u('src/db/index.ts', 5), u('drizzle.config.ts', 9)],
    nextRotation: '2026-08-01',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    kind: 'private',
    required: true,
    values: {
      local: 'sk_test_aaa',
      preview: 'sk_test_bbb',
      staging: 'sk_test_ccc',
      production: 'sk_live_xxx',
    },
    usedIn: [u('src/app/api/checkout/route.ts', 8), u('src/lib/stripe.ts', 3)],
    nextRotation: '2026-06-15',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    kind: 'private',
    required: true,
    values: {
      preview: 'whsec_p',
      staging: 'whsec_s',
      production: 'whsec_xxxxxx',
    },
    usedIn: [u('src/app/api/webhooks/stripe/route.ts', 11)],
    nextRotation: '2026-06-15',
  },
  {
    key: 'AUTH_SECRET',
    kind: 'private',
    required: true,
    values: {
      local: 'devsecret',
      preview: 'previewsecret',
      staging: 'stagingsecret',
      production: 'prodsecret',
    },
    usedIn: [u('src/lib/auth.ts', 4)],
    nextRotation: '2026-07-01',
  },
  {
    key: 'OPENAI_API_KEY',
    kind: 'private',
    required: true,
    values: {
      local: 'sk-test',
      staging: 'sk-stag',
      production: 'sk-prod',
    },
    usedIn: [u('src/server/ai.ts', 6)],
    nextRotation: '2026-05-30',
  },
  {
    key: 'SENDGRID_API_KEY',
    kind: 'private',
    required: false,
    values: {
      staging: 'SG.stag',
      production: 'SG.prod',
    },
    usedIn: [u('src/server/email.ts', 4)],
  },
  {
    key: 'SENTRY_DSN',
    kind: 'public',
    required: false,
    values: {
      preview: 'https://dsn.sentry/preview',
      staging: 'https://dsn.sentry/staging',
      production: 'https://dsn.sentry/prod',
    },
    usedIn: [u('sentry.client.config.ts', 5)],
  },
  {
    key: 'REDIS_URL',
    kind: 'private',
    required: true,
    values: {
      local: 'redis://localhost:6379',
      preview: 'redis://preview-redis',
      staging: 'redis://staging-redis',
      production: 'redis://prod-redis',
    },
    usedIn: [u('src/server/cache.ts', 7)],
  },
  {
    key: 'S3_BUCKET',
    kind: 'private',
    required: true,
    values: {
      local: 'dev-bucket',
      preview: 'preview-bucket',
      staging: 'staging-bucket',
      production: 'prod-bucket',
    },
    usedIn: [u('src/server/storage.ts', 9)],
  },
  {
    key: 'S3_ACCESS_TOKEN',
    kind: 'private',
    required: true,
    values: {
      local: 'tok_dev',
      staging: 'tok_stag',
      production: 'tok_prod',
    },
    usedIn: [u('src/server/storage.ts', 11)],
    nextRotation: '2026-05-20',
  },
  {
    key: 'NEXT_PUBLIC_FEATURE_FLAGS',
    kind: 'public',
    required: false,
    values: {
      local: 'all',
      preview: 'preview',
      staging: 'beta',
      production: 'stable',
    },
    usedIn: [u('src/lib/flags.ts', 3)],
  },
  {
    key: 'BUILD_VERSION',
    kind: 'build',
    required: false,
    values: {
      preview: '0.0.0-pr',
      staging: '13.4.0-rc.1',
      production: '13.4.0',
    },
    usedIn: [u('next.config.ts', 12)],
  },
  {
    key: 'BUILD_COMMIT_SHA',
    kind: 'build',
    required: false,
    values: {
      preview: 'aa11ee2',
      staging: 'b2e93d1',
      production: '8a4f1c2',
    },
    usedIn: [u('next.config.ts', 14)],
  },
  {
    key: 'NEXT_PUBLIC_RELEASE_CHANNEL',
    kind: 'public',
    required: false,
    values: {
      local: 'dev',
      preview: 'preview',
      staging: 'beta',
      production: 'stable',
    },
    usedIn: [u('src/app/layout.tsx', 8)],
  },
  {
    key: 'GITHUB_TOKEN',
    kind: 'private',
    required: false,
    values: {
      production: 'ghp_xxxxxx',
    },
    usedIn: [u('src/server/gh.ts', 4)],
    nextRotation: '2026-09-01',
  },
  {
    key: 'CRON_SECRET',
    kind: 'private',
    required: true,
    values: {
      preview: 'cs_p',
      staging: 'cs_s',
      production: 'cs_prod',
    },
    usedIn: [u('src/app/api/cron/route.ts', 6)],
    nextRotation: '2026-07-15',
  },
  {
    key: 'NEXT_TELEMETRY_DISABLED',
    kind: 'build',
    required: false,
    values: {
      local: '1',
      preview: '1',
      staging: '1',
      production: '1',
    },
    usedIn: [u('.env', 1)],
  },
  {
    key: 'NEXT_PUBLIC_SUPPORT_EMAIL',
    kind: 'public',
    required: false,
    values: {
      local: 'dev@example.com',
      preview: 'support@example.com',
      staging: 'support@example.com',
      production: 'support@example.com',
    },
    usedIn: [u('src/app/contact/page.tsx', 12)],
  },
  {
    key: 'POSTHOG_KEY',
    kind: 'private',
    required: false,
    values: {
      staging: 'phc_stag',
      production: 'phc_prod',
    },
    usedIn: [u('src/lib/posthog.ts', 3)],
    nextRotation: '2026-08-12',
  },
  {
    key: 'EDGE_CONFIG_TOKEN',
    kind: 'private',
    required: false,
    values: {
      preview: 'edge_p',
      staging: 'edge_s',
      production: 'edge_prod',
    },
    usedIn: [u('src/lib/edge-config.ts', 5)],
    nextRotation: '2026-06-30',
  },
];

export function isSecret(key: string): boolean {
  return /KEY|SECRET|TOKEN|DSN/i.test(key);
}

export function maskValue(v: string): string {
  if (v.length <= 4) return '••••';
  return `${v.slice(0, 3)}••••${v.slice(-2)}`;
}

export const KIND_TONE: Record<VarKind, 'accent' | 'muted' | 'info'> = {
  public: 'accent',
  private: 'muted',
  build: 'info',
};
