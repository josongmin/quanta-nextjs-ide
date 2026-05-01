import { Button, Chip, Icon, IconBox } from '@shared/ui';
import {
  nodeChildren,
  nodeParent,
  type GraphNode,
  type RenderGraph,
} from '../helpers';

interface DetailsPaneProps {
  graph: RenderGraph | null;
  node: GraphNode | null;
  onJump(file: string): void;
}

export function DetailsPane({ graph, node, onJump }: DetailsPaneProps) {
  if (!node || !graph) {
    return (
      <section className="px-3 py-3 text-[11px] text-ink-3">
        Select a node to see details.
      </section>
    );
  }
  const parent = nodeParent(graph, node.id);
  const children = nodeChildren(graph, node.id);

  return (
    <section className="min-w-0 px-3 py-3">
      <header className="mb-2 flex items-center gap-1.5">
        <IconBox
          letter={node.role === 'client' ? 'C' : 'S'}
          tone={node.role === 'client' ? 'client' : 'server'}
        />
        <span className="truncate text-sm font-medium text-ink-1">
          {node.name}
        </span>
      </header>
      <div className="font-mono text-[11px] text-ink-3 truncate">{node.file}</div>

      <div className="mt-3 hairline-t pt-2 text-[11px] text-ink-2">
        <div className="text-caps text-ink-3">Role</div>
        <div className="mt-0.5">
          {node.role === 'client' ? 'Client component' : 'Server component'}
          {node.isRoot ? ' · root' : ''}
        </div>
      </div>

      <div className="mt-2 hairline-t pt-2">
        <div className="text-caps text-ink-3">Parent</div>
        <div className="mt-0.5 text-[11px] text-ink-2">
          {parent ? parent.name : '—'}
        </div>
      </div>

      <div className="mt-2 hairline-t pt-2">
        <div className="text-caps text-ink-3">
          Children ({children.length})
        </div>
        <ul className="mt-0.5 space-y-0.5 text-[11px] text-ink-2">
          {children.length === 0 ? (
            <li className="text-ink-3">leaf</li>
          ) : (
            children.map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <span className="text-ink-3">└─</span>
                <span className="truncate">{c.name}</span>
                <Chip
                  tone={c.role === 'client' ? 'client' : 'server'}
                  size="xs"
                  className="ml-auto font-normal normal-case"
                >
                  {c.role === 'client' ? 'C' : 'S'}
                </Chip>
              </li>
            ))
          )}
        </ul>
      </div>

      {node.hotspot ? (
        <div className="mt-2 hairline-t pt-2">
          <div className="text-caps text-ink-3">Why it re-renders</div>
          <div className="mt-0.5 text-[11px] text-ink-2">
            {node.hotspot.rerenders}× on prop change — {node.hotspot.reason}
          </div>
        </div>
      ) : null}

      <Button
        size="xs"
        tone="ghost"
        className="mt-3 w-full"
        onClick={() => onJump(node.file)}
      >
        <Icon.UpRight className="h-3 w-3" /> Open in editor
      </Button>
    </section>
  );
}
