/**
 * Lightweight OTLP-shaped types we accept on input + the trace-tree we emit.
 *
 * Real OTLP has many fields; we only model what the IDE actually displays.
 * Anything else we encounter is preserved on a `raw` bag so the inspector
 * can show it.
 */

export interface OtlpKeyValue {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string | number;
    doubleValue?: number;
    boolValue?: boolean;
    arrayValue?: { values: ReadonlyArray<OtlpKeyValue['value']> };
  };
}

export interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: number | string;
  /** Nanoseconds since epoch as decimal string, per OTLP. */
  startTimeUnixNano: string | number;
  endTimeUnixNano: string | number;
  attributes?: ReadonlyArray<OtlpKeyValue>;
  status?: { code?: number; message?: string };
}

export interface OtlpScopeSpans {
  scope?: { name?: string; version?: string };
  spans: ReadonlyArray<OtlpSpan>;
}

export interface OtlpResourceSpans {
  resource?: { attributes?: ReadonlyArray<OtlpKeyValue> };
  scopeSpans: ReadonlyArray<OtlpScopeSpans>;
}

export interface OtlpPayload {
  resourceSpans: ReadonlyArray<OtlpResourceSpans>;
}

export interface NormalizedSpan {
  spanId: string;
  parentId?: string;
  traceId: string;
  name: string;
  /** Microseconds offset from trace start. */
  startUs: number;
  durationUs: number;
  /** Self-time = duration minus children duration. */
  selfUs: number;
  kind: string;
  attributes: Record<string, string | number | boolean>;
  /** OpenTelemetry `code.filepath` if present. */
  filepath?: string;
  /** OpenTelemetry `code.function` if present. */
  function?: string;
  /** Line number from `code.lineno`. */
  lineno?: number;
  status: 'ok' | 'error' | 'unset';
  errorMessage?: string;
  scope?: string;
  /** Children's normalized span ids. */
  children: string[];
  depth: number;
}

export interface TraceTree {
  traceId: string;
  rootIds: string[];
  spans: Map<string, NormalizedSpan>;
  /** Total trace duration in microseconds. */
  totalUs: number;
  startUs: number;
}
