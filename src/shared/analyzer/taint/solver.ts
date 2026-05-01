/**
 * Intra- and (1-level) inter-procedural taint solver.
 *
 * Algorithm sketch:
 *   1. Within a single function (or top-level scope), we maintain a set of
 *      "tainted symbol names". A name becomes tainted when:
 *        - it is initialised from a known source expression
 *          (e.g. `const x = process.env.STRIPE_SECRET_KEY`), OR
 *        - it is the parameter of a function that is called with a tainted
 *          argument at any of the call-sites we observed (1-level).
 *   2. We propagate via assignments (`a = b`, `const a = b`),
 *      destructuring (`const { x } = tainted`), spreads (`{ ...tainted }`),
 *      and call returns (`const x = fn(tainted)` -> if fn returns its arg,
 *      x is tainted).
 *   3. A sink fires when its expression text references a tainted symbol
 *      (textually – sufficient for MVP and avoids brittle symbol resolution).
 *
 * Confidence:
 *   - 'high'   : direct flow with no aliasing through unknown calls.
 *   - 'medium' : flowed through 1 call boundary, or via spread / destructure.
 *   - 'low'    : sink expression *contains* a tainted name as a substring
 *                but we couldn't prove the path; we still surface it so the
 *                gate can fail-closed.
 */

import {
  Node,
  Project,
  ScriptKind,
  type SourceFile,
  SyntaxKind,
  type FunctionDeclaration,
  type FunctionExpression,
  type ArrowFunction,
  type MethodDeclaration,
  type VariableStatement,
  type CallExpression,
} from 'ts-morph';

import { findAllSources } from './sources';
import { findAllSinks } from './sinks';
import { analyzeBoundaries, type DirectiveInputFile } from './adapters';
import type {
  TaintEdge,
  TaintNodeRef,
  TaintPath,
  TaintSink,
  TaintSource,
  TaintConfidence,
} from './types';

type FnLike =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunction
  | MethodDeclaration;

interface FileTaintFacts {
  /** Symbol names that are tainted within the file scope (best-effort). */
  taintedNames: Map<string, TaintSource>;
  /** Edges accumulated as we discovered taint flow. */
  edges: TaintEdge[];
  /** Functions whose parameters are tainted at any observed call site. */
  taintedParams: Map<string, TaintSource>; // key: `fnName.paramName`
}

function refOfNode(node: Node, file: string, syntaxKind?: string): TaintNodeRef {
  return {
    file,
    line: node.getStartLineNumber(),
    column: Math.max(1, node.getStart() - node.getStartLinePos() + 1),
    syntaxKind: syntaxKind ?? node.getKindName(),
  };
}

function exprMentions(text: string, name: string): boolean {
  // word-boundary match
  return new RegExp(`\\b${escape(name)}\\b`).test(text);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Walk a single SourceFile and compute file-local taint facts. */
function analyzeFile(sf: SourceFile, file: string, sources: TaintSource[]): FileTaintFacts {
  const facts: FileTaintFacts = {
    taintedNames: new Map(),
    edges: [],
    taintedParams: new Map(),
  };

  // Seed: if a source expression appears in a variable initialiser, taint that name.
  const varStmts = sf.getDescendantsOfKind(SyntaxKind.VariableStatement) as VariableStatement[];
  for (const v of varStmts) {
    for (const decl of v.getDeclarationList().getDeclarations()) {
      const init = decl.getInitializer();
      if (!init) continue;
      const initText = init.getText();
      const matched = sources.find((s) => s.file === file && initText.includes(s.expr));
      if (!matched) continue;
      const nameNode = decl.getNameNode();
      // Handle plain identifier
      if (Node.isIdentifier(nameNode)) {
        const name = nameNode.getText();
        facts.taintedNames.set(name, matched);
        facts.edges.push({
          from: matched.node,
          to: refOfNode(nameNode, file, 'Identifier'),
          kind: 'assignment',
          note: `assigned to "${name}"`,
        });
      } else if (Node.isObjectBindingPattern(nameNode)) {
        for (const el of nameNode.getElements()) {
          const id = el.getNameNode();
          if (!Node.isIdentifier(id)) continue;
          const name = id.getText();
          facts.taintedNames.set(name, matched);
          facts.edges.push({
            from: matched.node,
            to: refOfNode(id, file, 'Identifier'),
            kind: 'destructure',
            note: `destructured as "${name}"`,
          });
        }
      }
    }
  }

  // Propagate one round: re-assignments / spreads.
  // Run twice for transitive single-step flow.
  for (let round = 0; round < 2; round++) {
    const before = facts.taintedNames.size;
    for (const v of varStmts) {
      for (const decl of v.getDeclarationList().getDeclarations()) {
        const init = decl.getInitializer();
        if (!init) continue;
        const initText = init.getText();
        const taintedHit = Array.from(facts.taintedNames.entries()).find(([n]) =>
          exprMentions(initText, n),
        );
        if (!taintedHit) continue;
        const [, src] = taintedHit;
        const nameNode = decl.getNameNode();
        if (Node.isIdentifier(nameNode)) {
          const name = nameNode.getText();
          if (facts.taintedNames.has(name)) continue;
          facts.taintedNames.set(name, src);
          facts.edges.push({
            from: refOfNode(init, file, init.getKindName()),
            to: refOfNode(nameNode, file, 'Identifier'),
            kind: initText.startsWith('{') || initText.includes('...') ? 'spread' : 'assignment',
            note: `propagated to "${name}"`,
          });
        }
      }
    }
    if (facts.taintedNames.size === before) break;
  }

  // 1-level inter-procedural: scan call sites; if any argument is a tainted
  // identifier and the callee is a local function, mark its parameter.
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression) as CallExpression[];
  const localFns = collectLocalFunctions(sf);
  for (const call of calls) {
    const calleeText = call.getExpression().getText();
    const fn = localFns.get(calleeText);
    if (!fn) continue;
    const params = fn.getParameters();
    const args = call.getArguments();
    for (let i = 0; i < args.length && i < params.length; i++) {
      const a = args[i];
      const p = params[i];
      if (!a || !p) continue;
      const aText = a.getText();
      const taintedHit = Array.from(facts.taintedNames.entries()).find(([n]) =>
        exprMentions(aText, n),
      );
      if (!taintedHit) continue;
      const [, src] = taintedHit;
      const paramName = p.getNameNode().getText();
      facts.taintedParams.set(`${calleeText}.${paramName}`, src);
      facts.edges.push({
        from: refOfNode(a, file, a.getKindName()),
        to: refOfNode(p, file, 'Parameter'),
        kind: 'call-arg',
        note: `passed to ${calleeText} as "${paramName}"`,
      });
      // Within the callee, the parameter is now tainted.
      // We mark the param name in the file-level table so subsequent sinks
      // inside the callee body will trigger.
      if (!facts.taintedNames.has(paramName)) {
        facts.taintedNames.set(paramName, src);
      }
    }
  }

  return facts;
}

function collectLocalFunctions(sf: SourceFile): Map<string, FnLike> {
  const out = new Map<string, FnLike>();
  for (const fn of sf.getFunctions()) {
    const nm = fn.getName();
    if (nm) out.set(nm, fn);
  }
  // const Foo = (x) => ... / function expr
  for (const v of sf.getVariableStatements()) {
    for (const d of v.getDeclarationList().getDeclarations()) {
      const init = d.getInitializer();
      if (!init) continue;
      if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
        const nameNode = d.getNameNode();
        if (Node.isIdentifier(nameNode)) {
          out.set(nameNode.getText(), init as FnLike);
        }
      }
    }
  }
  return out;
}

function classifyConfidence(edges: TaintEdge[]): TaintConfidence {
  if (edges.length === 0) return 'low';
  const kinds = new Set(edges.map((e) => e.kind));
  if (kinds.has('call-arg') || kinds.has('spread')) return 'medium';
  if (edges.length === 1 && (kinds.has('assignment') || kinds.has('destructure'))) {
    return 'high';
  }
  if (edges.length <= 3) return 'high';
  return 'medium';
}

/** Resolve sink hits for a file given file taint facts. */
function resolveSinks(
  sinks: TaintSink[],
  facts: FileTaintFacts,
  source: TaintSource,
): TaintPath[] {
  const out: TaintPath[] = [];
  for (const sink of sinks) {
    // sink expression directly mentions the source expression?
    const direct = sink.expr.includes(source.expr);
    const mentionedNames = Array.from(facts.taintedNames.keys()).filter((n) =>
      exprMentions(sink.expr, n),
    );
    const indirect = mentionedNames.length > 0 &&
      mentionedNames.some((n) => facts.taintedNames.get(n) === source);
    if (!direct && !indirect) continue;

    const edges = direct
      ? [
          {
            from: source.node,
            to: sink.node,
            kind: 'jsx-prop' as const,
            note: 'direct flow into sink',
          },
        ]
      : [
          ...facts.edges.filter(
            (e) =>
              facts.taintedNames.get(e.to.syntaxKind ?? '') === source ||
              (mentionedNames.length > 0 && e.to.syntaxKind === 'Identifier'),
          ),
          {
            from: sink.node,
            to: sink.node,
            kind: sink.kind === 'client-component-prop' ? ('jsx-prop' as const) : ('call-arg' as const),
            note: `reached ${sink.kind}`,
          },
        ];
    const confidence = direct ? 'high' : classifyConfidence(edges);
    out.push({ source, sink, edges, confidence });
  }
  return out;
}

export interface SolverInput {
  files: ReadonlyArray<DirectiveInputFile>;
}

export interface SolverResult {
  paths: TaintPath[];
  scanned: number;
}

export function solveTaint(input: SolverInput): SolverResult {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true, jsx: 4 /* Preserve */ },
  });
  for (const f of input.files) {
    const ext = f.file.endsWith('.tsx') ? '.tsx' : '.ts';
    project.createSourceFile(`/${f.file}`, f.source, {
      overwrite: true,
      scriptKind: ext === '.tsx' ? ScriptKind.TSX : ScriptKind.TS,
    });
  }

  // Boundary info from use-client analyzer.
  const { clientComponents } = analyzeBoundaries(input.files);

  const allPaths: TaintPath[] = [];
  for (const f of input.files) {
    const sf = project.getSourceFile(`/${f.file}`);
    if (!sf) continue;
    const sources = findAllSources(sf, f.file);
    if (sources.length === 0) {
      // even if no sources here, sinks may consume identifiers tainted in this file,
      // but in the file-local MVP we skip cross-file flow.
      continue;
    }
    const sinks = findAllSinks(sf, f.file, clientComponents);
    const facts = analyzeFile(sf, f.file, sources);
    for (const src of sources) {
      allPaths.push(...resolveSinks(sinks, facts, src));
    }
  }
  return { paths: allPaths, scanned: input.files.length };
}
