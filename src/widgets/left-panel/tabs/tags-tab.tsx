import { useMemo } from 'react';
import { toast } from 'sonner';
import { useCacheTagStore } from '@entities/cache-tag';
import { useRouteStore } from '@entities/route';
import type { CacheTag, CacheTagSite } from '@shared/types';
import {
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Icon,
  Section,
} from '@shared/ui';
import { cn } from '@shared/lib/cn';
import { TabHeader } from '../parts/tab-header';
import { FilterChipGroup, type FilterChipOption } from '../parts/filter-chip-group';

const VIEW_OPTIONS: ReadonlyArray<FilterChipOption<'list' | 'graph'>> = [
  { value: 'list', label: 'List' },
  { value: 'graph', label: 'Graph' },
];

interface TagCtxProps {
  tag: CacheTag;
  children: React.ReactNode;
}

function TagContextMenu({ tag, children }: TagCtxProps) {
  const fire = (label: string) => () => toast(label, { description: `tag: ${tag.name}` });
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Tag: "{tag.name}"</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuLabel>Inspect</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Show lineage')}>Show lineage</ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show all fetches with this tag')}>
          Show all fetches with this tag
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Show all revalidate sites')}>
          Show all revalidate sites
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>Refactor</ContextMenuLabel>
        <ContextMenuItem onSelect={fire('Rename tag (safe across project)')}>
          Rename tag (safe across project)
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Merge with another tag')}>
          Merge with another tag
        </ContextMenuItem>
        <ContextMenuItem onSelect={fire('Split per-resource')}>
          Split per-resource (product:{'{id}'})
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function SiteRow({ site }: { site: CacheTagSite }) {
  return (
    <div className="flex h-6 items-center gap-1.5 px-2 text-xs text-ink-2 hover:bg-bg-hover">
      <Icon.File className="h-3 w-3 text-ink-3" />
      <span className="font-mono">{site.location.file}</span>
      <span className="text-[10px] text-ink-3">:{site.location.line}</span>
      {site.fetchUrl && (
        <Chip tone="muted" size="xs" className="ml-auto font-mono">
          {site.fetchUrl}
        </Chip>
      )}
      {typeof site.revalidate === 'number' && (
        <Chip tone="info" size="xs">
          rev {site.revalidate}s
        </Chip>
      )}
    </div>
  );
}

function TagListRow({ tag }: { tag: CacheTag }) {
  const orphan = tag.producers.length === 0 || tag.invalidators.length === 0;
  const dup = !!tag.inconsistencyGroup;
  return (
    <TagContextMenu tag={tag}>
      <Section
        title={
          <span className="inline-flex items-center gap-1.5">
            <Icon.Tag className="h-3 w-3 text-ink-3" />
            <span className="font-mono">{tag.name}</span>
            {dup && (
              <Chip tone="warn" size="xs" title={`group: ${tag.inconsistencyGroup}`}>
                ?dup
              </Chip>
            )}
            {orphan && tag.producers.length === 0 && tag.invalidators.length > 0 && (
              <Chip tone="warn" size="xs">
                ⚠ no producers
              </Chip>
            )}
            {orphan && tag.producers.length > 0 && tag.invalidators.length === 0 && (
              <Chip tone="hint" size="xs">
                no invalidators
              </Chip>
            )}
          </span>
        }
        defaultOpen={false}
        trailing={
          <span className="text-[10px] text-ink-3">
            producers {tag.producers.length} · invalidators {tag.invalidators.length} ·
            routes {tag.affectedRouteIds.length}
          </span>
        }
      >
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-[10px] font-medium tracking-caps text-ink-3">
              PRODUCERS ({tag.producers.length})
            </div>
            {tag.producers.length === 0 ? (
              <div className="px-2 text-xs text-ink-3">— none —</div>
            ) : (
              tag.producers.map((p, i) => <SiteRow key={`p-${i}`} site={p} />)
            )}
          </div>
          <div>
            <div className="text-[10px] font-medium tracking-caps text-ink-3">
              INVALIDATORS ({tag.invalidators.length})
            </div>
            {tag.invalidators.length === 0 ? (
              <div className="px-2 text-xs text-ink-3">— none —</div>
            ) : (
              tag.invalidators.map((p, i) => <SiteRow key={`i-${i}`} site={p} />)
            )}
          </div>
          <div>
            <div className="text-[10px] font-medium tracking-caps text-ink-3">
              AFFECTED ROUTES ({tag.affectedRouteIds.length})
            </div>
            <div className="flex flex-wrap gap-1 px-2 py-1">
              {tag.affectedRouteIds.length === 0 ? (
                <span className="text-xs text-ink-3">— none —</span>
              ) : (
                tag.affectedRouteIds.map((id) => (
                  <Chip key={id} tone="muted" size="xs" className="font-mono">
                    {id}
                  </Chip>
                ))
              )}
            </div>
          </div>
        </div>
      </Section>
    </TagContextMenu>
  );
}

interface GraphProps {
  tags: ReadonlyArray<CacheTag>;
}

interface NodePos {
  x: number;
  y: number;
  tag: CacheTag;
}

function TagGraph({ tags }: GraphProps) {
  const W = 320;
  const H = 320;
  const positions = useMemo<NodePos[]>(() => {
    const cols = Math.ceil(Math.sqrt(tags.length));
    const cellW = (W - 40) / Math.max(1, cols);
    const cellH = (H - 40) / Math.max(1, Math.ceil(tags.length / Math.max(1, cols)));
    return tags.map((tag, i) => ({
      tag,
      x: 30 + (i % cols) * cellW + cellW / 2,
      y: 30 + Math.floor(i / cols) * cellH + cellH / 2,
    }));
  }, [tags]);

  const edges = useMemo(() => {
    const out: Array<{ a: NodePos; b: NodePos; group: string }> = [];
    const byGroup = new Map<string, NodePos[]>();
    for (const p of positions) {
      const g = p.tag.inconsistencyGroup;
      if (!g) continue;
      const list = byGroup.get(g) ?? [];
      list.push(p);
      byGroup.set(g, list);
    }
    for (const [group, list] of byGroup) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (a && b) out.push({ a, b, group });
        }
      }
    }
    return out;
  }, [positions]);

  return (
    <div className="flex justify-center p-4">
      <svg width={W} height={H} className="rounded-sm border border-line bg-bg">
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke="hsl(var(--warn))"
            strokeWidth={1}
            strokeDasharray="3 2"
            opacity={0.6}
          />
        ))}
        {positions.map((p) => {
          const r = 14 + Math.min(8, p.tag.producers.length);
          const dup = !!p.tag.inconsistencyGroup;
          return (
            <g key={p.tag.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={dup ? 'hsl(var(--warn-soft))' : 'hsl(var(--bg))'}
                stroke={dup ? 'hsl(var(--warn))' : 'hsl(var(--border-strong))'}
                strokeWidth={1.5}
              />
              <text
                x={p.x}
                y={p.y - r - 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="monospace"
                fill="hsl(var(--text))"
              >
                {p.tag.name}
              </text>
              <text
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fontSize="9"
                fill="hsl(var(--text-3))"
              >
                {p.tag.producers.length}/{p.tag.invalidators.length}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TagsTab() {
  const tags = useCacheTagStore((s) => s.tags);
  const view = useCacheTagStore((s) => s.view);
  const setView = useCacheTagStore((s) => s.setView);
  const routes = useRouteStore((s) => s.routes);

  const enrichedTags = useMemo(() => {
    const routeIds = new Set(routes.map((r) => r.id));
    return tags.map((t) => ({
      ...t,
      affectedRouteIds: t.affectedRouteIds.filter((id) => routeIds.has(id) || true),
    }));
  }, [tags, routes]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabHeader>
        <FilterChipGroup options={VIEW_OPTIONS} value={view} onChange={setView} />
        <span className="ml-auto text-[10px] text-ink-3">{tags.length} tags</span>
      </TabHeader>
      <div className={cn('flex-1 min-h-0 overflow-y-auto')}>
        {view === 'list' ? (
          tags.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-xs text-ink-3">
              No tags
            </div>
          ) : (
            enrichedTags.map((t) => <TagListRow key={t.id} tag={t} />)
          )
        ) : (
          <TagGraph tags={tags} />
        )}
      </div>
    </div>
  );
}
