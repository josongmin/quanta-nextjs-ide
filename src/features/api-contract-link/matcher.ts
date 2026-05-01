import type {
  CallSite,
  HttpMethod,
  RawCaller,
  RawHandler,
} from './scanner';

export interface ApiContract {
  id: string;
  endpoint: string;
  method: HttpMethod;
  callers: CallSite[];
  handler: {
    file: string;
    line: number;
    requestType?: string;
    responseType?: string;
  } | null;
  status: 'matched' | 'orphan-caller' | 'orphan-handler';
  drift?: string;
}

function normalize(endpoint: string): string {
  // Replace dynamic segments to a canonical form: [id]/:id → :*
  return endpoint
    .replace(/\[\.{3}\w+\]/g, ':...')
    .replace(/\[\w+\]/g, ':*')
    .replace(/:\w+/g, ':*');
}

function pathsMatch(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

export function matchContracts(
  callers: RawCaller[],
  handlers: RawHandler[],
): ApiContract[] {
  const result: ApiContract[] = [];
  const usedHandlers = new Set<RawHandler>();

  // Group callers by (method, normalized endpoint).
  const callerGroups = new Map<string, RawCaller[]>();
  for (const c of callers) {
    const key = `${c.method} ${normalize(c.endpoint)}`;
    const arr = callerGroups.get(key) ?? [];
    arr.push(c);
    callerGroups.set(key, arr);
  }

  for (const [key, group] of callerGroups) {
    const first = group[0]!;
    const handler = handlers.find(
      (h) =>
        !usedHandlers.has(h) &&
        h.method === first.method &&
        pathsMatch(h.endpoint, first.endpoint),
    );
    if (handler) usedHandlers.add(handler);
    result.push({
      id: `c:${key}`,
      endpoint: first.endpoint,
      method: first.method,
      callers: group.map((g) => g.call),
      handler: handler
        ? {
            file: handler.file,
            line: handler.line,
            ...(handler.inputTypeHint ? { requestType: handler.inputTypeHint } : {}),
            ...(handler.returnTypeHint ? { responseType: handler.returnTypeHint } : {}),
          }
        : null,
      status: handler ? 'matched' : 'orphan-caller',
    });
  }

  for (const h of handlers) {
    if (usedHandlers.has(h)) continue;
    result.push({
      id: `h:${h.method} ${normalize(h.endpoint)}`,
      endpoint: h.endpoint,
      method: h.method,
      callers: [],
      handler: {
        file: h.file,
        line: h.line,
        ...(h.inputTypeHint ? { requestType: h.inputTypeHint } : {}),
        ...(h.returnTypeHint ? { responseType: h.returnTypeHint } : {}),
      },
      status: 'orphan-handler',
    });
  }

  return result.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}
