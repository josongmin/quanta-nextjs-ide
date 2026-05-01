import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@entities/ui-shell';
import { Button, Chip, OverlayPanel, ScrollArea } from '@shared/ui';
import { PanelHeader } from '@shared/ui/panel-header';
import { ToggleChip } from '@shared/ui/toggle-chip';
import { cn } from '@shared/lib/cn';
import {
  ARCHETYPES,
  findNode,
  type RouteArchetype,
  type RouteNode,
  type SlotKind,
  type TransitionStep,
} from './helpers';

const KIND_TONE: Record<SlotKind, 'neutral' | 'accent' | 'info' | 'warn'> = {
  segment: 'neutral',
  page: 'info',
  parallel: 'accent',
  intercept: 'warn',
};

interface LaidOutNode {
  node: RouteNode;
  x: number;
  y: number;
  parentId?: string;
}

function layoutTree(root: RouteNode): { nodes: LaidOutNode[]; width: number; height: number } {
  const COL = 200;
  const ROW = 56;
  const nodes: LaidOutNode[] = [];

  let nextLeaf = 0;
  const assign = (n: RouteNode, depth: number, parentId?: string): number => {
    if (!n.children || n.children.length === 0) {
      const x = nextLeaf * COL + 20;
      const y = depth * ROW + 20;
      const item: LaidOutNode = parentId !== undefined
        ? { node: n, x, y, parentId }
        : { node: n, x, y };
      nodes.push(item);
      nextLeaf += 1;
      return x;
    }
    const childXs = n.children.map((c) => assign(c, depth + 1, n.id));
    const sum = childXs.reduce((a, b) => a + b, 0);
    const x = childXs.length > 0 ? sum / childXs.length : 0;
    const y = depth * ROW + 20;
    const item: LaidOutNode = parentId !== undefined
      ? { node: n, x, y, parentId }
      : { node: n, x, y };
    nodes.push(item);
    return x;
  };

  assign(root, 0);
  const width = Math.max(400, nextLeaf * COL + 40);
  const maxDepth = Math.max(...nodes.map((n) => n.y)) + 60;
  return { nodes, width, height: maxDepth };
}

export function ParallelRoutesVizOverlay() {
  const open = useUiStore((s) => s.overlays.parallelRoutesViz.open);
  const close = useUiStore((s) => s.closeOverlay);
  const [archId, setArchId] = useState<string>(ARCHETYPES[0]?.id ?? 'product');
  const archetype: RouteArchetype = useMemo(
    () => ARCHETYPES.find((a) => a.id === archId) ?? ARCHETYPES[0]!,
    [archId],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const layout = useMemo(() => layoutTree(archetype.root), [archetype]);

  const selected = useMemo(
    () => (selectedId ? findNode(archetype.root, selectedId) : undefined),
    [selectedId, archetype],
  );

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('parallelRoutesViz'))}
      title="Parallel routes visualizer"
      subtitle={archetype.description}
      size="xl"
      footer={
        <>
          <Button size="xs" tone="ghost" onClick={() => toast('Generated slot skeleton (mock)')}>
            Generate skeleton
          </Button>
          <Button size="xs" tone="default" onClick={() => toast('Test all entry points (mock)')}>
            Test all entry points
          </Button>
        </>
      }
    >
      <PanelHeader>
        <span className="tracking-caps text-ink-3">archetype</span>
        {ARCHETYPES.map((a) => (
          <ToggleChip
            key={a.id}
            active={a.id === archId}
            onClick={() => {
              setArchId(a.id);
              setSelectedId(null);
            }}
          >
            {a.label}
          </ToggleChip>
        ))}
        <span className="ml-auto text-ink-3">click any node for details</span>
      </PanelHeader>

      <div className="grid grid-cols-[1fr_300px] divide-x divide-line">
        <div className="flex h-[540px] flex-col">
          {/* Tree SVG */}
          <ScrollArea className="hairline-b">
            <div className="px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
              File structure
            </div>
            <div className="px-3 pb-3">
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                className="block w-full"
                style={{ height: layout.height }}
              >
                {/* parent → child links */}
                {layout.nodes.map((n) => {
                  if (!n.parentId) return null;
                  const p = layout.nodes.find((x) => x.node.id === n.parentId);
                  if (!p) return null;
                  const isIntercept = n.node.kind === 'intercept';
                  return (
                    <line
                      key={`l-${n.node.id}`}
                      x1={p.x + 70}
                      y1={p.y + 24}
                      x2={n.x + 70}
                      y2={n.y}
                      className={cn(
                        isIntercept ? 'stroke-sev-warn' : 'stroke-line',
                      )}
                      strokeWidth={1}
                      strokeDasharray={isIntercept ? '3 3' : undefined}
                    />
                  );
                })}
                {/* nodes */}
                {layout.nodes.map((n) => {
                  const tone = KIND_TONE[n.node.kind];
                  const isSel = selectedId === n.node.id;
                  const fillCls =
                    tone === 'accent'
                      ? 'fill-accent-soft'
                      : tone === 'info'
                        ? 'fill-sev-info-soft'
                        : tone === 'warn'
                          ? 'fill-sev-warn-soft'
                          : 'fill-bg-subtle';
                  const strokeCls =
                    tone === 'accent'
                      ? 'stroke-accent'
                      : tone === 'info'
                        ? 'stroke-sev-info'
                        : tone === 'warn'
                          ? 'stroke-sev-warn'
                          : 'stroke-line';
                  return (
                    <g
                      key={n.node.id}
                      transform={`translate(${n.x},${n.y})`}
                      onClick={() => setSelectedId(n.node.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={0}
                        y={0}
                        width={140}
                        height={24}
                        rx={3}
                        className={cn(fillCls, strokeCls)}
                        strokeWidth={isSel ? 1.5 : 1}
                      />
                      <text
                        x={70}
                        y={15}
                        textAnchor="middle"
                        fontSize={10}
                        className="fill-ink-1 font-mono"
                      >
                        {n.node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </ScrollArea>

          {/* Transition simulator */}
          <ScrollArea className="flex-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-caps text-ink-3">
              Transition simulator
            </div>
            <div className="grid grid-flow-col gap-2 overflow-x-auto px-3 pb-3">
              {archetype.transitions.map((t, i) => (
                <TransitionCard key={i} step={t} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right rail */}
        <ScrollArea className="h-[540px]">
          <div className="px-3 py-3">
            <div className="text-[10px] uppercase tracking-caps text-ink-3">
              Selected slot
            </div>
            {selected ? (
              <div className="mt-2 space-y-2 text-xs">
                <div className="font-mono text-ink-1">{selected.path}</div>
                <div className="flex flex-wrap gap-1">
                  <Chip tone={KIND_TONE[selected.kind]} size="xs">
                    {selected.kind}
                  </Chip>
                  {selected.hasDefault === true ? (
                    <Chip tone="static" size="xs">
                      default.tsx ✓
                    </Chip>
                  ) : selected.hasDefault === false ? (
                    <Chip tone="err" size="xs">
                      no default.tsx
                    </Chip>
                  ) : null}
                  {selected.intercepts ? (
                    <Chip tone="warn" size="xs">
                      intercepts {selected.intercepts}
                    </Chip>
                  ) : null}
                </div>
                {selected.fallbackText ? (
                  <div className="text-ink-3">
                    Fallback:{' '}
                    <span className="font-mono text-ink-2">{selected.fallbackText}</span>
                  </div>
                ) : null}
                {selected.caveats && selected.caveats.length > 0 ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-caps text-ink-3">
                      Caveats
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
                      {selected.caveats.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded-sm border border-line bg-bg-subtle px-1.5 py-0.5 text-[10px] text-ink-2"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 rounded-sm border border-dashed border-line bg-bg-subtle/40 px-2 py-3 text-center text-[11px] text-ink-3">
                Click a slot in the tree to inspect.
              </div>
            )}

            <div className="mt-4 text-[10px] uppercase tracking-caps text-ink-3">
              Common pitfalls
            </div>
            <ul className="mt-1 space-y-1.5">
              {archetype.pitfalls.map((p, i) => (
                <li
                  key={i}
                  className="rounded-sm border border-line bg-sev-warn-soft/40 px-2 py-1.5 text-[11px] text-ink-1"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </OverlayPanel>
  );
}

function TransitionCard({ step }: { step: TransitionStep }) {
  return (
    <div className="w-[200px] shrink-0 rounded-sm border border-line bg-bg p-2 text-[11px]">
      <div className="font-mono text-ink-1">{step.label}</div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-ink-3">{step.url}</div>
      <div className="mt-2 space-y-1">
        {step.rendered.map((r, i) => (
          <div
            key={i}
            className={cn(
              'rounded-sm border px-1.5 py-1 font-mono text-[10px]',
              r.tone === 'main' && 'border-line bg-bg-subtle text-ink-1',
              r.tone === 'tab' && 'border-accent/40 bg-accent-soft text-accent',
              r.tone === 'modal' && 'border-sev-warn/40 bg-sev-warn-soft text-sev-warn',
              r.tone === 'drawer' && 'border-sev-info/40 bg-sev-info-soft text-sev-info',
              r.tone === 'fallback' && 'border-line/60 bg-bg text-ink-3',
            )}
          >
            <span className="text-ink-3">{r.slot}</span> {r.component}
          </div>
        ))}
      </div>
      {step.note ? (
        <div className="mt-2 text-[10px] text-ink-3">{step.note}</div>
      ) : null}
    </div>
  );
}
