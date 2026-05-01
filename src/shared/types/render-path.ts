/**
 * Render-path / critical-CSS shape types.
 *
 * Lives in `shared/types` so the `critical-css` feature and the
 * `shared/mocks/render-path.ts` mock data can both reference these
 * without a shared-to-feature import.
 */

export interface RenderPathEntry {
  id: string;
  resource: string;
  kind: 'html' | 'css' | 'js' | 'font' | 'image' | 'xhr';
  startMs: number;
  durMs: number;
  renderBlocking: boolean;
  size: number;
}

export interface CriticalCssBundle {
  routeId: string;
  aboveFoldRules: string;
  deferredRules: string;
  reduceKb: number;
}
