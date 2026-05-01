/**
 * File-system based Next.js App Router discoverer.
 *
 * In a browser/Vite environment we cannot use Node `fs` at runtime, so we
 * snapshot the fixture's `app/` tree at build time using `import.meta.glob`
 * with `query: '?raw'`. Each matched file shows up as a `[path -> source]`
 * pair, which is exactly what a synchronous `fs.readdirSync` + `fs.readFileSync`
 * pair would give us.
 *
 * The shape of the output is identical regardless of host: a `Route[]`
 * compatible with `@shared/types`. Route inference here is intentionally
 * shallow — rendering class, archetype, cache hints etc. are filled in with
 * sensible defaults; deeper classification can come later (and likely
 * via a richer ts-morph pass).
 */

import type { Route, RouteBoundaries } from '@shared/types';

// NOTE: this glob path is relative to THIS file. The fixture is at
// `<repo>/e2e/fixtures/next-app/app`, three levels up from `src/shared/analyzer`.
// `as: 'raw'` is deprecated, use `query: '?raw', import: 'default'` instead.
const FIXTURE_FILES = import.meta.glob<string>(
  '../../../e2e/fixtures/next-app/app/**/*.{ts,tsx,js,jsx}',
  { query: '?raw', import: 'default', eager: true },
);

const FIXTURE_PREFIX = '../../../e2e/fixtures/next-app/';

interface DiscoveredFile {
  /** Path relative to the Next app root, e.g. "app/products/[id]/page.tsx". */
  appRelative: string;
  /** Directory the file lives in, relative to app root. e.g. "app/products/[id]". */
  dir: string;
  /** Just the filename. */
  basename: string;
  /** File contents (raw). */
  source: string;
}

interface RouteAggregate {
  dir: string;
  pageFile?: DiscoveredFile;
  layoutFile?: DiscoveredFile;
  loadingFile?: DiscoveredFile;
  errorFile?: DiscoveredFile;
  notFoundFile?: DiscoveredFile;
  defaultFile?: DiscoveredFile;
  templateFile?: DiscoveredFile;
}

const PAGE_FILE_RE = /^page\.(tsx|ts|jsx|js)$/;
const LAYOUT_FILE_RE = /^layout\.(tsx|ts|jsx|js)$/;
const LOADING_FILE_RE = /^loading\.(tsx|ts|jsx|js)$/;
const ERROR_FILE_RE = /^error\.(tsx|ts|jsx|js)$/;
const NOT_FOUND_FILE_RE = /^not-found\.(tsx|ts|jsx|js)$/;
const DEFAULT_FILE_RE = /^default\.(tsx|ts|jsx|js)$/;
const TEMPLATE_FILE_RE = /^template\.(tsx|ts|jsx|js)$/;
const ROUTE_HANDLER_RE = /^route\.(ts|js)$/;

function toAppRelative(globKey: string): string | null {
  // globKey like "../../../e2e/fixtures/next-app/app/products/[id]/page.tsx"
  if (!globKey.startsWith(FIXTURE_PREFIX)) return null;
  return globKey.slice(FIXTURE_PREFIX.length); // -> "app/products/[id]/page.tsx"
}

function dirAndBase(appRelative: string): { dir: string; basename: string } {
  const idx = appRelative.lastIndexOf('/');
  if (idx === -1) return { dir: '', basename: appRelative };
  return { dir: appRelative.slice(0, idx), basename: appRelative.slice(idx + 1) };
}

/**
 * Translate a directory inside `app/` into the route URL pattern.
 *  - `app`                          -> `/`
 *  - `app/products`                 -> `/products`
 *  - `app/products/[id]`            -> `/products/[id]`
 *  - `app/(marketing)/about`        -> `/about`         (group skipped)
 *  - `app/@modal/(.)photo/[pid]`    -> `/@modal/(.)photo/[pid]`
 */
function dirToRoutePath(dir: string): string {
  // strip leading "app" segment
  const parts = dir.split('/').filter(Boolean);
  if (parts[0] !== 'app') return '/' + parts.join('/');
  const rest = parts.slice(1);
  const urlParts: string[] = [];
  for (const seg of rest) {
    // route group: (marketing) — skipped in URL
    // intercepting prefixes: (.), (..), (..)(..), (...) — we KEEP these in path
    //    so the user can see the interception target. But a plain "(group)"
    //    with no leading "." inside parens is a group and is skipped.
    if (/^\([^.][^)]*\)$/.test(seg)) {
      // route group, skip
      continue;
    }
    urlParts.push(seg);
  }
  return '/' + urlParts.join('/');
}

function isRouteGroup(dirSegment: string): boolean {
  return /^\([^.][^)]*\)$/.test(dirSegment);
}

function isParallelSlot(dirSegment: string): boolean {
  return dirSegment.startsWith('@');
}

function interceptPrefix(dirSegment: string): string | null {
  // (.)  same level
  // (..) one up
  // (..)(..) two up
  // (...) root
  const m = dirSegment.match(/^(\((?:\.{1,3}|\.\.\)\(\.\.)\))/);
  return m ? m[1] ?? null : null;
}

function findParallelSlot(dir: string): string | undefined {
  const segs = dir.split('/');
  for (const s of segs) {
    if (isParallelSlot(s)) return s;
  }
  return undefined;
}

function isIntercepting(dir: string): boolean {
  return dir.split('/').some((s) => interceptPrefix(s) !== null);
}

function hasUseClient(source: string): boolean {
  // 'use client'; or "use client"; possibly preceded by comments / whitespace.
  // Cheap heuristic: scan first ~400 chars for the directive token.
  const head = source.slice(0, 400);
  return /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*['"]use client['"]\s*;?/.test(head);
}

function archetypeFromPath(_routePath: string): Route['archetype'] {
  // We deliberately don't try to infer archetype here — the fixture has
  // no domain-specific signals beyond names. Default to `unknown` and
  // let downstream classification own this.
  return 'unknown';
}

function defaultBoundaries(): RouteBoundaries {
  return {
    loading: 'na',
    error: 'na',
    notFound: 'na',
    default: 'na',
    template: 'na',
  };
}

function makeRouteId(routePath: string, slot: string | undefined): string {
  const base = routePath
    .replace(/^\//, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const id = base.length === 0 ? 'home' : base;
  return slot ? `route_${slot.replace(/^@/, 'slot_')}_${id}` : `route_${id}`;
}

/**
 * Input shape for {@link analyzeRoutesFromFiles}. Each entry is a Next-app
 * relative POSIX path (e.g. `app/products/[id]/page.tsx`) plus the file's
 * raw source. `app/` may live at the project root or under `src/app/` —
 * callers must strip the `src/` prefix before passing files in so the
 * analyzer sees a uniform `app/...` shape.
 */
export interface RouteSourceFile {
  /** App-root-relative path: `app/products/[id]/page.tsx`. */
  appRelative: string;
  /** Raw file contents. */
  source: string;
}

/**
 * Build the Route[] from a pre-loaded set of `app/**` files. This is the
 * Tauri-mode entry point: callers fetch files via the workspace API and
 * feed them in, decoupling the analyzer from the host filesystem.
 */
export function analyzeRoutesFromFiles(files: ReadonlyArray<RouteSourceFile>): Route[] {
  const discovered: DiscoveredFile[] = [];
  for (const f of files) {
    if (!f.appRelative.startsWith('app/') && f.appRelative !== 'app') continue;
    const { dir, basename } = dirAndBase(f.appRelative);
    discovered.push({
      appRelative: f.appRelative,
      dir,
      basename,
      source: f.source,
    });
  }
  return analyzeRoutesFromDiscovered(discovered);
}

/**
 * Discover Next.js App Router routes from the fixture snapshot.
 *
 * The `rootDir` parameter exists for API-shape parity with a Node
 * `fs`-based implementation. In the Vite/browser host we use the
 * build-time glob snapshot keyed on a fixed path, so `rootDir` is
 * accepted but unused beyond a soft sanity check.
 */
export function analyzeRoutes(rootDir: string): Route[] {
  // Soft validation: caller is expected to pass something that looks like
  // the Next-app root we snapshot. We don't fail if it differs.
  void rootDir;

  // 1. Build a flat list of discovered files.
  const files: DiscoveredFile[] = [];
  for (const [globKey, source] of Object.entries(FIXTURE_FILES)) {
    const appRelative = toAppRelative(globKey);
    if (!appRelative) continue;
    if (!appRelative.startsWith('app/') && appRelative !== 'app') continue;
    const { dir, basename } = dirAndBase(appRelative);
    files.push({ appRelative, dir, basename, source });
  }
  return analyzeRoutesFromDiscovered(files);
}

function analyzeRoutesFromDiscovered(files: DiscoveredFile[]): Route[] {

  // 2. Group files by directory and pick out per-segment specials.
  const byDir = new Map<string, RouteAggregate>();
  const get = (dir: string): RouteAggregate => {
    let agg = byDir.get(dir);
    if (!agg) {
      agg = { dir };
      byDir.set(dir, agg);
    }
    return agg;
  };

  for (const f of files) {
    const agg = get(f.dir);
    if (PAGE_FILE_RE.test(f.basename) || ROUTE_HANDLER_RE.test(f.basename)) {
      // Both `page.tsx` and `route.ts` represent a callable route at this segment.
      // We let `route.ts` masquerade as a page so API endpoints surface in the tab too.
      agg.pageFile = f;
    } else if (LAYOUT_FILE_RE.test(f.basename)) {
      agg.layoutFile = f;
    } else if (LOADING_FILE_RE.test(f.basename)) {
      agg.loadingFile = f;
    } else if (ERROR_FILE_RE.test(f.basename)) {
      agg.errorFile = f;
    } else if (NOT_FOUND_FILE_RE.test(f.basename)) {
      agg.notFoundFile = f;
    } else if (DEFAULT_FILE_RE.test(f.basename)) {
      agg.defaultFile = f;
    } else if (TEMPLATE_FILE_RE.test(f.basename)) {
      agg.templateFile = f;
    }
  }

  // 3. For each directory that has a page (or route handler), build a Route.
  const routes: Route[] = [];
  // Sort dirs to keep output deterministic.
  const dirs = Array.from(byDir.keys()).sort();

  for (const dir of dirs) {
    const agg = byDir.get(dir);
    if (!agg?.pageFile) continue;

    const routePath = dirToRoutePath(dir);
    const slot = findParallelSlot(dir);
    const intercepting = isIntercepting(dir);
    const groupOnly = dir
      .split('/')
      .slice(1) // drop "app"
      .some(isRouteGroup);

    // climb the directory tree to find the nearest layout (could be in a
    // parent segment — that's how Next inheriting layouts work).
    let layoutFile: DiscoveredFile | undefined = agg.layoutFile;
    if (!layoutFile) {
      let cursor = dir;
      while (cursor.includes('/')) {
        cursor = cursor.slice(0, cursor.lastIndexOf('/'));
        const parent = byDir.get(cursor);
        if (parent?.layoutFile) {
          layoutFile = parent.layoutFile;
          break;
        }
      }
    }

    const segments = routePath
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);

    // 'use client' on either page.tsx or layout.tsx flips client-heavy hints.
    const pageIsClient = hasUseClient(agg.pageFile.source);
    const layoutIsClient = layoutFile ? hasUseClient(layoutFile.source) : false;
    const clientKb = pageIsClient || layoutIsClient ? 1 : 0;

    const route: Route = {
      id: makeRouteId(routePath, slot),
      path: routePath,
      segments,
      archetype: archetypeFromPath(routePath),
      rendering: 'static',
      renderingConfidence: 'low',
      costClass: 'A',
      clientKb,
      isParallel: !!slot,
      isIntercepting: intercepting,
      isGroup: groupOnly,
      ...(slot ? { parallelSlot: slot } : {}),
      cacheTags: [],
      boundaries: {
        ...defaultBoundaries(),
        loading: agg.loadingFile ? 'present' : 'na',
        error: agg.errorFile ? 'present' : 'na',
        notFound: agg.notFoundFile ? 'present' : 'na',
        default: agg.defaultFile ? 'present' : 'na',
        template: agg.templateFile ? 'present' : 'na',
      },
      metadata: {
        title: false,
        description: false,
        canonical: false,
        openGraph: false,
        robots: false,
        isGenerated: false,
      },
      auth: { guard: 'none', archetypeExpected: 'public' },
      dataSources: [],
      islands: [],
      files: {
        page: agg.pageFile.appRelative,
        ...(layoutFile ? { layout: layoutFile.appRelative } : {}),
        ...(agg.loadingFile ? { loading: agg.loadingFile.appRelative } : {}),
        ...(agg.errorFile ? { error: agg.errorFile.appRelative } : {}),
        ...(agg.notFoundFile ? { notFound: agg.notFoundFile.appRelative } : {}),
        ...(agg.defaultFile ? { default: agg.defaultFile.appRelative } : {}),
        ...(agg.templateFile ? { template: agg.templateFile.appRelative } : {}),
      },
      riskCount: 0,
      parentRouteId: null,
    };

    routes.push(route);
  }

  return routes;
}

/**
 * Build a {@link RouteTreeNode} forest from the routes returned by
 * {@link analyzeRoutes}. The shape mirrors `mockRouteTree` so the
 * existing routes tab renders without modification.
 */
export function buildRouteTree(
  routes: Route[],
): import('@shared/types').RouteTreeNode {
  type Node = import('@shared/types').RouteTreeNode;

  const root: Node = {
    id: 'app',
    label: 'app',
    kind: 'segment',
    children: [],
  };

  // For each route, derive the directory trail under "app/" and walk/create nodes.
  for (const route of routes) {
    const pageFile = route.files.page;
    if (!pageFile) continue;
    // pageFile is like "app/products/[id]/page.tsx" — split on "/" and drop file.
    const parts = pageFile.split('/');
    const fileBase = parts.pop() ?? 'page';
    if (parts[0] === 'app') parts.shift();

    let cursor = root;
    let pathAcc = 'app';
    for (const seg of parts) {
      pathAcc = `${pathAcc}/${seg}`;
      let next = cursor.children.find((c) => c.id === pathAcc);
      if (!next) {
        next = {
          id: pathAcc,
          label: seg,
          kind: classifySegmentKind(seg),
          children: [],
        };
        cursor.children.push(next);
      }
      cursor = next;
    }

    // Attach the route leaf.
    const leafId = `${pathAcc}/${fileBase.replace(/\.[^.]+$/, '')}`;
    cursor.children.push({
      id: leafId,
      label: fileBase,
      kind: 'route',
      routeId: route.id,
      children: [],
    });

    // Attach boundary file leaves so the tree visually mirrors the FS.
    const sibs: Array<[keyof Route['files'], string]> = [
      ['loading', 'loading.tsx'],
      ['error', 'error.tsx'],
      ['notFound', 'not-found.tsx'],
      ['default', 'default.tsx'],
      ['template', 'template.tsx'],
    ];
    for (const [k, label] of sibs) {
      const f = route.files[k];
      if (!f) continue;
      const id = `${pathAcc}/${label.replace(/\.[^.]+$/, '')}`;
      // Avoid duplicate boundary entries when shared by sibling routes.
      if (cursor.children.some((c) => c.id === id)) continue;
      cursor.children.push({ id, label, kind: 'file', children: [] });
    }
  }

  return root;
}

function classifySegmentKind(
  seg: string,
): import('@shared/types').RouteTreeNode['kind'] {
  if (isRouteGroup(seg)) return 'group';
  if (isParallelSlot(seg)) return 'parallel';
  if (interceptPrefix(seg) !== null) return 'intercepting';
  if (seg.startsWith('[') && seg.endsWith(']')) return 'dynamic';
  return 'segment';
}
