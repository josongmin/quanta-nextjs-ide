export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
export type Runtime = 'node' | 'edge';
export type BodyParse = 'raw' | 'json' | 'form-data';
export type AuthMode = 'none' | 'bearer' | 'session';
export type WebhookProvider = 'stripe' | 'github' | 'generic';

export interface RouteHandlerConfig {
  path: string;
  method: HttpMethod;
  runtime: Runtime;
  bodyParse: BodyParse;
  auth: AuthMode;
  rateLimit: boolean;
  rateLimitRps: number;
  cacheHeaders: boolean;
  cacheMaxAge: number;
  webhook: boolean;
  webhookProvider: WebhookProvider;
  responseEnvelope: string;
}

export function defaultConfig(): RouteHandlerConfig {
  return {
    path: '/api/checkout',
    method: 'POST',
    runtime: 'node',
    bodyParse: 'json',
    auth: 'session',
    rateLimit: true,
    rateLimitRps: 10,
    cacheHeaders: false,
    cacheMaxAge: 60,
    webhook: false,
    webhookProvider: 'stripe',
    responseEnvelope: '{ ok: true, data }',
  };
}

export function generateRouteHandler(c: RouteHandlerConfig): string {
  const lines: string[] = [];

  lines.push(`import { NextRequest, NextResponse } from 'next/server';`);
  if (c.auth === 'session') {
    lines.push(`import { getSession } from '@/lib/auth';`);
  }
  if (c.rateLimit) {
    lines.push(`import { rateLimit } from '@/lib/rate-limit';`);
  }
  if (c.webhook) {
    lines.push(`import { verify${capitalize(c.webhookProvider)}Signature } from '@/lib/webhooks/${c.webhookProvider}';`);
  }
  lines.push('');
  lines.push(`export const runtime = ${JSON.stringify(c.runtime)};`);
  if (c.method !== 'GET' || c.bodyParse === 'raw') {
    lines.push(`export const dynamic = 'force-dynamic';`);
  }
  lines.push('');

  lines.push(`export async function ${c.method}(req: NextRequest) {`);

  if (c.rateLimit) {
    lines.push(`  const rl = await rateLimit(req, { rps: ${c.rateLimitRps} });`);
    lines.push(`  if (!rl.ok) {`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },`);
    lines.push(`      { status: 429, headers: { 'retry-after': String(rl.retryAfter) } },`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push('');
  }

  if (c.auth === 'bearer') {
    lines.push(`  const auth = req.headers.get('authorization') ?? '';`);
    lines.push(`  if (!auth.startsWith('Bearer ')) {`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Missing bearer token' } },`);
    lines.push(`      { status: 401 },`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push('');
  }

  if (c.auth === 'session') {
    lines.push(`  const session = await getSession();`);
    lines.push(`  if (!session?.user) {`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Sign-in required' } },`);
    lines.push(`      { status: 401 },`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push('');
  }

  lines.push(`  try {`);

  if (c.method !== 'GET') {
    if (c.bodyParse === 'json') {
      lines.push(`    const body: unknown = await req.json();`);
    } else if (c.bodyParse === 'form-data') {
      lines.push(`    const body = await req.formData();`);
    } else {
      lines.push(`    const rawBody = await req.text();`);
      if (c.webhook) {
        lines.push(`    const signature = req.headers.get('${signatureHeader(c.webhookProvider)}') ?? '';`);
        lines.push(`    const event = await verify${capitalize(c.webhookProvider)}Signature(rawBody, signature);`);
      }
    }
    lines.push('');
  }

  if (c.webhook && c.bodyParse !== 'raw') {
    lines.push(`    // Webhook verification typically requires the raw body. Switch bodyParse to 'raw'.`);
    lines.push('');
  }

  lines.push(`    // TODO: implement ${c.method} ${c.path}`);
  lines.push(`    const data = { method: ${JSON.stringify(c.method)}, path: ${JSON.stringify(c.path)} };`);
  lines.push('');

  const cacheHeader =
    c.cacheHeaders && c.method === 'GET'
      ? `, headers: { 'cache-control': 'public, s-maxage=${c.cacheMaxAge}, stale-while-revalidate=${c.cacheMaxAge * 2}' }`
      : '';

  const envelope = c.responseEnvelope.trim().length > 0
    ? c.responseEnvelope
    : '{ ok: true, data }';

  lines.push(`    return NextResponse.json(${envelope}${cacheHeader ? `, {${cacheHeader.replace(/^,\s*/, ' ')} }` : ''});`);
  lines.push(`  } catch (err) {`);
  lines.push(`    console.error(${JSON.stringify(`[${c.method} ${c.path}]`)}, err);`);
  lines.push(`    return NextResponse.json(`);
  lines.push(`      { ok: false, error: { code: 'INTERNAL', message: 'Unexpected error' } },`);
  lines.push(`      { status: 500 },`);
  lines.push(`    );`);
  lines.push(`  }`);
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function signatureHeader(provider: WebhookProvider): string {
  switch (provider) {
    case 'stripe':
      return 'stripe-signature';
    case 'github':
      return 'x-hub-signature-256';
    case 'generic':
    default:
      return 'x-signature';
  }
}

export function handlerFilePath(routePath: string): string {
  const trimmed = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  return `app/${trimmed}/route.ts`;
}
