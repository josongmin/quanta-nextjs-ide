export type DeployKind = 'production' | 'staging' | 'preview' | 'canary';
export type DeployStatus = 'live' | 'building' | 'failed' | 'stale';

export interface DeployEnv {
  readonly id: string;
  readonly name: string;
  readonly kind: DeployKind;
  readonly branch: string;
  readonly sha: string;
  readonly url: string;
  readonly status: DeployStatus;
  /** uptime over last 24h (24 hourly samples 0..1) */
  readonly uptime: ReadonlyArray<number>;
  /** traffic % currently routed to this env */
  readonly trafficPct: number;
  readonly envVarsCount: number;
  readonly deployLog: string;
}

function uptime(seed: number, dipAt?: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 24; i++) {
    const wob = Math.sin(i * 1.31 + seed) * 0.01 + 0.99;
    let v = Math.max(0.92, Math.min(1, wob));
    if (dipAt !== undefined && Math.abs(i - dipAt) < 2) {
      v = 0.7 + (Math.abs(i - dipAt) * 0.1);
    }
    out.push(v);
  }
  return out;
}

const LOG_PROD = `[14:02:11] ✓ Compiled successfully
[14:02:14] ✓ Generating static pages (132/132)
[14:02:16] ✓ Finalizing edge functions
[14:02:18] ✓ Deployment ready · 8.4s
[14:02:18] ▲ https://app.example.com promoted`;

const LOG_BUILDING = `[14:11:02] ◌ Cloning repository
[14:11:04] ◌ Restoring cache
[14:11:06] ◌ Running build
[14:11:09] ◌ Compiling 312 modules
[14:11:11] ◌ Compiling 624/812 modules ...`;

const LOG_FAILED = `[13:48:21] ✓ Compiled successfully
[13:48:23] ✗ Type error in src/app/page.tsx:12
[13:48:23]   Type 'string' is not assignable to 'number'.
[13:48:24] ✗ Build failed · exit 1`;

const LOG_STALE = `[09:14:01] ✓ Compiled successfully
[09:14:04] ✓ Deployment ready · 6.2s
[09:14:04] (idle since)`;

export const DEPLOYS: ReadonlyArray<DeployEnv> = [
  {
    id: 'prod',
    name: 'production',
    kind: 'production',
    branch: 'main',
    sha: '8a4f1c2',
    url: 'https://app.example.com',
    status: 'live',
    uptime: uptime(1),
    trafficPct: 90,
    envVarsCount: 22,
    deployLog: LOG_PROD,
  },
  {
    id: 'staging',
    name: 'staging',
    kind: 'staging',
    branch: 'develop',
    sha: 'b2e93d1',
    url: 'https://staging.example.com',
    status: 'live',
    uptime: uptime(2),
    trafficPct: 0,
    envVarsCount: 21,
    deployLog: LOG_PROD,
  },
  {
    id: 'canary-5',
    name: 'canary-5',
    kind: 'canary',
    branch: 'release/13.4',
    sha: '5c79e08',
    url: 'https://canary-5.example.com',
    status: 'live',
    uptime: uptime(3),
    trafficPct: 5,
    envVarsCount: 22,
    deployLog: LOG_PROD,
  },
  {
    id: 'canary-50',
    name: 'canary-50',
    kind: 'canary',
    branch: 'release/13.4',
    sha: '5c79e08',
    url: 'https://canary-50.example.com',
    status: 'live',
    uptime: uptime(4),
    trafficPct: 5,
    envVarsCount: 22,
    deployLog: LOG_PROD,
  },
  {
    id: 'pr-123',
    name: 'preview-pr-123',
    kind: 'preview',
    branch: 'feat/checkout-v2',
    sha: 'aa11ee2',
    url: 'https://pr-123.example.com',
    status: 'live',
    uptime: uptime(5),
    trafficPct: 0,
    envVarsCount: 19,
    deployLog: LOG_PROD,
  },
  {
    id: 'pr-456',
    name: 'preview-pr-456',
    kind: 'preview',
    branch: 'fix/header-flash',
    sha: 'bb22ff3',
    url: 'https://pr-456.example.com',
    status: 'building',
    uptime: uptime(6, 14),
    trafficPct: 0,
    envVarsCount: 18,
    deployLog: LOG_BUILDING,
  },
  {
    id: 'pr-501',
    name: 'preview-pr-501',
    kind: 'preview',
    branch: 'feat/dark-mode',
    sha: 'cc33aa4',
    url: 'https://pr-501.example.com',
    status: 'failed',
    uptime: uptime(7, 18),
    trafficPct: 0,
    envVarsCount: 18,
    deployLog: LOG_FAILED,
  },
  {
    id: 'pr-512',
    name: 'preview-pr-512',
    kind: 'preview',
    branch: 'chore/upgrade-next',
    sha: 'dd44bb5',
    url: 'https://pr-512.example.com',
    status: 'live',
    uptime: uptime(8),
    trafficPct: 0,
    envVarsCount: 19,
    deployLog: LOG_PROD,
  },
  {
    id: 'pr-540',
    name: 'preview-pr-540',
    kind: 'preview',
    branch: 'feat/i18n-zh',
    sha: 'ee55cc6',
    url: 'https://pr-540.example.com',
    status: 'stale',
    uptime: uptime(9),
    trafficPct: 0,
    envVarsCount: 19,
    deployLog: LOG_STALE,
  },
  {
    id: 'staging-edge',
    name: 'staging-edge',
    kind: 'staging',
    branch: 'develop',
    sha: 'b2e93d1',
    url: 'https://staging-edge.example.com',
    status: 'live',
    uptime: uptime(10),
    trafficPct: 0,
    envVarsCount: 21,
    deployLog: LOG_PROD,
  },
  {
    id: 'canary-eu',
    name: 'canary-eu',
    kind: 'canary',
    branch: 'release/13.4',
    sha: '5c79e08',
    url: 'https://canary-eu.example.com',
    status: 'live',
    uptime: uptime(11),
    trafficPct: 0,
    envVarsCount: 22,
    deployLog: LOG_PROD,
  },
  {
    id: 'pr-577',
    name: 'preview-pr-577',
    kind: 'preview',
    branch: 'fix/csp-report',
    sha: 'ff66dd7',
    url: 'https://pr-577.example.com',
    status: 'live',
    uptime: uptime(12),
    trafficPct: 0,
    envVarsCount: 19,
    deployLog: LOG_PROD,
  },
];

export const KIND_TONE: Record<DeployKind, 'accent' | 'info' | 'muted' | 'warn'> = {
  production: 'accent',
  staging: 'info',
  preview: 'muted',
  canary: 'warn',
};

export const STATUS_TONE: Record<DeployStatus, 'info' | 'warn' | 'err' | 'muted'> = {
  live: 'info',
  building: 'warn',
  failed: 'err',
  stale: 'muted',
};

export function deployById(id: string): DeployEnv {
  return DEPLOYS.find((d) => d.id === id) ?? DEPLOYS[0]!;
}
