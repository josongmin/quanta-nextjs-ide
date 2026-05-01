import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import {
  Chip,
  Icon,
  OverlayPanel,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@shared/ui';
import { ToggleChip } from '@shared/ui/toggle-chip';
import {
  KIND_TONE,
  ROOT_TYPE_ID,
  findType,
  layoutTree,
  type Direction,
  type Layout,
  type LayoutNode,
} from './helpers';

export function TypeHierarchyOverlay() {
  const open = useUiStore((s) => s.overlays.typeHierarchy.open);
  const symbolId = useUiStore((s) => s.overlays.typeHierarchy.symbolId);
  const close = useUiStore((s) => s.closeOverlay);

  const rootId = symbolId ?? ROOT_TYPE_ID;
  const [direction, setDirection] = useState<Direction>('both');
  const [abstractOnly, setAbstractOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(rootId);

  const layout = useMemo(
    () => layoutTree(rootId, direction, abstractOnly),
    [rootId, direction, abstractOnly],
  );

  const selected = findType(selectedId) ?? findType(rootId);

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(v) => !v && close('typeHierarchy')}
      title={
        <span className="flex items-center gap-2">
          <Icon.Layers className="h-4 w-4 text-ink-3" />
          <span>Type Hierarchy</span>
          <Chip tone="accent" size="xs">
            {rootId}
          </Chip>
        </span>
      }
      size="lg"
      footer={
        <>
          <ToggleChip
            active={abstractOnly}
            onClick={() => setAbstractOnly((v) => !v)}
            title="Hide concrete types"
          >
            <Icon.Hex className="h-3 w-3" /> Show only abstract
          </ToggleChip>
          <span className="ml-auto text-[11px] text-ink-3">
            {layout.nodes.length} nodes · {layout.edges.length} edges
          </span>
        </>
      }
    >
      <Tabs
        value={direction}
        onValueChange={(v) => setDirection(v as Direction)}
      >
        <TabsList>
          <TabsTrigger value="super">
            <Icon.Up className="h-3 w-3" /> Supertypes
          </TabsTrigger>
          <TabsTrigger value="sub">
            <Icon.Down className="h-3 w-3" /> Subtypes
          </TabsTrigger>
          <TabsTrigger value="both">
            <Icon.Layers className="h-3 w-3" /> Both
          </TabsTrigger>
        </TabsList>
        <TabsContent value="super">
          <Body
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            selected={selected}
          />
        </TabsContent>
        <TabsContent value="sub">
          <Body
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            selected={selected}
          />
        </TabsContent>
        <TabsContent value="both">
          <Body
            layout={layout}
            selectedId={selectedId}
            onSelect={setSelectedId}
            selected={selected}
          />
        </TabsContent>
      </Tabs>
    </OverlayPanel>
  );
}

function Body({
  layout,
  selectedId,
  onSelect,
  selected,
}: {
  layout: Layout;
  selectedId: string;
  onSelect(id: string): void;
  selected: ReturnType<typeof findType>;
}) {
  return (
    <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
      <ScrollArea className="max-h-[60vh]">
        <div className="p-3">
          <TreeSvg
            layout={layout}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
      </ScrollArea>
      <aside className="min-w-0">
        <header className="flex items-center gap-2 px-3 py-2 hairline-b bg-bg-subtle">
          <Icon.Info className="h-3 w-3 text-ink-3" />
          <span className="text-caps text-ink-3">Selected type</span>
        </header>
        {selected ? (
          <div className="space-y-3 p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-ink-1">
                  {selected.name}
                </span>
                <Chip tone={KIND_TONE[selected.kind]} size="xs">
                  {selected.kind}
                </Chip>
                {selected.abstract ? (
                  <Chip tone="muted" size="xs">
                    abstract
                  </Chip>
                ) : null}
              </div>
              <div className="mt-1 truncate font-mono text-[11px] text-ink-3">
                {selected.file}:{selected.line}
              </div>
            </div>
            <div>
              <div className="mb-1 text-caps text-ink-3">
                Members ({selected.members.length})
              </div>
              <div className="rounded-sm border border-line">
                {selected.members.length === 0 ? (
                  <div className="p-2 text-[11px] text-ink-3">
                    No declared members.
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {selected.members.map((m) => (
                      <li
                        key={m.name}
                        className="flex items-baseline gap-2 px-2 py-1.5"
                      >
                        <Chip
                          tone={m.kind === 'method' ? 'isr' : 'muted'}
                          size="xs"
                        >
                          {m.kind}
                        </Chip>
                        <span className="truncate font-mono text-[11px] text-ink-1">
                          {m.signature}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() =>
                  toast('Open declaration', {
                    description: `${selected.file}:${selected.line}`,
                  })
                }
                className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover"
              >
                <Icon.UpRight className="h-3 w-3" /> Open declaration
              </button>
              <button
                onClick={() =>
                  toast('Find usages', {
                    description: `${selected.name}`,
                  })
                }
                className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-bg px-2 text-[11px] text-ink-2 hover:bg-bg-hover"
              >
                <Icon.Search className="h-3 w-3" /> Find usages
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-ink-3">No type selected.</div>
        )}
      </aside>
    </div>
  );
}

function TreeSvg({
  layout,
  selectedId,
  onSelect,
}: {
  layout: Layout;
  selectedId: string;
  onSelect(id: string): void;
}) {
  const { nodes, edges, width, height } = layout;
  const byId = new Map<string, LayoutNode>(nodes.map((n) => [n.id, n]));
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      role="img"
      aria-label="Type hierarchy graph"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="text-line-strong" stroke="currentColor" fill="none">
        {edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + a.w / 2;
          const y1 = a.y + a.h;
          const x2 = b.x + b.w / 2;
          const y2 = b.y;
          const midY = (y1 + y2) / 2;
          const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={path}
              strokeWidth={1}
              className="text-ink-3"
              markerEnd="url(#arrow)"
            />
          );
        })}
      </g>
      {nodes.map((n) => {
        const isSelected = n.id === selectedId;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x} ${n.y})`}
            onClick={() => onSelect(n.id)}
            className="cursor-pointer"
          >
            <rect
              x={0}
              y={0}
              rx={6}
              ry={6}
              width={n.w}
              height={n.h}
              className={
                isSelected
                  ? 'fill-accent-soft stroke-accent'
                  : 'fill-bg stroke-line'
              }
              strokeWidth={1}
            />
            <text
              x={10}
              y={20}
              className="fill-ink-1 font-mono"
              fontSize={11}
              fontWeight={600}
            >
              {n.node.name}
            </text>
            <text
              x={10}
              y={36}
              className="fill-ink-3"
              fontSize={9}
            >
              {n.node.kind}
              {n.node.abstract ? ' · abstract' : ''}
            </text>
            <text
              x={n.w - 10}
              y={36}
              textAnchor="end"
              className="fill-ink-3"
              fontSize={9}
            >
              {n.node.members.length} members
            </text>
          </g>
        );
      })}
    </svg>
  );
}
