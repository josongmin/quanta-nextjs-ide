/**
 * OTel collector source — reads traces from `@features/otel-trace`'s store
 * and auto-correlates each trace to a route by reading the `http.route`
 * attribute on the root span (or falling back to root span name).
 */

import { useOtelStore } from '@features/otel-trace/store';
import type { TraceTree } from '@features/otel-trace/types';
import { useLiveBottomTabsStore } from '../store';
import type { TraceCorrelation } from '../types';

function inferRoute(tree: TraceTree): string | null {
  const rootId = tree.rootIds[0];
  if (!rootId) return null;
  const root = tree.spans.get(rootId);
  if (!root) return null;
  const httpRoute = root.attributes['http.route'];
  if (typeof httpRoute === 'string' && httpRoute.length > 0) return httpRoute;
  // Fallback: parse "GET /products/[id]" → "/products/[id]"
  const m = /\b(?:GET|POST|PUT|DELETE|PATCH)\s+(\/\S*)/.exec(root.name);
  if (m && m[1]) return m[1];
  return null;
}

export function correlateTrace(tree: TraceTree, ingestedAt = Date.now()): TraceCorrelation {
  return {
    traceId: tree.traceId,
    route: inferRoute(tree),
    totalUs: tree.totalUs,
    ingestedAt,
  };
}

let _attached = false;

/**
 * Subscribe to the otel store and:
 *   1. keep `selectedTraceId` in sync with the otel store's selection if our
 *      slice has none chosen yet
 *   2. expose `correlations` via the selector below for the Trace tab
 */
export function attachOtelCollectorSource(): () => void {
  if (_attached) return () => {};
  _attached = true;

  const sync = () => {
    const otel = useOtelStore.getState();
    const ours = useLiveBottomTabsStore.getState();
    if (ours.selectedTraceId == null && otel.selectedTraceId) {
      useLiveBottomTabsStore.getState().setSelectedTraceId(otel.selectedTraceId);
    }
  };

  sync();
  const unsub = useOtelStore.subscribe(sync);
  return () => {
    unsub();
    _attached = false;
  };
}

/**
 * Returns the list of trace correlations for the Trace tab. Newest first,
 * capped to 10.
 */
export function getRecentCorrelations(): TraceCorrelation[] {
  const traces = useOtelStore.getState().traces;
  return traces.slice(0, 10).map((t) => correlateTrace(t));
}
