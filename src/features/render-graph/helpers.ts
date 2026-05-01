import type { Archetype, Route } from '@shared/types';

export type RenderRole = 'server' | 'client';

export interface GraphNode {
  id: string;
  name: string;
  role: RenderRole;
  file: string;
  isRoot?: boolean;
  hotspot?: { rerenders: number; reason: string };
  parentId?: string;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
}

export interface RenderGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routeId: string;
}

interface ChildSpec {
  name: string;
  role: RenderRole;
  file: string;
  hotspot?: { rerenders: number; reason: string };
  children?: ChildSpec[];
}

const archetypeChildren: Record<Archetype, ChildSpec[]> = {
  marketing: [
    {
      name: 'Hero',
      role: 'server',
      file: 'components/Hero.tsx',
      children: [
        { name: 'CTA', role: 'client', file: 'components/CTA.tsx' },
      ],
    },
    { name: 'FeatureGrid', role: 'server', file: 'components/FeatureGrid.tsx' },
    { name: 'Testimonials', role: 'server', file: 'components/Testimonials.tsx' },
    {
      name: 'NewsletterForm',
      role: 'client',
      file: 'components/NewsletterForm.client.tsx',
      hotspot: { rerenders: 8, reason: 'state on every keystroke' },
    },
    { name: 'Footer', role: 'server', file: 'components/Footer.tsx' },
    {
      name: 'AnalyticsBeacon',
      role: 'client',
      file: 'components/AnalyticsBeacon.client.tsx',
    },
  ],
  'commerce.list': [
    {
      name: 'ProductFilters',
      role: 'client',
      file: 'components/ProductFilters.client.tsx',
      hotspot: { rerenders: 22, reason: 'subscribes to URL search params' },
    },
    {
      name: 'ProductGrid',
      role: 'server',
      file: 'components/ProductGrid.tsx',
      children: [
        { name: 'ProductCard', role: 'server', file: 'components/ProductCard.tsx' },
        {
          name: 'AddToCartButton',
          role: 'client',
          file: 'components/AddToCartButton.client.tsx',
        },
      ],
    },
    { name: 'SortControl', role: 'client', file: 'components/SortControl.client.tsx' },
    { name: 'Pagination', role: 'server', file: 'components/Pagination.tsx' },
    { name: 'EmptyState', role: 'server', file: 'components/EmptyState.tsx' },
  ],
  'commerce.product-detail': [
    { name: 'Breadcrumbs', role: 'server', file: 'components/Breadcrumbs.tsx' },
    {
      name: 'ProductGallery',
      role: 'client',
      file: 'components/ProductGallery.client.tsx',
      hotspot: { rerenders: 14, reason: 'image swap on hover/zoom' },
    },
    {
      name: 'ProductInfo',
      role: 'server',
      file: 'components/ProductInfo.tsx',
      children: [
        { name: 'PriceTag', role: 'server', file: 'components/PriceTag.tsx' },
        {
          name: 'VariantSelector',
          role: 'client',
          file: 'components/VariantSelector.client.tsx',
          hotspot: { rerenders: 9, reason: 'variant change recomputes price' },
        },
      ],
    },
    {
      name: 'AddToCart',
      role: 'client',
      file: 'components/AddToCart.client.tsx',
    },
    { name: 'Reviews', role: 'server', file: 'components/Reviews.tsx' },
    {
      name: 'ReviewForm',
      role: 'client',
      file: 'components/ReviewForm.client.tsx',
    },
    { name: 'RelatedProducts', role: 'server', file: 'components/RelatedProducts.tsx' },
    {
      name: 'StickyBuyBar',
      role: 'client',
      file: 'components/StickyBuyBar.client.tsx',
      hotspot: { rerenders: 30, reason: 'scroll-driven visibility' },
    },
    { name: 'Specs', role: 'server', file: 'components/Specs.tsx' },
  ],
  'commerce.cart': [
    {
      name: 'CartList',
      role: 'client',
      file: 'components/CartList.client.tsx',
      hotspot: { rerenders: 12, reason: 'cart store subscription' },
    },
    {
      name: 'CartItem',
      role: 'client',
      file: 'components/CartItem.client.tsx',
    },
    { name: 'CartSummary', role: 'server', file: 'components/CartSummary.tsx' },
    {
      name: 'CouponInput',
      role: 'client',
      file: 'components/CouponInput.client.tsx',
    },
    { name: 'CheckoutButton', role: 'client', file: 'components/CheckoutButton.client.tsx' },
  ],
  'commerce.checkout': [
    {
      name: 'CheckoutForm',
      role: 'client',
      file: 'components/CheckoutForm.client.tsx',
      hotspot: { rerenders: 41, reason: 'form fields re-validate on each change' },
    },
    { name: 'OrderSummary', role: 'server', file: 'components/OrderSummary.tsx' },
    {
      name: 'StripeElements',
      role: 'client',
      file: 'components/StripeElements.client.tsx',
    },
    { name: 'AddressBlock', role: 'client', file: 'components/AddressBlock.client.tsx' },
    { name: 'TermsNotice', role: 'server', file: 'components/TermsNotice.tsx' },
  ],
  admin: [
    { name: 'AdminHeader', role: 'server', file: 'components/AdminHeader.tsx' },
    {
      name: 'DataTable',
      role: 'client',
      file: 'components/DataTable.client.tsx',
      hotspot: { rerenders: 18, reason: 'sort/filter state' },
    },
    { name: 'TableRow', role: 'server', file: 'components/TableRow.tsx' },
    { name: 'TableToolbar', role: 'client', file: 'components/TableToolbar.client.tsx' },
    { name: 'BulkActions', role: 'client', file: 'components/BulkActions.client.tsx' },
    { name: 'Pagination', role: 'server', file: 'components/Pagination.tsx' },
  ],
  account: [
    { name: 'AccountTabs', role: 'client', file: 'components/AccountTabs.client.tsx' },
    { name: 'ProfileForm', role: 'client', file: 'components/ProfileForm.client.tsx' },
    { name: 'OrderHistory', role: 'server', file: 'components/OrderHistory.tsx' },
    { name: 'PaymentMethods', role: 'server', file: 'components/PaymentMethods.tsx' },
    {
      name: 'NotificationToggles',
      role: 'client',
      file: 'components/NotificationToggles.client.tsx',
      hotspot: { rerenders: 6, reason: 'optimistic updates on toggle' },
    },
  ],
  dashboard: [
    {
      name: 'Sidebar',
      role: 'server',
      file: 'components/Sidebar.tsx',
      children: [
        { name: 'NavItem', role: 'client', file: 'components/NavItem.client.tsx' },
      ],
    },
    {
      name: 'KpiRow',
      role: 'server',
      file: 'components/KpiRow.tsx',
      children: [
        { name: 'KpiCard', role: 'server', file: 'components/KpiCard.tsx' },
      ],
    },
    {
      name: 'ChartPanel',
      role: 'client',
      file: 'components/ChartPanel.client.tsx',
      hotspot: { rerenders: 27, reason: 'live data poll every 5s' },
    },
    { name: 'RecentActivity', role: 'server', file: 'components/RecentActivity.tsx' },
    { name: 'AlertsBell', role: 'client', file: 'components/AlertsBell.client.tsx' },
    { name: 'ProfileMenu', role: 'client', file: 'components/ProfileMenu.client.tsx' },
  ],
  auth: [
    { name: 'AuthForm', role: 'client', file: 'components/AuthForm.client.tsx' },
    { name: 'OAuthButtons', role: 'client', file: 'components/OAuthButtons.client.tsx' },
    { name: 'TermsLink', role: 'server', file: 'components/TermsLink.tsx' },
  ],
  blog: [
    { name: 'PostHeader', role: 'server', file: 'components/PostHeader.tsx' },
    { name: 'PostBody', role: 'server', file: 'components/PostBody.tsx' },
    { name: 'TableOfContents', role: 'client', file: 'components/TableOfContents.client.tsx' },
    {
      name: 'CommentBox',
      role: 'client',
      file: 'components/CommentBox.client.tsx',
      hotspot: { rerenders: 10, reason: 'textarea controlled state' },
    },
    { name: 'RelatedPosts', role: 'server', file: 'components/RelatedPosts.tsx' },
  ],
  docs: [
    { name: 'DocsSidebar', role: 'server', file: 'components/DocsSidebar.tsx' },
    { name: 'DocBody', role: 'server', file: 'components/DocBody.tsx' },
    { name: 'CodeBlock', role: 'client', file: 'components/CodeBlock.client.tsx' },
    { name: 'SearchBar', role: 'client', file: 'components/SearchBar.client.tsx' },
  ],
  api: [
    { name: 'RouteHandler', role: 'server', file: 'app/api/route.ts' },
    { name: 'RequestParser', role: 'server', file: 'lib/request-parser.ts' },
    { name: 'ResponseWriter', role: 'server', file: 'lib/response-writer.ts' },
  ],
  webhook: [
    { name: 'WebhookHandler', role: 'server', file: 'app/api/webhook/route.ts' },
    { name: 'SignatureVerify', role: 'server', file: 'lib/sig-verify.ts' },
    { name: 'EventDispatch', role: 'server', file: 'lib/event-dispatch.ts' },
  ],
  unknown: [
    { name: 'Container', role: 'server', file: 'components/Container.tsx' },
    { name: 'Content', role: 'server', file: 'components/Content.tsx' },
    { name: 'Sidebar', role: 'client', file: 'components/Sidebar.client.tsx' },
  ],
};

function rootName(route: Route): string {
  const seg = route.segments[route.segments.length - 1] ?? 'Page';
  const cleaned = seg.replace(/[\[\](){}.@]/g, '').replace(/^/, (c) => c);
  if (!cleaned) return 'Page';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + 'Page';
}

function flatten(
  parentId: string,
  specs: ChildSpec[] | undefined,
  acc: { nodes: GraphNode[]; edges: GraphEdge[] },
): void {
  if (!specs) return;
  for (const spec of specs) {
    const id = `${parentId}__${spec.name}`;
    acc.nodes.push({
      id,
      name: spec.name,
      role: spec.role,
      file: spec.file,
      hotspot: spec.hotspot,
      parentId,
    });
    acc.edges.push({ fromId: parentId, toId: id });
    flatten(id, spec.children, acc);
  }
}

export function getRenderGraph(route: Route): RenderGraph {
  const rootId = `${route.id}__root`;
  const acc: { nodes: GraphNode[]; edges: GraphEdge[] } = {
    nodes: [
      {
        id: rootId,
        name: rootName(route),
        role: 'server',
        file: route.files.page ?? `app${route.path}/page.tsx`,
        isRoot: true,
      },
    ],
    edges: [],
  };
  const children = archetypeChildren[route.archetype] ?? archetypeChildren.unknown;
  flatten(rootId, children, acc);
  return { nodes: acc.nodes, edges: acc.edges, routeId: route.id };
}

export function nodeChildren(graph: RenderGraph, id: string): GraphNode[] {
  return graph.nodes.filter((n) => n.parentId === id);
}

export function nodeParent(graph: RenderGraph, id: string): GraphNode | undefined {
  const parent = graph.nodes.find((n) => n.id === id);
  if (!parent?.parentId) return undefined;
  return graph.nodes.find((n) => n.id === parent.parentId);
}

export type GraphFilter = 'all' | 'server' | 'client' | 'hotspots';

export function applyFilter(
  graph: RenderGraph,
  filter: GraphFilter,
): Set<string> {
  const visible = new Set<string>();
  for (const n of graph.nodes) {
    const match =
      filter === 'all' ||
      (filter === 'server' && n.role === 'server') ||
      (filter === 'client' && n.role === 'client') ||
      (filter === 'hotspots' && Boolean(n.hotspot));
    if (n.isRoot || match) visible.add(n.id);
  }
  return visible;
}

export interface NodeLayout {
  id: string;
  x: number;
  y: number;
}

export interface GraphLayout {
  nodes: NodeLayout[];
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  rowGap: number;
  colGap: number;
}

export function layoutGraph(
  graph: RenderGraph,
  visible: Set<string>,
): GraphLayout {
  const nodeWidth = 132;
  const nodeHeight = 38;
  const rowGap = 28;
  const colGap = 14;

  // Group nodes by depth (distance from root).
  const depth = new Map<string, number>();
  for (const node of graph.nodes) {
    let d = 0;
    let curId: string | undefined = node.id;
    while (curId) {
      const cur = graph.nodes.find((n) => n.id === curId);
      if (!cur || !cur.parentId) break;
      curId = cur.parentId;
      d += 1;
    }
    depth.set(node.id, d);
  }

  const byDepth: GraphNode[][] = [];
  for (const node of graph.nodes) {
    if (!visible.has(node.id)) continue;
    const d = depth.get(node.id) ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d]!.push(node);
  }

  const layoutNodes: NodeLayout[] = [];
  let maxRowWidth = 0;
  byDepth.forEach((row, d) => {
    const rowWidth = row.length * nodeWidth + (row.length - 1) * colGap;
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
    const startX = -rowWidth / 2 + nodeWidth / 2;
    row.forEach((node, idx) => {
      layoutNodes.push({
        id: node.id,
        x: startX + idx * (nodeWidth + colGap),
        y: d * (nodeHeight + rowGap),
      });
    });
  });

  const width = Math.max(maxRowWidth + 40, 480);
  const height = byDepth.length * (nodeHeight + rowGap);
  return {
    nodes: layoutNodes,
    width,
    height,
    nodeWidth,
    nodeHeight,
    rowGap,
    colGap,
  };
}

export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}

export function jumpTabId(file: string): string {
  return `tab-${file}`;
}

export const FILTERS: { id: GraphFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'server', label: 'Server' },
  { id: 'client', label: 'Client' },
  { id: 'hotspots', label: 'Hotspots' },
];

export function truncateName(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
