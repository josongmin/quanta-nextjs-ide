export type StoreKind = 'local' | 'session' | 'cookie' | 'idb' | 'cache';

export interface KvEntry {
  key: string;
  value: string;
  bytes: number;
}

export interface CookieEntry {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  sameSite: 'lax' | 'strict' | 'none';
  bytes: number;
}

export interface IdbStoreSpec {
  name: string;
  records: ReadonlyArray<{ key: string; value: Record<string, unknown> }>;
}
export interface IdbDb {
  name: string;
  version: number;
  stores: ReadonlyArray<IdbStoreSpec>;
}
export interface CacheBucket {
  name: string;
  entries: ReadonlyArray<{
    url: string;
    method: 'GET' | 'POST';
    status: number;
    bytes: number;
  }>;
}

export const localKv: ReadonlyArray<KvEntry> = [
  { key: 'theme', value: '"light"', bytes: 8 },
  { key: 'user.id', value: '"u_24fa"', bytes: 16 },
  { key: 'recent.routes', value: '["/","/about"]', bytes: 32 },
  { key: 'feature.flags', value: '{"new-checkout":true}', bytes: 64 },
  { key: 'lang', value: '"en-US"', bytes: 12 },
  { key: 'tz', value: '"America/Los_Angeles"', bytes: 24 },
  { key: 'consent', value: '{"analytics":true}', bytes: 56 },
  { key: 'returning', value: 'true', bytes: 8 },
];

export const sessionKv: ReadonlyArray<KvEntry> = [
  { key: 'csrf', value: '"abc123…"', bytes: 24 },
  { key: 'cart.draft', value: '{"items":2}', bytes: 48 },
  { key: 'wizard.step', value: '3', bytes: 4 },
  { key: 'modal.last', value: '"login"', bytes: 16 },
];

export const cookies: ReadonlyArray<CookieEntry> = [
  {
    name: 'session',
    value: 'eyJhbGciOiJI…',
    domain: '.example.com',
    path: '/',
    expires: '2026-06-01',
    sameSite: 'lax',
    bytes: 256,
  },
  {
    name: 'csrf-token',
    value: '8f2c…',
    domain: '.example.com',
    path: '/',
    expires: 'Session',
    sameSite: 'strict',
    bytes: 32,
  },
  {
    name: '_ga',
    value: 'GA1.2.…',
    domain: '.example.com',
    path: '/',
    expires: '2027-05-01',
    sameSite: 'lax',
    bytes: 48,
  },
  {
    name: 'consent',
    value: 'all',
    domain: '.example.com',
    path: '/',
    expires: '2026-12-01',
    sameSite: 'lax',
    bytes: 16,
  },
  {
    name: 'experiment',
    value: 'B',
    domain: '.example.com',
    path: '/',
    expires: '2026-08-01',
    sameSite: 'lax',
    bytes: 8,
  },
  {
    name: 'partner-ref',
    value: 'pr_88',
    domain: '.example.com',
    path: '/',
    expires: '2026-05-15',
    sameSite: 'none',
    bytes: 16,
  },
];

const buildIdbRecords = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => ({
    key: `${prefix}-${(i + 1).toString().padStart(3, '0')}`,
    value: {
      id: `${prefix}-${i + 1}`,
      title: `Record ${i + 1}`,
      ts: 1714000000 + i * 60,
      bytes: 100 + i * 12,
    },
  }));

export const idbDbs: ReadonlyArray<IdbDb> = [
  {
    name: 'app-cache',
    version: 3,
    stores: [
      { name: 'queries', records: buildIdbRecords(20, 'q') },
      { name: 'mutations', records: buildIdbRecords(12, 'm') },
    ],
  },
  {
    name: 'media-store',
    version: 1,
    stores: [
      { name: 'thumbs', records: buildIdbRecords(30, 't') },
      { name: 'meta', records: buildIdbRecords(15, 'me') },
      { name: 'hashes', records: buildIdbRecords(12, 'h') },
    ],
  },
];

const buildCacheEntries = (prefix: string) =>
  Array.from({ length: 8 }, (_, i) => ({
    url: `https://cdn.example.com/${prefix}/${(i + 1).toString().padStart(3, '0')}.js`,
    method: 'GET' as const,
    status: 200,
    bytes: 1024 * (i + 1),
  }));

export const cacheBuckets: ReadonlyArray<CacheBucket> = [
  { name: 'app-shell-v1', entries: buildCacheEntries('shell') },
  { name: 'fonts-v2', entries: buildCacheEntries('fonts') },
  { name: 'images-v1', entries: buildCacheEntries('images') },
];

export function totalBytesLocal(): number {
  return localKv.reduce((a, x) => a + x.bytes, 0);
}
export function totalBytesSession(): number {
  return sessionKv.reduce((a, x) => a + x.bytes, 0);
}
export function totalBytesCookies(): number {
  return cookies.reduce((a, x) => a + x.bytes, 0);
}
export function totalBytesIdb(): number {
  return idbDbs.reduce(
    (a, db) =>
      a +
      db.stores.reduce(
        (b, s) => b + s.records.reduce((c, r) => c + (r.value['bytes'] as number ?? 0), 0),
        0,
      ),
    0,
  );
}
export function totalBytesCache(): number {
  return cacheBuckets.reduce(
    (a, b) => a + b.entries.reduce((c, e) => c + e.bytes, 0),
    0,
  );
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export const KIND_LABEL: Record<StoreKind, string> = {
  local: 'LocalStorage',
  session: 'SessionStorage',
  cookie: 'Cookies',
  idb: 'IndexedDB',
  cache: 'Cache API',
};

export interface RecordView {
  title: string;
  json: string;
  meta: ReadonlyArray<{ k: string; v: string }>;
}
