export type RemoteKind = 'ssh' | 'container' | 'codespace';

export type RemoteStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error';

export interface Remote {
  id: string;
  kind: RemoteKind;
  label: string;
  host: string;
  status: RemoteStatus;
  latencyMs: number;
  lastUsed: number;
  uptimeMin: number;
  envChips: ReadonlyArray<string>;
  recentCommands: ReadonlyArray<string>;
}

export const KINDS: ReadonlyArray<RemoteKind> = ['ssh', 'container', 'codespace'];

const NOW = 1_730_000_000_000;

export const REMOTES: ReadonlyArray<Remote> = [
  {
    id: 'r1',
    kind: 'ssh',
    label: 'prod-bastion',
    host: 'songmin@bastion.prod.acme.io',
    status: 'connected',
    latencyMs: 24,
    lastUsed: NOW - 4 * 60_000,
    uptimeMin: 184,
    envChips: ['Ubuntu 22.04', 'node 20.11', 'tmux 3.4', 'tier=prod'],
    recentCommands: [
      'sudo systemctl status nextjs-edge.service',
      'tail -f /var/log/audit/audit.log',
      'kubectl get pods -n web',
      'redis-cli -h cache.prod ping',
      'pm2 logs --lines 100',
      'top',
    ],
  },
  {
    id: 'r2',
    kind: 'ssh',
    label: 'staging-edge',
    host: 'songmin@edge.staging.acme.io',
    status: 'connected',
    latencyMs: 41,
    lastUsed: NOW - 18 * 60_000,
    uptimeMin: 31,
    envChips: ['Debian 12', 'node 22.4', 'pnpm 9', 'tier=staging'],
    recentCommands: [
      'pnpm --filter web build',
      'curl -I https://staging.acme.io/healthz',
      'docker ps',
      'tail -F /var/log/edge.log',
      'export NEXT_TELEMETRY_DISABLED=1',
      'time pnpm test',
    ],
  },
  {
    id: 'r3',
    kind: 'container',
    label: 'dev-container',
    host: 'devcontainer://workspace-quanta-7c2',
    status: 'connecting',
    latencyMs: 9,
    lastUsed: NOW - 90 * 60_000,
    uptimeMin: 0,
    envChips: ['Debian slim', 'node 20', 'docker-in-docker'],
    recentCommands: [
      'pnpm install --frozen-lockfile',
      'pnpm dev',
      'git pull --rebase',
      'pnpm typecheck',
      'tsc -b --pretty',
      'pnpm lint',
    ],
  },
  {
    id: 'r4',
    kind: 'container',
    label: 'e2e-runner',
    host: 'docker://playwright-1.45-noble',
    status: 'disconnected',
    latencyMs: 0,
    lastUsed: NOW - 6 * 3600_000,
    uptimeMin: 0,
    envChips: ['playwright 1.45', 'chromium', 'firefox', 'webkit'],
    recentCommands: [
      'pnpm playwright install --with-deps',
      'pnpm e2e --project=chromium',
      'pnpm e2e --project=firefox',
      'pnpm playwright show-report',
      'rm -rf test-results',
      'pnpm e2e --grep checkout',
    ],
  },
  {
    id: 'r5',
    kind: 'codespace',
    label: 'gh-codespace-A',
    host: 'codespace://acme-songmin-quanta-4ab',
    status: 'connected',
    latencyMs: 73,
    lastUsed: NOW - 1 * 60_000,
    uptimeMin: 412,
    envChips: ['Ubuntu 22.04', 'node 20.10', '4-core', '16GB', 'public'],
    recentCommands: [
      'gh pr list --author @me',
      'pnpm dev',
      'gh pr create --fill',
      'gh pr checks',
      'gh codespace ports',
      'curl -s localhost:3000/healthz',
    ],
  },
  {
    id: 'r6',
    kind: 'codespace',
    label: 'gh-codespace-B',
    host: 'codespace://acme-songmin-quanta-9ef',
    status: 'error',
    latencyMs: 0,
    lastUsed: NOW - 2 * 3600_000,
    uptimeMin: 0,
    envChips: ['Ubuntu 22.04', 'node 22.4', '8-core', '32GB', 'private'],
    recentCommands: [
      'pnpm i',
      'pnpm build',
      'fail: out of memory',
      'gh codespace logs',
      'gh codespace rebuild',
      'gh codespace stop',
    ],
  },
];

export function statusTone(
  s: RemoteStatus,
): 'accent' | 'info' | 'warn' | 'err' | 'muted' {
  switch (s) {
    case 'connected':
      return 'info';
    case 'connecting':
      return 'accent';
    case 'disconnected':
      return 'muted';
    case 'error':
      return 'err';
  }
}

export function kindGlyph(k: RemoteKind): string {
  switch (k) {
    case 'ssh':
      return '▣';
    case 'container':
      return '◇';
    case 'codespace':
      return '◎';
  }
}

export function relTime(ts: number): string {
  const diff = NOW - ts;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function fmtUptime(min: number): string {
  if (min === 0) return '—';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
