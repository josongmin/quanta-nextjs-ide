export type MutantStatus = 'killed' | 'survived' | 'timeout' | 'noCoverage';
export type Mutator =
  | 'BinOp →/-'
  | 'BinOp +/-'
  | 'BoolNeg'
  | 'LiteralReplace'
  | 'CondBoundary'
  | 'ReturnVoid';

export interface Mutant {
  id: string;
  file: string;
  line: number;
  mutator: Mutator;
  status: MutantStatus;
  description: string;
  before: string;
  after: string;
}

export interface FileMutation {
  file: string;
  mutants: ReadonlyArray<Mutant>;
  history: ReadonlyArray<number>; // last 5 kill ratios (0..1)
}

export const fileMutations: ReadonlyArray<FileMutation> = [
  {
    file: 'src/lib/cart.ts',
    history: [0.7, 0.72, 0.74, 0.76, 0.8],
    mutants: [
      {
        id: 'm_cart_1',
        file: 'src/lib/cart.ts',
        line: 5,
        mutator: 'BinOp +/-',
        status: 'killed',
        description: 'Replaced += with -=',
        before: 'existing.qty += item.qty;',
        after: 'existing.qty -= item.qty;',
      },
      {
        id: 'm_cart_2',
        file: 'src/lib/cart.ts',
        line: 13,
        mutator: 'BoolNeg',
        status: 'survived',
        description: 'Negated filter predicate',
        before: 'i => i.id !== id',
        after: 'i => i.id === id',
      },
      {
        id: 'm_cart_3',
        file: 'src/lib/cart.ts',
        line: 18,
        mutator: 'BinOp →/-',
        status: 'killed',
        description: 'Replaced * with /',
        before: 's + i.price * i.qty',
        after: 's + i.price / i.qty',
      },
      {
        id: 'm_cart_4',
        file: 'src/lib/cart.ts',
        line: 22,
        mutator: 'LiteralReplace',
        status: 'noCoverage',
        description: 'Replaced "SUMMER10" with ""',
        before: 'code === "SUMMER10"',
        after: 'code === ""',
      },
      {
        id: 'm_cart_5',
        file: 'src/lib/cart.ts',
        line: 23,
        mutator: 'LiteralReplace',
        status: 'survived',
        description: 'Replaced 0.2 with 0',
        before: 'cart.discount = 0.2',
        after: 'cart.discount = 0',
      },
    ],
  },
  {
    file: 'src/server/checkout.ts',
    history: [0.55, 0.6, 0.62, 0.66, 0.72],
    mutants: [
      {
        id: 'm_co_1',
        file: 'src/server/checkout.ts',
        line: 2,
        mutator: 'BoolNeg',
        status: 'killed',
        description: 'Negated email check',
        before: '!user.email',
        after: 'user.email',
      },
      {
        id: 'm_co_2',
        file: 'src/server/checkout.ts',
        line: 5,
        mutator: 'CondBoundary',
        status: 'survived',
        description: 'Replaced !== with ===',
        before: 'charge.status !== "ok"',
        after: 'charge.status === "ok"',
      },
      {
        id: 'm_co_3',
        file: 'src/server/checkout.ts',
        line: 8,
        mutator: 'ReturnVoid',
        status: 'killed',
        description: 'Replaced return with undefined',
        before: 'return await db.orders.insert(...)',
        after: 'return undefined',
      },
      {
        id: 'm_co_4',
        file: 'src/server/checkout.ts',
        line: 6,
        mutator: 'LiteralReplace',
        status: 'timeout',
        description: 'Replaced error message',
        before: '"charge_failed"',
        after: '""',
      },
    ],
  },
  {
    file: 'src/utils/format.ts',
    history: [0.9, 0.92, 0.94, 0.95, 1.0],
    mutants: [
      {
        id: 'm_fmt_1',
        file: 'src/utils/format.ts',
        line: 5,
        mutator: 'BinOp →/-',
        status: 'killed',
        description: 'Replaced * with /',
        before: 'n * 100',
        after: 'n / 100',
      },
      {
        id: 'm_fmt_2',
        file: 'src/utils/format.ts',
        line: 5,
        mutator: 'LiteralReplace',
        status: 'killed',
        description: 'Replaced "%" with ""',
        before: '`${(n * 100).toFixed(0)}%`',
        after: '`${(n * 100).toFixed(0)}`',
      },
    ],
  },
  {
    file: 'src/components/ProductCard.tsx',
    history: [0.5, 0.5, 0.55, 0.58, 0.6],
    mutants: [
      {
        id: 'm_pc_1',
        file: 'src/components/ProductCard.tsx',
        line: 2,
        mutator: 'BoolNeg',
        status: 'survived',
        description: 'Replaced != null with == null',
        before: 'product.salePrice != null',
        after: 'product.salePrice == null',
      },
      {
        id: 'm_pc_2',
        file: 'src/components/ProductCard.tsx',
        line: 6,
        mutator: 'CondBoundary',
        status: 'survived',
        description: 'Always-true ternary',
        before: 'sale ? money(...) : money(...)',
        after: 'true ? money(...) : money(...)',
      },
      {
        id: 'm_pc_3',
        file: 'src/components/ProductCard.tsx',
        line: 7,
        mutator: 'ReturnVoid',
        status: 'killed',
        description: 'Removed onClick handler',
        before: 'onClick={() => onAdd(product)}',
        after: 'onClick={() => undefined}',
      },
      {
        id: 'm_pc_4',
        file: 'src/components/ProductCard.tsx',
        line: 5,
        mutator: 'LiteralReplace',
        status: 'survived',
        description: 'Replaced product.name with ""',
        before: '{product.name}',
        after: '""',
      },
    ],
  },
  {
    file: 'src/server/auth.ts',
    history: [0.85, 0.88, 0.9, 0.92, 0.95],
    mutants: [
      {
        id: 'm_au_1',
        file: 'src/server/auth.ts',
        line: 3,
        mutator: 'BoolNeg',
        status: 'killed',
        description: 'Negated user existence',
        before: '!user',
        after: 'user',
      },
      {
        id: 'm_au_2',
        file: 'src/server/auth.ts',
        line: 4,
        mutator: 'BoolNeg',
        status: 'killed',
        description: 'Negated verify',
        before: '!verify(user, password)',
        after: 'verify(user, password)',
      },
      {
        id: 'm_au_3',
        file: 'src/server/auth.ts',
        line: 5,
        mutator: 'ReturnVoid',
        status: 'survived',
        description: 'Return null instead of token',
        before: 'return token(user)',
        after: 'return null',
      },
    ],
  },
  {
    file: 'src/lib/flags.ts',
    history: [0.4, 0.4, 0.45, 0.5, 0.5],
    mutants: [
      {
        id: 'm_fl_1',
        file: 'src/lib/flags.ts',
        line: 3,
        mutator: 'BoolNeg',
        status: 'survived',
        description: 'Replaced !f with f',
        before: '!f',
        after: 'f',
      },
      {
        id: 'm_fl_2',
        file: 'src/lib/flags.ts',
        line: 4,
        mutator: 'CondBoundary',
        status: 'survived',
        description: 'Replaced < with <=',
        before: 'f.expiresAt < Date.now()',
        after: 'f.expiresAt <= Date.now()',
      },
      {
        id: 'm_fl_3',
        file: 'src/lib/flags.ts',
        line: 5,
        mutator: 'BoolNeg',
        status: 'killed',
        description: 'Replaced enabled with !enabled',
        before: 'return f.enabled',
        after: 'return !f.enabled',
      },
      {
        id: 'm_fl_4',
        file: 'src/lib/flags.ts',
        line: 4,
        mutator: 'BoolNeg',
        status: 'noCoverage',
        description: 'Removed expiresAt guard',
        before: 'f.expiresAt && ...',
        after: 'true && ...',
      },
    ],
  },
];

export function killRatio(f: FileMutation): number {
  if (f.mutants.length === 0) return 0;
  const killed = f.mutants.filter((m) => m.status === 'killed').length;
  return killed / f.mutants.length;
}

export function survivedCount(f: FileMutation): number {
  return f.mutants.filter((m) => m.status === 'survived').length;
}

export function totalKillRatio(): number {
  let killed = 0;
  let total = 0;
  for (const f of fileMutations) {
    for (const m of f.mutants) {
      total += 1;
      if (m.status === 'killed') killed += 1;
    }
  }
  if (total === 0) return 0;
  return killed / total;
}

export function mutatorBreakdown(
  f: FileMutation,
): ReadonlyArray<{ mutator: Mutator; count: number }> {
  const map = new Map<Mutator, number>();
  for (const m of f.mutants) {
    map.set(m.mutator, (map.get(m.mutator) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([mutator, count]) => ({ mutator, count }));
}
