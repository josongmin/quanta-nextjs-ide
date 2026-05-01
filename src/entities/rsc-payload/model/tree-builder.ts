import type { RscChunk, TreeNode } from './types';

export function buildResolvedTree(
  chunks: ReadonlyArray<RscChunk>,
  uptoMs?: number,
): ReadonlyArray<TreeNode> {
  const cutoff = uptoMs ?? Number.POSITIVE_INFINITY;
  const visible = chunks.filter((c) => c.arrivedAtMs <= cutoff);

  // React Flight may emit the same id multiple times (Suspense follow-ups);
  // keep the earliest occurrence to mirror "when did this resolve".
  const nodes = new Map<string, TreeNode>();
  const parentOf = new Map<string, string | undefined>();
  for (const c of visible) {
    if (nodes.has(c.id)) continue;
    nodes.set(c.id, {
      id: c.id,
      label: c.label ?? c.id,
      kind: c.kind,
      resolvedAt: c.arrivedAtMs,
      children: [],
    });
    parentOf.set(c.id, c.parent);
  }

  const roots: TreeNode[] = [];
  for (const [id, node] of nodes) {
    const parent = parentOf.get(id);
    if (parent && nodes.has(parent)) {
      nodes.get(parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
