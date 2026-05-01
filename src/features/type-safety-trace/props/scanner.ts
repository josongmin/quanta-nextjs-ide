/**
 * Props Origin scanner.
 *
 * For a given JSX attribute, walks ts-morph back through the consuming
 * component to determine where the value came from. The chain is then
 * scored for serialization risk (server-only data crossing a 'use client'
 * boundary is flagged unsafe).
 *
 * This is intentionally conservative: when the AST climb hits something
 * we can't statically resolve (e.g. a React.Context consumer, a dynamic
 * import, or a generic), we stop and emit an `unknown` step rather than
 * guessing. The panel then shows the partial chain so the user knows
 * exactly where introspection stopped.
 */

import { Node, SyntaxKind, type SourceFile } from 'ts-morph';
import { addOrUpdateSource } from '../project';
import type {
  PropChainKind,
  PropChainStep,
  PropOrigin,
  SerializationRisk,
} from './types';
import type { SymbolRef } from '../types';

const SERVER_DATA_HINTS = [
  'process.env',
  'prisma.',
  'fs.read',
  'cookies(',
  'headers(',
  'auth(',
  'getServerSession',
];

function locationOf(node: Node, file: string, name: string): SymbolRef {
  const start = node.getStart();
  const sf = node.getSourceFile();
  const pos = sf.getLineAndColumnAtPos(start);
  return {
    file,
    line: pos.line,
    column: pos.column,
    name,
    kind: node.getKindName(),
  };
}

function classifyExpression(
  text: string,
  declKind: PropChainKind,
): PropChainKind {
  for (const hint of SERVER_DATA_HINTS) {
    if (text.includes(hint)) return 'server-data';
  }
  return declKind;
}

function resolveIdentifier(
  ident: Node,
  file: string,
): PropChainStep | null {
  if (!Node.isIdentifier(ident)) return null;
  const symbol = ident.getSymbol();
  const decl = symbol?.getDeclarations()?.[0];
  if (!decl) {
    return {
      kind: 'unknown',
      symbol: locationOf(ident, file, ident.getText()),
      snippet: ident.getText(),
      note: 'symbol not resolved in this project',
    };
  }
  // Parameter (likely a parent component prop).
  if (Node.isParameterDeclaration(decl)) {
    return {
      kind: 'parent-prop',
      symbol: locationOf(decl, file, ident.getText()),
      snippet: decl.getText(),
      note: 'destructured component prop',
    };
  }
  // BindingElement (e.g. `const { foo } = useUser()`).
  if (Node.isBindingElement(decl)) {
    const initText = decl.getParent().getParent()?.getText() ?? decl.getText();
    const isHook = /\buse[A-Z]/.test(initText);
    return {
      kind: isHook ? 'hook' : 'local',
      symbol: locationOf(decl, file, ident.getText()),
      snippet: initText.slice(0, 160),
      note: isHook ? 'destructured from hook return' : 'destructured local',
    };
  }
  // VariableDeclaration.
  if (Node.isVariableDeclaration(decl)) {
    const init = decl.getInitializer();
    const text = init?.getText() ?? decl.getText();
    const isHook = /\buse[A-Z]/.test(text);
    return {
      kind: classifyExpression(text, isHook ? 'hook' : 'local'),
      symbol: locationOf(decl, file, ident.getText()),
      snippet: text.slice(0, 160),
      note: isHook ? 'hook return value' : undefined,
    };
  }
  if (Node.isImportSpecifier(decl) || Node.isImportClause(decl)) {
    return {
      kind: 'import',
      symbol: locationOf(decl, file, ident.getText()),
      snippet: decl.getText(),
      note: 'imported binding',
    };
  }
  return {
    kind: 'unknown',
    symbol: locationOf(decl, file, ident.getText()),
    snippet: decl.getText().slice(0, 160),
  };
}

function buildChain(expr: Node, file: string): PropChainStep[] {
  const chain: PropChainStep[] = [];
  // Literal value.
  if (
    Node.isStringLiteral(expr) ||
    Node.isNumericLiteral(expr) ||
    expr.getKind() === SyntaxKind.TrueKeyword ||
    expr.getKind() === SyntaxKind.FalseKeyword
  ) {
    chain.push({
      kind: 'literal',
      symbol: locationOf(expr, file, expr.getText()),
      snippet: expr.getText(),
    });
    return chain;
  }
  // Identifier — resolve.
  if (Node.isIdentifier(expr)) {
    const step = resolveIdentifier(expr, file);
    if (step) chain.push(step);
    return chain;
  }
  // PropertyAccess (e.g. `props.userId`, `user.id`) — climb to root identifier.
  if (Node.isPropertyAccessExpression(expr)) {
    const root = expr.getExpression();
    chain.push({
      kind: 'local',
      symbol: locationOf(expr, file, expr.getText()),
      snippet: expr.getText(),
      note: 'property access',
    });
    chain.push(...buildChain(root, file));
    return chain;
  }
  // CallExpression — record the call, classify hook.
  if (Node.isCallExpression(expr)) {
    const text = expr.getText();
    const isHook = /\buse[A-Z]/.test(text);
    chain.push({
      kind: classifyExpression(text, isHook ? 'hook' : 'local'),
      symbol: locationOf(expr, file, text.slice(0, 64)),
      snippet: text.slice(0, 160),
      note: isHook ? 'hook call' : 'function call',
    });
    return chain;
  }
  // Default: opaque expression.
  chain.push({
    kind: 'unknown',
    symbol: locationOf(expr, file, expr.getText().slice(0, 64)),
    snippet: expr.getText().slice(0, 160),
  });
  return chain;
}

function isClientFile(sf: SourceFile): boolean {
  const head = sf.getFullText().slice(0, 200);
  return /['"]use client['"]/.test(head);
}

function classifyRisk(
  chain: ReadonlyArray<PropChainStep>,
  consumerIsClient: boolean,
): { risk: SerializationRisk; reason?: string } {
  const hasServerData = chain.some((s) => s.kind === 'server-data');
  if (hasServerData && consumerIsClient) {
    return {
      risk: 'unsafe',
      reason: 'server-only data is flowing into a client component',
    };
  }
  if (hasServerData) return { risk: 'maybe', reason: 'server-side data origin' };
  const hasUnknown = chain.some((s) => s.kind === 'unknown');
  if (hasUnknown) return { risk: 'maybe', reason: 'origin not fully traced' };
  return { risk: 'safe' };
}

export interface ScanPropsArgs {
  file: string;
  source: string;
  /** 1-based line / column of the cursor (or JSX attribute). */
  line: number;
  column: number;
}

/**
 * Resolve the JSX attribute under the cursor and produce a PropOrigin.
 * Returns null if the cursor isn't on a JSX attribute.
 */
export async function scanPropOrigin(
  args: ScanPropsArgs,
): Promise<PropOrigin | null> {
  const sf = await addOrUpdateSource(args.file, args.source);
  const pos = sf.compilerNode.getPositionOfLineAndCharacter(
    args.line - 1,
    args.column - 1,
  );
  const node = sf.getDescendantAtPos(pos);
  if (!node) return null;
  const attr = node.getFirstAncestorByKind(SyntaxKind.JsxAttribute);
  if (!attr) return null;

  const propName = attr.getNameNode().getText();
  const initializer = attr.getInitializer();
  let valueExpr: Node | undefined;
  if (!initializer) {
    // <Comp prop /> — boolean shorthand.
    return {
      jsxLocation: locationOf(attr, args.file, propName),
      propName,
      consumer: enclosingComponentName(attr) ?? 'Unknown',
      chain: [
        {
          kind: 'literal',
          symbol: locationOf(attr, args.file, 'true'),
          snippet: 'true',
        },
      ],
      serializationRisk: 'safe',
    };
  }
  if (Node.isJsxExpression(initializer)) {
    valueExpr = initializer.getExpression();
  } else if (Node.isStringLiteral(initializer)) {
    valueExpr = initializer;
  }
  if (!valueExpr) return null;

  const chain = buildChain(valueExpr, args.file);
  const consumerIsClient = isClientFile(sf);
  const { risk, reason } = classifyRisk(chain, consumerIsClient);
  return {
    jsxLocation: locationOf(attr, args.file, propName),
    propName,
    consumer: enclosingComponentName(attr) ?? 'Unknown',
    chain,
    serializationRisk: risk,
    ...(reason ? { serializationReason: reason } : {}),
  };
}

function enclosingComponentName(node: Node): string | null {
  const fn =
    node.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ??
    node.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ??
    node.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
  if (!fn) return null;
  if (Node.isFunctionDeclaration(fn)) {
    return fn.getName() ?? null;
  }
  // Arrow / FunctionExpression — climb to a VariableDeclaration to find a name.
  const v = fn.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
  if (v) return v.getName();
  return null;
}
