export type ModelKind = 'opus-4.7' | 'sonnet-4.6' | 'haiku-4.5';

export interface ModelPricing {
  inPerMTok: number; // USD per 1M input tokens
  outPerMTok: number; // USD per 1M output tokens
}

export const MODEL_PRICING: Record<ModelKind, ModelPricing> = {
  'opus-4.7': { inPerMTok: 15, outPerMTok: 75 },
  'sonnet-4.6': { inPerMTok: 3, outPerMTok: 15 },
  'haiku-4.5': { inPerMTok: 0.8, outPerMTok: 4 },
};

export const MODEL_KINDS: ReadonlyArray<ModelKind> = [
  'opus-4.7',
  'sonnet-4.6',
  'haiku-4.5',
];

export interface DayUsage {
  day: string; // 'YYYY-MM-DD'
  spendByModel: Record<ModelKind, number>;
}

export interface AgentUsage {
  agent: string;
  costUSD: number;
  callCount: number;
}

// Last 14 days, ending at "today" 2026-05-01
const DAYS = [
  '2026-04-18',
  '2026-04-19',
  '2026-04-20',
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
  '2026-04-24',
  '2026-04-25',
  '2026-04-26',
  '2026-04-27',
  '2026-04-28',
  '2026-04-29',
  '2026-04-30',
  '2026-05-01',
] as const;

const RAW: ReadonlyArray<readonly [number, number, number]> = [
  [4.2, 6.8, 1.1],
  [3.1, 5.2, 0.9],
  [2.4, 4.1, 1.4],
  [5.6, 7.3, 1.6],
  [6.1, 8.0, 1.9],
  [4.8, 6.4, 1.5],
  [3.3, 5.0, 1.2],
  [4.9, 7.1, 1.4],
  [7.2, 9.6, 2.1],
  [8.1, 10.4, 2.4],
  [6.4, 8.2, 1.7],
  [5.3, 7.0, 1.8],
  [9.2, 11.0, 2.6],
  [10.4, 12.6, 2.9],
];

export const DAILY_USAGE: ReadonlyArray<DayUsage> = DAYS.map((d, i) => {
  const row = RAW[i] ?? [0, 0, 0];
  return {
    day: d,
    spendByModel: {
      'opus-4.7': row[0],
      'sonnet-4.6': row[1],
      'haiku-4.5': row[2],
    },
  };
});

export const AGENT_USAGE: ReadonlyArray<AgentUsage> = [
  { agent: 'refactor', costUSD: 38.4, callCount: 412 },
  { agent: 'test', costUSD: 22.1, callCount: 318 },
  { agent: 'review', costUSD: 18.7, callCount: 274 },
  { agent: 'migrate', costUSD: 14.6, callCount: 152 },
  { agent: 'security', costUSD: 9.3, callCount: 88 },
];

export function dailyTotal(d: DayUsage): number {
  return MODEL_KINDS.reduce((acc, m) => acc + d.spendByModel[m], 0);
}

export function todaySpend(): number {
  const last = DAILY_USAGE[DAILY_USAGE.length - 1];
  return last ? dailyTotal(last) : 0;
}

export function mtdSpend(): number {
  // Month-to-date = days where day starts with '2026-05'
  return DAILY_USAGE.filter((d) => d.day.startsWith('2026-05')).reduce(
    (acc, d) => acc + dailyTotal(d),
    0,
  );
}

export function projectedEom(): number {
  // crude: avg of last 7 days × 30
  const last7 = DAILY_USAGE.slice(-7);
  if (last7.length === 0) return 0;
  const avg = last7.reduce((acc, d) => acc + dailyTotal(d), 0) / last7.length;
  return avg * 30;
}

export function trend7d(): ReadonlyArray<number> {
  return DAILY_USAGE.slice(-7).map(dailyTotal);
}

export function totalAgentCost(): number {
  return AGENT_USAGE.reduce((acc, a) => acc + a.costUSD, 0);
}

export function modelColor(m: ModelKind): string {
  switch (m) {
    case 'opus-4.7':
      return 'fill-accent';
    case 'sonnet-4.6':
      return 'fill-sev-info';
    case 'haiku-4.5':
      return 'fill-sem-isr';
  }
}

export function modelDot(m: ModelKind): string {
  switch (m) {
    case 'opus-4.7':
      return 'bg-accent';
    case 'sonnet-4.6':
      return 'bg-sev-info';
    case 'haiku-4.5':
      return 'bg-sem-isr';
  }
}

export function shortDay(d: string): string {
  // 2026-05-01 -> 05-01
  return d.length >= 10 ? d.slice(5) : d;
}
