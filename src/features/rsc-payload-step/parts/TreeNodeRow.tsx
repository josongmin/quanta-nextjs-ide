import { KIND_LABEL, KIND_TONE, type TreeNode } from '@entities/rsc-payload';
import { Chip } from '@shared/ui';

interface NodeProps {
  node: TreeNode;
  depth: number;
}

export function TreeNodeRow({ node, depth }: NodeProps) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-0.5"
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <span aria-hidden className="font-mono text-[10px] text-ink-3">
          {depth > 0 ? '└─' : '•'}
        </span>
        <span className="font-mono text-[11px] text-ink-1">{node.label}</span>
        <Chip tone={KIND_TONE[node.kind]} size="xs">
          {KIND_LABEL[node.kind]}
        </Chip>
        <span className="font-mono text-[10px] text-ink-3">
          @{Math.round(node.resolvedAt)}ms
        </span>
      </div>
      {node.children.map((c) => (
        <TreeNodeRow key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}
