import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { useBoundaryStore } from '@entities/boundary';
import { analyzeClientModules, useLastTraceStore } from '@entities/rsc-payload';
import { buildCodeGraph, useCodeGraphStore } from '@entities/code-graph';
import type { ClientIsland } from '@shared/types';
import {
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Icon,
  Tooltip,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';

type IslandFilter = 'all' | 'excessive' | 'root';

const FILTERS: ReadonlyArray<FilterChipOption<IslandFilter>> = [
  { value: 'all', label: 'All' },
  { value: 'excessive', label: 'Heavy' },
  { value: 'root', label: 'Root' },
];

function kbTone(kb: number) {
  if (kb >= 200) return 'err' as const;
  if (kb >= 60) return 'warn' as const;
  if (kb >= 20) return 'info' as const;
  return 'static' as const;
}

interface IslandRowProps {
  island: ClientIsland;
  selected: boolean;
  onClick(): void;
}

function IslandContextMenu({
  island,
  children,
}: {
  island: ClientIsland;
  children: React.ReactNode;
}) {
  const openOverlay = useUiStore((s) => s.openOverlay);
  const fire = (label: string) => () => toast(label, { description: island.file });
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>{island.name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => {
            openOverlay('blastRadius', { sourceFile: island.file });
            toast('Show blast radius', { description: island.file });
          }}
        >
          Show blast radius
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Open in editor')}>Open in editor</ContextMenuItem>
        <ContextMenuItem onSelect={fire('Move boundary down')}>
          Move boundary down
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Convert to Server Component')}>
          Convert to Server Component
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function IslandRow({ island, selected, onClick }: IslandRowProps) {
  return (
    <IslandContextMenu island={island}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        className={cn(
          'group relative flex h-8 items-center gap-2 px-2 text-xs hover:bg-bg-hover',
          selected && 'bg-bg-selected',
        )}
      >
        {selected && (
          <span aria-hidden className="absolute left-0 top-0 h-full w-0.5 bg-accent" />
        )}
        <Icon.Hex
          className={cn(
            'h-3 w-3',
            island.excessive ? 'text-sev-warn' : 'text-sem-client',
          )}
        />
        <span className="font-mono text-ink-1">{island.name}</span>
        <span className="truncate font-mono text-[10px] text-ink-3">{island.file}</span>
        <Chip tone={kbTone(island.estimatedKb)} size="xs" className="ml-auto font-semibold">
          {island.estimatedKb}KB
        </Chip>
        <Chip tone="muted" size="xs">
          {island.affectedRouteIds.length} routes
        </Chip>
        {island.isRoot && (
          <Chip tone="err" size="xs" className="font-bold">
            ROOT
          </Chip>
        )}
        {island.excessive && (
          <Tooltip content="Boundary is excessive — pulls heavy deps into many routes">
            <span className="text-sev-warn">
              <Icon.Alert className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        )}
        <Tooltip
          content={
            <div className="text-xs">
              <div className="text-ink-3">Reasons:</div>
              <ul className="ml-3 list-disc">
                {island.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          }
        >
          <span className="hidden max-w-[120px] truncate text-[10px] text-ink-3 sm:inline">
            {island.reasons.join(', ')}
          </span>
        </Tooltip>
      </div>
    </IslandContextMenu>
  );
}

export function IslandsTab() {
  const islands = useBoundaryStore((s) => s.islands);
  const selectedIslandId = useBoundaryStore((s) => s.selectedIslandId);
  const setSelected = useBoundaryStore((s) => s.setSelectedIsland);
  const setInspector = useUiStore((s) => s.setInspectorContext);

  const [filter, setFilter] = useState<IslandFilter>('all');

  const sorted = useMemo(() => {
    return [...islands]
      .filter((i) => {
        if (filter === 'excessive') return i.excessive;
        if (filter === 'root') return i.isRoot;
        return true;
      })
      .sort((a, b) => b.estimatedKb - a.estimatedKb);
  }, [islands, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup
          options={FILTERS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
        <span className="ml-auto text-[10px] text-ink-3">{sorted.length} islands</span>
      </TabHeader>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line/70">
        {sorted.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-ink-3">
            No islands
          </div>
        ) : (
          sorted.map((i) => (
            <IslandRow
              key={i.id}
              island={i}
              selected={selectedIslandId === i.id}
              onClick={() => {
                setSelected(i.id);
                setInspector({ kind: 'boundary', islandId: i.id });
              }}
            />
          ))
        )}
        <RscTraceModulesSection />
        <GroundTruthSection />
      </div>
    </div>
  );
}

function GroundTruthSection() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const files = useCodeGraphStore((s) => s.files);
  const graph = useMemo(() => buildCodeGraph(files, chunks), [files, chunks]);
  if (!url) return null;
  const userTruth = graph.groundTruth.filter(
    (g) => g.confirmedByAst,
  );
  return (
    <div className="border-t-2 border-accent/40 bg-accent/5">
      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-ink-3">
        <span className="font-mono uppercase tracking-wide text-accent">
          Ground truth (Probe + AST)
        </span>
        <span className="ml-auto">
          {userTruth.length} confirmed · {graph.declaredButNotShipped.length} declared-not-shipped
        </span>
      </div>
      {userTruth.length === 0 ? (
        <div className="px-2 py-2 text-[11px] text-ink-3">
          No client islands confirmed by both Probe and AST.
        </div>
      ) : (
        <div className="divide-y divide-line/70">
          {userTruth.map((g) => (
            <div
              key={g.chunkId}
              className="flex items-center gap-2 px-2 py-1 text-xs"
              title={g.matchedAstFile ?? g.modulePath}
            >
              <span className="w-7 font-mono text-[10px] text-ink-3">{g.chunkId}</span>
              <span className="font-mono text-ink-1">{g.label}</span>
              {g.matchedAstFile ? (
                <span className="truncate font-mono text-[10px] text-ink-3">
                  ↪ {g.matchedAstFile}
                </span>
              ) : null}
              <span className="ml-auto font-mono text-[10px] text-ink-3">
                {g.sizeBytes}B
              </span>
              <Chip tone="accent" size="xs">
                ✓ AST
              </Chip>
            </div>
          ))}
        </div>
      )}
      {graph.declaredButNotShipped.length > 0 ? (
        <div className="hairline-t px-2 py-1 text-[10px] text-ink-3">
          declared-not-shipped:{' '}
          {graph.declaredButNotShipped.map((d) => d.file).join(', ')}
        </div>
      ) : null}
    </div>
  );
}

function RscTraceModulesSection() {
  const url = useLastTraceStore((s) => s.url);
  const chunks = useLastTraceStore((s) => s.chunks);
  const modules = useMemo(() => analyzeClientModules(chunks), [chunks]);

  if (!url) return null;

  const userModules = modules.filter((m) => !m.isNextInternal && !m.isThirdParty);
  const internalCount = modules.length - userModules.length;
  return (
    <div className="border-t-2 border-line bg-bg-subtle">
      <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-ink-3">
        <span className="font-mono uppercase tracking-wide">From last RSC trace</span>
        <span className="font-mono">{url}</span>
        <span className="ml-auto">
          {userModules.length} user · {internalCount} internal
        </span>
      </div>
      {modules.length === 0 ? (
        <div className="px-2 py-2 text-xs text-ink-3">No client modules in trace</div>
      ) : (
        <div className="divide-y divide-line/70">
          {userModules.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-bg-hover"
              title={m.modulePath}
            >
              <span className="w-7 font-mono text-[10px] text-ink-3">{m.id}</span>
              <span className="font-mono text-ink-1">{m.label}</span>
              <span className="ml-auto font-mono text-[10px] text-ink-3">
                {m.sizeBytes}B · {Math.round(m.arrivedAtMs)}ms
              </span>
              <Chip tone="info" size="xs">
                user
              </Chip>
            </div>
          ))}
          {userModules.length === 0 ? (
            <div className="px-2 py-1 text-[10px] text-ink-3">
              All modules are Next.js internal — no user client islands shipped
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
