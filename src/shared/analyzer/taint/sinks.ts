/**
 * Taint sink detectors.
 *
 * MVP focuses on:
 *  - JSX attributes whose host element is an imported client component
 *    (resolved via the use-client analyzer's findings).
 *  - JSON.stringify(...) calls that may serialise a tainted value into a
 *    response/log.
 *  - console.log/error/warn calls (treated as 'log' sink).
 *  - fetch(... { body }) calls (treated as 'fetch-body' sink).
 *
 * Detection is conservative: the sink is only the *call/attribute itself*.
 * The solver decides whether a tainted value reaches it.
 */

import {
  Node,
  type SourceFile,
  SyntaxKind,
  type JsxAttribute,
  type CallExpression,
} from 'ts-morph';
import type { TaintNodeRef, TaintSink } from './types';
import type { ClientComponentInfo } from './adapters';

function refOf(node: Node, file: string, syntaxKind?: string): TaintNodeRef {
  const line = node.getStartLineNumber();
  const col = node.getStart() - node.getStartLinePos();
  return {
    file,
    line,
    column: col >= 0 ? col + 1 : undefined,
    syntaxKind,
  };
}

interface SinkDetectionContext {
  /** Map of local name (as imported in this file) -> client component file. */
  clientImports: Map<string, string>;
}

function buildClientImports(
  sf: SourceFile,
  clientComponents: ReadonlyArray<ClientComponentInfo>,
): Map<string, string> {
  const out = new Map<string, string>();
  const clientFiles = new Set(clientComponents.map((c) => c.file));
  for (const imp of sf.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    if (!spec.startsWith('.')) continue;
    // Best-effort: see if any client-component file path ends with the
    // imported specifier (after extension stripping).
    const matched = Array.from(clientFiles).find((cf) =>
      cf.endsWith(spec.replace(/^\.\//, '').replace(/^\.\.\//, '')) ||
      cf.includes(spec.replace(/^\.+\//, '')),
    );
    if (!matched) continue;
    for (const named of imp.getNamedImports()) {
      out.set(named.getName(), matched);
    }
    const def = imp.getDefaultImport();
    if (def) out.set(def.getText(), matched);
  }
  return out;
}

export function findClientPropSinks(
  sf: SourceFile,
  file: string,
  clientComponents: ReadonlyArray<ClientComponentInfo>,
): TaintSink[] {
  const ctx: SinkDetectionContext = {
    clientImports: buildClientImports(sf, clientComponents),
  };
  if (ctx.clientImports.size === 0) return [];

  const out: TaintSink[] = [];
  const attrs = sf.getDescendantsOfKind(SyntaxKind.JsxAttribute) as JsxAttribute[];
  for (const a of attrs) {
    // Walk up to JsxOpeningElement / JsxSelfClosingElement to get the tag name.
    const opening = a.getFirstAncestor((p) =>
      p.getKind() === SyntaxKind.JsxOpeningElement ||
      p.getKind() === SyntaxKind.JsxSelfClosingElement,
    );
    if (!opening) continue;
    const tagNode = (opening as unknown as { getTagNameNode?: () => Node }).getTagNameNode?.();
    const tagName = tagNode?.getText() ?? '';
    if (!ctx.clientImports.has(tagName)) continue;
    const initializer = a.getInitializer();
    if (!initializer) continue;
    const expr = Node.isJsxExpression(initializer)
      ? initializer.getExpression()
      : initializer;
    if (!expr) continue;
    out.push({
      kind: 'client-component-prop',
      node: refOf(a, file, 'JsxAttribute'),
      file,
      expr: expr.getText(),
      meta: {
        component: ctx.clientImports.get(tagName) ?? '',
        prop: a.getNameNode().getText(),
      },
    });
  }
  return out;
}

export function findSerializationSinks(sf: SourceFile, file: string): TaintSink[] {
  const out: TaintSink[] = [];
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression) as CallExpression[];
  for (const c of calls) {
    const exprText = c.getExpression().getText();
    if (exprText === 'JSON.stringify') {
      const args = c.getArguments();
      if (args.length === 0) continue;
      const arg0 = args[0];
      if (!arg0) continue;
      out.push({
        kind: 'serialized-response',
        node: refOf(arg0, file, 'JSON.stringify-arg'),
        file,
        expr: arg0.getText(),
      });
    }
  }
  return out;
}

export function findLogSinks(sf: SourceFile, file: string): TaintSink[] {
  const out: TaintSink[] = [];
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression) as CallExpression[];
  for (const c of calls) {
    const exprText = c.getExpression().getText();
    if (
      exprText === 'console.log' ||
      exprText === 'console.error' ||
      exprText === 'console.warn' ||
      exprText === 'console.info'
    ) {
      for (const arg of c.getArguments()) {
        out.push({
          kind: 'log',
          node: refOf(arg, file, 'console-arg'),
          file,
          expr: arg.getText(),
        });
      }
    }
  }
  return out;
}

export function findFetchBodySinks(sf: SourceFile, file: string): TaintSink[] {
  const out: TaintSink[] = [];
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression) as CallExpression[];
  for (const c of calls) {
    const exprText = c.getExpression().getText();
    if (exprText !== 'fetch') continue;
    const args = c.getArguments();
    if (args.length < 2) continue;
    const init = args[1];
    if (!init || !Node.isObjectLiteralExpression(init)) continue;
    const bodyProp = init.getProperty('body');
    if (!bodyProp || !Node.isPropertyAssignment(bodyProp)) continue;
    const valueNode = bodyProp.getInitializer();
    if (!valueNode) continue;
    out.push({
      kind: 'fetch-body',
      node: refOf(valueNode, file, 'fetch-body'),
      file,
      expr: valueNode.getText(),
    });
  }
  return out;
}

export function findAllSinks(
  sf: SourceFile,
  file: string,
  clientComponents: ReadonlyArray<ClientComponentInfo>,
): TaintSink[] {
  return [
    ...findClientPropSinks(sf, file, clientComponents),
    ...findSerializationSinks(sf, file),
    ...findLogSinks(sf, file),
    ...findFetchBodySinks(sf, file),
  ];
}
