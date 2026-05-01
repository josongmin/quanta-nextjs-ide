import type { CacheTag, Route, ServerAction } from '@shared/types';
import { mockSources } from '@shared/mocks/source-files';

export type ReferenceKind = 'route' | 'tag' | 'action' | 'symbol';

export type ReferenceGroup =
  | 'links-to'
  | 'redirects-to'
  | 'sitemap'
  | 'affected'
  | 'producer'
  | 'invalidator'
  | 'caller'
  | 'form-action'
  | 'match';

export interface ReferenceItem {
  id: string;
  group: ReferenceGroup;
  file: string;
  line: number;
  /** Short single-line preview snippet for display. */
  preview: string;
}

const MAX_RESULTS = 30;

/**
 * Find a single substring's first line/preview in a source file.
 * Returns null if no match is found.
 */
function findFirstMatch(
  source: string,
  needle: string,
): { line: number; preview: string } | null {
  if (!needle) return null;
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i] ?? '';
    if (text.includes(needle)) {
      return { line: i + 1, preview: text.trim() };
    }
  }
  return null;
}

function findAllMatches(
  source: string,
  needles: string[],
): Array<{ line: number; preview: string; needle: string }> {
  const out: Array<{ line: number; preview: string; needle: string }> = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i] ?? '';
    for (const needle of needles) {
      if (needle && text.includes(needle)) {
        out.push({ line: i + 1, preview: text.trim(), needle });
        break;
      }
    }
  }
  return out;
}

function makeId(group: ReferenceGroup, file: string, line: number): string {
  return `${group}:${file}:${line}`;
}

/**
 * Build references for a route — search mock sources for `Link href="path"`,
 * `redirect("path")`, `router.push("path")` substrings.
 */
export function findRouteReferences(
  routePath: string,
  routes: Route[],
): ReferenceItem[] {
  const out: ReferenceItem[] = [];
  const linkNeedles = [
    `href="${routePath}"`,
    `href='${routePath}'`,
  ];
  const redirectNeedles = [
    `redirect("${routePath}")`,
    `redirect('${routePath}')`,
    `router.push("${routePath}")`,
    `router.push('${routePath}')`,
  ];

  for (const [file, source] of Object.entries(mockSources)) {
    for (const m of findAllMatches(source, linkNeedles)) {
      out.push({
        id: makeId('links-to', file, m.line),
        group: 'links-to',
        file,
        line: m.line,
        preview: m.preview,
      });
    }
    for (const m of findAllMatches(source, redirectNeedles)) {
      out.push({
        id: makeId('redirects-to', file, m.line),
        group: 'redirects-to',
        file,
        line: m.line,
        preview: m.preview,
      });
    }
  }

  // Sitemap entry — synthetic deterministic mock.
  out.push({
    id: makeId('sitemap', 'app/sitemap.ts', 1),
    group: 'sitemap',
    file: 'app/sitemap.ts',
    line: 1,
    preview: `{ url: '${routePath}' }`,
  });

  // Affected pages — routes whose path starts with this path (children).
  for (const r of routes) {
    if (r.path === routePath) continue;
    if (!r.path.startsWith(routePath)) continue;
    const file = r.files.page ?? `app${r.path}/page.tsx`;
    out.push({
      id: makeId('affected', file, 1),
      group: 'affected',
      file,
      line: 1,
      preview: `// ${r.path} (${r.archetype})`,
    });
  }

  return out.slice(0, MAX_RESULTS);
}

export function findTagReferences(tag: CacheTag): ReferenceItem[] {
  const out: ReferenceItem[] = [];
  for (const p of tag.producers) {
    const source = mockSources[p.location.file] ?? '';
    const lines = source.split('\n');
    const preview =
      lines[Math.max(0, p.location.line - 1)]?.trim() ??
      `fetch(..., { next: { tags: ['${tag.name}'] } })`;
    out.push({
      id: makeId('producer', p.location.file, p.location.line),
      group: 'producer',
      file: p.location.file,
      line: p.location.line,
      preview,
    });
  }
  for (const inv of tag.invalidators) {
    const source = mockSources[inv.location.file] ?? '';
    const lines = source.split('\n');
    const preview =
      lines[Math.max(0, inv.location.line - 1)]?.trim() ??
      `revalidateTag('${tag.name}')`;
    out.push({
      id: makeId('invalidator', inv.location.file, inv.location.line),
      group: 'invalidator',
      file: inv.location.file,
      line: inv.location.line,
      preview,
    });
  }
  for (const routeId of tag.affectedRouteIds) {
    out.push({
      id: makeId('affected', routeId, 1),
      group: 'affected',
      file: `${routeId}`,
      line: 1,
      preview: `// route → ${routeId}`,
    });
  }
  return out.slice(0, MAX_RESULTS);
}

export function findActionReferences(action: ServerAction): ReferenceItem[] {
  const out: ReferenceItem[] = [];
  // Form action references — search sources for action name as identifier.
  const needles = [`action={${action.name}}`, `${action.name}(`, ` ${action.name}`];
  for (const [file, source] of Object.entries(mockSources)) {
    if (file === action.file) continue;
    const matches = findAllMatches(source, needles);
    for (const m of matches.slice(0, 4)) {
      const isFormAction = m.preview.includes(`action={${action.name}}`);
      out.push({
        id: makeId(isFormAction ? 'form-action' : 'caller', file, m.line),
        group: isFormAction ? 'form-action' : 'caller',
        file,
        line: m.line,
        preview: m.preview,
      });
    }
  }
  // Definition site
  const def = mockSources[action.file];
  if (def) {
    const m = findFirstMatch(def, `function ${action.name}`);
    if (m) {
      out.push({
        id: makeId('match', action.file, m.line),
        group: 'match',
        file: action.file,
        line: m.line,
        preview: m.preview,
      });
    }
  }
  // Affected route
  if (action.routeId) {
    out.push({
      id: makeId('affected', action.routeId, 1),
      group: 'affected',
      file: action.routeId,
      line: 1,
      preview: `// route → ${action.routeId}`,
    });
  }
  return out.slice(0, MAX_RESULTS);
}

export function findSymbolReferences(symbol: string): ReferenceItem[] {
  const out: ReferenceItem[] = [];
  for (const [file, source] of Object.entries(mockSources)) {
    if (!source.includes(symbol)) continue;
    const m = findFirstMatch(source, symbol);
    if (m) {
      out.push({
        id: makeId('match', file, m.line),
        group: 'match',
        file,
        line: m.line,
        preview: m.preview,
      });
    }
  }
  return out.slice(0, MAX_RESULTS);
}

export interface ReferenceBucket {
  group: ReferenceGroup;
  label: string;
  items: ReferenceItem[];
}

const GROUP_LABELS: Record<ReferenceGroup, string> = {
  'links-to': 'Links to',
  'redirects-to': 'Redirects to',
  sitemap: 'Sitemap',
  affected: 'Affected pages',
  producer: 'Producers',
  invalidator: 'Invalidators',
  caller: 'Callers',
  'form-action': 'Form action',
  match: 'Matches',
};

const GROUP_ORDER: Record<ReferenceKind, ReferenceGroup[]> = {
  route: ['links-to', 'redirects-to', 'sitemap', 'affected'],
  tag: ['producer', 'invalidator', 'affected'],
  action: ['form-action', 'caller', 'match', 'affected'],
  symbol: ['match'],
};

export function bucketize(
  kind: ReferenceKind,
  items: ReferenceItem[],
): ReferenceBucket[] {
  const order = GROUP_ORDER[kind];
  return order.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: items.filter((i) => i.group === group),
  }));
}

export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}
