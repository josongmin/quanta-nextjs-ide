export interface FunnelStep {
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly conversionPct: number;
  readonly dropOffReasons: ReadonlyArray<{
    readonly label: string;
    readonly pct: number;
  }>;
  readonly topEvents: ReadonlyArray<string>;
  readonly topExitPages: ReadonlyArray<string>;
}

export interface Funnel {
  readonly id: string;
  readonly name: string;
  readonly steps: ReadonlyArray<FunnelStep>;
}

export const FUNNELS: ReadonlyArray<Funnel> = [
  {
    id: 'subscribe',
    name: 'Subscribe + Refer',
    steps: [
      {
        id: 'visit',
        name: 'Visit',
        count: 124800,
        conversionPct: 100,
        dropOffReasons: [
          { label: 'bounced', pct: 38 },
          { label: 'no scroll', pct: 22 },
          { label: 'mobile-only-bounce', pct: 14 },
        ],
        topEvents: ['page_view /'],
        topExitPages: ['/', '/pricing'],
      },
      {
        id: 'signup',
        name: 'Sign up',
        count: 38240,
        conversionPct: 30.6,
        dropOffReasons: [
          { label: 'form abandon', pct: 41 },
          { label: 'oauth fail', pct: 17 },
          { label: 'email exists', pct: 12 },
        ],
        topEvents: ['form_submit signup', 'oauth_start'],
        topExitPages: ['/signup', '/oauth/callback'],
      },
      {
        id: 'activate',
        name: 'Activate',
        count: 21900,
        conversionPct: 57.3,
        dropOffReasons: [
          { label: 'email unverified', pct: 49 },
          { label: 'first project missing', pct: 22 },
          { label: 'tour skip', pct: 11 },
        ],
        topEvents: ['email_verified', 'project_created'],
        topExitPages: ['/onboarding'],
      },
      {
        id: 'subscribe',
        name: 'Subscribe',
        count: 7820,
        conversionPct: 35.7,
        dropOffReasons: [
          { label: 'price shock', pct: 33 },
          { label: 'card declined', pct: 19 },
          { label: 'no Apple Pay', pct: 9 },
        ],
        topEvents: ['checkout_start', 'plan_select pro'],
        topExitPages: ['/checkout', '/pricing'],
      },
      {
        id: 'renew',
        name: 'Renew',
        count: 5990,
        conversionPct: 76.6,
        dropOffReasons: [
          { label: 'card expired', pct: 51 },
          { label: 'value loss', pct: 27 },
          { label: 'switched provider', pct: 12 },
        ],
        topEvents: ['renewal_charge_success'],
        topExitPages: ['/billing'],
      },
      {
        id: 'refer',
        name: 'Refer',
        count: 2110,
        conversionPct: 35.2,
        dropOffReasons: [
          { label: 'no link copied', pct: 60 },
          { label: 'low NPS', pct: 22 },
          { label: 'invite ignored', pct: 14 },
        ],
        topEvents: ['referral_link_copied', 'invite_sent'],
        topExitPages: ['/refer'],
      },
    ],
  },
  {
    id: 'checkout',
    name: 'Checkout (alt)',
    steps: [],
  },
  {
    id: 'onboarding',
    name: 'Onboarding 2026',
    steps: [],
  },
];

export const COHORT_LABELS: ReadonlyArray<string> = [
  'W14',
  'W15',
  'W16',
  'W17',
  'W18',
  'W19',
  'W20',
  'W21',
];

export function buildCohortMatrix(): ReadonlyArray<ReadonlyArray<number>> {
  const rows: number[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: number[] = [];
    for (let c = 0; c < 12; c++) {
      const decay = Math.exp(-c / (4 + r * 0.4));
      const noise = Math.sin(r * 1.7 + c * 0.6) * 0.05;
      row.push(Math.max(0, Math.min(1, decay + noise)));
    }
    rows.push(row);
  }
  return rows;
}

export const RANGES: ReadonlyArray<string> = ['7d', '30d', '90d', 'YTD'];

export function funnelById(id: string): Funnel {
  return FUNNELS.find((f) => f.id === id) ?? FUNNELS[0]!;
}

export const REASON_TONE: ReadonlyArray<string> = [
  'fill-sev-err',
  'fill-sev-warn',
  'fill-sev-info',
  'fill-sem-static',
  'fill-accent',
];
