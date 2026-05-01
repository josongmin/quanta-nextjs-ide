export type HostId = 'vercel' | 'netlify' | 'cloudflare' | 'self';
export type FeatureStatus = 'yes' | 'partial' | 'workaround' | 'no';
export type FeatureGroup = 'rendering' | 'cache' | 'runtime' | 'dx';

export interface Host {
  readonly id: HostId;
  readonly label: string;
  readonly logo: string; // single-letter mark
}

export interface Feature {
  readonly id: string;
  readonly label: string;
  readonly group: FeatureGroup;
}

export interface MatrixCell {
  readonly status: FeatureStatus;
  readonly notes: string;
  readonly evidence: string; // mock URL
  readonly workaround?: string; // optional snippet
}

export const HOSTS: ReadonlyArray<Host> = [
  { id: 'vercel', label: 'Vercel', logo: 'V' },
  { id: 'netlify', label: 'Netlify', logo: 'N' },
  { id: 'cloudflare', label: 'Cloudflare Workers', logo: 'C' },
  { id: 'self', label: 'Self-hosted Node', logo: 'S' },
];

export const FEATURES: ReadonlyArray<Feature> = [
  { id: 'isr', label: 'ISR', group: 'cache' },
  { id: 'odr', label: 'On-Demand Revalidate', group: 'cache' },
  { id: 'edge', label: 'Edge runtime', group: 'runtime' },
  { id: 'imgopt', label: 'Image Optimization', group: 'rendering' },
  { id: 'mw', label: 'Middleware', group: 'runtime' },
  { id: 'streaming', label: 'Streaming SSR', group: 'rendering' },
  { id: 'sa', label: 'Server Actions', group: 'rendering' },
  { id: 'rsc', label: 'RSC', group: 'rendering' },
  { id: 'usecache', label: 'use cache', group: 'cache' },
  { id: 'bgfn', label: 'Background Functions', group: 'runtime' },
  { id: 'cron', label: 'Cron', group: 'runtime' },
  { id: 'rewrites', label: 'Rewrites', group: 'dx' },
  { id: 'redirects', label: 'Redirects', group: 'dx' },
  { id: 'headers', label: 'Headers', group: 'dx' },
  { id: 'draft', label: 'Draft Mode', group: 'cache' },
  { id: 'i18n', label: 'Internationalization', group: 'dx' },
];

type Matrix = Record<string, Record<HostId, MatrixCell>>;

const URL_BASE = 'https://docs.example.com/hosting/';

function cell(status: FeatureStatus, notes: string, evidence: string, workaround?: string): MatrixCell {
  return workaround !== undefined ? { status, notes, evidence, workaround } : { status, notes, evidence };
}

export const MATRIX: Matrix = {
  isr: {
    vercel: cell('yes', 'Native ISR with edge revalidation.', `${URL_BASE}vercel/isr`),
    netlify: cell('yes', 'Supported via On-Demand Builders.', `${URL_BASE}netlify/isr`),
    cloudflare: cell('partial', 'Limited via cache API; 25 MiB asset cap.', `${URL_BASE}cf/isr`, "// fallback to fetch with revalidate\nfetch(url, { next: { revalidate: 60 } });\n"),
    self: cell('workaround', 'Requires shared cache (e.g., Redis) across instances.', `${URL_BASE}self/isr`, "// next.config.js\nmodule.exports = {\n  cacheHandler: require.resolve('./cache-handler.js'),\n  cacheMaxMemorySize: 0,\n};\n"),
  },
  odr: {
    vercel: cell('yes', 'revalidatePath / revalidateTag work out of the box.', `${URL_BASE}vercel/odr`),
    netlify: cell('yes', 'On-Demand Revalidation supported.', `${URL_BASE}netlify/odr`),
    cloudflare: cell('partial', 'Tag-based revalidation requires KV setup.', `${URL_BASE}cf/odr`),
    self: cell('workaround', 'Use a custom cache handler with a pub/sub broker.', `${URL_BASE}self/odr`, "// trigger\nawait fetch('/api/revalidate?tag=posts', { method: 'POST' });\n"),
  },
  edge: {
    vercel: cell('yes', 'Edge Functions in 30+ regions.', `${URL_BASE}vercel/edge`),
    netlify: cell('yes', 'Edge Functions powered by Deno.', `${URL_BASE}netlify/edge`),
    cloudflare: cell('yes', 'Native Workers runtime.', `${URL_BASE}cf/edge`),
    self: cell('no', 'Node-only; no edge primitive.', `${URL_BASE}self/edge`),
  },
  imgopt: {
    vercel: cell('yes', 'next/image with global CDN optimization.', `${URL_BASE}vercel/img`),
    netlify: cell('yes', 'Netlify Image CDN.', `${URL_BASE}netlify/img`),
    cloudflare: cell('partial', 'Cloudflare Images add-on; not next/image native.', `${URL_BASE}cf/img`, "// next.config.js\nimages: { loader: 'custom', loaderFile: './cf-loader.ts' };\n"),
    self: cell('partial', 'Sharp runs locally; cache to disk.', `${URL_BASE}self/img`),
  },
  mw: {
    vercel: cell('yes', 'Middleware on Edge runtime.', `${URL_BASE}vercel/mw`),
    netlify: cell('yes', 'Middleware on Edge Functions.', `${URL_BASE}netlify/mw`),
    cloudflare: cell('yes', 'Workers handle middleware natively.', `${URL_BASE}cf/mw`),
    self: cell('partial', 'Runs on Node; no edge geolocation primitives.', `${URL_BASE}self/mw`),
  },
  streaming: {
    vercel: cell('yes', 'Streaming SSR fully supported.', `${URL_BASE}vercel/stream`),
    netlify: cell('yes', 'Streaming via Edge.', `${URL_BASE}netlify/stream`),
    cloudflare: cell('yes', 'TransformStream supported.', `${URL_BASE}cf/stream`),
    self: cell('yes', 'Node 18+ ReadableStream OK.', `${URL_BASE}self/stream`),
  },
  sa: {
    vercel: cell('yes', 'Server Actions GA.', `${URL_BASE}vercel/sa`),
    netlify: cell('yes', 'Supported.', `${URL_BASE}netlify/sa`),
    cloudflare: cell('partial', 'Some bindings need manual wiring.', `${URL_BASE}cf/sa`),
    self: cell('yes', 'Works on standalone server.', `${URL_BASE}self/sa`),
  },
  rsc: {
    vercel: cell('yes', 'RSC payload streaming on by default.', `${URL_BASE}vercel/rsc`),
    netlify: cell('yes', 'Full RSC support.', `${URL_BASE}netlify/rsc`),
    cloudflare: cell('yes', 'RSC streams over Workers.', `${URL_BASE}cf/rsc`),
    self: cell('yes', 'Works with `next start`.', `${URL_BASE}self/rsc`),
  },
  usecache: {
    vercel: cell('yes', 'New use cache directive supported (canary).', `${URL_BASE}vercel/usecache`),
    netlify: cell('partial', 'Behind flag; tag invalidation manual.', `${URL_BASE}netlify/usecache`),
    cloudflare: cell('workaround', 'Needs custom cache handler bound to KV.', `${URL_BASE}cf/usecache`, "// app/page.tsx\n'use cache';\n\nexport default async function Page() {\n  const data = await fetchData();\n  return <View data={data} />;\n}\n"),
    self: cell('workaround', 'Implement cacheHandler with disk or Redis.', `${URL_BASE}self/usecache`),
  },
  bgfn: {
    vercel: cell('yes', 'Vercel Functions with waitUntil().', `${URL_BASE}vercel/bg`),
    netlify: cell('yes', 'Background Functions up to 15min.', `${URL_BASE}netlify/bg`),
    cloudflare: cell('yes', 'event.waitUntil in Workers.', `${URL_BASE}cf/bg`),
    self: cell('partial', 'Roll your own queue (BullMQ, etc.).', `${URL_BASE}self/bg`),
  },
  cron: {
    vercel: cell('yes', 'Cron Jobs in dashboard / vercel.json.', `${URL_BASE}vercel/cron`),
    netlify: cell('yes', 'Scheduled functions.', `${URL_BASE}netlify/cron`),
    cloudflare: cell('yes', 'Cron Triggers in Workers.', `${URL_BASE}cf/cron`),
    self: cell('workaround', 'Use systemd timers or external scheduler.', `${URL_BASE}self/cron`),
  },
  rewrites: {
    vercel: cell('yes', 'Defined in next.config.js.', `${URL_BASE}vercel/rw`),
    netlify: cell('yes', '_redirects + next.config.js.', `${URL_BASE}netlify/rw`),
    cloudflare: cell('yes', 'next.config.js + Workers route.', `${URL_BASE}cf/rw`),
    self: cell('yes', 'next.config.js applied at runtime.', `${URL_BASE}self/rw`),
  },
  redirects: {
    vercel: cell('yes', 'Redirects honored.', `${URL_BASE}vercel/rd`),
    netlify: cell('yes', '_redirects file or config.', `${URL_BASE}netlify/rd`),
    cloudflare: cell('yes', 'Bulk redirects + Workers.', `${URL_BASE}cf/rd`),
    self: cell('yes', 'next.config.js applied at runtime.', `${URL_BASE}self/rd`),
  },
  headers: {
    vercel: cell('yes', 'Custom headers per route.', `${URL_BASE}vercel/hd`),
    netlify: cell('yes', '_headers + config.', `${URL_BASE}netlify/hd`),
    cloudflare: cell('yes', '_headers and Workers.', `${URL_BASE}cf/hd`),
    self: cell('yes', 'Standard Node headers.', `${URL_BASE}self/hd`),
  },
  draft: {
    vercel: cell('yes', 'Draft Mode + Preview deployments.', `${URL_BASE}vercel/draft`),
    netlify: cell('yes', 'Supported with preview cookie.', `${URL_BASE}netlify/draft`),
    cloudflare: cell('partial', 'Cookie set OK; cache bypass needs care.', `${URL_BASE}cf/draft`),
    self: cell('yes', 'Works out of the box.', `${URL_BASE}self/draft`),
  },
  i18n: {
    vercel: cell('yes', 'App Router i18n routing.', `${URL_BASE}vercel/i18n`),
    netlify: cell('yes', 'Locale-aware routing.', `${URL_BASE}netlify/i18n`),
    cloudflare: cell('partial', 'Locale matching in Workers needed.', `${URL_BASE}cf/i18n`),
    self: cell('yes', 'Built into Next.js runtime.', `${URL_BASE}self/i18n`),
  },
};

export const STATUS_FILL: Record<FeatureStatus, string> = {
  yes: '#22c55e',
  partial: '#eab308',
  workaround: '#f97316',
  no: '#ef4444',
};

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  yes: 'Supported',
  partial: 'Partial',
  workaround: 'Workaround',
  no: 'Not supported',
};

export const STATUS_TONE: Record<FeatureStatus, 'static' | 'warn' | 'info' | 'err'> = {
  yes: 'static',
  partial: 'warn',
  workaround: 'info',
  no: 'err',
};

export const GROUP_LABEL: Record<FeatureGroup, string> = {
  rendering: 'Rendering',
  cache: 'Cache',
  runtime: 'Runtime',
  dx: 'DX',
};

export function compatibility(hostId: HostId): number {
  let total = 0;
  let score = 0;
  for (const f of FEATURES) {
    const c = MATRIX[f.id]?.[hostId];
    if (!c) continue;
    total += 1;
    if (c.status === 'yes') score += 1;
    else if (c.status === 'partial') score += 0.66;
    else if (c.status === 'workaround') score += 0.33;
  }
  return total === 0 ? 0 : Math.round((score / total) * 100);
}
