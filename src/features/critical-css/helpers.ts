import { mockCriticalBundles, mockRenderPaths } from '@shared/mocks/render-path';
import type { CriticalCssBundle, RenderPathEntry } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/critical-css/helpers` consumers keep working.
export type { RenderPathEntry, CriticalCssBundle } from '@shared/types';

export const renderPaths: Record<string, RenderPathEntry[]> = mockRenderPaths;
export const criticalBundles: Record<string, CriticalCssBundle> = mockCriticalBundles;

export const KIND_COLOR: Record<RenderPathEntry['kind'], string> = {
  html: 'fill-ink-2',
  css: 'fill-sem-isr',
  js: 'fill-sem-dynamic',
  font: 'fill-sem-edge',
  image: 'fill-sem-static',
  xhr: 'fill-sev-info',
};

export const KIND_LABEL: Record<RenderPathEntry['kind'], string> = {
  html: 'HTML',
  css: 'CSS',
  js: 'JS',
  font: 'Font',
  image: 'Image',
  xhr: 'XHR',
};

export function pathTotalMs(entries: ReadonlyArray<RenderPathEntry>): number {
  if (entries.length === 0) return 0;
  return entries.reduce((max, e) => Math.max(max, e.startMs + e.durMs), 0);
}
