import { useMemo } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useEditorStore } from '@entities/editor';
import { useBoundaryStore } from '@entities/boundary';
import { useRouteStore } from '@entities/route';
import {
  Button,
  Chip,
  Icon,
  IconBox,
  OverlayPanel,
  RenderingChip,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import type { ClientIsland, Route } from '@shared/types';
import {
  buildDependencyTree,
  jumpTabId,
  resolveIsland,
  shortFile,
  suggestIslands,
  totalSuggestedKb,
  type ImportNode,
  type IslandSuggestion,
} from './helpers';

export function BlastRadiusOverlay() {
  const open = useUiStore((s) => s.overlays.blastRadius.open);
  const sourceFile = useUiStore((s) => s.overlays.blastRadius.sourceFile);
  const close = useUiStore((s) => s.closeOverlay);

  const islands = useBoundaryStore((s) => s.islands);
  const routes = useRouteStore((s) => s.routes);
  const openTab = useEditorStore((s) => s.openTab);

  const island = useMemo(
    () => resolveIsland(islands, sourceFile),
    [islands, sourceFile],
  );
  const tree = useMemo(() => buildDependencyTree(island), [island]);
  const suggestions = useMemo(() => suggestIslands(island), [island]);

  const affectedRoutes = useMemo(() => {
    const byId = new Map(routes.map((r) => [r.id, r]));
    return island.affectedRouteIds
      .map((id) => byId.get(id))
      .filter((r): r is Route => Boolean(r));
  }, [island, routes]);

  const projectedKb = Math.max(
    8,
    island.estimatedKb - totalSuggestedKb(suggestions) * 1.5,
  );

  const handleJump = (file: string) => {
    openTab({ id: jumpTabId(file), file, label: shortFile(file) });
  };

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('blastRadius'))}
      title={
        <span className="flex items-center gap-2">
          <Icon.Net className="h-4 w-4 text-ink-3" />
          <span>Blast Radius</span>
          <Chip tone="client" size="sm">
            {'use client'}
          </Chip>
        </span>
      }
      subtitle={
        <span className="font-mono text-[11px]">
          {island.file} · {island.affectedRouteIds.length} routes affected · ~
          {island.estimatedKb}KB on client
        </span>
      }
      size="md"
      footer={
        <>
          <Button
            size="sm"
            tone="ghost"
            onClick={() =>
              toast('Boundary Optimizer (mock)', {
                description: 'Open dedicated optimizer panel — coming soon.',
              })
            }
          >
            <Icon.Settings className="h-3 w-3" /> Open Boundary Optimizer
          </Button>
          <Button
            size="sm"
            tone="default"
            onClick={() =>
              toast('Refactor preview queued', {
                description: `${suggestions.length} islands · est. -${(
                  island.estimatedKb - projectedKb
                ).toFixed(0)}KB`,
              })
            }
          >
            <Icon.Bulb className="h-3 w-3" /> Preview refactor
          </Button>
          <Button size="sm" tone="ghost" onClick={() => close('blastRadius')}>
            Close
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[1.05fr_1fr] divide-x divide-line">
        <DependencyTreePane
          island={island}
          tree={tree}
          onJump={handleJump}
        />
        <ImpactPane
          routes={affectedRoutes}
          island={island}
          suggestions={suggestions}
          projectedKb={projectedKb}
        />
      </div>
    </OverlayPanel>
  );
}

function DependencyTreePane({
  island,
  tree,
  onJump,
}: {
  island: ClientIsland;
  tree: ImportNode[];
  onJump(file: string): void;
}) {
  return (
    <section className="min-w-0 px-4 py-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-caps text-ink-3">Imports tree</h3>
        <span className="text-[11px] text-ink-3">
          {tree.length + 1} files in client bundle
        </span>
      </header>
      <div className="font-mono text-[12px]">
        <div className="flex items-center gap-2 rounded-sm bg-bg-subtle px-2 py-1">
          <IconBox letter="C" tone="client" />
          <span className="flex-1 truncate text-ink-1">{island.file}</span>
          <Chip tone="client" size="xs">
            root
          </Chip>
          <Chip tone="warn" size="xs">
            ~{island.estimatedKb}KB
          </Chip>
        </div>
        <ul className="mt-1 ml-2 space-y-0.5 border-l border-line pl-3">
          {tree.map((node) => (
            <DependencyRow key={node.file} node={node} onJump={onJump} />
          ))}
          <li className="flex items-center gap-2 px-1 py-0.5 text-[11px] text-ink-3">
            <span>└─</span>
            <span>... 28 more</span>
          </li>
        </ul>
      </div>
      <p className="mt-3 text-[11px] text-ink-3">
        Tree shows direct imports + their reasons for being client-side. Click
        the jump arrow to open the file.
      </p>
    </section>
  );
}

function DependencyRow({
  node,
  onJump,
}: {
  node: ImportNode;
  onJump(file: string): void;
}) {
  return (
    <Tooltip
      side="right"
      align="start"
      content={
        <div className="w-[260px] space-y-1">
          <div className="text-[11px] font-medium text-ink-1">{node.file}</div>
          <div className="text-[10px] text-ink-3">
            {node.imports} imports · ~{node.estimatedKb}KB
          </div>
          {node.reasons.length > 0 && (
            <ul className="space-y-0.5 text-[11px] text-ink-2">
              {node.reasons.map((r) => (
                <li key={r} className="before:mr-1.5 before:content-['•']">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    >
      <li
        className={cn(
          'flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-bg-hover',
          node.flag === 'heavy' && 'bg-sev-warn-soft/40',
        )}
      >
        <span className="text-[10px] text-ink-3">└─</span>
        <Icon.File className="h-3 w-3 text-ink-3" />
        <span className="min-w-0 flex-1 truncate text-ink-1">{node.label}</span>
        <span className="text-[10px] text-ink-3">{node.imports} imports</span>
        <Chip tone="muted" size="xs" className="font-normal normal-case">
          ~{node.estimatedKb}KB
        </Chip>
        <button
          onClick={() => onJump(node.file)}
          className="text-ink-3 transition-colors hover:text-accent"
          aria-label="Jump to file"
        >
          <Icon.UpRight className="h-3.5 w-3.5" />
        </button>
      </li>
    </Tooltip>
  );
}

function ImpactPane({
  routes,
  island,
  suggestions,
  projectedKb,
}: {
  routes: Route[];
  island: ClientIsland;
  suggestions: IslandSuggestion[];
  projectedKb: number;
}) {
  return (
    <section className="min-w-0 px-4 py-3">
      <h3 className="mb-2 text-caps text-ink-3">
        Affected routes ({routes.length})
      </h3>
      <ul className="max-h-[200px] space-y-0.5 overflow-y-auto">
        {routes.map((route) => (
          <li
            key={route.id}
            className="flex items-center gap-2 rounded-sm px-1 py-1 hover:bg-bg-hover"
          >
            <Icon.Globe className="h-3.5 w-3.5 text-ink-3" />
            <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-1">
              {route.path}
            </span>
            <RenderingChip
              rendering={route.rendering}
              confidence={route.renderingConfidence}
            />
          </li>
        ))}
      </ul>

      <div className="mt-3 hairline-t pt-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Client JS estimate"
            value={`~${island.estimatedKb}KB`}
            tone="warn"
          />
          <Stat
            label="After refactor"
            value={`~${projectedKb.toFixed(0)}KB`}
            tone="static"
            sub={`-${(island.estimatedKb - projectedKb).toFixed(0)}KB est.`}
          />
        </div>
      </div>

      <div className="mt-3 hairline-t pt-3">
        <header className="mb-1.5 flex items-center justify-between">
          <h3 className="text-caps text-ink-3">
            Suggested optimal boundaries ({suggestions.length})
          </h3>
        </header>
        <ul className="space-y-1">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-sm border border-line bg-bg px-2 py-1.5"
            >
              <IconBox letter="C" tone="client" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm text-ink-1">
                  <span className="truncate font-mono">{s.file}</span>
                  <Chip tone="muted" size="xs" className="font-normal normal-case">
                    ~{s.estimatedKb}KB
                  </Chip>
                </div>
                <div className="truncate text-[11px] text-ink-3">{s.reason}</div>
              </div>
              <Button
                size="xs"
                tone="ghost"
                onClick={() =>
                  toast(`Preview: extract ${s.name}`, {
                    description: `Would create ${s.file} (~${s.estimatedKb}KB)`,
                  })
                }
              >
                Preview refactor
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'warn' | 'static';
}) {
  return (
    <div className="rounded-sm border border-line bg-bg px-2 py-1.5">
      <div className="text-caps text-ink-3">{label}</div>
      <div
        className={cn(
          'mt-0.5 font-mono text-[14px] font-semibold',
          tone === 'warn' && 'text-sev-warn',
          tone === 'static' && 'text-sem-static',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-ink-3">{sub}</div>}
    </div>
  );
}
