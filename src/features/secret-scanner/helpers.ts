export type SecretKind =
  | 'aws'
  | 'stripe'
  | 'jwt'
  | 'generic'
  | 'github'
  | 'db_url'
  | 'private_key';

export type RiskLevel = 'low' | 'med' | 'high' | 'crit';

export interface SecretFinding {
  id: string;
  file: string;
  line: number;
  kind: SecretKind;
  entropy: number; // 0..1
  evidenceMasked: string; // e.g. "••••••GHJ7"
  commit: string; // sha-ish
  age: number; // days
  riskLevel: RiskLevel;
  snippet: string;
}

export interface RotationPlaybook {
  kind: SecretKind;
  steps: ReadonlyArray<string>;
  command: string;
}

const mask = (last4: string): string => `••••••${last4}`;

export const KIND_LABEL: Record<SecretKind, string> = {
  aws: 'AWS access key',
  stripe: 'Stripe secret',
  jwt: 'JWT bearer',
  generic: 'Generic high-entropy',
  github: 'GitHub token',
  db_url: 'Database URL',
  private_key: 'Private key',
};

export const KIND_TONE: Record<
  SecretKind,
  'warn' | 'err' | 'info' | 'accent' | 'static' | 'hint' | 'muted'
> = {
  aws: 'warn',
  stripe: 'accent',
  jwt: 'info',
  generic: 'muted',
  github: 'hint',
  db_url: 'static',
  private_key: 'err',
};

export const RISK_TONE: Record<RiskLevel, 'muted' | 'info' | 'warn' | 'err'> = {
  low: 'muted',
  med: 'info',
  high: 'warn',
  crit: 'err',
};

export const MOCK_FINDINGS: ReadonlyArray<SecretFinding> = [
  {
    id: 'sf_01',
    file: 'app/api/upload/route.ts',
    line: 14,
    kind: 'aws',
    entropy: 0.92,
    evidenceMasked: mask('GHJ7'),
    commit: 'a1f3c91',
    age: 4,
    riskLevel: 'crit',
    snippet:
      "const AWS_SECRET = 'AKIA••••••••••••GHJ7';\nconst client = new S3Client({ accessKey: AWS_SECRET });",
  },
  {
    id: 'sf_02',
    file: 'lib/billing/stripe.ts',
    line: 8,
    kind: 'stripe',
    entropy: 0.88,
    evidenceMasked: mask('xQ12'),
    commit: '7c12bb0',
    age: 11,
    riskLevel: 'crit',
    snippet:
      "export const stripe = new Stripe('sk_live_•••••••••••••••••••••xQ12');",
  },
  {
    id: 'sf_03',
    file: 'middleware.ts',
    line: 31,
    kind: 'jwt',
    entropy: 0.71,
    evidenceMasked: mask('aP9k'),
    commit: 'b09f213',
    age: 2,
    riskLevel: 'high',
    snippet:
      "const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.•••••••.aP9k';",
  },
  {
    id: 'sf_04',
    file: '.env.local.example',
    line: 3,
    kind: 'db_url',
    entropy: 0.65,
    evidenceMasked: mask('m4Wq'),
    commit: '5dee842',
    age: 41,
    riskLevel: 'high',
    snippet:
      "DATABASE_URL=postgres://app:•••••••@db.prod.internal:5432/m4Wq",
  },
  {
    id: 'sf_05',
    file: 'scripts/deploy.ts',
    line: 22,
    kind: 'github',
    entropy: 0.83,
    evidenceMasked: mask('PA7t'),
    commit: '0fa6c33',
    age: 6,
    riskLevel: 'high',
    snippet: "const GH_PAT = 'ghp_••••••••••••••••••••••••PA7t';",
  },
  {
    id: 'sf_06',
    file: 'app/api/webhook/route.ts',
    line: 5,
    kind: 'generic',
    entropy: 0.78,
    evidenceMasked: mask('q0Lz'),
    commit: '14ab9e1',
    age: 19,
    riskLevel: 'med',
    snippet: "const SHARED_SECRET = '•••••••••••••••q0Lz';",
  },
  {
    id: 'sf_07',
    file: 'config/keys/server.pem',
    line: 1,
    kind: 'private_key',
    entropy: 0.97,
    evidenceMasked: mask('END '),
    commit: 'e5cba27',
    age: 87,
    riskLevel: 'crit',
    snippet:
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIB••••••••••••••••••••••••••••••••\n-----END RSA PRIVATE KEY-----',
  },
  {
    id: 'sf_08',
    file: 'app/api/login/route.ts',
    line: 17,
    kind: 'jwt',
    entropy: 0.69,
    evidenceMasked: mask('Vr2x'),
    commit: '3bc1772',
    age: 3,
    riskLevel: 'med',
    snippet: "const SIGN_KEY = '••••••••••••••••••Vr2x';",
  },
  {
    id: 'sf_09',
    file: 'tests/fixtures/users.ts',
    line: 44,
    kind: 'aws',
    entropy: 0.55,
    evidenceMasked: mask('test'),
    commit: '0aac120',
    age: 130,
    riskLevel: 'low',
    snippet: "const FIXTURE_AWS = 'AKIAFAKETESTtest';",
  },
  {
    id: 'sf_10',
    file: 'lib/payments/checkout.ts',
    line: 9,
    kind: 'stripe',
    entropy: 0.86,
    evidenceMasked: mask('tEs8'),
    commit: 'f33eaa1',
    age: 25,
    riskLevel: 'high',
    snippet: "const STRIPE_TEST = 'sk_test_••••••••••••••••••tEs8';",
  },
  {
    id: 'sf_11',
    file: 'app/(admin)/users/page.tsx',
    line: 12,
    kind: 'db_url',
    entropy: 0.6,
    evidenceMasked: mask('Bn0c'),
    commit: '90fbb45',
    age: 9,
    riskLevel: 'med',
    snippet:
      "const DSN = 'mysql://root:••••••@10.0.0.5:3306/Bn0c';",
  },
  {
    id: 'sf_12',
    file: 'lib/integrations/github.ts',
    line: 28,
    kind: 'github',
    entropy: 0.81,
    evidenceMasked: mask('OAtH'),
    commit: '1e2d44a',
    age: 60,
    riskLevel: 'high',
    snippet: "const GH_OAUTH = 'gho_••••••••••••••••••••••••OAtH';",
  },
  {
    id: 'sf_13',
    file: 'app/layout.tsx',
    line: 4,
    kind: 'generic',
    entropy: 0.45,
    evidenceMasked: mask('demo'),
    commit: 'cf01923',
    age: 200,
    riskLevel: 'low',
    snippet: "const DEMO_KEY = 'public-demo';",
  },
  {
    id: 'sf_14',
    file: 'lib/security/sign.ts',
    line: 11,
    kind: 'private_key',
    entropy: 0.95,
    evidenceMasked: mask('Pem '),
    commit: 'aa12f80',
    age: 50,
    riskLevel: 'crit',
    snippet:
      '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIA•••••••••••••••\n-----END EC PRIVATE KEY-----',
  },
  {
    id: 'sf_15',
    file: 'app/api/notify/route.ts',
    line: 6,
    kind: 'aws',
    entropy: 0.79,
    evidenceMasked: mask('SNs1'),
    commit: '88dabf6',
    age: 14,
    riskLevel: 'high',
    snippet: "const AWS_SNS = 'AKIA••••••••••••SNs1';",
  },
  {
    id: 'sf_16',
    file: 'lib/cache/redis.ts',
    line: 9,
    kind: 'db_url',
    entropy: 0.62,
    evidenceMasked: mask('Cach'),
    commit: '3d5eb09',
    age: 33,
    riskLevel: 'med',
    snippet:
      "const REDIS_URL = 'redis://default:••••••@cache.prod:6379/Cach';",
  },
  {
    id: 'sf_17',
    file: 'scripts/release.ts',
    line: 41,
    kind: 'github',
    entropy: 0.84,
    evidenceMasked: mask('rEle'),
    commit: 'b1b0a44',
    age: 7,
    riskLevel: 'high',
    snippet: "const GH_RELEASE = 'ghr_••••••••••••rEle';",
  },
  {
    id: 'sf_18',
    file: 'tests/e2e/auth.spec.ts',
    line: 13,
    kind: 'jwt',
    entropy: 0.5,
    evidenceMasked: mask('mock'),
    commit: '2008cce',
    age: 90,
    riskLevel: 'low',
    snippet: "const MOCK_JWT = 'eyJtZXN0...mock';",
  },
];

export const PLAYBOOKS: ReadonlyArray<RotationPlaybook> = [
  {
    kind: 'aws',
    steps: ['Create new IAM key', 'Update secret manager', 'Disable old key'],
    command: 'aws iam create-access-key --user-name app-svc',
  },
  {
    kind: 'stripe',
    steps: ['Roll restricted key', 'Update env', 'Revoke old'],
    command: 'stripe keys roll --type restricted',
  },
  {
    kind: 'jwt',
    steps: ['Rotate signing secret', 'Bump kid', 'Invalidate sessions'],
    command: 'pnpm run rotate:jwt',
  },
  {
    kind: 'github',
    steps: ['Generate fine-grained PAT', 'Update Actions secret', 'Revoke prior'],
    command: 'gh auth refresh -s repo,workflow',
  },
  {
    kind: 'db_url',
    steps: ['Issue new DB user', 'Migrate connections', 'Drop old user'],
    command: 'psql -c "ALTER USER app WITH PASSWORD :new"',
  },
  {
    kind: 'private_key',
    steps: ['Generate new keypair', 'Distribute pubkey', 'Retire old'],
    command: 'openssl genrsa -out new.pem 4096',
  },
  {
    kind: 'generic',
    steps: ['Identify owner', 'Replace token', 'Audit usage'],
    command: 'pnpm run secrets:rotate',
  },
];

export function scrubSnippet(s: string): string {
  // Keep snippet largely as-is (already masked) but blur the suspicious tokens
  return s.replace(/(AKIA|sk_live_|sk_test_|ghp_|gho_|ghr_|eyJ)[^\s'"]+/g, '$1••••••••');
}

export function entropyTone(e: number): 'err' | 'warn' | 'info' {
  if (e >= 0.85) return 'err';
  if (e >= 0.7) return 'warn';
  return 'info';
}
