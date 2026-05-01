/**
 * Wires the four built-in analyzers (routes, use-client, use-cache,
 * code-graph) into the analyzer bus.
 *
 * Each analyzer's `dependsOn` predicate is intentionally narrow so that an
 * edit to a single page file doesn't re-run every analyzer in the IDE.
 *
 * Outputs flow into existing zustand stores so consuming features see fresh
 * data without any plumbing changes.
 */

import { analyzerBus, isAppRouterPath, isTsLike } from './bus';
import {
  loadAppFiles,
  toDirectiveInputs,
} from './workspace-sources';
import {
  analyzeRoutes,
  analyzeRoutesFromFiles,
  buildRouteTree,
  type RouteSourceFile,
} from './routes';
import { analyzeUseCacheAsync } from './use-cache-client';
import { analyzeCodeGraphAsync } from './code-graph-client';
import { analyzeDirectives } from './use-client-lite';
import { useRouteStore } from '@entities/route';
import { useCacheDirectiveStore } from '@entities/cache-directive/store';
import { DEMO_WORKSPACE_ROOT } from '@shared/workspace';

let registered = false;

/**
 * Idempotent — call from app bootstrap. Safe to call multiple times; the
 * bus de-dupes registrations by id.
 */
export function registerBuiltInAnalyzers(): void {
  if (registered) return;
  registered = true;

  // ── routes ──────────────────────────────────────────────────────────────
  analyzerBus.register({
    id: 'routes',
    dependsOn: (p) => isAppRouterPath(p),
    run: async (root) => {
      let routes;
      if (root === DEMO_WORKSPACE_ROOT) {
        routes = analyzeRoutes('e2e/fixtures/next-app');
      } else {
        const files = await loadAppFiles(root);
        // Strip `src/` prefix so the analyzer always sees `app/...`.
        const sources: RouteSourceFile[] = files
          .map((f) => ({
            appRelative: f.path.startsWith('src/app/')
              ? f.path.slice(4)
              : f.path,
            source: f.content,
          }))
          .filter((f) => f.appRelative.startsWith('app/'));
        routes = analyzeRoutesFromFiles(sources);
      }
      if (routes.length === 0) return;
      const tree = buildRouteTree(routes);
      useRouteStore.getState().setRoutes(routes, tree);
    },
  });

  // ── use-cache (worker-backed) ──────────────────────────────────────────
  analyzerBus.register({
    id: 'use-cache',
    dependsOn: (p) => isTsLike(p),
    run: async (root) => {
      try {
        const files = await loadAppFiles(root);
        const report = await analyzeUseCacheAsync(files);
        useCacheDirectiveStore.setState({
          status: 'ready',
          report,
          error: null,
          lastScannedAt: Date.now(),
        });
      } catch (e) {
        useCacheDirectiveStore.setState({
          status: 'error',
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
  });

  // ── use-client (lite, regex) ────────────────────────────────────────────
  // The full ts-morph variant runs in a worker via `code-graph` below; the
  // lite analyzer is fine for the directive list itself and stays cheap.
  analyzerBus.register({
    id: 'use-client',
    dependsOn: (p) => isTsLike(p),
    run: async (root) => {
      const files = await loadAppFiles(root);
      const inputs = toDirectiveInputs(files);
      const report = analyzeDirectives(inputs);
      // Surface via a window event for now — entities/boundary owns the
      // consumer hookup. Avoids a hard import dependency on a store that may
      // be re-shaped by other phases.
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('analyzer:use-client', { detail: report }),
          );
        }
      } catch {
        // ignore
      }
    },
  });

  // ── code-graph (worker, ts-morph) ───────────────────────────────────────
  analyzerBus.register({
    id: 'code-graph',
    dependsOn: (p) => isTsLike(p),
    run: async (root) => {
      try {
        const files = await loadAppFiles(root);
        const inputs = toDirectiveInputs(files);
        const report = await analyzeCodeGraphAsync(inputs);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('analyzer:code-graph', { detail: report }),
          );
        }
      } catch {
        // ignore — worker may not be available in test env
      }
    },
  });
}
