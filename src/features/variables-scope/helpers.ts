export type ScopeKind = 'Local' | 'Closure' | 'Module' | 'Global';

export type VarValue =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'undefined' }
  | { kind: 'object'; entries: ReadonlyArray<VarEntry> }
  | { kind: 'array'; entries: ReadonlyArray<VarEntry> }
  | { kind: 'function'; signature: string };

export interface VarEntry {
  id: string;
  name: string;
  type: string;
  value: VarValue;
  isFrozen?: boolean;
  isProxy?: boolean;
}

export interface ScopeGroup {
  kind: ScopeKind;
  entries: ReadonlyArray<VarEntry>;
}

const s = (id: string, name: string, value: string): VarEntry => ({
  id,
  name,
  type: 'string',
  value: { kind: 'string', value },
});
const n = (id: string, name: string, value: number): VarEntry => ({
  id,
  name,
  type: 'number',
  value: { kind: 'number', value },
});
const b = (id: string, name: string, value: boolean): VarEntry => ({
  id,
  name,
  type: 'boolean',
  value: { kind: 'boolean', value },
});
const obj = (
  id: string,
  name: string,
  entries: ReadonlyArray<VarEntry>,
  opts?: { type?: string; frozen?: boolean; proxy?: boolean },
): VarEntry => ({
  id,
  name,
  type: opts?.type ?? 'Object',
  value: { kind: 'object', entries },
  ...(opts?.frozen !== undefined ? { isFrozen: opts.frozen } : {}),
  ...(opts?.proxy !== undefined ? { isProxy: opts.proxy } : {}),
});
const arr = (
  id: string,
  name: string,
  entries: ReadonlyArray<VarEntry>,
  type = 'Array',
): VarEntry => ({
  id,
  name,
  type,
  value: { kind: 'array', entries },
});
const fn = (id: string, name: string, signature: string): VarEntry => ({
  id,
  name,
  type: 'function',
  value: { kind: 'function', signature },
});

export const mockScopes: ReadonlyArray<ScopeGroup> = [
  {
    kind: 'Local',
    entries: [
      s('lc_id', 'id', 'sku_88421'),
      obj('lc_params', 'params', [
        s('lc_params_id', 'id', 'sku_88421'),
        s('lc_params_locale', 'locale', 'en-US'),
      ]),
      obj('lc_session', 'session', [
        s('lc_session_uid', 'userId', 'usr_4421'),
        s('lc_session_email', 'email', 'shopper@example.com'),
        b('lc_session_admin', 'isAdmin', false),
      ]),
      obj(
        'lc_product',
        'product',
        [
          s('lc_product_id', 'id', 'sku_88421'),
          s('lc_product_title', 'title', 'Walnut Side Table'),
          n('lc_product_price', 'priceCents', 12900),
          arr('lc_product_tags', 'tags', [
            s('lc_product_t0', '0', 'furniture'),
            s('lc_product_t1', '1', 'living-room'),
            s('lc_product_t2', '2', 'wooden'),
          ]),
          obj(
            'lc_product_dim',
            'dimensions',
            [
              n('lc_pd_w', 'width', 24),
              n('lc_pd_h', 'height', 30),
              n('lc_pd_d', 'depth', 18),
            ],
            { frozen: true },
          ),
        ],
        { type: 'Product', frozen: true },
      ),
      obj('lc_request', 'request', [
        s('lc_req_method', 'method', 'GET'),
        s('lc_req_url', 'url', '/products/sku_88421'),
      ]),
      n('lc_qty', 'qty', 3),
      b('lc_isPreview', 'isPreview', false),
    ],
  },
  {
    kind: 'Closure',
    entries: [
      fn('cl_fetch', 'fetchProduct', '(id: string) => Promise<Product>'),
      fn('cl_cached', 'cachedFetch', '<T>(key: string, fn: () => T) => T'),
      obj('cl_cacheTags', 'cacheTags', [
        s('cl_t0', '0', 'product:sku_88421'),
        s('cl_t1', '1', 'inventory:warehouse-1'),
      ]),
      n('cl_revalidate', 'revalidate', 60),
      s('cl_locale', 'locale', 'en-US'),
      b('cl_isDraft', 'isDraft', false),
      obj(
        'cl_logger',
        'logger',
        [s('cl_log_ns', 'namespace', 'app:product')],
        { proxy: true },
      ),
    ],
  },
  {
    kind: 'Module',
    entries: [
      fn('m_notFound', 'notFound', '() => never'),
      fn('m_redirect', 'redirect', '(url: string) => never'),
      obj('m_db', 'db', [
        fn('m_db_query', 'query', '<T>(sql: string) => Promise<T[]>'),
        s('m_db_url', 'url', 'postgres://localhost/shop'),
      ]),
      arr('m_caches', 'caches', [
        s('m_caches_0', '0', 'fetch-cache'),
        s('m_caches_1', '1', 'tag-cache'),
        s('m_caches_2', '2', 'react-cache'),
      ]),
      s('m_envName', 'envName', 'production'),
      n('m_buildId', 'buildId', 12041),
    ],
  },
  {
    kind: 'Global',
    entries: [
      obj('g_process', 'process', [
        s('g_process_v', 'version', 'v20.11.1'),
        s('g_process_arch', 'arch', 'arm64'),
        obj('g_process_env', 'env', [
          s('g_pe_node', 'NODE_ENV', 'production'),
          s('g_pe_url', 'NEXT_PUBLIC_URL', 'https://shop.example'),
        ]),
      ]),
      obj('g_globalThis', 'globalThis', [
        s('g_gt_kind', 'runtime', 'node'),
      ]),
      fn('g_fetch', 'fetch', '(input: RequestInfo) => Promise<Response>'),
      fn('g_setTimeout', 'setTimeout', '(cb, ms) => Timer'),
      obj('g_console', 'console', [
        fn('g_console_log', 'log', '(...args) => void'),
        fn('g_console_warn', 'warn', '(...args) => void'),
      ]),
      s('g_userAgent', 'process.platform', 'darwin'),
    ],
  },
];

export function previewVar(v: VarValue): string {
  switch (v.kind) {
    case 'string':
      return JSON.stringify(v.value);
    case 'number':
      return String(v.value);
    case 'boolean':
      return v.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'function':
      return `ƒ ${v.signature}`;
    case 'object': {
      const inner = v.entries.slice(0, 3).map((e) => `${e.name}:…`).join(', ');
      return `{ ${inner}${v.entries.length > 3 ? ', …' : ''} }`;
    }
    case 'array':
      return `Array(${v.entries.length})`;
  }
}

export function stringifyVar(v: VarValue, depth = 0): string {
  const pad = '  '.repeat(depth);
  const next = '  '.repeat(depth + 1);
  switch (v.kind) {
    case 'string':
      return JSON.stringify(v.value);
    case 'number':
      return String(v.value);
    case 'boolean':
      return v.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'function':
      return `function ${v.signature}`;
    case 'object': {
      if (v.entries.length === 0) return '{}';
      const inner = v.entries
        .map((e) => `${next}${JSON.stringify(e.name)}: ${stringifyVar(e.value, depth + 1)}`)
        .join(',\n');
      return `{\n${inner}\n${pad}}`;
    }
    case 'array': {
      if (v.entries.length === 0) return '[]';
      const inner = v.entries
        .map((e) => `${next}${stringifyVar(e.value, depth + 1)}`)
        .join(',\n');
      return `[\n${inner}\n${pad}]`;
    }
  }
}
