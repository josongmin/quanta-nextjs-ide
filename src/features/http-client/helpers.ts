export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const METHODS: ReadonlyArray<HttpMethod> = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

export interface UrlSegment {
  text: string;
  isVar: boolean;
}

export function tokenizeUrl(url: string): ReadonlyArray<UrlSegment> {
  const out: UrlSegment[] = [];
  const re = /\{\{[^}]+\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(url)) !== null) {
    if (m.index > last) {
      out.push({ text: url.slice(last, m.index), isVar: false });
    }
    out.push({ text: m[0], isVar: true });
    last = m.index + m[0].length;
  }
  if (last < url.length) out.push({ text: url.slice(last), isVar: false });
  return out;
}

export interface HttpHeader {
  key: string;
  value: string;
}

export interface SavedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: ReadonlyArray<HttpHeader>;
  body: string;
}

export interface HttpEnv {
  id: 'dev' | 'staging';
  name: string;
  vars: Record<string, string>;
}

export interface HistoryEntry {
  id: string;
  reqId: string;
  method: HttpMethod;
  url: string;
  status: number;
  ms: number;
  size: string;
  body: string;
  ts: number;
}

export const ENVS: ReadonlyArray<HttpEnv> = [
  {
    id: 'dev',
    name: 'dev',
    vars: {
      API_BASE: 'http://localhost:3000/api',
      TOKEN: 'dev-tok-12345',
      USER_ID: 'u_001',
    },
  },
  {
    id: 'staging',
    name: 'staging',
    vars: {
      API_BASE: 'https://staging.quanta.dev/api',
      TOKEN: 'stg-tok-99887',
      USER_ID: 'u_777',
    },
  },
];

export const SAVED_REQUESTS: ReadonlyArray<SavedRequest> = [
  {
    id: 'req_list_products',
    name: 'List products',
    method: 'GET',
    url: '{{API_BASE}}/products?limit=20',
    headers: [
      { key: 'Authorization', value: 'Bearer {{TOKEN}}' },
      { key: 'Accept', value: 'application/json' },
    ],
    body: '',
  },
  {
    id: 'req_get_product',
    name: 'Get product by id',
    method: 'GET',
    url: '{{API_BASE}}/products/123',
    headers: [{ key: 'Authorization', value: 'Bearer {{TOKEN}}' }],
    body: '',
  },
  {
    id: 'req_create_product',
    name: 'Create product',
    method: 'POST',
    url: '{{API_BASE}}/products',
    headers: [
      { key: 'Authorization', value: 'Bearer {{TOKEN}}' },
      { key: 'Content-Type', value: 'application/json' },
    ],
    body: '{\n  "name": "Hex Mug",\n  "price": 19.99,\n  "stock": 42\n}',
  },
  {
    id: 'req_update_product',
    name: 'Update product price',
    method: 'PATCH',
    url: '{{API_BASE}}/products/123',
    headers: [
      { key: 'Authorization', value: 'Bearer {{TOKEN}}' },
      { key: 'Content-Type', value: 'application/json' },
    ],
    body: '{\n  "price": 24.50\n}',
  },
  {
    id: 'req_delete_product',
    name: 'Delete product',
    method: 'DELETE',
    url: '{{API_BASE}}/products/123',
    headers: [{ key: 'Authorization', value: 'Bearer {{TOKEN}}' }],
    body: '',
  },
  {
    id: 'req_checkout',
    name: 'Start checkout',
    method: 'POST',
    url: '{{API_BASE}}/checkout',
    headers: [
      { key: 'Authorization', value: 'Bearer {{TOKEN}}' },
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-User', value: '{{USER_ID}}' },
    ],
    body: '{\n  "cartId": "c_42",\n  "currency": "USD"\n}',
  },
  {
    id: 'req_search',
    name: 'Search items',
    method: 'GET',
    url: '{{API_BASE}}/search?q=mug&limit=10',
    headers: [{ key: 'Accept', value: 'application/json' }],
    body: '',
  },
  {
    id: 'req_me',
    name: 'Current user',
    method: 'GET',
    url: '{{API_BASE}}/me',
    headers: [{ key: 'Authorization', value: 'Bearer {{TOKEN}}' }],
    body: '',
  },
];

export const INITIAL_HISTORY: ReadonlyArray<HistoryEntry> = [
  {
    id: 'h_01',
    reqId: 'req_list_products',
    method: 'GET',
    url: '/products?limit=20',
    status: 200,
    ms: 78,
    size: '4.2kb',
    body: '{"items":[{"id":1,"name":"Mug"},{"id":2,"name":"Tee"}],"total":2}',
    ts: 1714490000000,
  },
  {
    id: 'h_02',
    reqId: 'req_get_product',
    method: 'GET',
    url: '/products/123',
    status: 200,
    ms: 41,
    size: '612b',
    body: '{"id":123,"name":"Hex Mug","price":19.99}',
    ts: 1714490100000,
  },
  {
    id: 'h_03',
    reqId: 'req_create_product',
    method: 'POST',
    url: '/products',
    status: 201,
    ms: 132,
    size: '512b',
    body: '{"id":456,"name":"Hex Mug","price":19.99,"stock":42}',
    ts: 1714490300000,
  },
  {
    id: 'h_04',
    reqId: 'req_update_product',
    method: 'PATCH',
    url: '/products/123',
    status: 200,
    ms: 89,
    size: '420b',
    body: '{"id":123,"price":24.5}',
    ts: 1714490500000,
  },
  {
    id: 'h_05',
    reqId: 'req_delete_product',
    method: 'DELETE',
    url: '/products/123',
    status: 204,
    ms: 65,
    size: '0b',
    body: '',
    ts: 1714490700000,
  },
  {
    id: 'h_06',
    reqId: 'req_checkout',
    method: 'POST',
    url: '/checkout',
    status: 402,
    ms: 211,
    size: '128b',
    body: '{"error":"payment_required"}',
    ts: 1714490900000,
  },
  {
    id: 'h_07',
    reqId: 'req_search',
    method: 'GET',
    url: '/search?q=mug',
    status: 200,
    ms: 110,
    size: '2.1kb',
    body: '{"hits":[{"id":1},{"id":42}]}',
    ts: 1714491100000,
  },
  {
    id: 'h_08',
    reqId: 'req_me',
    method: 'GET',
    url: '/me',
    status: 401,
    ms: 22,
    size: '64b',
    body: '{"error":"unauthorized"}',
    ts: 1714491300000,
  },
  {
    id: 'h_09',
    reqId: 'req_list_products',
    method: 'GET',
    url: '/products?limit=20',
    status: 200,
    ms: 84,
    size: '4.2kb',
    body: '{"items":[{"id":1},{"id":2}],"total":2}',
    ts: 1714491500000,
  },
  {
    id: 'h_10',
    reqId: 'req_create_product',
    method: 'POST',
    url: '/products',
    status: 500,
    ms: 305,
    size: '96b',
    body: '{"error":"internal"}',
    ts: 1714491700000,
  },
];

export function statusTone(status: number): 'static' | 'warn' | 'err' | 'info' {
  if (status >= 500) return 'err';
  if (status >= 400) return 'warn';
  if (status >= 300) return 'info';
  return 'static';
}

export function methodTone(
  m: HttpMethod,
): 'info' | 'static' | 'warn' | 'err' | 'accent' {
  switch (m) {
    case 'GET':
      return 'info';
    case 'POST':
      return 'static';
    case 'PUT':
    case 'PATCH':
      return 'warn';
    case 'DELETE':
      return 'err';
  }
}

export function relativeTimeMs(ts: number, now = 1714500000000): string {
  const ms = now - ts;
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}
