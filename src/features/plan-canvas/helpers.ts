export type NodeKind = 'research' | 'edit' | 'test' | 'verify' | 'deploy';
export type NodeStatus = 'todo' | 'doing' | 'done' | 'blocked';

export interface PlanNode {
  id: string;
  title: string;
  kind: NodeKind;
  depsIds: ReadonlyArray<string>;
  etaMin: number;
  status: NodeStatus;
  notes: string;
  x: number;
  y: number;
}

export interface NodeDraft {
  title: string;
  kind: NodeKind;
  status: NodeStatus;
  etaMin: number;
  notes: string;
  depsIds: ReadonlyArray<string>;
}

export function toDraft(n: PlanNode): NodeDraft {
  return {
    title: n.title,
    kind: n.kind,
    status: n.status,
    etaMin: n.etaMin,
    notes: n.notes,
    depsIds: n.depsIds,
  };
}

export const NODE_KINDS: ReadonlyArray<NodeKind> = [
  'research',
  'edit',
  'test',
  'verify',
  'deploy',
];

export const NODE_STATUSES: ReadonlyArray<NodeStatus> = [
  'todo',
  'doing',
  'done',
  'blocked',
];

export const NODE_W = 168;
export const NODE_H = 64;

export const PLAN_NODES: ReadonlyArray<PlanNode> = [
  {
    id: 'n1',
    title: 'Survey usages of useCart',
    kind: 'research',
    depsIds: [],
    etaMin: 15,
    status: 'done',
    notes: 'rg results saved to scratch/cart-usage.md',
    x: 40,
    y: 40,
  },
  {
    id: 'n2',
    title: 'Define CartItem + Money types',
    kind: 'edit',
    depsIds: ['n1'],
    etaMin: 25,
    status: 'doing',
    notes: 'Use branded number for cents.',
    x: 260,
    y: 40,
  },
  {
    id: 'n3',
    title: 'Migrate cart.add callsites',
    kind: 'edit',
    depsIds: ['n2'],
    etaMin: 45,
    status: 'todo',
    notes: 'Watch for legacy CommonJS imports in /scripts.',
    x: 480,
    y: 40,
  },
  {
    id: 'n4',
    title: 'Update unit tests',
    kind: 'test',
    depsIds: ['n3'],
    etaMin: 30,
    status: 'todo',
    notes: '',
    x: 700,
    y: 40,
  },
  {
    id: 'n5',
    title: 'Run tsc + lint',
    kind: 'verify',
    depsIds: ['n3', 'n4'],
    etaMin: 10,
    status: 'todo',
    notes: '',
    x: 920,
    y: 40,
  },
  {
    id: 'n6',
    title: 'Bench checkout p95',
    kind: 'verify',
    depsIds: ['n3'],
    etaMin: 20,
    status: 'blocked',
    notes: 'Blocked: needs staging access.',
    x: 700,
    y: 160,
  },
  {
    id: 'n7',
    title: 'Open PR + request review',
    kind: 'deploy',
    depsIds: ['n5', 'n6'],
    etaMin: 8,
    status: 'todo',
    notes: '',
    x: 920,
    y: 160,
  },
  {
    id: 'n8',
    title: 'Stage rollout 10% → 100%',
    kind: 'deploy',
    depsIds: ['n7'],
    etaMin: 60,
    status: 'todo',
    notes: 'Use feature flag cart_v2.',
    x: 1140,
    y: 160,
  },
];

export function kindFill(k: NodeKind): string {
  switch (k) {
    case 'research':
      return 'fill-sev-info-soft stroke-sev-info';
    case 'edit':
      return 'fill-accent-soft stroke-accent';
    case 'test':
      return 'fill-sem-isr-soft stroke-sem-isr';
    case 'verify':
      return 'fill-sev-warn-soft stroke-sev-warn';
    case 'deploy':
      return 'fill-sem-edge-soft stroke-sem-edge';
  }
}

export function kindLabelClass(k: NodeKind): string {
  switch (k) {
    case 'research':
      return 'fill-sev-info';
    case 'edit':
      return 'fill-accent';
    case 'test':
      return 'fill-sem-isr';
    case 'verify':
      return 'fill-sev-warn';
    case 'deploy':
      return 'fill-sem-edge';
  }
}

export function statusTone(s: NodeStatus): 'muted' | 'accent' | 'info' | 'err' {
  switch (s) {
    case 'todo':
      return 'muted';
    case 'doing':
      return 'accent';
    case 'done':
      return 'info';
    case 'blocked':
      return 'err';
  }
}

export function totalEtaMin(nodes: ReadonlyArray<PlanNode>): number {
  return nodes.reduce((acc, n) => acc + n.etaMin, 0);
}
