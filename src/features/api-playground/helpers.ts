export type ApiProtocol = 'REST' | 'GraphQL' | 'tRPC';
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiParamType = 'string' | 'number' | 'boolean' | 'enum';

export interface ApiParam {
  name: string;
  type: ApiParamType;
  required: boolean;
  default?: string | number | boolean;
  enumValues?: ReadonlyArray<string>;
}

export interface ApiResponseSnapshot {
  id: string;
  status: number;
  ms: number;
  at: string;
  body: string;
}

export interface ApiEndpointDef {
  id: string;
  protocol: ApiProtocol;
  method?: ApiMethod;
  path: string;
  operation?: string;
  group: string;
  description: string;
  params: ReadonlyArray<ApiParam>;
  responseSchema: Record<string, string>;
  recentResponses: ReadonlyArray<ApiResponseSnapshot>;
}

export const apiEndpoints: ReadonlyArray<ApiEndpointDef> = [
  {
    id: 'rest-list-users',
    protocol: 'REST',
    method: 'GET',
    path: '/api/users',
    group: 'users',
    description: 'List users with pagination',
    params: [
      { name: 'page', type: 'number', required: false, default: 1 },
      { name: 'limit', type: 'number', required: false, default: 20 },
      { name: 'q', type: 'string', required: false },
    ],
    responseSchema: {
      data: 'User[]',
      page: 'number',
      total: 'number',
    },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 86,
        at: '2026-04-29T10:14:21Z',
        body: JSON.stringify({ data: [{ id: 'u_1', email: 'a@x.io' }], page: 1, total: 1 }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 92,
        at: '2026-04-29T09:11:01Z',
        body: JSON.stringify({ data: [], page: 1, total: 0 }, null, 2),
      },
      {
        id: 'r3',
        status: 401,
        ms: 12,
        at: '2026-04-28T18:00:00Z',
        body: JSON.stringify({ error: 'Unauthorized' }, null, 2),
      },
    ],
  },
  {
    id: 'rest-create-user',
    protocol: 'REST',
    method: 'POST',
    path: '/api/users',
    group: 'users',
    description: 'Create a new user',
    params: [
      { name: 'email', type: 'string', required: true },
      { name: 'name', type: 'string', required: false },
      { name: 'role', type: 'enum', required: true, enumValues: ['admin', 'user', 'guest'] },
    ],
    responseSchema: { id: 'string', email: 'string', role: 'string' },
    recentResponses: [
      {
        id: 'r1',
        status: 201,
        ms: 142,
        at: '2026-04-29T08:00:00Z',
        body: JSON.stringify({ id: 'u_42', email: 'a@x.io', role: 'user' }, null, 2),
      },
      {
        id: 'r2',
        status: 422,
        ms: 22,
        at: '2026-04-28T22:01:00Z',
        body: JSON.stringify({ error: 'email taken' }, null, 2),
      },
      {
        id: 'r3',
        status: 201,
        ms: 138,
        at: '2026-04-28T18:21:00Z',
        body: JSON.stringify({ id: 'u_41', email: 'b@x.io', role: 'admin' }, null, 2),
      },
    ],
  },
  {
    id: 'rest-get-post',
    protocol: 'REST',
    method: 'GET',
    path: '/api/posts/:id',
    group: 'posts',
    description: 'Fetch one post by id',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'includeAuthor', type: 'boolean', required: false, default: true },
    ],
    responseSchema: { id: 'string', title: 'string', author: 'User?' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 64,
        at: '2026-04-29T10:01:00Z',
        body: JSON.stringify({ id: 'p_1', title: 'Hello', author: { id: 'u_1' } }, null, 2),
      },
      {
        id: 'r2',
        status: 404,
        ms: 8,
        at: '2026-04-28T14:50:00Z',
        body: JSON.stringify({ error: 'not found' }, null, 2),
      },
      {
        id: 'r3',
        status: 200,
        ms: 71,
        at: '2026-04-28T13:00:00Z',
        body: JSON.stringify({ id: 'p_2', title: 'World' }, null, 2),
      },
    ],
  },
  {
    id: 'rest-update-post',
    protocol: 'REST',
    method: 'PATCH',
    path: '/api/posts/:id',
    group: 'posts',
    description: 'Update a post',
    params: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: false },
      { name: 'body', type: 'string', required: false },
      { name: 'published', type: 'boolean', required: false, default: false },
    ],
    responseSchema: { id: 'string', updatedAt: 'string' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 102,
        at: '2026-04-29T10:11:00Z',
        body: JSON.stringify({ id: 'p_1', updatedAt: '2026-04-29T10:11:00Z' }, null, 2),
      },
      {
        id: 'r2',
        status: 403,
        ms: 14,
        at: '2026-04-28T19:00:00Z',
        body: JSON.stringify({ error: 'forbidden' }, null, 2),
      },
      {
        id: 'r3',
        status: 200,
        ms: 88,
        at: '2026-04-28T17:00:00Z',
        body: JSON.stringify({ id: 'p_3', updatedAt: '2026-04-28T17:00:00Z' }, null, 2),
      },
    ],
  },
  {
    id: 'rest-delete-post',
    protocol: 'REST',
    method: 'DELETE',
    path: '/api/posts/:id',
    group: 'posts',
    description: 'Delete a post',
    params: [{ name: 'id', type: 'string', required: true }],
    responseSchema: { ok: 'boolean' },
    recentResponses: [
      {
        id: 'r1',
        status: 204,
        ms: 31,
        at: '2026-04-29T09:00:00Z',
        body: '',
      },
      {
        id: 'r2',
        status: 404,
        ms: 12,
        at: '2026-04-28T15:00:00Z',
        body: JSON.stringify({ error: 'not found' }, null, 2),
      },
      {
        id: 'r3',
        status: 204,
        ms: 28,
        at: '2026-04-28T14:00:00Z',
        body: '',
      },
    ],
  },
  {
    id: 'gql-list-posts',
    protocol: 'GraphQL',
    operation: 'query Posts',
    path: '/graphql',
    group: 'posts',
    description: 'List posts with author',
    params: [
      { name: 'limit', type: 'number', required: false, default: 10 },
      { name: 'after', type: 'string', required: false },
    ],
    responseSchema: { posts: 'Post[]', cursor: 'string?' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 121,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ data: { posts: [], cursor: null } }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 102,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ data: { posts: [{ id: 'p_1' }], cursor: 'c1' } }, null, 2),
      },
      {
        id: 'r3',
        status: 400,
        ms: 18,
        at: '2026-04-28T19:00:00Z',
        body: JSON.stringify({ errors: [{ message: 'invalid syntax' }] }, null, 2),
      },
    ],
  },
  {
    id: 'gql-create-comment',
    protocol: 'GraphQL',
    operation: 'mutation CreateComment',
    path: '/graphql',
    group: 'comments',
    description: 'Add a comment to a post',
    params: [
      { name: 'postId', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
    ],
    responseSchema: { id: 'string', body: 'string' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 92,
        at: '2026-04-29T10:09:00Z',
        body: JSON.stringify({ data: { createComment: { id: 'c_1', body: 'Nice' } } }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 88,
        at: '2026-04-28T22:00:00Z',
        body: JSON.stringify({ data: { createComment: { id: 'c_2', body: 'OK' } } }, null, 2),
      },
      {
        id: 'r3',
        status: 401,
        ms: 12,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ errors: [{ message: 'auth required' }] }, null, 2),
      },
    ],
  },
  {
    id: 'gql-me',
    protocol: 'GraphQL',
    operation: 'query Me',
    path: '/graphql',
    group: 'auth',
    description: 'Current authenticated user',
    params: [],
    responseSchema: { me: 'User' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 38,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ data: { me: { id: 'u_1', email: 'a@x.io' } } }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 32,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ data: { me: { id: 'u_1', email: 'a@x.io' } } }, null, 2),
      },
      {
        id: 'r3',
        status: 401,
        ms: 8,
        at: '2026-04-28T18:00:00Z',
        body: JSON.stringify({ errors: [{ message: 'no session' }] }, null, 2),
      },
    ],
  },
  {
    id: 'trpc-user-list',
    protocol: 'tRPC',
    operation: 'user.list',
    path: '/trpc/user.list',
    group: 'users',
    description: 'tRPC user list query',
    params: [
      { name: 'limit', type: 'number', required: false, default: 20 },
      { name: 'role', type: 'enum', required: false, enumValues: ['admin', 'user', 'guest'] },
    ],
    responseSchema: { items: 'User[]' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 54,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ result: { data: { items: [] } } }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 49,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ result: { data: { items: [{ id: 'u_1' }] } } }, null, 2),
      },
      {
        id: 'r3',
        status: 200,
        ms: 60,
        at: '2026-04-28T19:00:00Z',
        body: JSON.stringify({ result: { data: { items: [{ id: 'u_2' }] } } }, null, 2),
      },
    ],
  },
  {
    id: 'trpc-post-create',
    protocol: 'tRPC',
    operation: 'post.create',
    path: '/trpc/post.create',
    group: 'posts',
    description: 'tRPC post create mutation',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
      { name: 'tagIds', type: 'string', required: false },
    ],
    responseSchema: { id: 'string', title: 'string' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 130,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ result: { data: { id: 'p_99', title: 'New' } } }, null, 2),
      },
      {
        id: 'r2',
        status: 422,
        ms: 21,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ error: { code: 'BAD_REQUEST' } }, null, 2),
      },
      {
        id: 'r3',
        status: 200,
        ms: 145,
        at: '2026-04-28T19:00:00Z',
        body: JSON.stringify({ result: { data: { id: 'p_98', title: 'Old' } } }, null, 2),
      },
    ],
  },
  {
    id: 'trpc-tag-list',
    protocol: 'tRPC',
    operation: 'tag.list',
    path: '/trpc/tag.list',
    group: 'tags',
    description: 'tRPC tag list',
    params: [{ name: 'q', type: 'string', required: false }],
    responseSchema: { items: 'Tag[]' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 22,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ result: { data: { items: [] } } }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 24,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ result: { data: { items: [{ id: 't_1' }] } } }, null, 2),
      },
      {
        id: 'r3',
        status: 200,
        ms: 21,
        at: '2026-04-28T19:00:00Z',
        body: JSON.stringify({ result: { data: { items: [{ id: 't_2' }] } } }, null, 2),
      },
    ],
  },
  {
    id: 'rest-health',
    protocol: 'REST',
    method: 'GET',
    path: '/api/health',
    group: 'system',
    description: 'Service health check',
    params: [],
    responseSchema: { ok: 'boolean', uptime: 'number' },
    recentResponses: [
      {
        id: 'r1',
        status: 200,
        ms: 4,
        at: '2026-04-29T10:00:00Z',
        body: JSON.stringify({ ok: true, uptime: 99821 }, null, 2),
      },
      {
        id: 'r2',
        status: 200,
        ms: 5,
        at: '2026-04-28T20:00:00Z',
        body: JSON.stringify({ ok: true, uptime: 88200 }, null, 2),
      },
      {
        id: 'r3',
        status: 503,
        ms: 12,
        at: '2026-04-28T03:00:00Z',
        body: JSON.stringify({ ok: false, uptime: 0 }, null, 2),
      },
    ],
  },
];

export function endpointLabel(e: ApiEndpointDef): string {
  if (e.protocol === 'REST') return `${e.method ?? 'GET'} ${e.path}`;
  return e.operation ?? e.path;
}

export function buildCurl(
  e: ApiEndpointDef,
  params: Record<string, string>,
  headers: ReadonlyArray<{ k: string; v: string }>,
  authToken: string | null,
): string {
  const method = e.method ?? 'POST';
  let url = e.path;
  const queryParts: string[] = [];
  const bodyParts: Record<string, string> = {};
  for (const p of e.params) {
    const v = params[p.name];
    if (v == null || v === '') continue;
    if (e.protocol === 'REST' && url.includes(`:${p.name}`)) {
      url = url.replace(`:${p.name}`, encodeURIComponent(v));
    } else if (method === 'GET') {
      queryParts.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(v)}`);
    } else {
      bodyParts[p.name] = v;
    }
  }
  const fullUrl = queryParts.length > 0 ? `${url}?${queryParts.join('&')}` : url;
  const lines: string[] = [`curl -X ${method} "${fullUrl}"`];
  for (const h of headers) {
    if (!h.k) continue;
    lines.push(`  -H "${h.k}: ${h.v}"`);
  }
  if (authToken) {
    lines.push(`  -H "Authorization: Bearer ${authToken}"`);
  }
  if (Object.keys(bodyParts).length > 0) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${JSON.stringify(bodyParts)}'`);
  }
  return lines.join(' \\\n');
}

export function zodSchema(e: ApiEndpointDef): string {
  const lines: string[] = [`export const ${e.id.replace(/-/g, '_')}_response = z.object({`];
  for (const [k, v] of Object.entries(e.responseSchema)) {
    const optional = v.endsWith('?');
    const base = v.replace('?', '');
    const isArr = base.endsWith('[]');
    const t = base.replace('[]', '').toLowerCase();
    const z =
      t === 'string'
        ? 'z.string()'
        : t === 'number'
          ? 'z.number()'
          : t === 'boolean'
            ? 'z.boolean()'
            : `z.unknown() /* ${base} */`;
    const expr = isArr ? `z.array(${z})` : z;
    lines.push(`  ${k}: ${expr}${optional ? '.optional()' : ''},`);
  }
  lines.push('});');
  return lines.join('\n');
}
