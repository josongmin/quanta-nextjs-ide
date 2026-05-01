/**
 * Layer violation detector.
 *
 * Consumes a precomputed import graph (workspace-relative `from → [imports]`)
 * and the layer config, then emits a `Violation` for any edge whose layer
 * delta is illegal (UI → Data direct, or any deeper-layer-to-shallower
 * "reverse" edge).
 *
 * The import graph shape matches the one produced by
 * `src/shared/analyzer/code-graph.ts` (`importGraph` field on
 * `CodeGraphReport`). We accept the bare `Record<string, string[]>` so
 * the detector stays decoupled from the worker types.
 */

import { DEFAULT_LAYERS, layerOf, rankOf } from './config';
import type { LayerDefinition, Violation, ViolationKind, ViolationReport } from './types';

export interface DetectOptions {
  layers?: ReadonlyArray<LayerDefinition>;
  /**
   * If provided, only edges originating from one of these files are
   * considered. Useful for "show violations introduced by my change".
   */
  scope?: ReadonlyArray<string>;
}

export function detectViolations(
  importGraph: Record<string, ReadonlyArray<string>>,
  options: DetectOptions = {},
): ViolationReport {
  const layers = options.layers ?? DEFAULT_LAYERS;
  const scopeSet = options.scope ? new Set(options.scope) : null;
  const violations: Violation[] = [];
  let edgeCount = 0;
  let counter = 0;

  for (const [from, deps] of Object.entries(importGraph)) {
    if (scopeSet && !scopeSet.has(from)) continue;
    const fromLayer = layerOf(from, layers);
    if (!fromLayer) {
      edgeCount += deps.length;
      continue;
    }
    for (const to of deps) {
      edgeCount++;
      const toLayer = layerOf(to, layers);
      if (!toLayer || toLayer === fromLayer) continue;
      const fr = rankOf(fromLayer);
      const tr = rankOf(toLayer);
      const delta = tr - fr;
      if (delta === 1) continue; // adjacent, allowed direction.

      let kind: ViolationKind;
      let hint: string;
      if (delta < 0) {
        kind = 'reverse';
        hint = `${toLayer} should not be imported by ${fromLayer}; invert the dependency or move the helper.`;
      } else if (fromLayer === 'ui' && toLayer === 'data') {
        kind = 'ui-to-data';
        hint = 'UI must not reach data directly. Route this through a service in lib/services.';
      } else {
        kind = 'cross-layer';
        hint = `${fromLayer} → ${toLayer} skips ${layers[fr + 1]?.id ?? '(intermediate)'}; introduce a wrapper.`;
      }

      violations.push({
        id: `lv_${counter++}`,
        from,
        to,
        fromLayer,
        toLayer,
        kind,
        hint,
      });
    }
  }

  return {
    violations,
    scanned: Object.keys(importGraph).length,
    edges: edgeCount,
  };
}

/**
 * Convenience: tally violations per layer pair, used to decorate the
 * pyramid SVG with edge counts.
 */
export function tallyByPair(
  violations: ReadonlyArray<Violation>,
): ReadonlyArray<{ from: string; to: string; count: number; kind: ViolationKind }> {
  const map = new Map<string, { from: string; to: string; count: number; kind: ViolationKind }>();
  for (const v of violations) {
    const key = `${v.fromLayer}->${v.toLayer}:${v.kind}`;
    const slot = map.get(key);
    if (slot) slot.count++;
    else map.set(key, { from: v.fromLayer, to: v.toLayer, count: 1, kind: v.kind });
  }
  return [...map.values()];
}
