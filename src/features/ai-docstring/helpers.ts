export type DocStyle = 'jsdoc' | 'tsdoc' | 'markdown';

export interface DocTarget {
  id: string;
  name: string;
  file: string;
  signature: string;
  body: string;
  language: string;
}

export interface IncludeFlags {
  examples: boolean;
  throws: boolean;
  since: boolean;
  deprecated: boolean;
  see: boolean;
}

const fmt = (s: string): string => s.replace(/^\n/, '').replace(/\n$/, '');

export const DOC_TARGETS: ReadonlyArray<DocTarget> = [
  {
    id: 'fn-1',
    name: 'parseRoute',
    file: 'src/entities/route/parse.ts',
    language: 'ts',
    signature: 'export function parseRoute(raw: string): RouteSpec',
    body: fmt(`
export function parseRoute(raw: string): RouteSpec {
  const [path, ...flags] = raw.split('@');
  return {
    path,
    isStatic: flags.includes('static'),
    isDynamic: flags.includes('dynamic'),
  };
}
`),
  },
  {
    id: 'fn-2',
    name: 'sumKb',
    file: 'src/widgets/bundle-summary/sum.ts',
    language: 'ts',
    signature: 'export function sumKb(routes: ReadonlyArray<Route>): number',
    body: fmt(`
export function sumKb(routes: ReadonlyArray<Route>): number {
  let total = 0;
  for (const r of routes) total += r.sizeKb;
  return Math.round(total * 10) / 10;
}
`),
  },
  {
    id: 'fn-3',
    name: 'classifyRendering',
    file: 'src/entities/route/classify.ts',
    language: 'ts',
    signature:
      'export function classifyRendering(route: Route): RenderingKind',
    body: fmt(`
export function classifyRendering(route: Route): RenderingKind {
  if (route.useStream) return 'stream';
  if (route.cache === 'force-cache') return 'static';
  if (route.cache === 'no-store') return 'dynamic';
  return 'isr';
}
`),
  },
  {
    id: 'fn-4',
    name: 'requestWithRetry',
    file: 'src/shared/lib/fetch.ts',
    language: 'ts',
    signature:
      'export async function requestWithRetry<T>(url: string, opts?: RetryOpts): Promise<T>',
    body: fmt(`
export async function requestWithRetry<T>(
  url: string,
  opts: RetryOpts = {},
): Promise<T> {
  const max = opts.maxRetries ?? 3;
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, opts.init);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return (await res.json()) as T;
    } catch (err) {
      attempt += 1;
      if (attempt >= max) throw err;
      await sleep(2 ** attempt * 100);
    }
  }
}
`),
  },
  {
    id: 'fn-5',
    name: 'shapeColor',
    file: 'src/shared/lib/color.ts',
    language: 'ts',
    signature: 'export function shapeColor(seed: string): string',
    body: fmt(`
export function shapeColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return \`hsl(\${hue} 65% 55%)\`;
}
`),
  },
];

export function buildDocstring(
  target: DocTarget,
  style: DocStyle,
  include: IncludeFlags,
): string {
  if (style === 'markdown') {
    const lines: string[] = [];
    lines.push(`### ${target.name}`);
    lines.push('');
    lines.push(`Documents \`${target.name}\` — see signature below.`);
    if (include.examples) {
      lines.push('');
      lines.push('**Example**');
      lines.push('```ts');
      lines.push(`const out = ${target.name}(/* args */);`);
      lines.push('```');
    }
    if (include.throws) {
      lines.push('');
      lines.push('**Throws**: when input is malformed or upstream fails.');
    }
    if (include.since) lines.push('\n_Since v0.4.0_');
    if (include.deprecated)
      lines.push('\n> Deprecated — prefer the streaming variant.');
    if (include.see) lines.push('\nSee also: related parser utilities.');
    return lines.join('\n');
  }

  // jsdoc / tsdoc share the same shape; tsdoc tweaks tag order.
  const open = '/**';
  const close = ' */';
  const pad = ' * ';
  const lines: string[] = [];
  lines.push(open);
  lines.push(
    `${pad}${target.name} — ${descriptionFor(target.name)}`,
  );
  lines.push(` *`);
  for (const p of paramsFor(target.name)) {
    lines.push(`${pad}@param ${p.name} - ${p.desc}`);
  }
  lines.push(`${pad}@returns ${returnsFor(target.name)}`);
  if (include.throws) {
    lines.push(`${pad}@throws {Error} when the input cannot be processed.`);
  }
  if (include.examples) {
    lines.push(` *`);
    lines.push(`${pad}@example`);
    lines.push(`${pad}\`\`\`ts`);
    lines.push(`${pad}const out = ${target.name}(/* args */);`);
    lines.push(`${pad}\`\`\``);
  }
  if (include.since) lines.push(`${pad}@since 0.4.0`);
  if (include.deprecated)
    lines.push(`${pad}@deprecated prefer the streaming variant.`);
  if (include.see) lines.push(`${pad}@see related-parser`);
  if (style === 'tsdoc') {
    lines.push(`${pad}@public`);
  }
  lines.push(close);
  return lines.join('\n');
}

function descriptionFor(name: string): string {
  switch (name) {
    case 'parseRoute':
      return 'parses a route literal into a RouteSpec.';
    case 'sumKb':
      return 'sums route sizes in kilobytes, rounded to one decimal.';
    case 'classifyRendering':
      return 'classifies a route by its caching and streaming flags.';
    case 'requestWithRetry':
      return 'fetches JSON with exponential backoff retry.';
    case 'shapeColor':
      return 'derives a stable HSL color from a seed string.';
    default:
      return 'performs an operation.';
  }
}

interface ParamDoc {
  name: string;
  desc: string;
}
function paramsFor(name: string): ParamDoc[] {
  switch (name) {
    case 'parseRoute':
      return [{ name: 'raw', desc: 'route literal in `path@flag1@flag2` form' }];
    case 'sumKb':
      return [{ name: 'routes', desc: 'list of routes to aggregate' }];
    case 'classifyRendering':
      return [{ name: 'route', desc: 'route to classify' }];
    case 'requestWithRetry':
      return [
        { name: 'url', desc: 'absolute or relative URL to fetch' },
        { name: 'opts', desc: 'retry and request options' },
      ];
    case 'shapeColor':
      return [{ name: 'seed', desc: 'arbitrary stable input string' }];
    default:
      return [];
  }
}

function returnsFor(name: string): string {
  switch (name) {
    case 'parseRoute':
      return 'a RouteSpec describing the parsed route.';
    case 'sumKb':
      return 'total size in kilobytes, rounded to one decimal.';
    case 'classifyRendering':
      return 'a RenderingKind tag.';
    case 'requestWithRetry':
      return 'the parsed JSON body cast to T.';
    case 'shapeColor':
      return 'an `hsl(...)` color string.';
    default:
      return 'the result.';
  }
}

export function targetById(id: string): DocTarget {
  return DOC_TARGETS.find((t) => t.id === id) ?? DOC_TARGETS[0]!;
}

export function chunkLines(text: string): string[] {
  // Stream line by line, then word groups within each line.
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (line.length === 0) {
      out.push('\n');
      continue;
    }
    const words = line.split(' ');
    let i = 0;
    while (i < words.length) {
      const size = 3 + (i % 3); // 3..5 words
      const end = Math.min(words.length, i + size);
      const piece = words.slice(i, end).join(' ');
      out.push(end === words.length ? piece : piece + ' ');
      i = end;
    }
    out.push('\n');
  }
  return out;
}
