/**
 * Phase 6 — Fullstack Trace builder.
 *
 * `buildTrace(routePath)` aggregates from the existing zustand stores to
 * produce a vertical execution flow:
 *   layout → page → middleware → server actions → fetches → db → cache → revalidate
 *
 * No reactivity — the overlay re-runs this on each mount.
 */

import { useRouteStore } from '@entities/route';
import { useActionStore } from '@entities/server-action';
import { useCacheTagStore } from '@entities/cache-tag';
import { useBoundaryStore } from '@entities/boundary';
import { useDiagnosticStore } from '@entities/diagnostic';
import type { Diagnostic, Route, Severity } from '@shared/types';
import type { TraceNode, TraceRiskLevel } from './types';

export interface BuildTraceOptions {
  /** Whether to include test rows. Default true. */
  includeTests?: boolean;
}

export function buildTrace(routePath: string, options: BuildTraceOptions = {}): TraceNode[] {
  const { includeTests = true } = options;

  const routes = useRouteStore.getState().routes;
  const route =
    routes.find((r) => r.path === routePath) ??
    routes.find((r) => r.id === routePath);
  if (!route) {
    return [];
  }

  const nodes: TraceNode[] = [];
  const { actions, handlers } = useActionStore.getState();
  const { tags } = useCacheTagStore.getState();
  const { middleware } = useBoundaryStore.getState();
  const { diagnostics } = useDiagnosticStore.getState();

  const diagsForFile = (file?: string): Diagnostic[] =>
    file ? diagnostics.filter((d) => d.location.file === file) : [];

  const riskFor = (severity?: Severity): TraceRiskLevel =>
    severity === 'err' ? 'high' : severity === 'warn' ? 'medium' : 'low';

  const worstSeverity = (ds: Diagnostic[]): Severity | undefined => {
    if (ds.some((d) => d.severity === 'err')) return 'err';
    if (ds.some((d) => d.severity === 'warn')) return 'warn';
    if (ds.some((d) => d.severity === 'info')) return 'info';
    return undefined;
  };

  // ── Middleware (if its matcher would touch this route) ────────────
  if (middleware && (middleware.matchesAllRoutes || matcherTouches(middleware.matcher, route.path))) {
    const ds = diagsForFile(middleware.file);
    const sev = worstSeverity(ds);
    nodes.push({
      id: 'middleware',
      kind: 'middleware',
      label: 'middleware.ts',
      ...(middleware.file ? { file: middleware.file } : {}),
      line: 1,
      detail: middleware.runtime + (middleware.usesAuthCheck ? ' · auth' : ''),
      risk: riskFor(sev),
      ...(sev ? { severity: sev } : {}),
      badges: middleware.usesAuthCheck ? ['auth'] : [],
    });
  }

  // ── Layout chain (single layout in mock; real impl walks ancestors) ─
  if (route.files.layout) {
    const ds = diagsForFile(route.files.layout);
    const sev = worstSeverity(ds);
    nodes.push({
      id: 'layout',
      kind: 'layout',
      label: 'layout.tsx',
      file: route.files.layout,
      line: 1,
      detail: route.path,
      risk: riskFor(sev),
      ...(sev ? { severity: sev } : {}),
    });
  }

  // ── Page ─────────────────────────────────────────────────────────
  if (route.files.page) {
    const ds = diagsForFile(route.files.page);
    const sev = worstSeverity(ds);
    nodes.push({
      id: 'page',
      kind: 'page',
      label: `page (${route.rendering})`,
      file: route.files.page,
      line: 1,
      detail: route.archetype,
      risk: riskFor(sev),
      ...(sev ? { severity: sev } : {}),
      badges: [
        route.rendering,
        route.auth.guard !== 'none' ? route.auth.guard : '',
      ].filter(Boolean),
    });
  }

  // ── Server actions for this route ────────────────────────────────
  for (const a of actions.filter((x) => x.routeId === route.id)) {
    const ds = diagsForFile(a.file);
    const sev = worstSeverity(ds);
    nodes.push({
      id: `action:${a.id}`,
      kind: 'server-action',
      label: a.name,
      file: a.file,
      line: a.location?.line ?? 1,
      detail: `score ${a.score} · ${a.exposedSurface.join(', ') || 'private'}`,
      risk: a.score < 60 ? 'high' : a.score < 80 ? 'medium' : 'low',
      ...(sev ? { severity: sev } : {}),
      badges: a.checklist.filter((c) => c.state === 'missing').map((c) => `missing ${c.key}`),
    });
  }

  // ── Route handlers attached to this route ────────────────────────
  for (const h of handlers.filter((x) => x.path === route.path)) {
    const ds = diagsForFile(h.file);
    const sev = worstSeverity(ds);
    nodes.push({
      id: `handler:${h.id}`,
      kind: 'route-handler',
      label: `${h.method} ${h.path}`,
      file: h.file,
      line: 1,
      detail: h.runtime + (h.hasAuth ? ' · auth' : ''),
      risk: h.riskCount > 0 ? 'medium' : 'low',
      ...(sev ? { severity: sev } : {}),
      badges: [h.runtime, h.isWebhook ? 'webhook' : ''].filter(Boolean),
    });
  }

  // ── Data sources (fetch / db / helper / cache) ───────────────────
  for (const ds of route.dataSources) {
    nodes.push({
      id: `data:${ds.id}`,
      kind: ds.kind === 'db' ? 'db' : ds.kind === 'cache' ? 'cache-read' : 'fetch',
      label: ds.name,
      detail:
        ds.kind === 'fetch'
          ? `policy ${ds.cacheMode}` + (ds.revalidate ? ` · rev ${ds.revalidate}` : '')
          : ds.kind,
      risk: ds.cacheMode === 'no-store' ? 'medium' : 'low',
      badges: ds.cacheTags.map((t) => `tag:${t}`),
    });
  }

  // ── Cache writes / revalidates ───────────────────────────────────
  for (const tag of tags.filter((t) => t.affectedRouteIds.includes(route.id))) {
    if (tag.invalidators.length === 0) {
      nodes.push({
        id: `cache:${tag.id}:write`,
        kind: 'cache-write',
        label: `tag:${tag.name}`,
        detail: 'no invalidator',
        risk: 'high',
        severity: 'warn',
      });
    } else {
      for (const inv of tag.invalidators) {
        nodes.push({
          id: `cache:${tag.id}:rev:${inv.location.line}`,
          kind: 'revalidate',
          label: `revalidateTag(${tag.name})`,
          file: inv.location.file,
          line: inv.location.line,
          detail: 'invalidator',
          risk: 'low',
        });
      }
    }
  }

  // ── Tests covering nodes ─────────────────────────────────────────
  if (includeTests) {
    const ownedFiles = new Set<string>(
      [
        route.files.page,
        route.files.layout,
        ...actions.filter((a) => a.routeId === route.id).map((a) => a.file),
        ...handlers.filter((h) => h.path === route.path).map((h) => h.file),
      ].filter(Boolean) as string[],
    );
    // Best-effort heuristic: test files we know about live in __tests__
    // adjacent to ownedFiles. We don't have a real test-impact index in
    // mock mode so we just emit a single placeholder when none found.
    const probable = Array.from(ownedFiles).map((f) => deriveTestPath(f));
    for (const t of probable) {
      nodes.push({
        id: `test:${t}`,
        kind: 'test',
        label: t.split('/').pop() ?? t,
        file: t,
        line: 1,
        detail: 'derived',
        risk: 'low',
      });
    }
  }

  return nodes;
}

function matcherTouches(matcher: string[], path: string): boolean {
  if (matcher.length === 0) return true;
  return matcher.some((m) => {
    if (m === '/') return true;
    if (m === path) return true;
    if (m.endsWith('/*') && path.startsWith(m.slice(0, -2))) return true;
    return false;
  });
}

function deriveTestPath(file: string): string {
  const parts = file.split('/');
  const last = parts.pop() ?? file;
  const stem = last.replace(/\.(tsx?|jsx?)$/, '');
  return [...parts, '__tests__', `${stem}.test.${last.endsWith('.tsx') ? 'tsx' : 'ts'}`].join('/');
}

/** Convenience for tests: filter trace by predicate while preserving ordering. */
export function filterTrace(trace: TraceNode[], pred: (n: TraceNode) => boolean): TraceNode[] {
  return trace.filter(pred);
}

/** Markdown export — used by the overlay's "Copy as Markdown" action. */
export function traceToMarkdown(routePath: string, trace: TraceNode[]): string {
  const lines: string[] = [];
  lines.push(`# Fullstack Trace · \`${routePath}\``);
  lines.push('');
  for (const n of trace) {
    const loc = n.file ? `\`${n.file}:${n.line ?? 1}\`` : '';
    const detail = n.detail ? ` — ${n.detail}` : '';
    lines.push(`- **${n.kind}** · ${n.label}${detail} ${loc}`.trimEnd());
  }
  return lines.join('\n');
}

/** Re-export Route shape for tests/consumers. */
export type { Route };
