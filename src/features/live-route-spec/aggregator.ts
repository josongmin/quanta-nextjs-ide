/**
 * Pure aggregator: file path → RouteSpec | null.
 *
 * All inputs come from the *callers* (we accept the data, we don't reach
 * into the stores) so this stays unit-testable and free of React hooks.
 */

import { match, P } from 'ts-pattern';
import type { Diagnostic, Route, ServerAction } from '@shared/types';
import { modeFamily, modeLabel } from '../render-mode-badge/resolver';
import type { ResolvedMode } from '../render-mode-badge/types';
import type {
  ModeFamily,
  ResolvedModeLike,
  RouteSpec,
  RouteSpecAuth,
  RouteSpecCache,
  RouteSpecCacheTag,
  RouteSpecMode,
  RouteSpecRisk,
  ShippingStatus,
} from './types';

export interface AggregateInput {
  readonly file: string;
  readonly routes: ReadonlyArray<Route>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly actions: ReadonlyArray<ServerAction>;
  readonly resolved?: ResolvedMode | null;
  /** Used by the cache section to surface non-route producers. */
  readonly cacheTagsForRoute?: ReadonlyArray<{
    readonly name: string;
    readonly producers: ReadonlyArray<string>;
    readonly invalidators: ReadonlyArray<string>;
  }>;
}

export function findRouteForFile(
  routes: ReadonlyArray<Route>,
  file: string,
): Route | undefined {
  return routes.find((r) => Object.values(r.files).some((f) => f === file));
}

const isRouteFile = (file: string): boolean => {
  // page / layout / route / actions / loading / error / not-found / template / default
  return /(?:page|layout|route|actions|loading|error|not-found|template|default)\.(?:tsx?|jsx?|mjs)$/.test(
    file,
  );
};

const familyFromRendering = (r: Route): ModeFamily =>
  match(r.rendering)
    .with('static', () => 'static' as const)
    .with('isr', () => 'isr' as const)
    .with('dynamic', () => 'dynamic' as const)
    .with('unknown', () => 'static' as const)
    .exhaustive();

const buildMode = (
  route: Route,
  resolved: ResolvedModeLike | null | undefined,
): RouteSpecMode => {
  if (resolved) {
    const family = modeFamily(resolved.mode);
    return {
      family,
      mode: resolved.mode,
      label: modeLabel(resolved.mode),
      confidence: resolved.confidence,
      revalidate: resolved.revalidate ?? null,
      cause: resolved.cause,
      reasoning: resolved.signals.slice(0, 3),
    };
  }
  // Fallback: derive from Route directly when render-mode-badge has no entry.
  const family = familyFromRendering(route);
  const firstRev = route.dataSources.find((d) => typeof d.revalidate === 'number');
  return {
    family,
    mode: route.rendering,
    label: route.rendering.toUpperCase(),
    confidence: route.renderingConfidence,
    revalidate: firstRev?.revalidate ?? null,
    cause: route.renderingCause ?? 'no analysis evidence',
    reasoning: [],
  };
};

const buildCache = (
  route: Route,
  cacheTagsForRoute: AggregateInput['cacheTagsForRoute'],
): RouteSpecCache => {
  const tags: RouteSpecCacheTag[] = [];

  // Tags this route consumes (declared on the Route).
  for (const t of route.cacheTags) {
    tags.push({ name: t, role: 'consumes' });
  }

  // From the cache-tag store, classify producers vs invalidators.
  if (cacheTagsForRoute) {
    for (const tag of cacheTagsForRoute) {
      // Promote already-consumed tag to "produces" if any producer points to one
      // of this route's files. We simply tag it as produces if producers.len>0.
      const role: RouteSpecCacheTag['role'] =
        tag.invalidators.length > 0
          ? 'invalidates'
          : tag.producers.length > 0
            ? 'produces'
            : 'consumes';
      const exists = tags.find((t) => t.name === tag.name);
      if (!exists) tags.push({ name: tag.name, role });
      else if (role === 'invalidates' || role === 'produces') {
        // Upgrade existing entry to a more specific role.
        const idx = tags.indexOf(exists);
        tags[idx] = { name: tag.name, role };
      }
    }
  }

  const revalidates = route.dataSources
    .map((d) => d.revalidate)
    .filter((r): r is number => typeof r === 'number');
  const revalidate = revalidates.length > 0 ? Math.min(...revalidates) : null;

  return {
    tags,
    revalidate,
    hasInvalidator: tags.some((t) => t.role === 'invalidates' || t.role === 'produces'),
  };
};

const buildAuth = (route: Route): RouteSpecAuth => {
  const label = match(route.auth.guard)
    .with('none', () => 'public')
    .with('requireUser', () => 'requireUser')
    .with('requireRole', () => 'requireRole')
    .with('middleware', () => 'middleware')
    .exhaustive();

  const archetypeMatches = match([route.auth.guard, route.auth.archetypeExpected] as const)
    .with(['none', 'public'], () => true)
    .with([P.union('requireUser', 'requireRole', 'middleware'), 'user'], () => true)
    .with(['requireRole', 'admin'], () => true)
    .with(['middleware', 'admin'], () => true)
    .otherwise(() => false);

  return {
    auth: route.auth,
    label,
    archetypeMatches,
    middlewareCovered:
      route.auth.guard === 'middleware' || route.auth.archetypeExpected !== 'admin',
  };
};

const SEV_RANK: Record<RouteSpecRisk['severity'], number> = {
  err: 0,
  warn: 1,
  info: 2,
  hint: 3,
};

const buildRisks = (route: Route, all: ReadonlyArray<Diagnostic>): RouteSpecRisk[] => {
  const mine = all
    .filter((d) => d.routeId === route.id || d.affectedRouteIds.includes(route.id))
    .slice()
    .sort((a, b) => (SEV_RANK[a.severity] - SEV_RANK[b.severity]) || a.title.localeCompare(b.title));
  return mine.map((d) => ({
    id: d.id,
    title: d.title,
    severity: d.severity,
    confidence: d.confidence,
    file: d.location.file,
    line: d.location.line,
  }));
};

/**
 * Synthetic shipping status — there is no central "ship log" entity yet,
 * so we derive a plausible one from {@link Route#riskCount}. Marked TODO in
 * the public surface for the parallel "ship-drawer" agent to feed real
 * data later.
 */
const buildShipping = (route: Route): ShippingStatus => {
  const hasBlocker = route.riskCount > 0;
  return {
    lastShippedAt: null,
    lastShippedBy: null,
    verdict: hasBlocker ? 'inconclusive' : 'admit',
    verdictLabel: hasBlocker ? 'Inconclusive' : 'Admit',
    pending: hasBlocker ? `${route.riskCount} risk${route.riskCount === 1 ? '' : 's'}` : null,
  };
};

const collectFiles = (route: Route): string[] =>
  Object.values(route.files).filter((f): f is string => typeof f === 'string');

export function aggregateRouteSpec(input: AggregateInput): RouteSpec | null {
  if (!isRouteFile(input.file)) return null;
  const route = findRouteForFile(input.routes, input.file);
  if (!route) return null;

  const myActions = input.actions.filter((a) => a.routeId === route.id);

  return {
    routeId: route.id,
    path: route.path,
    archetype: route.archetype,
    costClass: route.costClass,
    clientKb: route.clientKb,
    mode: buildMode(route, input.resolved ?? null),
    cache: buildCache(route, input.cacheTagsForRoute),
    auth: buildAuth(route),
    actions: myActions.map((a) => ({ id: a.id, name: a.name, score: a.score })),
    data: route.dataSources.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      revalidate: d.revalidate ?? null,
    })),
    risks: buildRisks(route, input.diagnostics),
    shipping: buildShipping(route),
    files: collectFiles(route),
  };
}
