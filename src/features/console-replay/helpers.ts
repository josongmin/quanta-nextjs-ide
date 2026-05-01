export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface ConsoleEntry {
  id: string;
  at: number;
  level: ConsoleLevel;
  message: string;
  args?: string[];
  stack?: string[];
  source: string;
}

interface Spec {
  delta: number;
  level: ConsoleLevel;
  message: string;
  args?: string[];
  stack?: string[];
  source: string;
}

const specs: ReadonlyArray<Spec> = [
  {
    delta: 0,
    level: 'info',
    message: '[next] starting dev server on :3000',
    source: 'next/dist/server',
  },
  {
    delta: 80,
    level: 'log',
    message: 'AppShell mounted',
    source: 'src/app/layout.tsx',
  },
  {
    delta: 124,
    level: 'debug',
    message: 'analytics.init({ tenant: "acme" })',
    args: ['{ tenant: "acme", env: "dev" }'],
    source: 'src/lib/analytics.ts',
  },
  {
    delta: 188,
    level: 'warn',
    message: 'Hydration mismatch: server="$0.99" client="$0,99"',
    stack: [
      'at PriceTag (src/features/product/price-tag.tsx:14:8)',
      'at ProductCard (src/features/product/product-card.tsx:42:6)',
      'at ProductGrid (src/features/product/product-grid.tsx:18:4)',
    ],
    source: 'src/features/product/price-tag.tsx',
  },
  {
    delta: 232,
    level: 'log',
    message: 'router.push("/products")',
    source: 'src/app/(commerce)/products/page.tsx',
  },
  {
    delta: 280,
    level: 'info',
    message: 'GET /api/products → 200 184ms',
    source: 'src/app/api/products/route.ts',
  },
  {
    delta: 360,
    level: 'warn',
    message: 'Image without explicit width: /images/hero.jpg',
    source: 'src/components/image.tsx',
  },
  {
    delta: 432,
    level: 'log',
    message: 'ProductGrid rendered 24 items',
    source: 'src/features/product/product-grid.tsx',
  },
  {
    delta: 480,
    level: 'debug',
    message: 'cache.set("products:p1", …, ttl=60s)',
    source: 'src/lib/cache.ts',
  },
  {
    delta: 524,
    level: 'error',
    message: 'TypeError: Cannot read properties of undefined (reading "name")',
    args: ['{ "user": null }'],
    stack: [
      'at UserMenu (src/features/user/user-menu.tsx:32:18)',
      'at Header (src/widgets/header/index.tsx:12:6)',
    ],
    source: 'src/features/user/user-menu.tsx',
  },
  {
    delta: 600,
    level: 'warn',
    message: 'React: Each child in a list should have a unique "key" prop',
    stack: [
      'at Reviews (src/features/product/reviews.tsx:24:6)',
      'at ProductDetail (src/app/(commerce)/products/[id]/page.tsx:42:4)',
    ],
    source: 'src/features/product/reviews.tsx',
  },
  {
    delta: 680,
    level: 'log',
    message: 'router.push("/products/p_42")',
    source: 'src/app/(commerce)/products/[id]/page.tsx',
  },
  {
    delta: 720,
    level: 'info',
    message: 'GET /api/products/p_42 → 200 142ms',
    source: 'src/app/api/products/[id]/route.ts',
  },
  {
    delta: 800,
    level: 'log',
    message: 'AddToCart click qty=1',
    source: 'src/features/cart/add-to-cart.tsx',
  },
  {
    delta: 836,
    level: 'debug',
    message: 'POST /api/cart/items',
    args: ['{ productId: "p_42", qty: 1 }'],
    source: 'src/app/api/cart/items/route.ts',
  },
  {
    delta: 920,
    level: 'info',
    message: 'POST /api/cart/items → 201 88ms',
    source: 'src/app/api/cart/items/route.ts',
  },
  {
    delta: 980,
    level: 'warn',
    message: 'analytics: dropping event (queue full): cart_view',
    source: 'src/lib/analytics.ts',
  },
  {
    delta: 1060,
    level: 'log',
    message: 'router.push("/login")',
    source: 'src/app/(auth)/login/page.tsx',
  },
  {
    delta: 1120,
    level: 'error',
    message: 'NetworkError: failed to fetch /api/auth/csrf',
    stack: [
      'at csrfToken (src/lib/auth.ts:18:14)',
      'at LoginForm (src/features/auth/login-form.tsx:24:8)',
    ],
    source: 'src/lib/auth.ts',
  },
  {
    delta: 1200,
    level: 'info',
    message: 'retrying /api/auth/csrf (attempt 2/3)',
    source: 'src/lib/auth.ts',
  },
  {
    delta: 1262,
    level: 'log',
    message: 'GET /api/auth/csrf → 200 64ms',
    source: 'src/lib/auth.ts',
  },
  {
    delta: 1300,
    level: 'log',
    message: 'auth.login({ email: "u@example.com" })',
    source: 'src/features/auth/login-form.tsx',
  },
  {
    delta: 1490,
    level: 'info',
    message: 'POST /api/auth/login → 200 312ms',
    source: 'src/app/api/auth/login/route.ts',
  },
  {
    delta: 1540,
    level: 'log',
    message: 'session set: u_8821',
    source: 'src/lib/auth.ts',
  },
  {
    delta: 1620,
    level: 'log',
    message: 'router.push("/checkout")',
    source: 'src/app/(checkout)/checkout/page.tsx',
  },
  {
    delta: 1700,
    level: 'warn',
    message: '[stripe] live publishable key in dev environment',
    source: 'src/features/checkout/payment-form.tsx',
  },
  {
    delta: 1780,
    level: 'log',
    message: 'PaymentForm submitted',
    args: ['{ cardLast4: "4242" }'],
    source: 'src/features/checkout/payment-form.tsx',
  },
  {
    delta: 1880,
    level: 'error',
    message: 'PaymentDeclined: card declined by issuer (code=402)',
    args: ['{ orderId: null, code: 402 }'],
    stack: [
      'at handleSubmit (src/features/checkout/payment-form.tsx:88:14)',
      'at submit (src/features/checkout/checkout-flow.tsx:42:6)',
    ],
    source: 'src/features/checkout/payment-form.tsx',
  },
  {
    delta: 1960,
    level: 'info',
    message: 'toast: "Payment declined"',
    source: 'src/lib/toast.ts',
  },
  {
    delta: 2040,
    level: 'debug',
    message: 'retry button shown',
    source: 'src/features/checkout/payment-form.tsx',
  },
  {
    delta: 2200,
    level: 'log',
    message: 'PaymentForm submitted (retry)',
    args: ['{ cardLast4: "1881" }'],
    source: 'src/features/checkout/payment-form.tsx',
  },
  {
    delta: 2480,
    level: 'info',
    message: 'POST /api/checkout → 200 612ms',
    source: 'src/app/api/checkout/route.ts',
  },
  {
    delta: 2520,
    level: 'log',
    message: 'order created: o_553',
    source: 'src/features/checkout/checkout-flow.tsx',
  },
  {
    delta: 2540,
    level: 'debug',
    message: 'cache.invalidate(["cart","orders"])',
    source: 'src/lib/cache.ts',
  },
  {
    delta: 2620,
    level: 'log',
    message: 'router.replace("/account/orders/o_553")',
    source: 'src/app/(account)/orders/[id]/page.tsx',
  },
  {
    delta: 2700,
    level: 'info',
    message: 'GET /api/orders/o_553 → 200 138ms',
    source: 'src/app/api/orders/[id]/route.ts',
  },
  {
    delta: 2780,
    level: 'warn',
    message: 'console: Module-not-found stub: heatmap.so (skipped)',
    source: 'next/dist/build',
  },
  {
    delta: 2860,
    level: 'debug',
    message: 'analytics.track("purchase")',
    args: ['{ orderId: "o_553", value: 29.99 }'],
    source: 'src/lib/analytics.ts',
  },
  {
    delta: 2940,
    level: 'log',
    message: 'OrderSummary mounted',
    source: 'src/features/account/order-summary.tsx',
  },
  {
    delta: 3000,
    level: 'info',
    message: 'session active · idle 0ms',
    source: 'src/lib/session.ts',
  },
  {
    delta: 3080,
    level: 'warn',
    message: 'unused css selector ".legacy-button" (4.1KB)',
    source: 'next/dist/build/css',
  },
];

export const consoleEntries: ReadonlyArray<ConsoleEntry> = specs.map((s, i) => ({
  id: `c_${String(i).padStart(3, '0')}`,
  at: s.delta,
  level: s.level,
  message: s.message,
  args: s.args,
  stack: s.stack,
  source: s.source,
}));

export const LEVELS: ReadonlyArray<ConsoleLevel> = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
];

export const SOURCES: ReadonlyArray<string> = Array.from(
  new Set(consoleEntries.map((e) => e.source.split('/').slice(0, 2).join('/'))),
).sort();

export function levelTone(
  l: ConsoleLevel,
):
  | 'accent'
  | 'static'
  | 'isr'
  | 'dynamic'
  | 'edge'
  | 'client'
  | 'server'
  | 'warn'
  | 'err'
  | 'info'
  | 'muted' {
  switch (l) {
    case 'log':
      return 'muted';
    case 'info':
      return 'info';
    case 'warn':
      return 'warn';
    case 'error':
      return 'err';
    case 'debug':
      return 'isr';
  }
}

export function levelGlyph(l: ConsoleLevel): string {
  switch (l) {
    case 'log':
      return '›';
    case 'info':
      return 'ⓘ';
    case 'warn':
      return '⚠';
    case 'error':
      return '✕';
    case 'debug':
      return '⌗';
  }
}

export function safeRegex(s: string): RegExp | null {
  try {
    return new RegExp(s, 'i');
  } catch {
    return null;
  }
}
