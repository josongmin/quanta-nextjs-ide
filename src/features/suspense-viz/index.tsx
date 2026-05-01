import { useMemo, useState } from 'react';
import { useUiStore } from '@entities/ui-shell';
import { Chip, CodeBlock, OverlayPanel } from '@shared/ui';
import { SelectControl } from '@shared/ui/select-control';
import { cn } from '@shared/lib/cn';
import {
  flatten,
  maxMs,
  ROUTE_OPTIONS,
  statusAt,
  statusTone,
  trees,
  type SuspenseNode,
  type SuspenseStatus,
} from './helpers';

const STATUS_GLYPH: Record<SuspenseStatus, string> = {
  resolved: '✓',
  pending: '◔',
  fallback: '◐',
  error: '✕',
};

interface NodeViewProps {
  node: SuspenseNode;
  depth: number;
  t: number;
  selectedId: string | null;
  onSelect(id: string): void;
}

function NodeView({ node, depth, t, selectedId, onSelect }: NodeViewProps) {
  const status = statusAt(node, t);
  const isSelected = selectedId === node.id;
  return (
    <div className="relative">
      {depth > 0 ? (
        <span
          aria-hidden
          className="absolute left-2 top-0 h-3 w-3 border-l border-b border-line"
          style={{ left: (depth - 1) * 16 + 6 }}
        />
      ) : null}
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: depth * 16 + 4 }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-[11px] hover:bg-bg-hover',
          isSelected && 'bg-accent-soft/60',
        )}
      >
        <span
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]',
            status === 'pending' && 'border-sev-warn/60 text-sev-warn animate-pulse',
            status === 'resolved' && 'border-sem-static/60 text-sem-static',
            status === 'fallback' && 'border-accent/60 text-accent',
            status === 'error' && 'border-sev-err/60 text-sev-err',
          )}
        >
          {STATUS_GLYPH[status]}
        </span>
        <span className="text-ink-1">{node.tag}</span>
        <Chip tone={statusTone(status)} size="xs">
          {status}
        </Chip>
        <span className="ml-auto font-mono text-[10px] text-ink-3">
          {node.ms}ms
        </span>
      </button>
      {node.children.map((c) => (
        <NodeView
          key={c.id}
          node={c}
          depth={depth + 1}
          t={t}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function findNode(node: SuspenseNode, id: string): SuspenseNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

export function SuspenseVizOverlay() {
  const open = useUiStore((s) => s.overlays.suspenseViz.open);
  const close = useUiStore((s) => s.closeOverlay);
  const ctxRouteId = useUiStore((s) => s.overlays.suspenseViz.routeId);

  const initialRoute =
    ctxRouteId && trees[ctxRouteId] ? ctxRouteId : 'route_dashboard';
  const [routeId, setRouteId] = useState<string>(initialRoute);
  const tree = trees[routeId];
  const max = useMemo(() => (tree ? maxMs(tree) : 0), [tree]);
  const [t, setT] = useState<number>(max);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset t when route changes
  const onRouteChange = (v: string) => {
    setRouteId(v);
    const next = trees[v];
    setT(next ? maxMs(next) : 0);
    setSelectedId(null);
  };

  if (!tree) return null;

  const flat = flatten(tree);
  const totals = flat.reduce(
    (acc, n) => {
      const s = statusAt(n, t);
      acc[s] += 1;
      return acc;
    },
    { pending: 0, resolved: 0, fallback: 0, error: 0 } as Record<
      SuspenseStatus,
      number
    >,
  );

  const selected = selectedId ? findNode(tree, selectedId) : null;

  return (
    <OverlayPanel
      open={open}
      onOpenChange={(o) => (o ? null : close('suspenseViz'))}
      title="Suspense Visualizer"
      subtitle="pending · resolved · fallback tree"
      size="md"
      footer={
        <span className="flex w-full items-center gap-3 text-[11px] text-ink-3">
          <span>
            resolved:{' '}
            <span className="font-mono text-sem-static">{totals.resolved}</span>
          </span>
          <span>
            pending:{' '}
            <span className="font-mono text-sev-warn">{totals.pending}</span>
          </span>
          <span>
            fallback:{' '}
            <span className="font-mono text-accent">{totals.fallback}</span>
          </span>
          <span>
            errors:{' '}
            <span className="font-mono text-sev-err">{totals.error}</span>
          </span>
          <span className="ml-auto font-mono">
            t = {t}ms / {max}ms
          </span>
        </span>
      }
    >
      <div className="flex h-9 items-center gap-2 hairline-b bg-bg-subtle px-3">
        <SelectControl
          label="route"
          value={routeId}
          onChange={onRouteChange}
          options={ROUTE_OPTIONS}
        />
        <div className="ml-2 flex items-center gap-1.5">
          <span className="text-caps text-ink-3">t</span>
          <input
            type="range"
            min={0}
            max={max}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-44 accent-current text-accent"
          />
          <span className="font-mono text-[10px] text-ink-3">{t}ms</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-ink-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sev-warn" />
            pending
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sem-static" />
            resolved
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            fallback
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sev-err" />
            error
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_260px]">
        <section className="max-h-[480px] overflow-y-auto p-3">
          <NodeView
            node={tree}
            depth={0}
            t={t}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        <aside className="hairline-l bg-bg-subtle/30 p-3">
          {selected ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Chip tone={statusTone(statusAt(selected, t))} size="xs">
                    {statusAt(selected, t)}
                  </Chip>
                  <span className="ml-auto font-mono text-[10px] text-ink-3">
                    {selected.ms}ms
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-ink-1">
                  {selected.tag}
                </div>
              </div>
              {selected.awaitedFor ? (
                <div>
                  <div className="text-caps mb-1 text-ink-3">awaiting</div>
                  <code className="block rounded-sm border border-line bg-bg px-1.5 py-1 font-mono text-[11px] text-ink-1">
                    {selected.awaitedFor}
                  </code>
                </div>
              ) : null}
              {selected.fallback ? (
                <div>
                  <div className="text-caps mb-1 text-ink-3">fallback</div>
                  <CodeBlock
                    code={selected.fallback}
                    showLineNumbers={false}
                    maxHeight={60}
                  />
                </div>
              ) : null}
              {selected.suggestion ? (
                <div>
                  <div className="text-caps mb-1 text-ink-3">suggestion</div>
                  <div className="rounded-sm border border-line bg-bg p-2 text-[11px] text-ink-1">
                    {selected.suggestion}
                  </div>
                </div>
              ) : null}
              <div className="text-[10px] text-ink-3">
                children:{' '}
                <span className="font-mono text-ink-2">
                  {selected.children.length}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-ink-3">
              Click a node in the tree to inspect.
            </div>
          )}
        </aside>
      </div>
    </OverlayPanel>
  );
}
