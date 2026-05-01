/**
 * Taint source detectors.
 *
 * MVP scope: we look for `process.env.X` accesses where X looks like a
 * secret (matches /SECRET|KEY|TOKEN|PASSWORD|PRIVATE/i and is NOT
 * prefixed with NEXT_PUBLIC_).
 *
 * Additional source detectors (db-row, session, request-headers) are
 * left as stubs — the solver still treats them uniformly, so we can
 * grow these incrementally without changing the public types.
 */

import {
  Node,
  PropertyAccessExpression,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';
import type { TaintSource } from './types';

const SECRET_PATTERN = /SECRET|KEY|TOKEN|PASSWORD|PRIVATE/i;
const PUBLIC_PREFIX = /^NEXT_PUBLIC_/i;

export function looksLikeSecretName(name: string): boolean {
  if (PUBLIC_PREFIX.test(name)) return false;
  return SECRET_PATTERN.test(name);
}

/** Detect `process.env.X` reads that look like secrets. */
export function findEnvSecretSources(sf: SourceFile, file: string): TaintSource[] {
  const out: TaintSource[] = [];
  const propAccesses = sf.getDescendantsOfKind(
    SyntaxKind.PropertyAccessExpression,
  ) as PropertyAccessExpression[];

  for (const pa of propAccesses) {
    // pattern: <X>.<name>  where <X> is `process.env`.
    const obj = pa.getExpression();
    const propName = pa.getName();
    if (!Node.isPropertyAccessExpression(obj)) continue;
    const objObj = obj.getExpression();
    const objName = obj.getName();
    if (objName !== 'env') continue;
    if (!Node.isIdentifier(objObj)) continue;
    if (objObj.getText() !== 'process') continue;
    if (!looksLikeSecretName(propName)) continue;
    const start = pa.getStartLineNumber();
    const col = pa.getStart() - pa.getStartLinePos();
    out.push({
      kind: 'env-secret',
      node: {
        file,
        line: start,
        column: col >= 0 ? col + 1 : undefined,
        syntaxKind: 'PropertyAccessExpression',
      },
      file,
      expr: pa.getText(),
    });
  }
  return out;
}

/**
 * Stub: future hook for db-row sources. Returns [] in MVP.
 */
export function findDbRowSources(_sf: SourceFile, _file: string): TaintSource[] {
  return [];
}

/**
 * Stub: future hook for session/request-headers sources.
 */
export function findRequestSources(_sf: SourceFile, _file: string): TaintSource[] {
  return [];
}

export function findAllSources(sf: SourceFile, file: string): TaintSource[] {
  return [
    ...findEnvSecretSources(sf, file),
    ...findDbRowSources(sf, file),
    ...findRequestSources(sf, file),
  ];
}
