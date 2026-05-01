/**
 * Walk every source file and collect identifiers whose type contains `any`.
 *
 * Uses ts-morph's TypeChecker to ask each ValueDeclaration / Parameter /
 * VariableDeclaration / AsExpression for its type. We flag:
 *   - declarations whose type has the `Any` flag
 *   - `as any` casts (AsExpression with the literal `any` type ref)
 *
 * The propagation chain is built lazily by the caller — this module just
 * surfaces source sites.
 */

import { Node, SyntaxKind, TypeFlags, type SourceFile } from 'ts-morph';
import { addOrUpdateSource } from '../project';
import { classifyAnySource, SOURCE_LABEL } from './sources';
import type { AnyLeak } from './types';
import type { SeverityLevel, SymbolRef } from '../types';

function locationOf(node: Node, file: string, name: string): SymbolRef {
  const sf = node.getSourceFile();
  const pos = sf.getLineAndColumnAtPos(node.getStart());
  return { file, line: pos.line, column: pos.column, name, kind: node.getKindName() };
}

function severityFor(kind: AnyLeak['sourceKind']): SeverityLevel {
  switch (kind) {
    case 'as-any':
      return 'high';
    case 'untyped-api':
    case 'json-parse':
      return 'medium';
    case 'untyped-lib':
      return 'medium';
    case 'implicit':
      return 'low';
  }
}

function isAnyType(type: import('ts-morph').Type | undefined): boolean {
  if (!type) return false;
  const flags = type.getFlags();
  if (flags & TypeFlags.Any) return true;
  // Apparent type — for `as any` the cast type is itself `any`.
  const apparent = type.getApparentType();
  if (apparent && apparent !== type && apparent.getFlags() & TypeFlags.Any) return true;
  return false;
}

function scanFile(sf: SourceFile, file: string): AnyLeak[] {
  const out: AnyLeak[] = [];
  // 1) AsExpressions targeting `any`.
  sf.forEachDescendant((node) => {
    if (Node.isAsExpression(node)) {
      const typeNode = node.getTypeNode();
      const text = typeNode?.getText() ?? '';
      if (text === 'any') {
        const sym = locationOf(node, file, node.getExpression().getText().slice(0, 64));
        out.push({
          sourceLocation: sym,
          sourceKind: 'as-any',
          propagation: [],
          severity: severityFor('as-any'),
          message: `Explicit cast \`${sym.name} as any\``,
        });
      }
      return;
    }
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node)) {
      const tn = node.getTypeNode();
      // Skip declarations whose annotation is *explicitly* something other
      // than `any`. We're hunting implicit / inferred any.
      if (tn && tn.getText() !== 'any') return;
      const type = node.getType();
      if (!isAnyType(type)) return;
      const initializer = Node.isVariableDeclaration(node) ? node.getInitializer() : undefined;
      const probe = initializer ?? node;
      const kind = classifyAnySource(probe);
      const name = node.getName?.() ?? node.getText().slice(0, 64);
      out.push({
        sourceLocation: locationOf(node, file, String(name)),
        sourceKind: kind,
        propagation: [],
        severity: severityFor(kind),
        message: `${SOURCE_LABEL[kind]} produces \`any\` at \`${name}\``,
      });
    }
  });
  return out;
}

export interface ScanAnyArgs {
  files: ReadonlyArray<{ path: string; text: string }>;
}

export async function scanAnyLeaks(args: ScanAnyArgs): Promise<AnyLeak[]> {
  const sources: SourceFile[] = [];
  for (const f of args.files) {
    // eslint-disable-next-line no-await-in-loop
    sources.push(await addOrUpdateSource(f.path, f.text));
  }
  const leaks: AnyLeak[] = [];
  for (const sf of sources) {
    const fileName = sf.getFilePath().toString();
    leaks.push(...scanFile(sf, fileName));
  }
  return leaks;
}
