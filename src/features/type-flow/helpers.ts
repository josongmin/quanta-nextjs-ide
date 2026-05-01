import type { CodeSymbolKind } from '@entities/code-symbol';

export type SerializationRisk = 'Date' | 'Function' | 'Map' | 'Set' | 'Decimal' | 'Buffer';

export interface FlowField {
  name: string;
  type: string;
  risk?: SerializationRisk;
  exposed?: boolean;
}

export interface FlowStage {
  label: string;
  symbol: string;
  file: string;
  description: string;
  fields: FlowField[];
}

export interface FlowIssue {
  severity: 'warn' | 'err' | 'info';
  message: string;
  detail?: string;
}

/**
 * Subset of {@link CodeSymbolKind} the type-flow visualization handles.
 * Aligned to the canonical entity to prevent type drift.
 */
export type TypeFlowKind = Extract<CodeSymbolKind, 'function' | 'type'>;

export interface SymbolFlow {
  id: string;
  label: string;
  kind: TypeFlowKind;
  source: FlowStage;
  server: FlowStage;
  client: FlowStage;
  issues: FlowIssue[];
}

export const symbolFlows: readonly SymbolFlow[] = [
  {
    id: 'getProduct',
    label: 'getProduct(id)',
    kind: 'function',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.Product',
      file: 'prisma/schema.prisma',
      description: 'Database row',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'price', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
        { name: 'inventory', type: 'Map<string,number>', risk: 'Map' },
        { name: 'internalCost', type: 'Decimal', exposed: true, risk: 'Decimal' },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'getProduct',
      file: 'lib/data/products.ts',
      description: 'Loader (Server Component / RSC)',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'price', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
        { name: 'inventory', type: 'Map<string,number>', risk: 'Map' },
        { name: 'internalCost', type: 'Decimal', exposed: true },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: '<ProductCard product={…} />',
      file: 'components/ProductCard.client.tsx',
      description: 'Receives full row (no DTO)',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'price', type: 'string', risk: 'Decimal' },
        { name: 'createdAt', type: 'string', risk: 'Date' },
        { name: 'inventory', type: '{}', risk: 'Map' },
        { name: 'internalCost', type: 'string', exposed: true },
      ],
    },
    issues: [
      {
        severity: 'err',
        message: 'Prisma.Product passed directly to <ProductCard/>',
        detail: 'Exposes internalCost — never shown in UI but ships in HTML.',
      },
      {
        severity: 'warn',
        message: 'Decimal serialized as string',
        detail: 'price/internalCost lose precision when re-parsed on client.',
      },
      {
        severity: 'warn',
        message: 'Map<> becomes empty object after JSON serialization',
      },
    ],
  },
  {
    id: 'getSession',
    label: 'getSession()',
    kind: 'function',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.User',
      file: 'prisma/schema.prisma',
      description: 'User row + tokens',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string', exposed: true },
        { name: 'passwordHash', type: 'string', exposed: true },
        { name: 'role', type: 'enum' },
        { name: 'lastLogin', type: 'Date', risk: 'Date' },
        { name: 'internalNotes', type: 'string', exposed: true },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'getSession',
      file: 'lib/auth/session.ts',
      description: 'Reads cookies(), loads user',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string', exposed: true },
        { name: 'passwordHash', type: 'string', exposed: true },
        { name: 'role', type: 'enum' },
        { name: 'lastLogin', type: 'Date', risk: 'Date' },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: '<UserMenu user={…} />',
      file: 'components/UserMenu.client.tsx',
      description: 'Receives full session',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string', exposed: true },
        { name: 'passwordHash', type: 'string', exposed: true },
        { name: 'role', type: 'string' },
        { name: 'lastLogin', type: 'string', risk: 'Date' },
      ],
    },
    issues: [
      {
        severity: 'err',
        message: 'Prisma.User passed directly to <UserMenu/> — exposes passwordHash, internalNotes',
        detail: 'Strip via toUserDTO() before crossing boundary.',
      },
      {
        severity: 'warn',
        message: 'lastLogin (Date) serialized as ISO string',
      },
    ],
  },
  {
    id: 'getOrders',
    label: 'getOrders()',
    kind: 'function',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.Order',
      file: 'prisma/schema.prisma',
      description: 'Order rows + line items',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
        { name: 'updateFn', type: '() => Promise<Order>', risk: 'Function' },
        { name: 'items', type: 'Set<LineItem>', risk: 'Set' },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'getOrders',
      file: 'lib/data/orders.ts',
      description: 'Returns array of orders',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
        { name: 'updateFn', type: '() => …', risk: 'Function' },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: '<OrdersTable orders={…} />',
      file: 'components/OrdersTable.client.tsx',
      description: 'Renders interactive table',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'string', risk: 'Decimal' },
        { name: 'createdAt', type: 'string', risk: 'Date' },
        { name: 'updateFn', type: 'undefined', risk: 'Function' },
      ],
    },
    issues: [
      {
        severity: 'err',
        message: 'Function `updateFn` cannot be serialized',
        detail: 'Will be undefined on client. Move to a server action instead.',
      },
      {
        severity: 'warn',
        message: 'Set<> drops after JSON serialization',
      },
    ],
  },
  {
    id: 'User',
    label: 'User',
    kind: 'type',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.User',
      file: 'prisma/schema.prisma',
      description: 'Generated by Prisma',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string', exposed: true },
        { name: 'passwordHash', type: 'string', exposed: true },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'User',
      file: 'lib/types/user.ts',
      description: 'Re-exported from prisma client',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'email', type: 'string', exposed: true },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: 'UserDTO',
      file: 'lib/types/user-dto.ts',
      description: 'Should be derived via Pick<>',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'displayName', type: 'string' },
      ],
    },
    issues: [
      {
        severity: 'info',
        message: 'No DTO exists — use Pick<User, "id" | "displayName">',
      },
    ],
  },
  {
    id: 'OrderDTO',
    label: 'OrderDTO',
    kind: 'type',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.Order',
      file: 'prisma/schema.prisma',
      description: 'Order row',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'Decimal', risk: 'Decimal' },
        { name: 'currency', type: 'string' },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'toOrderDTO',
      file: 'lib/types/order-dto.ts',
      description: 'Mapper function',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'string' },
        { name: 'currency', type: 'string' },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: 'OrderDTO',
      file: 'lib/types/order-dto.ts',
      description: 'Plain JSON shape',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'total', type: 'string' },
        { name: 'currency', type: 'string' },
      ],
    },
    issues: [],
  },
  {
    id: 'Product',
    label: 'Product',
    kind: 'type',
    source: {
      label: 'DB / DTO',
      symbol: 'Prisma.Product',
      file: 'prisma/schema.prisma',
      description: 'Generated by Prisma',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'price', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
      ],
    },
    server: {
      label: 'Server boundary',
      symbol: 'Product',
      file: 'lib/types/product.ts',
      description: 'Re-exported',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'price', type: 'Decimal', risk: 'Decimal' },
        { name: 'createdAt', type: 'Date', risk: 'Date' },
      ],
    },
    client: {
      label: 'Client boundary',
      symbol: 'Product',
      file: 'components/ProductCard.client.tsx',
      description: 'Used as prop type',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'price', type: 'string', risk: 'Decimal' },
        { name: 'createdAt', type: 'string', risk: 'Date' },
      ],
    },
    issues: [
      {
        severity: 'warn',
        message: 'Type defined on server but consumed on client without DTO',
      },
    ],
  },
] as const;

export function findFlow(id: string | undefined): SymbolFlow {
  return symbolFlows.find((s) => s.id === id) ?? symbolFlows[0]!;
}

export function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}
