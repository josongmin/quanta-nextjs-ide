import type { RscChunk } from './types';

export interface ClientModuleSummary {
  /** Chunk id, e.g. "a:". */
  id: string;
  /** Display label (basename without ext, or path tail). */
  label: string;
  /** Full module path from the I[...] descriptor. */
  modulePath: string;
  /** Webpack chunk paths the module ships in. */
  chunkPaths: ReadonlyArray<string>;
  /** Bytes of this chunk's wire-format line. */
  sizeBytes: number;
  /** First arrival time. */
  arrivedAtMs: number;
  /** True if this looks like an internal Next.js module (layout-router, etc). */
  isNextInternal: boolean;
  /** True if module path lives under node_modules. */
  isThirdParty: boolean;
}

const MODULE_LINE = /^I\["([^"]+)",\[([^\]]*)\]/;

const NEXT_INTERNAL_BASENAMES = new Set([
  'layout-router',
  'render-from-template-context',
  'metadata-boundary',
  'error-boundary',
  'not-found-boundary',
  'client-page',
  'client-segment',
]);

/**
 * Extract every client-side module reference from a parsed RSC stream.
 *
 * Pure: takes chunks, returns analysis. Used by:
 *  - Server-only tracker  (which user-modules ship to the client?)
 *  - Client islands tab   (sorted/filtered list of client modules)
 *  - Bundle/Vitals tab    (size accounting per module)
 */
export function analyzeClientModules(
  chunks: ReadonlyArray<RscChunk>,
): ReadonlyArray<ClientModuleSummary> {
  const seen = new Map<string, ClientModuleSummary>();
  for (const c of chunks) {
    if (c.kind !== 'module') continue;
    if (c.environment !== 'client') continue;
    if (seen.has(c.id)) continue;
    const m = c.payload.match(MODULE_LINE);
    if (!m) continue;
    const [, modulePath, chunksList] = m;
    if (!modulePath) continue;
    const chunkPaths = (chunksList ?? '')
      .split(',')
      .map((s) => s.replace(/^"|"$/g, ''))
      .filter((s) => s && !s.includes('app-pages-internals'));
    const basename = modulePath
      .split('/')
      .pop()
      ?.replace(/\.[jt]sx?$/, '') ?? modulePath;
    seen.set(c.id, {
      id: c.id,
      label: c.label ?? basename,
      modulePath,
      chunkPaths,
      sizeBytes: c.sizeBytes,
      arrivedAtMs: c.arrivedAtMs,
      isNextInternal: NEXT_INTERNAL_BASENAMES.has(basename),
      isThirdParty: modulePath.includes('node_modules'),
    });
  }
  return Array.from(seen.values());
}

export interface SuspenseBoundary {
  /** Chunk id of the Suspense element ($Sreact.suspense). */
  id: string;
  /** When this boundary was first seen. */
  arrivedAtMs: number;
  /** When child elements that reference it were resolved (max). */
  resolvedAtMs: number;
  /** Time between Suspense start and last child arrival, in ms. */
  fallbackDurationMs: number;
}

/**
 * Detect Suspense boundaries and how long their children took to stream in.
 *
 * Pure: used by:
 *  - Boundary visualizer (next surface)
 *  - Bundle/Vitals     (suspense-resolve timing metric)
 *  - Waterfall         (group lanes by suspense parent)
 */
export function analyzeSuspenseBoundaries(
  chunks: ReadonlyArray<RscChunk>,
): ReadonlyArray<SuspenseBoundary> {
  const out: SuspenseBoundary[] = [];
  for (const c of chunks) {
    if (c.kind !== 'reference') continue;
    if (!c.payload.includes('react.suspense')) continue;
    // Children are chunks that reference this id later in the stream.
    let lastChildAt = c.arrivedAtMs;
    for (const child of chunks) {
      if (child.arrivedAtMs <= c.arrivedAtMs) continue;
      if (child.resolvesRefs?.includes(c.id)) {
        if (child.arrivedAtMs > lastChildAt) lastChildAt = child.arrivedAtMs;
      }
    }
    out.push({
      id: c.id,
      arrivedAtMs: c.arrivedAtMs,
      resolvedAtMs: lastChildAt,
      fallbackDurationMs: lastChildAt - c.arrivedAtMs,
    });
  }
  return out;
}

export interface StreamMetrics {
  totalMs: number;
  totalBytes: number;
  chunkCount: number;
  uniqueChunkIds: number;
  followUpCount: number;
  ttfb: number;
  byKind: Record<RscChunk['kind'], number>;
  bytesByKind: Record<RscChunk['kind'], number>;
  clientBundleBytes: number;
  serverBytes: number;
}

const ZERO_BY_KIND = (): Record<RscChunk['kind'], number> => ({
  module: 0,
  element: 0,
  reference: 0,
  hint: 0,
  text: 0,
});

export interface ServerActionRef {
  /** Chunk id holding the action descriptor. */
  id: string;
  /** Function name from the descriptor (e.g. "submitAction"). */
  name: string;
  /** Hex action id from descriptor. */
  actionId: string;
  /** Bytes of the descriptor chunk. */
  sizeBytes: number;
}

const ACTION_DESCRIPTOR =
  /^{"id":"([a-f0-9]+)","bound":[^,]+,"name":"([^"]+)","env":"Server"/;

/**
 * Find every server-action descriptor in the stream. These appear as plain
 * text chunks like `{"id":"40693c...","bound":null,"name":"submitAction",...}`
 * and are referenced by `$Fa` from the form's action prop.
 */
export function analyzeServerActions(
  chunks: ReadonlyArray<RscChunk>,
): ReadonlyArray<ServerActionRef> {
  const out: ServerActionRef[] = [];
  for (const c of chunks) {
    if (c.kind !== 'text') continue;
    const m = c.payload.match(ACTION_DESCRIPTOR);
    if (!m) continue;
    out.push({
      id: c.id,
      actionId: m[1] ?? '',
      name: m[2] ?? '(anonymous)',
      sizeBytes: c.sizeBytes,
    });
  }
  return out;
}

export interface BoundaryChainItem {
  kind: 'layout-router' | 'error-boundary' | 'not-found-boundary' | 'metadata-boundary' | 'suspense' | 'render-from-template' | 'client-page' | 'client-segment';
  id: string;
  arrivedAtMs: number;
}

/**
 * Detect Next.js boundary infrastructure chunks emitted on every route.
 * Useful for surfacing "what boundary stack does this route resolve through?".
 */
export function analyzeBoundaryChain(
  chunks: ReadonlyArray<RscChunk>,
): ReadonlyArray<BoundaryChainItem> {
  const out: BoundaryChainItem[] = [];
  for (const c of chunks) {
    let kind: BoundaryChainItem['kind'] | null = null;
    if (c.kind === 'module') {
      const path = c.payload;
      if (path.includes('layout-router')) kind = 'layout-router';
      else if (path.includes('error-boundary')) kind = 'error-boundary';
      else if (path.includes('not-found-boundary')) kind = 'not-found-boundary';
      else if (path.includes('metadata-boundary')) kind = 'metadata-boundary';
      else if (path.includes('render-from-template')) kind = 'render-from-template';
      else if (path.includes('client-page')) kind = 'client-page';
      else if (path.includes('client-segment')) kind = 'client-segment';
    } else if (c.kind === 'reference' && c.payload.includes('react.suspense')) {
      kind = 'suspense';
    }
    if (!kind) continue;
    out.push({ kind, id: c.id, arrivedAtMs: c.arrivedAtMs });
  }
  return out;
}

export function computeStreamMetrics(
  chunks: ReadonlyArray<RscChunk>,
): StreamMetrics {
  const byKind = ZERO_BY_KIND();
  const bytesByKind = ZERO_BY_KIND();
  const ids = new Set<string>();
  let totalBytes = 0;
  let totalMs = 0;
  let clientBundleBytes = 0;
  let ttfb = Number.POSITIVE_INFINITY;

  for (const c of chunks) {
    byKind[c.kind] += 1;
    bytesByKind[c.kind] += c.sizeBytes;
    totalBytes += c.sizeBytes;
    if (c.arrivedAtMs > totalMs) totalMs = c.arrivedAtMs;
    if (c.arrivedAtMs < ttfb) ttfb = c.arrivedAtMs;
    ids.add(c.id);
    if (c.kind === 'module' && c.environment === 'client') {
      clientBundleBytes += c.sizeBytes;
    }
  }

  return {
    totalMs,
    totalBytes,
    chunkCount: chunks.length,
    uniqueChunkIds: ids.size,
    followUpCount: chunks.length - ids.size,
    ttfb: ttfb === Number.POSITIVE_INFINITY ? 0 : ttfb,
    byKind,
    bytesByKind,
    clientBundleBytes,
    serverBytes: totalBytes - clientBundleBytes,
  };
}
