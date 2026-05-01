import type { ApiContract } from './matcher';

export type ContractChangeKind =
  | 'response-field-removed'
  | 'response-field-added'
  | 'response-field-type-changed'
  | 'request-field-required'
  | 'status-code-changed'
  | 'method-changed'
  | 'endpoint-removed'
  | 'endpoint-added';

export interface ContractChange {
  endpoint: string;
  kind: ContractChangeKind;
  detail: string;
  breaking: boolean;
}

interface SimpleType {
  // Each top-level "field: type" pair. Keeps it tractable in-browser.
  fields: Record<string, string>;
}

const FIELD_RE = /(\w+)\s*:\s*([^;,\n}]+)/g;

function parseShape(t: string | undefined): SimpleType {
  const fields: Record<string, string> = {};
  if (!t) return { fields };
  let m: RegExpExecArray | null;
  FIELD_RE.lastIndex = 0;
  while ((m = FIELD_RE.exec(t)) !== null) {
    fields[m[1]!] = m[2]!.trim();
  }
  return { fields };
}

function diffShapes(
  endpoint: string,
  before: string | undefined,
  after: string | undefined,
  side: 'request' | 'response',
): ContractChange[] {
  const a = parseShape(before);
  const b = parseShape(after);
  const out: ContractChange[] = [];
  for (const [key, type] of Object.entries(a.fields)) {
    if (!(key in b.fields)) {
      out.push({
        endpoint,
        kind: 'response-field-removed',
        detail: `${side} field '${key}' (${type}) removed`,
        breaking: side === 'response',
      });
    } else if (b.fields[key] !== type) {
      out.push({
        endpoint,
        kind: 'response-field-type-changed',
        detail: `${side} field '${key}' type ${type} → ${b.fields[key]}`,
        breaking: true,
      });
    }
  }
  for (const [key, type] of Object.entries(b.fields)) {
    if (!(key in a.fields)) {
      out.push({
        endpoint,
        kind: 'response-field-added',
        detail: `${side} field '${key}' (${type}) added`,
        breaking: side === 'request' && !type.includes('?'),
      });
    }
  }
  return out;
}

export function diffContracts(
  before: ApiContract[],
  after: ApiContract[],
): ContractChange[] {
  const beforeMap = new Map(before.map((c) => [`${c.method} ${c.endpoint}`, c]));
  const afterMap = new Map(after.map((c) => [`${c.method} ${c.endpoint}`, c]));
  const out: ContractChange[] = [];

  for (const [key, b] of beforeMap) {
    const a = afterMap.get(key);
    if (!a) {
      out.push({
        endpoint: b.endpoint,
        kind: 'endpoint-removed',
        detail: `${b.method} ${b.endpoint} removed`,
        breaking: true,
      });
      continue;
    }
    out.push(
      ...diffShapes(b.endpoint, b.handler?.requestType, a.handler?.requestType, 'request'),
    );
    out.push(
      ...diffShapes(b.endpoint, b.handler?.responseType, a.handler?.responseType, 'response'),
    );
  }
  for (const [key, a] of afterMap) {
    if (!beforeMap.has(key)) {
      out.push({
        endpoint: a.endpoint,
        kind: 'endpoint-added',
        detail: `${a.method} ${a.endpoint} added`,
        breaking: false,
      });
    }
  }
  return out;
}
