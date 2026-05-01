/**
 * Heuristic classifier for `any` sources.
 *
 * Given the AST node + its surrounding context, decide whether the any
 * came from a JSON.parse / a library with no .d.ts / an explicit `as any`
 * cast / an implicit parameter / a fetch-style untyped API.
 *
 * Pure functions only — no ts-morph traversal here, just shape detection.
 */

import { Node, SyntaxKind } from 'ts-morph';
import type { AnySourceKind } from './types';

export function classifyAnySource(node: Node): AnySourceKind {
  const text = node.getText();
  if (/JSON\.parse\s*\(/.test(text)) return 'json-parse';
  if (/\bas\s+any\b/.test(text)) return 'as-any';
  // Common untyped runtime/network surfaces.
  if (/\bfetch\s*\(/.test(text) || /\.json\s*\(\s*\)/.test(text)) {
    return 'untyped-api';
  }
  // Parameter without an annotation in a function declaration.
  if (Node.isParameterDeclaration(node) && !node.getTypeNode()) {
    return 'implicit';
  }
  if (Node.isVariableDeclaration(node) && !node.getTypeNode()) {
    return 'implicit';
  }
  // Calls into a require()-style or globalThis lookup imply an untyped lib.
  if (/\brequire\s*\(/.test(text) || /globalThis\./.test(text)) {
    return 'untyped-lib';
  }
  // Find an enclosing import to refine "untyped-lib".
  const importDecl = node.getFirstAncestorByKind(SyntaxKind.ImportDeclaration);
  if (importDecl) return 'untyped-lib';
  return 'implicit';
}

export const SOURCE_LABEL: Record<AnySourceKind, string> = {
  'json-parse': 'JSON.parse',
  'untyped-lib': 'untyped library',
  'as-any': 'explicit cast',
  implicit: 'implicit any',
  'untyped-api': 'untyped API',
};
