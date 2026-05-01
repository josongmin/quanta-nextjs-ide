import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { selectPageRoutes, useRouteStore } from '@entities/route';
import { Icon, OverlayPanel } from '@shared/ui';
import type { Route } from '@shared/types';
import {
  applyFilter,
  getRenderGraph,
  jumpTabId,
  layoutGraph,
  shortFile,
  type GraphFilter,
  type RenderGraph,
} from './helpers';
import { DetailsPane } from './parts/DetailsPane';
import { GraphCanvas } from './parts/GraphCanvas';
import { Toolbar } from './parts/Toolbar';

export function RenderGraphOverlay() {
  const open = useUiStore((s) => s.overlays.renderGraph.open);
  const close = useUiStore((s) => s.closeOverlay);
  const routes = useRouteStore((s) => s.routes);
  const pageRoutes = useRouteStore(selectPageRoutes);
  const selectedRouteId = useRouteStore((s) => s.selectedRouteId);
  const openTab = useEditorStore((s) => s.openTab);

  const initialRouteId =
    selectedRouteId && routes.some((r) => r.id === selectedRouteId)
      ? selectedRouteId
      : routes[0]?.id;

  const [routeId, setRouteId] = useState<string | undefined>(initialRouteId);
  const [filter, setFilter] = useState<GraphFilter>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const route: Route | undefined = useMemo(
    () => routes.find((r) => r.id === routeId) ?? routes[0],
    [routes, routeId],
  );

  const graph = useMemo<RenderGraph | null>(
    () => (route ? getRenderGraph(route) : null),
    [route],
  );

  const visible = useMemo(
    () => (graph ? applyFilter(graph, filter) : new Set<string>()),
    [graph, filter],
  );

  const layout = useMemo(
    () => (graph ? layoutGraph(graph, visible) : null),
    [graph, visible],
  );

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const counts = useMemo(() => {
    if (!graph) return { server: 0, client: 0, hotspots: 0 };
    return {
      server: graph.nodes.filter((n) => n.role === 'server').length,
      client: graph.nodes.filter((n) => n.role === 'client').length,
      hotspots: graph.nodes.filter((n) => n.hotspot).length,
    };
  }, [graph]);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('renderGraph'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Branch className="h-4 w-4 text-ink-3" />
          <span>Render Graph</span>
        </span>
      }
      subtitle="component tree · re-render hotspots"
      size="md"
    >
      <Toolbar
        route={route}
        pageRoutes={pageRoutes}
        onRouteChange={(id) => {
          setRouteId(id);
          setSelectedNodeId(null);
        }}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      <div className="grid grid-cols-[1fr_240px] divide-x divide-line">
        <GraphCanvas
          graph={graph}
          layout={layout}
          visible={visible}
          selectedId={selectedNodeId}
          onSelect={(id) => setSelectedNodeId(id)}
        />
        <DetailsPane
          graph={graph}
          node={selectedNode}
          onJump={(file) => {
            openTab({ id: jumpTabId(file), file, label: shortFile(file) });
          }}
        />
      </div>
    </OverlayPanel>
  );
}
