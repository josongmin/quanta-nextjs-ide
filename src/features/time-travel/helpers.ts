export type StateActionKind =
  | 'mutation'
  | 'navigation'
  | 'query'
  | 'session'
  | 'cache'
  | 'effect';

export interface StateAction {
  id: string;
  at: number;
  kind: StateActionKind;
  label: string;
  payload?: string;
  statePatch?: string;
  durationMs: number;
}

export interface StateValue {
  auth: string | null;
  cart: number;
  route: string;
  lastFetch?: string;
}

export interface StateSnapshot {
  id: string;
  at: number;
  cause: StateAction;
  state: StateValue;
}

interface Step {
  delta: number; // ms after previous
  kind: StateActionKind;
  label: string;
  payload?: string;
  patch?: string;
  durationMs: number;
  apply: (s: StateValue) => StateValue;
}

const SESSION_START = 1_733_900_000_000;

const steps: ReadonlyArray<Step> = [
  {
    delta: 0,
    kind: 'session',
    label: 'session/init',
    payload: '{ "anon": true, "trace": "abc-001" }',
    patch: '{\n  "auth": null,\n  "cart": 0,\n  "route": "/"\n}',
    durationMs: 0,
    apply: (s) => ({ ...s, auth: null, cart: 0, route: '/' }),
  },
  {
    delta: 320,
    kind: 'navigation',
    label: 'router/push("/products")',
    payload: '{ "from": "/", "to": "/products" }',
    patch: '"route": "/products"',
    durationMs: 14,
    apply: (s) => ({ ...s, route: '/products' }),
  },
  {
    delta: 480,
    kind: 'query',
    label: 'fetch GET /api/products',
    payload: '{ "page": 1, "limit": 24 }',
    patch: '"lastFetch": "/api/products"',
    durationMs: 184,
    apply: (s) => ({ ...s, lastFetch: '/api/products' }),
  },
  {
    delta: 1200,
    kind: 'navigation',
    label: 'router/push("/products/p_42")',
    payload: '{ "to": "/products/p_42" }',
    patch: '"route": "/products/p_42"',
    durationMs: 11,
    apply: (s) => ({ ...s, route: '/products/p_42' }),
  },
  {
    delta: 240,
    kind: 'query',
    label: 'fetch GET /api/products/p_42',
    payload: '{ "id": "p_42" }',
    patch: '"lastFetch": "/api/products/p_42"',
    durationMs: 142,
    apply: (s) => ({ ...s, lastFetch: '/api/products/p_42' }),
  },
  {
    delta: 1900,
    kind: 'mutation',
    label: 'cart/add',
    payload: '{ "id": "p_42", "qty": 1 }',
    patch: '"cart": 1',
    durationMs: 4,
    apply: (s) => ({ ...s, cart: 1 }),
  },
  {
    delta: 600,
    kind: 'effect',
    label: 'analytics/track("add_to_cart")',
    payload: '{ "productId": "p_42", "value": 29.99 }',
    durationMs: 9,
    apply: (s) => s,
  },
  {
    delta: 1300,
    kind: 'navigation',
    label: 'router/push("/login")',
    payload: '{ "to": "/login", "redirect": "/checkout" }',
    patch: '"route": "/login"',
    durationMs: 10,
    apply: (s) => ({ ...s, route: '/login' }),
  },
  {
    delta: 2200,
    kind: 'mutation',
    label: 'auth/login.pending',
    payload: '{ "email": "u@example.com" }',
    durationMs: 1,
    apply: (s) => s,
  },
  {
    delta: 380,
    kind: 'query',
    label: 'fetch POST /api/auth/login',
    payload: '{ "email": "u@example.com" }',
    patch: '"lastFetch": "/api/auth/login"',
    durationMs: 312,
    apply: (s) => ({ ...s, lastFetch: '/api/auth/login' }),
  },
  {
    delta: 320,
    kind: 'mutation',
    label: 'auth/login.fulfilled',
    payload: '{ "userId": "u_8821", "token": "***" }',
    patch: '"auth": "u_8821"',
    durationMs: 3,
    apply: (s) => ({ ...s, auth: 'u_8821' }),
  },
  {
    delta: 200,
    kind: 'cache',
    label: 'cache/invalidate(["user"])',
    payload: '{ "tags": ["user"] }',
    durationMs: 2,
    apply: (s) => s,
  },
  {
    delta: 480,
    kind: 'navigation',
    label: 'router/push("/checkout")',
    payload: '{ "to": "/checkout" }',
    patch: '"route": "/checkout"',
    durationMs: 9,
    apply: (s) => ({ ...s, route: '/checkout' }),
  },
  {
    delta: 1100,
    kind: 'query',
    label: 'fetch GET /api/checkout/preview',
    payload: '{ "cartId": "c_1" }',
    patch: '"lastFetch": "/api/checkout/preview"',
    durationMs: 220,
    apply: (s) => ({ ...s, lastFetch: '/api/checkout/preview' }),
  },
  {
    delta: 2200,
    kind: 'mutation',
    label: 'checkout/submit.pending',
    durationMs: 2,
    apply: (s) => s,
  },
  {
    delta: 1450,
    kind: 'query',
    label: 'fetch POST /api/checkout',
    payload: '{ "cartId": "c_1", "card": "***4242" }',
    durationMs: 982,
    apply: (s) => ({ ...s, lastFetch: '/api/checkout' }),
  },
  {
    delta: 80,
    kind: 'mutation',
    label: 'checkout/submit.rejected',
    payload: '{ "error": "PaymentDeclined", "code": 402 }',
    durationMs: 2,
    apply: (s) => s,
  },
  {
    delta: 1300,
    kind: 'effect',
    label: 'toast/show("Payment declined")',
    payload: '{ "level": "error" }',
    durationMs: 1,
    apply: (s) => s,
  },
  {
    delta: 1820,
    kind: 'mutation',
    label: 'checkout/retry',
    payload: '{ "card": "***1881" }',
    durationMs: 1,
    apply: (s) => s,
  },
  {
    delta: 2180,
    kind: 'query',
    label: 'fetch POST /api/checkout',
    payload: '{ "cartId": "c_1", "card": "***1881" }',
    durationMs: 612,
    apply: (s) => ({ ...s, lastFetch: '/api/checkout' }),
  },
  {
    delta: 90,
    kind: 'mutation',
    label: 'checkout/submit.fulfilled',
    payload: '{ "orderId": "o_553" }',
    patch: '"cart": 0',
    durationMs: 3,
    apply: (s) => ({ ...s, cart: 0 }),
  },
  {
    delta: 380,
    kind: 'cache',
    label: 'cache/invalidate(["cart","orders"])',
    payload: '{ "tags": ["cart","orders"] }',
    durationMs: 2,
    apply: (s) => s,
  },
  {
    delta: 420,
    kind: 'navigation',
    label: 'router/replace("/account/orders/o_553")',
    payload: '{ "to": "/account/orders/o_553" }',
    patch: '"route": "/account/orders/o_553"',
    durationMs: 8,
    apply: (s) => ({ ...s, route: '/account/orders/o_553' }),
  },
  {
    delta: 600,
    kind: 'query',
    label: 'fetch GET /api/orders/o_553',
    durationMs: 138,
    apply: (s) => ({ ...s, lastFetch: '/api/orders/o_553' }),
  },
  {
    delta: 1900,
    kind: 'effect',
    label: 'analytics/track("purchase")',
    payload: '{ "orderId": "o_553", "value": 29.99 }',
    durationMs: 6,
    apply: (s) => s,
  },
];

function buildActions(): { actions: StateAction[]; snapshots: StateSnapshot[] } {
  const acts: StateAction[] = [];
  const snaps: StateSnapshot[] = [];
  let t = SESSION_START;
  let state: StateValue = { auth: null, cart: 0, route: '/' };
  steps.forEach((step, i) => {
    t += step.delta;
    const id = `act_${String(i).padStart(2, '0')}`;
    const action: StateAction = {
      id,
      at: t,
      kind: step.kind,
      label: step.label,
      payload: step.payload,
      statePatch: step.patch,
      durationMs: step.durationMs,
    };
    acts.push(action);
    state = step.apply(state);
    snaps.push({
      id: `snap_${String(i).padStart(2, '0')}`,
      at: t,
      cause: action,
      state,
    });
  });
  return { actions: acts, snapshots: snaps };
}

const built = buildActions();
export const actions: ReadonlyArray<StateAction> = built.actions;
export const snapshots: ReadonlyArray<StateSnapshot> = built.snapshots;

export const SESSION_T0 = SESSION_START;

export function formatDelta(at: number): string {
  const ms = at - SESSION_T0;
  if (ms < 1000) return `+${ms}ms`;
  return `+${(ms / 1000).toFixed(2)}s`;
}

export function formatStateJson(state: StateValue): string {
  return JSON.stringify(state, null, 2);
}

export function diffLines(prev: StateValue | null, next: StateValue): string[] {
  const lines: string[] = [];
  const keys = new Set<keyof StateValue>([
    ...((prev ? Object.keys(prev) : []) as (keyof StateValue)[]),
    ...(Object.keys(next) as (keyof StateValue)[]),
  ]);
  keys.forEach((k) => {
    const a = prev ? prev[k] : undefined;
    const b = next[k];
    if (a !== b) {
      lines.push(`${String(k)}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
    }
  });
  return lines;
}

export function kindTone(
  k: StateActionKind,
):
  | 'accent'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'warn' {
  switch (k) {
    case 'mutation':
      return 'accent';
    case 'navigation':
      return 'static';
    case 'query':
      return 'dynamic';
    case 'session':
      return 'server';
    case 'cache':
      return 'isr';
    case 'effect':
      return 'client';
  }
}

export const SPEEDS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];
