export type MwAction = 'pass' | 'redirect' | 'set-locale' | 'block' | 'rewrite';

export interface HeaderPreset {
  id: string;
  label: string;
  cookies: ReadonlyArray<{ key: string; value: string }>;
  headers: ReadonlyArray<{ key: string; value: string }>;
  description: string;
}

export interface MwRule {
  id: string;
  description: string;
  matchPath: RegExp;
  matchPathStr: string;
  condition(preset: HeaderPreset): boolean;
  conditionExpr: string;
  action: MwAction;
  actionDetail: string;
  setCookies?: ReadonlyArray<{ key: string; value: string }>;
}

export interface MwRoute {
  id: string;
  path: string;
  type: 'page' | 'api' | 'static';
}

export interface MwResolution {
  action: MwAction;
  detail: string;
  ruleId: string | null;
  ruleLineage: ReadonlyArray<string>;
  setCookies: ReadonlyArray<{ key: string; value: string }>;
  status: number;
  durationMs: number;
}

export const MIDDLEWARE_MATCHER = `['/((?!api|_next/static|_next/image|favicon.ico).*)']`;

export const MIDDLEWARE_CODE = `// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ${MIDDLEWARE_MATCHER},
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const session = req.cookies.get('session')?.value;
  const locale = req.cookies.get('locale')?.value ?? 'en';
  const ua = req.headers.get('user-agent') ?? '';

  // Rule 1: protect /admin and /account when unauthenticated
  if (/^\\/(admin|account)/.test(url.pathname) && !session) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Rule 2: locale-prefix korean traffic
  if (locale === 'ko' && !url.pathname.startsWith('/ko')) {
    url.pathname = '/ko' + url.pathname;
    const res = NextResponse.rewrite(url);
    res.cookies.set('locale', 'ko');
    return res;
  }

  // Rule 3: bot crawler block on /checkout
  if (/^\\/checkout/.test(url.pathname) && /bot|crawler/i.test(ua)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Rule 4: a/b cookie injection on /
  if (url.pathname === '/') {
    const res = NextResponse.next();
    if (!req.cookies.get('ab')) res.cookies.set('ab', 'A');
    return res;
  }

  return NextResponse.next();
}
`;

export const HEADER_PRESETS: ReadonlyArray<HeaderPreset> = [
  {
    id: 'anon',
    label: 'Anonymous',
    cookies: [],
    headers: [{ key: 'user-agent', value: 'Mozilla/5.0 (Mac)' }],
    description: 'No session, en locale',
  },
  {
    id: 'authed-us',
    label: 'Authed (US)',
    cookies: [
      { key: 'session', value: 'sess_abc' },
      { key: 'locale', value: 'en' },
    ],
    headers: [{ key: 'user-agent', value: 'Mozilla/5.0 (Mac)' }],
    description: 'Logged in, en',
  },
  {
    id: 'authed-kr',
    label: 'Authed (KR)',
    cookies: [
      { key: 'session', value: 'sess_xyz' },
      { key: 'locale', value: 'ko' },
    ],
    headers: [{ key: 'user-agent', value: 'Mozilla/5.0 (Mac)' }],
    description: 'Logged in, ko',
  },
  {
    id: 'bot',
    label: 'Bot crawler',
    cookies: [],
    headers: [{ key: 'user-agent', value: 'Googlebot/2.1' }],
    description: 'No session, bot UA',
  },
];

export const ROUTES: ReadonlyArray<MwRoute> = [
  { id: 'r-home', path: '/', type: 'page' },
  { id: 'r-products', path: '/products', type: 'page' },
  { id: 'r-product', path: '/products/[id]', type: 'page' },
  { id: 'r-blog', path: '/blog/[slug]', type: 'page' },
  { id: 'r-account', path: '/account', type: 'page' },
  { id: 'r-account-orders', path: '/account/orders', type: 'page' },
  { id: 'r-admin', path: '/admin', type: 'page' },
  { id: 'r-admin-users', path: '/admin/users', type: 'page' },
  { id: 'r-checkout', path: '/checkout', type: 'page' },
  { id: 'r-login', path: '/login', type: 'page' },
  { id: 'r-search', path: '/search', type: 'page' },
  { id: 'r-api-products', path: '/api/products', type: 'api' },
  { id: 'r-favicon', path: '/favicon.ico', type: 'static' },
  { id: 'r-img', path: '/_next/image', type: 'static' },
];

const RULES: ReadonlyArray<MwRule> = [
  {
    id: 'auth-gate',
    description: 'Redirect unauthenticated users from /admin or /account',
    matchPath: /^\/(admin|account)/,
    matchPathStr: '/admin or /account',
    condition: (p) => !p.cookies.find((c) => c.key === 'session'),
    conditionExpr: 'no session cookie',
    action: 'redirect',
    actionDetail: '/login',
  },
  {
    id: 'locale-rewrite',
    description: 'Rewrite to /ko prefix when locale=ko',
    matchPath: /^(?!\/ko)/,
    matchPathStr: 'any non-/ko path',
    condition: (p) => p.cookies.find((c) => c.key === 'locale')?.value === 'ko',
    conditionExpr: 'cookie locale === "ko"',
    action: 'set-locale',
    actionDetail: 'rewrite + set-cookie locale=ko',
    setCookies: [{ key: 'locale', value: 'ko' }],
  },
  {
    id: 'bot-block',
    description: 'Block bots on /checkout',
    matchPath: /^\/checkout/,
    matchPathStr: '/checkout/*',
    condition: (p) =>
      /bot|crawler/i.test(p.headers.find((h) => h.key === 'user-agent')?.value ?? ''),
    conditionExpr: 'UA matches /bot|crawler/i',
    action: 'block',
    actionDetail: '403 Forbidden',
  },
  {
    id: 'ab-cookie',
    description: 'Set ab cookie on root',
    matchPath: /^\/$/,
    matchPathStr: '/',
    condition: (p) => !p.cookies.find((c) => c.key === 'ab'),
    conditionExpr: 'no ab cookie',
    action: 'pass',
    actionDetail: 'set-cookie ab=A',
    setCookies: [{ key: 'ab', value: 'A' }],
  },
];

const MATCHER_RE =
  /^\/(?!api\b|_next\/static|_next\/image|favicon\.ico).*/;

function isMatched(path: string): boolean {
  return MATCHER_RE.test(path);
}

export function resolveMiddleware(
  route: MwRoute,
  preset: HeaderPreset,
): MwResolution {
  const lineage: string[] = [];
  if (!isMatched(route.path)) {
    lineage.push(`matcher excludes "${route.path}"`);
    return {
      action: 'pass',
      detail: 'matcher skipped',
      ruleId: null,
      ruleLineage: lineage,
      setCookies: [],
      status: 200,
      durationMs: 0,
    };
  }
  lineage.push(`matcher matched "${route.path}"`);
  for (const rule of RULES) {
    if (!rule.matchPath.test(route.path)) continue;
    lineage.push(`tested ${rule.id}: path matches ${rule.matchPathStr}`);
    if (!rule.condition(preset)) {
      lineage.push(`  → condition false (${rule.conditionExpr})`);
      continue;
    }
    lineage.push(`  → condition true (${rule.conditionExpr})`);
    lineage.push(`fired ${rule.id}: ${rule.action} (${rule.actionDetail})`);
    return {
      action: rule.action,
      detail: rule.actionDetail,
      ruleId: rule.id,
      ruleLineage: lineage,
      setCookies: rule.setCookies ?? [],
      status: rule.action === 'block' ? 403 : rule.action === 'redirect' ? 307 : 200,
      durationMs: 4 + Math.round((route.path.length * 0.3 + preset.id.length * 0.5) * 10) / 10,
    };
  }
  lineage.push('no rule fired → pass');
  return {
    action: 'pass',
    detail: 'pass-through',
    ruleId: null,
    ruleLineage: lineage,
    setCookies: [],
    status: 200,
    durationMs: 2,
  };
}

export function actionTone(a: MwAction): 'static' | 'warn' | 'err' | 'info' | 'accent' {
  switch (a) {
    case 'pass':
      return 'static';
    case 'redirect':
      return 'warn';
    case 'set-locale':
      return 'info';
    case 'block':
      return 'err';
    case 'rewrite':
      return 'accent';
  }
}

export function actionLabel(a: MwAction): string {
  switch (a) {
    case 'pass':
      return 'pass';
    case 'redirect':
      return 'redirect';
    case 'set-locale':
      return 'locale';
    case 'block':
      return 'block';
    case 'rewrite':
      return 'rewrite';
  }
}
