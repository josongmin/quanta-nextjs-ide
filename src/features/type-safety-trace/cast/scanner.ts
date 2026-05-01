/**
 * AST scan for unsafe casts:
 *   - AsExpression with `any` or `unknown` as target
 *   - DoubleAssertion (`x as unknown as Y`)
 *   - NonNullExpression (`x!`)
 *
 * The scanner is purely structural — severity assignment lives in
 * `severity.ts` so policy can evolve without touching detection.
 */

import { Node, type SourceFile } from 'ts-morph';
import { addOrUpdateSource } from '../project';
import { scoreCast } from './severity';
import type { UnsafeCast, UnsafeCastKind } from './types';
import type { SymbolRef } from '../types';

function locationOf(node: Node, file: string, name: string): SymbolRef {
  const sf = node.getSourceFile();
  const pos = sf.getLineAndColumnAtPos(node.getStart());
  return { file, line: pos.line, column: pos.column, name, kind: node.getKindName() };
}

function isClientFile(sf: SourceFile): boolean {
  return /['"]use client['"]/.test(sf.getFullText().slice(0, 200));
}

function detectKind(node: Node): UnsafeCastKind | null {
  if (Node.isNonNullExpression(node)) return 'non-null';
  if (Node.isAsExpression(node)) {
    const tn = node.getTypeNode();
    const t = tn?.getText() ?? '';
    if (t === 'any') return 'as-any';
    if (t === 'unknown') return 'unknown-cast';
    // Double-assertion check: parent is also an AsExpression chained on this.
    const inner = node.getExpression();
    if (Node.isAsExpression(inner)) {
      const innerType = inner.getTypeNode()?.getText() ?? '';
      if (innerType === 'unknown') return 'double-assert';
    }
  }
  return null;
}

function scanFile(sf: SourceFile, file: string): UnsafeCast[] {
  const out: UnsafeCast[] = [];
  const isClient = isClientFile(sf);
  sf.forEachDescendant((node) => {
    const kind = detectKind(node);
    if (!kind) return;
    const text = node.getText().slice(0, 96);
    let fromType = '';
    let toType = '';
    if (Node.isAsExpression(node)) {
      fromType = node.getExpression().getText().slice(0, 64);
      toType = node.getTypeNode()?.getText() ?? '';
    } else if (Node.isNonNullExpression(node)) {
      fromType = node.getExpression().getText().slice(0, 64);
      toType = `${fromType} (non-null)`;
    }
    const cast: UnsafeCast = {
      kind,
      location: locationOf(node, file, text),
      fromType,
      toType,
      downstream: [],
      severity: 'low',
      crossesBoundary: isClient,
    };
    cast.severity = scoreCast(cast);
    out.push(cast);
  });
  return out;
}

export interface ScanCastArgs {
  files: ReadonlyArray<{ path: string; text: string }>;
}

export async function scanUnsafeCasts(args: ScanCastArgs): Promise<UnsafeCast[]> {
  const out: UnsafeCast[] = [];
  for (const f of args.files) {
    // eslint-disable-next-line no-await-in-loop
    const sf = await addOrUpdateSource(f.path, f.text);
    out.push(...scanFile(sf, f.path));
  }
  return out;
}
