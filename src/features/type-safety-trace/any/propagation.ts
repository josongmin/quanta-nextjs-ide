/**
 * DFS over references to find downstream identifiers that inherit `any`.
 *
 * Strategy:
 *   1. Start at the source identifier (or its declaration).
 *   2. Use `lspClient.references` to find every place this symbol is read.
 *   3. For each read, also follow simple assignments (`const x = src.foo`)
 *      one hop further by re-running references on the LHS identifier.
 *
 * Guardrails:
 *   - Bounded depth (default 3) so a heavily-fanned utility doesn't
 *     drag every file in the project.
 *   - Visited set keyed by `${file}:${line}:${col}` to avoid cycles.
 *   - Soft cap on total visited (default 200).
 */

import { lspClient } from '@shared/lsp';
import type { SymbolRef } from '../types';

export interface PropagationOptions {
  maxDepth?: number;
  maxNodes?: number;
}

export async function propagateAny(
  start: SymbolRef,
  opts: PropagationOptions = {},
): Promise<SymbolRef[]> {
  const maxDepth = opts.maxDepth ?? 3;
  const maxNodes = opts.maxNodes ?? 200;
  const visited = new Set<string>();
  const found: SymbolRef[] = [];

  const queue: Array<{ ref: SymbolRef; depth: number }> = [
    { ref: start, depth: 0 },
  ];

  while (queue.length > 0 && found.length < maxNodes) {
    const item = queue.shift();
    if (!item) break;
    const { ref, depth } = item;
    const key = `${ref.file}:${ref.line}:${ref.column}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (depth > maxDepth) continue;

    let res:
      | Awaited<ReturnType<typeof lspClient.references>>
      | undefined;
    try {
      res = await lspClient.references(ref.file, ref.line, ref.column);
    } catch {
      res = undefined;
    }
    if (!res || !res.refs) continue;

    for (const r of res.refs) {
      if (r.isDefinition) continue;
      const next: SymbolRef = {
        file: r.file,
        line: r.start.line,
        column: r.start.offset,
        name: res.symbolName,
      };
      const k = `${next.file}:${next.line}:${next.column}`;
      if (visited.has(k)) continue;
      found.push(next);
      queue.push({ ref: next, depth: depth + 1 });
      if (found.length >= maxNodes) break;
    }
  }
  return found;
}
