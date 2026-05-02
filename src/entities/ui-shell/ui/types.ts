// Shared UI store types. These are re-exported by `@app/store` so the
// 234 existing importers keep working without changes.

export type LeftTab =
  | 'files'
  | 'routes'
  | 'actions'
  | 'handlers'
  | 'tags'
  | 'islands'
  | 'layouts'
  | 'meta'
  | 'env'
  | 'mid'
  | 'quality'
  | 'db'
  | 'apis'
  | 'i18n';

export type BottomTab =
  | 'problems'
  | 'semantic-diff'
  | 'routes'
  | 'cache-lineage'
  | 'bundle'
  | 'live'
  | 'output'
  | 'terminal'
  | 'runner'
  // Phase 19 — live, cache, trace surfaces
  | 'live-events'
  | 'cache-state'
  | 'trace-graph';

export type InspectorContext =
  | { kind: 'route'; routeId: string }
  | { kind: 'action'; actionId: string }
  | { kind: 'fetch'; routeId: string; fetchId: string }
  | { kind: 'boundary'; islandId: string }
  | { kind: 'project' }
  | { kind: 'migration' }
  | { kind: 'code-quality' }
  | { kind: 'bundle' }
  | { kind: 'ai' }
  | { kind: 'db'; modelId?: string }
  | { kind: 'query'; queryId: string }
  | { kind: 'lighthouse'; routeId: string };

export type Density = 'minimal' | 'default' | 'rich';
export type InspectionProfile =
  | 'startup'
  | 'commerce'
  | 'dashboard'
  | 'enterprise'
  | 'taleban'
  | 'custom';
export type ColorMode =
  | 'light'
  | 'light-hc'
  | 'mac'
  | 'sunset'
  | 'dark'
  | 'midnight'
  | 'terminal'
  | 'dim';
export type AutofixPolicy = 'off' | 'suggest' | 'on-save';

export interface RecentItem {
  kind: 'route' | 'file' | 'action' | 'tag';
  id: string;
  label: string;
  at: number;
}

export interface Annotation {
  id: string;
  file: string;
  line: number;
  body: string;
  at: number;
}
