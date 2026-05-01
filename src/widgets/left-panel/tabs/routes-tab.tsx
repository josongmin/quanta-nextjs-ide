import { useMemo, useState, type ReactNode } from 'react';
import { match } from 'ts-pattern';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useRouteStore } from '@entities/route';
import { useLastTraceStore } from '@entities/rsc-payload';
import type { Route, RouteTreeNode } from '@shared/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Icon,
  RouteRow,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';
import { SearchInput } from '../parts/search-input';

type RouteFilter = 'all' | 'static' | 'dynamic' | 'client-heavy';

const FILTER_OPTIONS: ReadonlyArray<FilterChipOption<RouteFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'static', label: 'Static' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'client-heavy', label: 'Client' },
];

const DEFAULT_EXPANDED = new Set<string>([
  'app',
  'app/(shop)',
  'app/(shop)/products',
  'app/(shop)/products/[id]',
  'app/admin',
  'app/admin/users',
  'app/admin/products',
]);

const BOUNDARY_FILES: ReadonlyArray<{
  key: 'loading' | 'error' | 'notFound';
  label: string;
}> = [
  { key: 'loading', label: 'loading.tsx' },
  { key: 'error', label: 'error.tsx' },
  { key: 'notFound', label: 'not-found.tsx' },
];

function passesFilter(route: Route | undefined, filter: RouteFilter): boolean {
  if (!route) return true;
  return match(filter)
    .with('all', () => true)
    .with('static', () => route.rendering === 'static')
    .with('dynamic', () => route.rendering === 'dynamic' || route.rendering === 'isr')
    .with('client-heavy', () => route.clientKb > 50)
    .exhaustive();
}

function nodeMatchesSearch(
  node: RouteTreeNode,
  routesById: Map<string, Route>,
  q: string,
): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  if (node.label.toLowerCase().includes(lower)) return true;
  if (node.routeId) {
    const r = routesById.get(node.routeId);
    if (r && r.path.toLowerCase().includes(lower)) return true;
  }
  return node.children.some((c) => nodeMatchesSearch(c, routesById, lower));
}

function nodePassesFilter(
  node: RouteTreeNode,
  routesById: Map<string, Route>,
  filter: RouteFilter,
): boolean {
  if (filter === 'all') return true;
  if (node.routeId) {
    return passesFilter(routesById.get(node.routeId), filter);
  }
  return node.children.some((c) => nodePassesFilter(c, routesById, filter));
}

interface RowProps {
  node: RouteTreeNode;
  depth: number;
  expanded: Set<string>;
  toggle(id: string): void;
  routesById: Map<string, Route>;
  selectedRouteId: string | null;
  onSelect(routeId: string, route: Route): void;
  filter: RouteFilter;
  search: string;
}

function RouteTreeRows({
  node,
  depth,
  expanded,
  toggle,
  routesById,
  selectedRouteId,
  onSelect,
  filter,
  search,
}: RowProps): ReactNode {
  if (!nodeMatchesSearch(node, routesById, search)) return null;
  if (!nodePassesFilter(node, routesById, filter)) return null;

  const route = node.routeId ? routesById.get(node.routeId) : undefined;
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id) || search.length > 0;
  const isSelected = !!route && selectedRouteId === route.id;

  const ghostBoundaries: ReactNode =
    route && isExpanded
      ? BOUNDARY_FILES.map((b) =>
          route.boundaries[b.key] === 'missing' ? (
            <div
              key={`${node.id}-ghost-${b.key}`}
              className="group flex h-6 items-center gap-1.5 pr-2 text-xs text-ink-3 hover:bg-bg-hover"
              style={{ paddingLeft: 8 + (depth + 1) * 14 }}
            >
              <span className="w-3" />
              <Icon.File className="h-3 w-3 opacity-50" />
              <span className="flex-1 truncate font-mono italic">
                {b.label}{' '}
                <span className="text-[10px] not-italic text-sev-warn">(missing)</span>
              </span>
              <button
                aria-label={`Generate ${b.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toast(`Generate ${b.label}`, { description: route.path });
                }}
                className="flex h-4 w-4 items-center justify-center rounded-sm border border-line text-ink-3 hover:border-accent hover:text-accent opacity-0 group-hover:opacity-100"
              >
                <Icon.Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : null,
        )
      : null;

  const row = (
    <RouteRow
      node={node}
      route={route}
      selected={isSelected}
      depth={depth}
      expanded={isExpanded}
      hasChildren={hasChildren}
      onToggle={() => toggle(node.id)}
      onClick={() => {
        if (route) onSelect(route.id, route);
        else if (hasChildren) toggle(node.id);
      }}
    />
  );

  const wrappedRow = route ? (
    <RouteContextMenu route={route}>
      <div>{row}</div>
    </RouteContextMenu>
  ) : (
    row
  );

  return (
    <>
      {wrappedRow}
      {ghostBoundaries}
      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <RouteTreeRows
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              routesById={routesById}
              selectedRouteId={selectedRouteId}
              onSelect={onSelect}
              filter={filter}
              search={search}
            />
          ))
        : null}
    </>
  );
}

interface CtxProps {
  route: Route;
  children: ReactNode;
}

function RouteContextMenu({ route, children }: CtxProps) {
  const fire = (label: string, hint?: string) => () =>
    toast(label, hint ? { description: hint } : undefined);

  const filesEntries = (
    [
      ['page', 'page.tsx'],
      ['layout', 'layout.tsx'],
      ['loading', 'loading.tsx'],
      ['error', 'error.tsx'],
      ['notFound', 'not-found.tsx'],
    ] as const
  ).map(([k, label]) => ({
    key: k,
    label,
    file: route.files[k],
    missing: route.boundaries[k as 'loading' | 'error' | 'notFound']
      ? route.boundaries[k as 'loading' | 'error' | 'notFound'] === 'missing'
      : false,
  }));

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Open</ContextMenuLabel>
        {filesEntries.map((f) => (
          <ContextMenuItem
            key={f.key}
            disabled={!f.file && !f.missing}
            onSelect={() =>
              f.file
                ? toast(`Open ${f.label}`, { description: f.file })
                : toast(`Generate ${f.label}`, { description: route.path })
            }
          >
            {f.label}
            {!f.file && f.missing ? (
              <span className="ml-1 text-[10px] text-sev-warn">(missing — generate?)</span>
            ) : null}
          </ContextMenuItem>
        ))}

        <ContextMenuSeparator />
        <ContextMenuLabel>Inspect</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Show route contract', route.path)}>
          Show route contract
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show data dependencies')}>
          Show data dependencies
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show client islands')}>
          Show client islands
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show impact graph')}>
          Show impact graph
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Generate</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Add loading.tsx')}>
          Add loading.tsx
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Add error.tsx')}>
          Add error.tsx
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Add not-found.tsx')}>
          Add not-found.tsx
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Add metadata')}>
          Add metadata
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Productionize</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Make this route production-ready')}>
          Make this route production-ready
          <ContextMenuShortcut>⌘⇧M</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Refactor</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Rename route (safe)')}>
          Rename route (safe)
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Move route to group')}>
          Move route to group
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Convert to parallel route')}>
          Convert to parallel route
        </ContextMenuItem>

        <ContextMenuSeparator />
        <ContextMenuLabel>Policy</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Set archetype')}>
          Set archetype (commerce / admin / blog ...)
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Edit route contract')}>
          Edit route contract
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function RoutesTab() {
  const tree = useRouteStore((s) => s.tree);
  const routes = useRouteStore((s) => s.routes);
  const selectedRouteId = useRouteStore((s) => s.selectedRouteId);
  const setSelected = useRouteStore((s) => s.setSelected);
  const filter = useRouteStore((s) => s.filter);
  const setFilter = useRouteStore((s) => s.setFilter);
  const search = useRouteStore((s) => s.searchQuery);
  const setSearch = useRouteStore((s) => s.setSearch);
  const setInspectorContext = useUiStore((s) => s.setInspectorContext);
  const openTab = useEditorStore((s) => s.openTab);

  const routesById = useMemo(
    () => new Map(routes.map((r) => [r.id, r])),
    [routes],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_EXPANDED));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSelect = (routeId: string, route: Route) => {
    setSelected(routeId);
    setInspectorContext({ kind: 'route', routeId });
    if (route.files.page) {
      openTab({
        id: `tab-${routeId}`,
        file: route.files.page,
        label: route.files.page.endsWith('route.ts') ? 'route.ts' : 'page.tsx',
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={FILTER_OPTIONS}
          value={filter as RouteFilter}
          onChange={(v) => setFilter(v)}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by path"
          className="ml-1"
        />
      </TabHeader>
      <RscTraceRouteBanner />

      <div role="tree" aria-label="Routes" className={cn('flex-1 min-h-0 overflow-y-auto')}>
        {tree.children.length === 0 ? (
          <EmptyState label="No routes" />
        ) : (
          tree.children.map((child) => (
            <RouteTreeRows
              key={child.id}
              node={child}
              depth={0}
              expanded={expanded}
              toggle={toggle}
              routesById={routesById}
              selectedRouteId={selectedRouteId}
              onSelect={onSelect}
              filter={filter as RouteFilter}
              search={search}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RscTraceRouteBanner() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const totalMs = useLastTraceStore((s) => s.totalMs);
  const totalBytes = useLastTraceStore((s) => s.totalBytes);
  if (!url) return null;
  return (
    <div className="hairline-b bg-bg-subtle px-2 py-1 text-[10px] text-ink-3">
      <span className="font-mono uppercase tracking-caps">probe</span>
      <span className="mx-1.5 font-mono text-ink-2">{url}</span>
      <span className="font-mono">
        {chunks.length}c · {Math.round(totalMs)}ms · {totalBytes}B
      </span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center text-xs text-ink-3">
      {label}
    </div>
  );
}
