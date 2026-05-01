export type FlagStatus = 'off' | 'canary' | 'partial' | 'on';
export type Audience = 'internal' | 'beta' | 'paid' | 'everyone';
export type RiskTier = 'low' | 'medium' | 'high';

export interface FlagEvent {
  readonly when: string;
  readonly action: string;
  readonly actor: string;
}

export interface Flag {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly status: FlagStatus;
  readonly percentage: number;
  readonly audiences: ReadonlyArray<Audience>;
  readonly riskTier: RiskTier;
  readonly dependencies: ReadonlyArray<string>;
  readonly events: ReadonlyArray<FlagEvent>;
}

export const FLAGS: ReadonlyArray<Flag> = [
  {
    id: 'f-checkout-v2',
    key: 'checkout_v2',
    description: 'New checkout flow with split payment',
    status: 'partial',
    percentage: 25,
    audiences: ['internal', 'beta', 'paid'],
    riskTier: 'high',
    dependencies: ['f-stripe-actions'],
    events: [
      { when: '04-29 12:30', action: 'rolled to 25%', actor: 'pmichel' },
      { when: '04-27 09:14', action: 'canary 5%', actor: 'pmichel' },
      { when: '04-25 11:01', action: 'audience +paid', actor: 'kdoyle' },
      { when: '04-22 16:22', action: 'created', actor: 'pmichel' },
      { when: '04-22 16:20', action: 'spec approved', actor: 'design' },
    ],
  },
  {
    id: 'f-stripe-actions',
    key: 'stripe_server_actions',
    description: 'Stripe via server actions instead of REST',
    status: 'on',
    percentage: 100,
    audiences: ['everyone'],
    riskTier: 'medium',
    dependencies: [],
    events: [
      { when: '04-20 10:11', action: 'rolled to 100%', actor: 'pmichel' },
      { when: '04-18 09:00', action: 'rolled to 50%', actor: 'pmichel' },
      { when: '04-15 13:45', action: 'rolled to 25%', actor: 'pmichel' },
      { when: '04-12 17:22', action: 'canary 5%', actor: 'pmichel' },
      { when: '04-10 09:00', action: 'created', actor: 'kdoyle' },
    ],
  },
  {
    id: 'f-search-suggest',
    key: 'search_suggestions',
    description: 'AI-powered query suggestions on /products',
    status: 'canary',
    percentage: 5,
    audiences: ['internal'],
    riskTier: 'medium',
    dependencies: [],
    events: [
      { when: '04-29 18:02', action: 'canary 5%', actor: 'aford' },
      { when: '04-28 12:15', action: 'created', actor: 'aford' },
      { when: '04-28 11:05', action: 'spec approved', actor: 'product' },
      { when: '04-27 09:00', action: 'design review', actor: 'design' },
      { when: '04-26 14:30', action: 'requested', actor: 'aford' },
    ],
  },
  {
    id: 'f-dark-mode',
    key: 'dark_mode_ui',
    description: 'Storefront dark theme',
    status: 'partial',
    percentage: 50,
    audiences: ['beta', 'paid'],
    riskTier: 'low',
    dependencies: [],
    events: [
      { when: '04-28 10:00', action: 'rolled to 50%', actor: 'design' },
      { when: '04-26 09:30', action: 'rolled to 25%', actor: 'design' },
      { when: '04-23 11:00', action: 'canary 5%', actor: 'design' },
      { when: '04-21 14:00', action: 'created', actor: 'design' },
      { when: '04-20 09:00', action: 'spec approved', actor: 'product' },
    ],
  },
  {
    id: 'f-rsc-products',
    key: 'rsc_products_route',
    description: 'Migrate /products to RSC',
    status: 'off',
    percentage: 0,
    audiences: [],
    riskTier: 'high',
    dependencies: ['f-stripe-actions'],
    events: [
      { when: '04-30 09:00', action: 'created', actor: 'kdoyle' },
      { when: '04-29 16:14', action: 'spec drafted', actor: 'kdoyle' },
      { when: '04-29 11:00', action: 'requested', actor: 'kdoyle' },
      { when: '04-28 09:00', action: 'design review', actor: 'design' },
      { when: '04-27 14:00', action: 'kickoff', actor: 'eng' },
    ],
  },
  {
    id: 'f-loyalty',
    key: 'loyalty_v1',
    description: 'Loyalty program (points + tiers)',
    status: 'canary',
    percentage: 5,
    audiences: ['internal', 'beta'],
    riskTier: 'medium',
    dependencies: ['f-checkout-v2'],
    events: [
      { when: '04-28 16:33', action: 'canary 5%', actor: 'product' },
      { when: '04-25 11:05', action: 'created', actor: 'product' },
      { when: '04-24 09:00', action: 'spec approved', actor: 'product' },
      { when: '04-22 14:00', action: 'eng review', actor: 'eng' },
      { when: '04-20 09:00', action: 'requested', actor: 'product' },
    ],
  },
];

export const STATUS_TONE: Record<FlagStatus, 'muted' | 'info' | 'warn' | 'accent'> = {
  off: 'muted',
  canary: 'info',
  partial: 'warn',
  on: 'accent',
};

export const RISK_TONE: Record<RiskTier, 'info' | 'warn' | 'err'> = {
  low: 'info',
  medium: 'warn',
  high: 'err',
};

export const STAGE_PRESETS: ReadonlyArray<{ label: string; value: number }> = [
  { label: '5% canary', value: 5 },
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '100%', value: 100 },
];

export const ALL_AUDIENCES: ReadonlyArray<Audience> = [
  'internal',
  'beta',
  'paid',
  'everyone',
];

export interface RiskItem {
  readonly id: string;
  readonly label: string;
}

export const RISK_CHECKLIST: ReadonlyArray<RiskItem> = [
  { id: 'tests', label: 'CI green on main' },
  { id: 'metrics', label: 'Metrics dashboards in place' },
  { id: 'rollback', label: 'One-click rollback verified' },
  { id: 'comms', label: 'Comms drafted to support' },
];

export function dependencyOf(flag: Flag, all: ReadonlyArray<Flag>): ReadonlyArray<Flag> {
  return all.filter((f) => flag.dependencies.includes(f.id));
}
