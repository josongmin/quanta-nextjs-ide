export type PaymentMethod = 'card' | 'apple_pay' | 'klarna' | 'ideal';
export type Currency = 'USD' | 'EUR' | 'KRW' | 'JPY';
export type ScenarioId =
  | 'success'
  | 'three_ds'
  | 'declined'
  | 'requires_action'
  | 'failed_network'
  | 'refunded';

export interface CartItem {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly qty: number;
  readonly unitAmount: number;
}

export interface PaymentMethodInfo {
  readonly id: PaymentMethod;
  readonly label: string;
  readonly currencies: ReadonlyArray<Currency>;
  readonly description: string;
}

export interface CurrencyInfo {
  readonly code: Currency;
  readonly symbol: string;
  readonly rate: number;
  readonly minor: number;
}

export interface JurisdictionInfo {
  readonly id: string;
  readonly label: string;
  readonly country: string;
  readonly rate: number;
  readonly type: 'sales_tax' | 'vat' | 'gst' | 'consumption';
}

export interface ScenarioStep {
  readonly id: 'cart' | 'payment' | '3ds' | 'confirm';
  readonly label: string;
  readonly description: string;
}

export interface ScenarioInfo {
  readonly id: ScenarioId;
  readonly label: string;
  readonly tone: 'static' | 'warn' | 'err' | 'info' | 'accent';
  readonly steps: ReadonlyArray<ScenarioStep>;
  readonly intentStatus: string;
  readonly outcomeMessage: string;
}

export const CART: ReadonlyArray<CartItem> = [
  {
    id: 'i-shoes',
    name: 'Trail runners — coal',
    sku: 'TR-COAL-42',
    qty: 1,
    unitAmount: 12999,
  },
  {
    id: 'i-socks',
    name: 'Merino crew socks (3-pack)',
    sku: 'SK-MER-M',
    qty: 2,
    unitAmount: 1899,
  },
  {
    id: 'i-laces',
    name: 'Reflective laces 120cm',
    sku: 'LC-REF-120',
    qty: 1,
    unitAmount: 599,
  },
];

export const PAYMENT_METHODS: ReadonlyArray<PaymentMethodInfo> = [
  {
    id: 'card',
    label: 'Card',
    currencies: ['USD', 'EUR', 'KRW', 'JPY'],
    description: 'Visa / Mastercard / Amex',
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    currencies: ['USD', 'EUR', 'JPY'],
    description: 'Tokenized device pay',
  },
  {
    id: 'klarna',
    label: 'Klarna',
    currencies: ['USD', 'EUR'],
    description: 'Pay in 4 / Financing',
  },
  {
    id: 'ideal',
    label: 'iDEAL',
    currencies: ['EUR'],
    description: 'NL bank redirect',
  },
];

export const CURRENCIES: ReadonlyArray<CurrencyInfo> = [
  { code: 'USD', symbol: '$', rate: 1, minor: 100 },
  { code: 'EUR', symbol: '€', rate: 0.92, minor: 100 },
  { code: 'KRW', symbol: '₩', rate: 1370, minor: 1 },
  { code: 'JPY', symbol: '¥', rate: 156, minor: 1 },
];

export const JURISDICTIONS: ReadonlyArray<JurisdictionInfo> = [
  { id: 'us-ca', label: 'US — California', country: 'US', rate: 0.0875, type: 'sales_tax' },
  { id: 'us-ny', label: 'US — New York', country: 'US', rate: 0.08875, type: 'sales_tax' },
  { id: 'eu-de', label: 'EU — Germany', country: 'DE', rate: 0.19, type: 'vat' },
  { id: 'kr', label: 'Korea', country: 'KR', rate: 0.1, type: 'vat' },
  { id: 'jp', label: 'Japan', country: 'JP', rate: 0.1, type: 'consumption' },
];

const STEP_BASE: ReadonlyArray<ScenarioStep> = [
  { id: 'cart', label: 'Cart', description: 'Customer reviews items' },
  { id: 'payment', label: 'Payment', description: 'Submit payment method' },
  { id: 'confirm', label: 'Confirm', description: 'Charge captured' },
];

const STEP_3DS: ReadonlyArray<ScenarioStep> = [
  { id: 'cart', label: 'Cart', description: 'Customer reviews items' },
  { id: 'payment', label: 'Payment', description: 'Submit payment method' },
  { id: '3ds', label: '3DS', description: 'Issuer challenge popup' },
  { id: 'confirm', label: 'Confirm', description: 'Charge captured' },
];

export const SCENARIOS: ReadonlyArray<ScenarioInfo> = [
  {
    id: 'success',
    label: 'Success',
    tone: 'static',
    steps: STEP_BASE,
    intentStatus: 'succeeded',
    outcomeMessage: 'PaymentIntent.succeeded · charge captured',
  },
  {
    id: 'three_ds',
    label: '3DS challenge',
    tone: 'info',
    steps: STEP_3DS,
    intentStatus: 'requires_action',
    outcomeMessage: 'next_action.use_stripe_sdk · 3DS frame opened',
  },
  {
    id: 'declined',
    label: 'Declined',
    tone: 'err',
    steps: STEP_BASE,
    intentStatus: 'requires_payment_method',
    outcomeMessage: 'card_declined · ask for another method',
  },
  {
    id: 'requires_action',
    label: 'Requires action',
    tone: 'warn',
    steps: STEP_BASE,
    intentStatus: 'requires_action',
    outcomeMessage: 'redirect_to_url · iDEAL bank confirm',
  },
  {
    id: 'failed_network',
    label: 'Failed (network)',
    tone: 'err',
    steps: STEP_BASE,
    intentStatus: 'requires_confirmation',
    outcomeMessage: 'api_connection_error · retry with idempotency key',
  },
  {
    id: 'refunded',
    label: 'Refunded',
    tone: 'accent',
    steps: STEP_BASE,
    intentStatus: 'succeeded',
    outcomeMessage: 'refund.created · charge.refunded',
  },
];

export function cartSubtotalUsdMinor(): number {
  return CART.reduce((sum, item) => sum + item.qty * item.unitAmount, 0);
}

export function convertMinor(usdMinor: number, currency: CurrencyInfo): number {
  if (currency.minor === 1) {
    return Math.round(usdMinor * currency.rate * 0.01);
  }
  return Math.round(usdMinor * currency.rate);
}

export function formatMoney(minor: number, currency: CurrencyInfo): string {
  if (currency.minor === 1) {
    return `${currency.symbol}${minor.toLocaleString()}`;
  }
  const major = (minor / currency.minor).toFixed(2);
  return `${currency.symbol}${Number(major).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildPaymentIntent(
  scenario: ScenarioInfo,
  currency: CurrencyInfo,
  jurisdiction: JurisdictionInfo,
  method: PaymentMethod,
  totalMinor: number,
): string {
  const lastError =
    scenario.id === 'declined'
      ? {
          code: 'card_declined',
          decline_code: 'generic_decline',
          message: 'Your card was declined.',
        }
      : scenario.id === 'failed_network'
        ? {
            code: 'api_connection_error',
            message: 'Network error contacting Stripe.',
          }
        : null;

  const nextAction =
    scenario.id === 'three_ds'
      ? {
          type: 'use_stripe_sdk',
          use_stripe_sdk: { type: 'three_d_secure_redirect' },
        }
      : scenario.id === 'requires_action'
        ? {
            type: 'redirect_to_url',
            redirect_to_url: { url: 'https://hooks.stripe.com/redirect/...' },
          }
        : null;

  const obj = {
    id: `pi_3O${scenario.id.replace('_', '')}_${currency.code}`,
    object: 'payment_intent',
    amount: totalMinor,
    currency: currency.code.toLowerCase(),
    status: scenario.intentStatus,
    payment_method_types: [method],
    metadata: {
      jurisdiction: jurisdiction.id,
      tax_type: jurisdiction.type,
      cart_items: CART.length,
    },
    last_payment_error: lastError,
    next_action: nextAction,
    livemode: false,
  };
  return JSON.stringify(obj, null, 2);
}

export function scenarioToneFill(
  tone: ScenarioInfo['tone'],
): { fill: string; stroke: string; text: string } {
  switch (tone) {
    case 'static':
      return { fill: 'fill-sem-static-soft', stroke: 'stroke-sem-static', text: 'fill-sem-static' };
    case 'warn':
      return { fill: 'fill-sev-warn-soft', stroke: 'stroke-sev-warn', text: 'fill-sev-warn' };
    case 'err':
      return { fill: 'fill-sev-err-soft', stroke: 'stroke-sev-err', text: 'fill-sev-err' };
    case 'info':
      return { fill: 'fill-sev-info-soft', stroke: 'stroke-sev-info', text: 'fill-sev-info' };
    case 'accent':
      return { fill: 'fill-accent-soft', stroke: 'stroke-accent', text: 'fill-accent' };
  }
}
