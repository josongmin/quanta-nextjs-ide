/**
 * Layer model — defines the canonical UI → SERVICE → DATA stack and the
 * glob patterns that classify a workspace file into one of those layers.
 *
 * The layer order matters: a violation is any direct import from a layer
 * higher in the list to a layer two-or-more steps deeper, OR any reverse
 * edge (deeper layer importing a shallower one).
 */

import type { LayerDefinition, LayerKind } from './types';

export const DEFAULT_LAYERS: ReadonlyArray<LayerDefinition> = [
  {
    id: 'ui',
    label: 'UI (components, app/)',
    globs: ['app/**', 'components/**', 'src/app/**', 'src/components/**', 'src/widgets/**', 'src/pages/**'],
    tone: 'accent',
  },
  {
    id: 'service',
    label: 'Service (lib/services, lib/api)',
    globs: ['lib/services/**', 'lib/api/**', 'src/lib/services/**', 'src/lib/api/**', 'src/features/**'],
    tone: 'info',
  },
  {
    id: 'data',
    label: 'Data (lib/db, prisma)',
    globs: ['lib/db/**', '**/prisma*', 'src/lib/db/**', 'src/entities/**', '**/schema.prisma'],
    tone: 'warn',
  },
];

export const LAYER_ORDER: ReadonlyArray<LayerKind> = ['ui', 'service', 'data'];

/** Layer rank — lower means closer to the user. */
export function rankOf(layer: LayerKind): number {
  return LAYER_ORDER.indexOf(layer);
}

/**
 * Translate a glob like `app/**` into a regex anchored to the file path.
 * Implementation: walk char-by-char to avoid the `**` vs `*` regex
 * collision (the `**` token must collapse to `.*` before single-star
 * substitution runs).
 */
function globToRegex(glob: string): RegExp {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    const next = glob[i + 1];
    if (c === '*' && next === '*') {
      out += '.*';
      i++;
    } else if (c === '*') {
      out += '[^/]*';
    } else if (c && /[.+?^${}()|[\]\\]/.test(c)) {
      out += '\\' + c;
    } else if (c) {
      out += c;
    }
  }
  return new RegExp(`(^|/)${out}$|(^|/)${out}(/|$)`);
}

const COMPILED = new WeakMap<LayerDefinition, RegExp[]>();

function regexesFor(layer: LayerDefinition): RegExp[] {
  const cached = COMPILED.get(layer);
  if (cached) return cached;
  const re = layer.globs.map(globToRegex);
  COMPILED.set(layer, re);
  return re;
}

/**
 * Classify a workspace-relative file path. Returns the FIRST matching
 * layer using the order in `layers` — callers should keep `data` last
 * so e.g. `src/lib/db/...` doesn't accidentally classify as `service`.
 */
export function layerOf(
  file: string,
  layers: ReadonlyArray<LayerDefinition> = DEFAULT_LAYERS,
): LayerKind | null {
  // Match in reverse so `data` (deepest) wins over a broad `service` glob
  // when the file lives under `lib/db`.
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer) continue;
    const regexes = regexesFor(layer);
    if (regexes.some((r) => r.test(file))) return layer.id;
  }
  return null;
}
