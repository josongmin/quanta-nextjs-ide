import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { useUiStore, initialOverlays } from '@entities/ui-shell';
import type { OverlayState } from '@entities/ui-shell';
import { PinnedDock } from './pinned-dock';

/**
 * Lazy-loaded overlay registry.
 *
 * Each overlay is bundled into its own chunk and only fetched when its
 * `open` flag flips to `true`. This keeps the main entry chunk small even
 * with 180+ overlays registered.
 *
 * The registry is now self-assembling via `import.meta.glob`: any feature
 * directory under `src/features/<dir>/index.tsx` that exports
 * `<PascalCase>Overlay` and whose camelCase dir name is declared in
 * `OverlayState` is automatically wired up. To add a new overlay:
 *   1. Create `src/features/<kebab-name>/index.tsx` and export
 *      `<PascalName>Overlay`.
 *   2. Declare `<camelName>` in `OverlayState` (and `initialOverlays`).
 * No edits to this file are required.
 *
 * Special-cased: the `wizards/<sub>` features live one level deeper, so the
 * top-level glob can't reach them; they remain hand-registered below.
 */
type OverlayKey = Exclude<keyof OverlayState, 'pinned'>;

interface OverlayEntry {
  slot: OverlayKey;
  Component: ComponentType;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** "flame-graph" → "flameGraph", "ai_inline_explain" → "aiInlineExplain" */
function toCamelCase(dir: string): string {
  return dir.replace(/[-_]([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** "flame-graph" → "FlameGraph" */
function toPascalCase(dir: string): string {
  const camel = toCamelCase(dir);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// Set of valid overlay slot keys (everything in OverlayState except `pinned`).
const validOverlayKeys = new Set<OverlayKey>(
  (Object.keys(initialOverlays) as Array<keyof OverlayState>).filter(
    (k): k is OverlayKey => k !== 'pinned',
  ),
);

// ── Self-registering registry ──────────────────────────────────────────────
//
// Vite requires a string literal here; aliases like `@features` don't work
// inside `import.meta.glob`. The path is relative to this file:
//   src/widgets/overlays/overlays-host.tsx → src/features/<dir>/index.tsx
type FeatureModule = Record<string, ComponentType>;
const featureModules = import.meta.glob<FeatureModule>(
  '../../features/*/index.tsx',
);

const dirNameRe = /\.\.\/\.\.\/features\/([^/]+)\/index\.tsx$/;

const autoEntries: OverlayEntry[] = [];
for (const [path, load] of Object.entries(featureModules)) {
  const match = dirNameRe.exec(path);
  if (!match) continue;
  const dir = match[1];
  if (!dir) continue;
  const slot = toCamelCase(dir) as OverlayKey;
  if (!validOverlayKeys.has(slot)) continue;
  const exportName = `${toPascalCase(dir)}Overlay`;
  const Component = lazy(async () => {
    const mod = await load();
    const Cmp = mod[exportName];
    if (!Cmp) {
      throw new Error(
        `[overlays-host] Feature "${dir}" is missing export "${exportName}"`,
      );
    }
    return { default: Cmp };
  });
  autoEntries.push({ slot, Component });
}

// Hand-register the few overlays that don't follow the
// `<kebab-dir>` ↔ `<camelKey>` / `<PascalDir>Overlay` convention:
//
//  • Wizards live in `features/wizards/<sub>/index.tsx` (one level deeper
//    than the top-level glob can reach), and their export names follow
//    `<Sub>WizardOverlay` rather than `<Sub>Overlay`.
//  • The `settings` slot is served by the `settings-panel/` feature
//    (slot key doesn't match the dir name), exporting `SettingsPanelOverlay`.
const manualEntries: OverlayEntry[] = [
  {
    slot: 'settings',
    Component: lazy(() =>
      import('@features/settings-panel').then((m) => ({
        default: m.SettingsPanelOverlay,
      })),
    ),
  },
  {
    slot: 'wizardServerAction',
    Component: lazy(() =>
      import('@features/wizards/server-action').then((m) => ({
        default: m.ServerActionWizardOverlay,
      })),
    ),
  },
  {
    slot: 'wizardRouteHandler',
    Component: lazy(() =>
      import('@features/wizards/route-handler').then((m) => ({
        default: m.RouteHandlerWizardOverlay,
      })),
    ),
  },
  {
    slot: 'wizardNewRoute',
    Component: lazy(() =>
      import('@features/wizards/new-route').then((m) => ({
        default: m.NewRouteWizardOverlay,
      })),
    ),
  },
];

const overlayEntries: OverlayEntry[] = [...autoEntries, ...manualEntries];

function LazyOverlaySlot({ slot, Component }: OverlayEntry) {
  const open = useUiStore((s) => s.overlays[slot].open);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
}

export function OverlaysHost() {
  return (
    <>
      {overlayEntries.map((e) => (
        <LazyOverlaySlot key={e.slot} slot={e.slot} Component={e.Component} />
      ))}
      <PinnedDock />
    </>
  );
}
