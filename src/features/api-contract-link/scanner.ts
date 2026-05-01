// Discover frontend callers and backend handlers for HTTP/RPC endpoints.
// Operates over an in-memory snapshot of project files (no FS dependency).

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface CallSite {
  file: string;
  line: number;
  snippet: string;
  client: 'fetch' | 'axios' | 'trpc' | 'hono' | 'server-action' | 'unknown';
}

export interface RawCaller {
  endpoint: string;
  method: HttpMethod;
  call: CallSite;
}

export interface RawHandler {
  endpoint: string;
  method: HttpMethod;
  file: string;
  line: number;
  returnTypeHint?: string;
  inputTypeHint?: string;
}

export interface SourceFile {
  file: string;
  source: string;
}

const FETCH_RE =
  /\bfetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*({[^}]*}))?/g;
const AXIOS_RE =
  /\baxios\s*\.\s*(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
const TRPC_RE =
  /\b(?:trpc|api)\s*\.\s*(\w+)\s*\.\s*(\w+)\s*\.\s*(query|mutate|useQuery|useMutation)\s*\(/g;
const ACTION_INVOKE_RE =
  /\b(?:formAction|action|invoke)\s*[:=]\s*\{?\s*(\w+Action)\b/g;
const HANDLER_EXPORT_RE =
  /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)\s*(?::\s*([^\n{]+))?/g;
const ACTION_DEFN_RE =
  /export\s+async\s+function\s+(\w+Action)\s*\(([^)]*)\)\s*(?::\s*([^\n{]+))?/g;

function lineOf(src: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx; i++) if (src[i] === '\n') line++;
  return line;
}

function snippet(src: string, line: number): string {
  return (src.split('\n')[line - 1] ?? '').trim();
}

function inferMethodFromOptions(opts: string | undefined): HttpMethod {
  if (!opts) return 'GET';
  const m = /method\s*:\s*['"`](\w+)['"`]/.exec(opts);
  return (m?.[1]?.toUpperCase() as HttpMethod) ?? 'GET';
}

function fileToRoutePath(file: string): string | null {
  const m =
    /(?:^|\/)(?:src\/)?app\/(.+?)\/route\.(?:tsx?|jsx?)$/.exec(file) ??
    /(?:^|\/)pages\/api\/(.+?)\.(?:tsx?|jsx?)$/.exec(file);
  if (!m) return null;
  let path = '/' + m[1]!.replace(/\(([^)]+)\)\//g, ''); // strip route groups
  path = path.replace(/\[([^\]]+)\]/g, ':$1'); // [id] → :id
  path = path.replace(/\/+/g, '/').replace(/\/$/, '');
  if (!path.startsWith('/api')) path = path.startsWith('/api/') ? path : `/api${path === '' ? '' : path}`;
  return path;
}

export function scanCallers(files: SourceFile[]): RawCaller[] {
  const out: RawCaller[] = [];
  for (const { file, source } of files) {
    let m: RegExpExecArray | null;

    FETCH_RE.lastIndex = 0;
    while ((m = FETCH_RE.exec(source)) !== null) {
      const url = m[1] ?? '';
      if (!url.startsWith('/api') && !/\/api\//.test(url)) continue;
      const line = lineOf(source, m.index);
      out.push({
        endpoint: url,
        method: inferMethodFromOptions(m[2]),
        call: { file, line, snippet: snippet(source, line), client: 'fetch' },
      });
    }

    AXIOS_RE.lastIndex = 0;
    while ((m = AXIOS_RE.exec(source)) !== null) {
      const method = (m[1] ?? 'GET').toUpperCase() as HttpMethod;
      const url = m[2] ?? '';
      const line = lineOf(source, m.index);
      out.push({
        endpoint: url,
        method,
        call: { file, line, snippet: snippet(source, line), client: 'axios' },
      });
    }

    TRPC_RE.lastIndex = 0;
    while ((m = TRPC_RE.exec(source)) !== null) {
      const router = m[1] ?? 'root';
      const procedure = m[2] ?? 'unknown';
      const verb = m[3] ?? '';
      const method: HttpMethod =
        verb === 'mutate' || verb === 'useMutation' ? 'POST' : 'GET';
      const line = lineOf(source, m.index);
      out.push({
        endpoint: `trpc:${router}.${procedure}`,
        method,
        call: { file, line, snippet: snippet(source, line), client: 'trpc' },
      });
    }

    ACTION_INVOKE_RE.lastIndex = 0;
    while ((m = ACTION_INVOKE_RE.exec(source)) !== null) {
      const name = m[1] ?? '';
      if (!name) continue;
      const line = lineOf(source, m.index);
      out.push({
        endpoint: `action:${name}`,
        method: 'POST',
        call: {
          file,
          line,
          snippet: snippet(source, line),
          client: 'server-action',
        },
      });
    }
  }
  return out;
}

export function scanHandlers(files: SourceFile[]): RawHandler[] {
  const out: RawHandler[] = [];
  for (const { file, source } of files) {
    const routePath = fileToRoutePath(file);
    let m: RegExpExecArray | null;

    if (routePath) {
      HANDLER_EXPORT_RE.lastIndex = 0;
      while ((m = HANDLER_EXPORT_RE.exec(source)) !== null) {
        const method = m[1] as HttpMethod;
        const params = m[2] ?? '';
        const ret = (m[3] ?? '').trim();
        out.push({
          endpoint: routePath,
          method,
          file,
          line: lineOf(source, m.index),
          ...(ret ? { returnTypeHint: ret } : {}),
          ...(params ? { inputTypeHint: params } : {}),
        });
      }
    }

    if (/actions?\.(?:tsx?|jsx?)$/.test(file)) {
      ACTION_DEFN_RE.lastIndex = 0;
      while ((m = ACTION_DEFN_RE.exec(source)) !== null) {
        const name = m[1] ?? '';
        const params = m[2] ?? '';
        const ret = (m[3] ?? '').trim();
        out.push({
          endpoint: `action:${name}`,
          method: 'POST',
          file,
          line: lineOf(source, m.index),
          ...(ret ? { returnTypeHint: ret } : {}),
          ...(params ? { inputTypeHint: params } : {}),
        });
      }
    }
  }
  return out;
}
