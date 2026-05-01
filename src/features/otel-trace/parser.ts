/**
 * OTLP/JSON → normalized TraceTree.
 *
 * Accepts either:
 *   - A full OTLP `{ resourceSpans: [...] }` payload (collector format)
 *   - A bare array of spans (some agents export this)
 *   - Jaeger-shaped `{ data: [{ spans: [...] }] }` (best-effort)
 *
 * Returns one TraceTree (the first traceId in the payload). Computes
 * self-time, depth, and code-attribute extraction in a single pass.
 */

import type {
  NormalizedSpan,
  OtlpKeyValue,
  OtlpPayload,
  OtlpSpan,
  TraceTree,
} from './types';

function readAttributeValue(v: OtlpKeyValue['value']): string | number | boolean {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.intValue !== undefined) {
    const n = typeof v.intValue === 'string' ? Number(v.intValue) : v.intValue;
    return Number.isFinite(n) ? n : String(v.intValue);
  }
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.boolValue !== undefined) return v.boolValue;
  if (v.arrayValue) {
    return v.arrayValue.values.map(readAttributeValue).join(', ');
  }
  return '';
}

function readAttributes(
  attrs: ReadonlyArray<OtlpKeyValue> | undefined,
): Record<string, string | number | boolean> {
  if (!attrs) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const kv of attrs) {
    out[kv.key] = readAttributeValue(kv.value);
  }
  return out;
}

function toNanos(v: string | number): number {
  if (typeof v === 'number') return v;
  // Some collectors export big-int as string. Number is fine for sub-2^53 ns.
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function spanKindLabel(k: OtlpSpan['kind']): string {
  if (typeof k === 'string') return k.toLowerCase().replace(/^span_kind_/, '');
  switch (k) {
    case 1:
      return 'internal';
    case 2:
      return 'server';
    case 3:
      return 'client';
    case 4:
      return 'producer';
    case 5:
      return 'consumer';
    default:
      return 'unspecified';
  }
}

interface RawSpan extends OtlpSpan {
  __scope?: string;
}

function collectSpans(payload: unknown): RawSpan[] {
  const spans: RawSpan[] = [];
  if (Array.isArray(payload)) {
    for (const s of payload) spans.push(s as RawSpan);
    return spans;
  }
  if (typeof payload !== 'object' || payload === null) return spans;
  const p = payload as OtlpPayload & { data?: Array<{ spans?: unknown[] }> };
  if (p.resourceSpans) {
    for (const rs of p.resourceSpans) {
      for (const ss of rs.scopeSpans ?? []) {
        const scope = ss.scope?.name;
        for (const s of ss.spans ?? []) {
          const r: RawSpan = { ...s };
          if (scope) r.__scope = scope;
          spans.push(r);
        }
      }
    }
    return spans;
  }
  if (Array.isArray(p.data)) {
    for (const t of p.data) {
      if (Array.isArray(t.spans)) {
        for (const s of t.spans) spans.push(s as RawSpan);
      }
    }
  }
  return spans;
}

export interface ParseResult {
  /** Successfully parsed traces (one per trace id). */
  traces: TraceTree[];
  /** Number of spans skipped because of missing required fields. */
  skipped: number;
}

export function parseOtlp(input: string | object): ParseResult {
  let payload: unknown;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { traces: [], skipped: 0 };
    }
  } else {
    payload = input;
  }

  const raw = collectSpans(payload);
  if (raw.length === 0) return { traces: [], skipped: 0 };

  // Group by traceId.
  const byTrace = new Map<string, RawSpan[]>();
  let skipped = 0;
  for (const s of raw) {
    if (!s || !s.traceId || !s.spanId) {
      skipped += 1;
      continue;
    }
    const arr = byTrace.get(s.traceId);
    if (arr) arr.push(s);
    else byTrace.set(s.traceId, [s]);
  }

  const traces: TraceTree[] = [];
  for (const [traceId, group] of byTrace) {
    traces.push(buildTrace(traceId, group));
  }
  // Sort traces by total duration desc — most "interesting" first.
  traces.sort((a, b) => b.totalUs - a.totalUs);
  return { traces, skipped };
}

function buildTrace(traceId: string, group: RawSpan[]): TraceTree {
  const spans = new Map<string, NormalizedSpan>();
  let traceStart = Number.POSITIVE_INFINITY;
  let traceEnd = 0;

  // First pass: compute absolute timestamps to find traceStart.
  const timing: Array<{ id: string; startNs: number; endNs: number }> = [];
  for (const s of group) {
    const startNs = toNanos(s.startTimeUnixNano);
    const endNs = toNanos(s.endTimeUnixNano);
    if (startNs < traceStart) traceStart = startNs;
    if (endNs > traceEnd) traceEnd = endNs;
    timing.push({ id: s.spanId, startNs, endNs });
  }
  if (!Number.isFinite(traceStart)) traceStart = 0;

  // Second pass: build NormalizedSpan with us-relative timing.
  for (let i = 0; i < group.length; i++) {
    const s = group[i]!;
    const t = timing[i]!;
    const startUs = (t.startNs - traceStart) / 1000;
    const durationUs = Math.max(0, (t.endNs - t.startNs) / 1000);
    const attrs = readAttributes(s.attributes);
    const filepath =
      typeof attrs['code.filepath'] === 'string'
        ? attrs['code.filepath']
        : typeof attrs['code.namespace'] === 'string'
          ? attrs['code.namespace']
          : undefined;
    const fn =
      typeof attrs['code.function'] === 'string'
        ? attrs['code.function']
        : undefined;
    const lineno =
      typeof attrs['code.lineno'] === 'number'
        ? (attrs['code.lineno'] as number)
        : typeof attrs['code.lineno'] === 'string'
          ? Number(attrs['code.lineno'])
          : undefined;
    const statusCode = s.status?.code ?? 0;
    const status: NormalizedSpan['status'] =
      statusCode === 2 ? 'error' : statusCode === 1 ? 'ok' : 'unset';

    const span: NormalizedSpan = {
      spanId: s.spanId,
      traceId,
      name: s.name,
      startUs,
      durationUs,
      selfUs: durationUs,
      kind: spanKindLabel(s.kind),
      attributes: attrs,
      status,
      children: [],
      depth: 0,
    };
    if (s.parentSpanId) span.parentId = s.parentSpanId;
    if (filepath !== undefined) span.filepath = filepath;
    if (fn !== undefined) span.function = fn;
    if (lineno !== undefined && Number.isFinite(lineno)) span.lineno = lineno;
    if (s.status?.message !== undefined) span.errorMessage = s.status.message;
    if (s.__scope !== undefined) span.scope = s.__scope;

    spans.set(s.spanId, span);
  }

  // Wire children + depth via a BFS from roots. A "root" is a span with no
  // parent OR whose parent isn't in this trace group (cross-process).
  const roots: string[] = [];
  for (const sp of spans.values()) {
    if (!sp.parentId || !spans.has(sp.parentId)) {
      roots.push(sp.spanId);
    } else {
      const parent = spans.get(sp.parentId)!;
      parent.children.push(sp.spanId);
    }
  }

  // Depth + self-time (parent.duration - sum(children.duration)).
  const visit = (id: string, depth: number) => {
    const sp = spans.get(id);
    if (!sp) return;
    sp.depth = depth;
    let childSum = 0;
    for (const cid of sp.children) {
      const c = spans.get(cid);
      if (c) childSum += c.durationUs;
      visit(cid, depth + 1);
    }
    sp.selfUs = Math.max(0, sp.durationUs - childSum);
  };
  for (const r of roots) visit(r, 0);

  // Sort children by start time so the waterfall is deterministic.
  for (const sp of spans.values()) {
    sp.children.sort((a, b) => {
      const sa = spans.get(a)?.startUs ?? 0;
      const sb = spans.get(b)?.startUs ?? 0;
      return sa - sb;
    });
  }
  roots.sort((a, b) => {
    const sa = spans.get(a)?.startUs ?? 0;
    const sb = spans.get(b)?.startUs ?? 0;
    return sa - sb;
  });

  const totalUs = Math.max(0, (traceEnd - traceStart) / 1000);
  return {
    traceId,
    rootIds: roots,
    spans,
    totalUs,
    startUs: 0,
  };
}

/** Top-N spans by self-time. */
export function hotspots(tree: TraceTree, n: number): NormalizedSpan[] {
  const arr = Array.from(tree.spans.values());
  arr.sort((a, b) => b.selfUs - a.selfUs);
  return arr.slice(0, n);
}

/** Flatten the tree in DFS / waterfall order. */
export function flatten(tree: TraceTree): NormalizedSpan[] {
  const out: NormalizedSpan[] = [];
  const walk = (id: string) => {
    const sp = tree.spans.get(id);
    if (!sp) return;
    out.push(sp);
    for (const c of sp.children) walk(c);
  };
  for (const r of tree.rootIds) walk(r);
  return out;
}
