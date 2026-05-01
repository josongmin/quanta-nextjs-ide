export interface Hunk {
  header: string;
  before: string;
  after: string;
}

export interface FileHunks {
  path: string;
  hunks: ReadonlyArray<Hunk>;
}

export type RiskSeverity = 'err' | 'warn' | 'info';

export interface RiskFactor {
  label: string;
  severity: RiskSeverity;
  explanation: string;
}

export interface ProofObligation {
  id: string;
  text: string;
}

export interface Patch {
  id: string;
  summary: string;
  riskScore: number; // 0..100
  riskFactors: ReadonlyArray<RiskFactor>;
  changedFiles: ReadonlyArray<string>;
  files: ReadonlyArray<FileHunks>;
  reviewers: ReadonlyArray<string>;
  proofObligations: ReadonlyArray<ProofObligation>;
}

export const PATCHES: ReadonlyArray<Patch> = [
  {
    id: 'p_4421',
    summary: 'refactor: typed cart totals + currency formatter',
    riskScore: 28,
    riskFactors: [
      {
        label: 'Touches checkout',
        severity: 'warn',
        explanation: 'src/server/checkout.ts is on the critical path.',
      },
      {
        label: 'Tests modified',
        severity: 'info',
        explanation: 'cart.test.ts updated alongside source.',
      },
    ],
    changedFiles: [
      'src/lib/cart.ts',
      'src/utils/format.ts',
      'src/lib/__tests__/cart.test.ts',
    ],
    files: [
      {
        path: 'src/lib/cart.ts',
        hunks: [
          {
            header: '@@ -42,7 +42,9 @@',
            before:
              "export function total(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}",
            after:
              "export function total(items: ReadonlyArray<CartItem>): Money {\n  return items.reduce((s, i) => s + i.priceCents, 0 as Money);\n}",
          },
        ],
      },
      {
        path: 'src/utils/format.ts',
        hunks: [
          {
            header: '@@ -10,4 +10,8 @@',
            before:
              "export function fmtUSD(n) {\n  return '$' + n.toFixed(2);\n}",
            after:
              "export function fmtUSD(cents: Money): string {\n  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);\n}",
          },
        ],
      },
    ],
    reviewers: ['@alice', '@bob'],
    proofObligations: [
      { id: 'po1', text: 'Verify rounding matches existing tax formula' },
      { id: 'po2', text: 'Confirm no precision loss for $1M+ baskets' },
      { id: 'po3', text: 'Run full e2e checkout suite' },
    ],
  },
  {
    id: 'p_4422',
    summary: 'fix: XSS in admin/comments markdown render',
    riskScore: 78,
    riskFactors: [
      {
        label: 'Removes sanitization',
        severity: 'err',
        explanation: 'Replaces DOMPurify with custom escape — needs review.',
      },
      {
        label: 'Touches auth surface',
        severity: 'warn',
        explanation: 'Admin route only, but /admin is privileged.',
      },
      {
        label: 'No tests added',
        severity: 'warn',
        explanation: 'Should include payload regression tests.',
      },
    ],
    changedFiles: ['src/admin/Comment.tsx', 'src/lib/sanitize.ts'],
    files: [
      {
        path: 'src/admin/Comment.tsx',
        hunks: [
          {
            header: '@@ -18,5 +18,5 @@',
            before:
              "<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(md) }} />",
            after: "<div dangerouslySetInnerHTML={{ __html: escape(md) }} />",
          },
        ],
      },
    ],
    reviewers: ['@security-team'],
    proofObligations: [
      { id: 'po1', text: 'Confirm escape() handles <script> payloads' },
      { id: 'po2', text: 'Confirm escape() handles javascript: hrefs' },
      { id: 'po3', text: 'Add regression test for stored-XSS payload' },
      { id: 'po4', text: 'Re-run security scanner against /admin' },
    ],
  },
  {
    id: 'p_4423',
    summary: 'perf: switch /api/orders to streaming response',
    riskScore: 54,
    riskFactors: [
      {
        label: 'API contract change',
        severity: 'warn',
        explanation: 'Response is chunked instead of single JSON.',
      },
      {
        label: 'Edge runtime move',
        severity: 'info',
        explanation: 'Adds runtime: edge — verify cold-start budget.',
      },
    ],
    changedFiles: ['src/pages/api/orders.ts'],
    files: [
      {
        path: 'src/pages/api/orders.ts',
        hunks: [
          {
            header: '@@ -1,8 +1,12 @@',
            before:
              "export default async function handler(req, res) {\n  const orders = await db.orders.findMany();\n  res.json(orders);\n}",
            after:
              "export const runtime = 'edge';\n\nexport default async function handler(req: Request) {\n  const stream = new ReadableStream({ start: streamOrders });\n  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson' } });\n}",
          },
        ],
      },
    ],
    reviewers: ['@platform'],
    proofObligations: [
      { id: 'po1', text: 'Confirm clients tolerate chunked response' },
      { id: 'po2', text: 'Validate p95 latency at 1k orders' },
    ],
  },
  {
    id: 'p_4424',
    summary: 'chore: bump react-router to 6.27',
    riskScore: 14,
    riskFactors: [
      {
        label: 'Minor bump only',
        severity: 'info',
        explanation: '6.26 → 6.27 — patch-level changes per release notes.',
      },
    ],
    changedFiles: ['package.json', 'pnpm-lock.yaml'],
    files: [
      {
        path: 'package.json',
        hunks: [
          {
            header: '@@ -34,3 +34,3 @@',
            before: '    "react-router": "^6.26.0",',
            after: '    "react-router": "^6.27.0",',
          },
        ],
      },
    ],
    reviewers: ['@frontend'],
    proofObligations: [
      { id: 'po1', text: 'Run smoke navigation tests' },
    ],
  },
  {
    id: 'p_4425',
    summary: 'feat: add audit log for admin role changes',
    riskScore: 41,
    riskFactors: [
      {
        label: 'Writes to audit table',
        severity: 'info',
        explanation: 'New write path — schema migration included.',
      },
      {
        label: 'Touches RBAC',
        severity: 'warn',
        explanation: 'Adds hook in role-mutation pipeline.',
      },
    ],
    changedFiles: ['src/server/audit.ts', 'migrations/0042_audit.sql'],
    files: [
      {
        path: 'src/server/audit.ts',
        hunks: [
          {
            header: '@@ -0,0 +1,9 @@',
            before: '',
            after:
              "export async function recordRoleChange(userId: string, prev: Role, next: Role) {\n  await db.audit.insert({ userId, prev, next, ts: Date.now() });\n}",
          },
        ],
      },
      {
        path: 'migrations/0042_audit.sql',
        hunks: [
          {
            header: '@@ -0,0 +1,7 @@',
            before: '',
            after:
              "CREATE TABLE audit (\n  id BIGSERIAL PRIMARY KEY,\n  user_id TEXT NOT NULL,\n  prev TEXT NOT NULL,\n  next TEXT NOT NULL,\n  ts BIGINT NOT NULL\n);",
          },
        ],
      },
    ],
    reviewers: ['@security-team', '@dba'],
    proofObligations: [
      { id: 'po1', text: 'Confirm migration is reversible' },
      { id: 'po2', text: 'Add audit row test' },
      { id: 'po3', text: 'Verify PII handling for user_id field' },
    ],
  },
];

export function riskTone(score: number): 'info' | 'warn' | 'err' {
  if (score >= 60) return 'err';
  if (score >= 30) return 'warn';
  return 'info';
}

export function severityLabel(s: RiskSeverity): string {
  switch (s) {
    case 'err':
      return 'high';
    case 'warn':
      return 'med';
    case 'info':
      return 'low';
  }
}
