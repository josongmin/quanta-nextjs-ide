export interface SLO {
  readonly id: string;
  readonly name: string;
  readonly metric: string;
  readonly targetPct: number;
  readonly currentPct: number;
  /** 30-day daily samples — running budget remaining (0..1) */
  readonly burn: ReadonlyArray<number>;
}

export interface Incident {
  readonly id: string;
  readonly when: string;
  readonly title: string;
  readonly cause: 'deploy' | 'dependency' | 'infra' | 'config' | 'spike';
  readonly impactPct: number;
}

function decay(start: number, end: number, n: number, jitter: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = start + (end - start) * t;
    const j = (Math.sin(i * 1.7) * 0.5 + Math.cos(i * 0.9) * 0.5) * jitter;
    out.push(Math.max(0, Math.min(1, base + j)));
  }
  return out;
}

export const SLOS: ReadonlyArray<SLO> = [
  {
    id: 'uptime',
    name: 'Uptime',
    metric: 'availability',
    targetPct: 99.9,
    currentPct: 99.94,
    burn: decay(1, 0.62, 30, 0.03),
  },
  {
    id: 'p95',
    name: 'p95 Latency',
    metric: '< 350ms',
    targetPct: 99,
    currentPct: 97.4,
    burn: decay(1, 0.18, 30, 0.05),
  },
  {
    id: 'hydration',
    name: 'Hydration Success',
    metric: 'no-mismatch',
    targetPct: 99.5,
    currentPct: 99.66,
    burn: decay(1, 0.78, 30, 0.04),
  },
  {
    id: 'action',
    name: 'Action Success',
    metric: 'server actions',
    targetPct: 99,
    currentPct: 98.2,
    burn: decay(1, 0.34, 30, 0.05),
  },
];

export const INCIDENTS: ReadonlyArray<Incident> = [
  { id: 'i-1', when: '2026-04-29 14:12', title: 'Spike on /products after deploy', cause: 'deploy', impactPct: 0.21 },
  { id: 'i-2', when: '2026-04-26 09:47', title: 'Edge region us-east-1 brown-out', cause: 'infra', impactPct: 0.34 },
  { id: 'i-3', when: '2026-04-22 22:03', title: 'Stripe API timeout cascade', cause: 'dependency', impactPct: 0.18 },
  { id: 'i-4', when: '2026-04-19 06:18', title: 'Bad feature flag config rollout', cause: 'config', impactPct: 0.09 },
  { id: 'i-5', when: '2026-04-15 17:44', title: 'Search traffic spike (3x)', cause: 'spike', impactPct: 0.12 },
  { id: 'i-6', when: '2026-04-11 11:30', title: 'Hydration regression on /pricing', cause: 'deploy', impactPct: 0.07 },
];

export interface SLOInsights {
  readonly headroomPct: number;
  /** days until budget hits 0; null = not depleting */
  readonly daysToZero: number | null;
}

export function insights(slo: SLO): SLOInsights {
  const headroomPct = +(slo.currentPct - slo.targetPct).toFixed(2);
  const last = slo.burn[slo.burn.length - 1] ?? 1;
  const first = slo.burn[0] ?? 1;
  const days = slo.burn.length;
  const slope = (last - first) / Math.max(1, days - 1);
  let daysToZero: number | null = null;
  if (slope < -0.001) {
    daysToZero = Math.round(last / -slope);
  }
  return { headroomPct, daysToZero };
}

export function projectedSeries(slo: SLO, ahead: number): ReadonlyArray<number> {
  const last = slo.burn[slo.burn.length - 1] ?? 1;
  const first = slo.burn[0] ?? 1;
  const slope = (last - first) / Math.max(1, slo.burn.length - 1);
  const out: number[] = [];
  for (let i = 1; i <= ahead; i++) {
    out.push(Math.max(0, Math.min(1, last + slope * i)));
  }
  return out;
}

export const CAUSE_TONE: Record<Incident['cause'], 'err' | 'warn' | 'info' | 'accent' | 'muted'> = {
  deploy: 'warn',
  dependency: 'err',
  infra: 'info',
  config: 'accent',
  spike: 'muted',
};
