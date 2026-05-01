/**
 * Shim layer between AI tool handlers and the workspace analyzers.
 *
 * Why a shim: Phase 1 owns the analyzers, Phase 2 owns the workspace, and
 * the agent must not modify those files. This module re-exports the few
 * symbols we need today, and provides safe fallbacks when an export is
 * not yet available (so the agent can still run with stub data during
 * parallel development).
 */

import type {
  DirectiveFinding,
  DirectiveReport,
} from '@shared/analyzer/use-client';
import type {
  UseCacheFinding,
  UseCacheReport,
} from '@shared/analyzer/use-cache';

export type {
  DirectiveFinding,
  DirectiveReport,
  UseCacheFinding,
  UseCacheReport,
};

/**
 * Returns the in-memory `code-graph` directives if a store has been
 * populated, or an empty list otherwise. We import dynamically through
 * a runtime require pattern so this file does not hard-fail at module
 * load if the entity isn't wired yet.
 */
export async function getDirectiveFindings(): Promise<DirectiveFinding[]> {
  try {
    const mod = await import('@entities/code-graph');
    const store = (mod as unknown as { useCodeGraphStore?: { getState(): { directives?: DirectiveFinding[] } } }).useCodeGraphStore;
    if (!store) return [];
    return [...(store.getState().directives ?? [])];
  } catch {
    return [];
  }
}

export async function getCacheFindings(): Promise<UseCacheFinding[]> {
  try {
    const mod = await import('@entities/cache-tag');
    const store = (mod as unknown as { useCacheTagStore?: { getState(): { findings?: UseCacheFinding[] } } }).useCacheTagStore;
    if (!store) return [];
    return [...(store.getState().findings ?? [])];
  } catch {
    return [];
  }
}

/** Shape used by route_lookup tool. */
export interface RouteSummary {
  routePath: string;
  pageFile?: string;
  layoutFile?: string;
  loadingFile?: string;
  errorFile?: string;
}

export async function getRoutes(): Promise<RouteSummary[]> {
  try {
    const mod = await import('@entities/route');
    const store = (mod as unknown as { useRouteStore?: { getState(): { routes?: unknown[] } } }).useRouteStore;
    if (!store) return [];
    const raw = store.getState().routes ?? [];
    return raw.map((r) => {
      const rec = r as Record<string, unknown>;
      return {
        routePath: String(rec['path'] ?? rec['routePath'] ?? ''),
        pageFile: rec['pageFile'] as string | undefined,
        layoutFile: rec['layoutFile'] as string | undefined,
        loadingFile: rec['loadingFile'] as string | undefined,
        errorFile: rec['errorFile'] as string | undefined,
      };
    });
  } catch {
    return [];
  }
}

export interface ServerActionSummary {
  name: string;
  file: string;
  routePath?: string;
}

export async function getServerActions(): Promise<ServerActionSummary[]> {
  try {
    const mod = await import('@entities/server-action');
    const store = (mod as unknown as { useServerActionStore?: { getState(): { actions?: unknown[] } } }).useServerActionStore;
    if (!store) return [];
    const raw = store.getState().actions ?? [];
    return raw.map((a) => {
      const rec = a as Record<string, unknown>;
      return {
        name: String(rec['name'] ?? ''),
        file: String(rec['file'] ?? ''),
        routePath: rec['routePath'] as string | undefined,
      };
    });
  } catch {
    return [];
  }
}
