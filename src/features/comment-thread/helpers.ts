export type ThreadStatus = 'open' | 'resolved' | 'outdated';

export interface Reaction {
  emoji: string;
  count: number;
}

export interface Post {
  author: string;
  body: string;
  ts: string; // relative
}

export interface Thread {
  id: string;
  file: string;
  line: number;
  status: ThreadStatus;
  author: string;
  posts: ReadonlyArray<Post>;
  reactions: ReadonlyArray<Reaction>;
}

export const THREADS: ReadonlyArray<Thread> = [
  {
    id: 't1',
    file: 'app/(shop)/cart/page.tsx',
    line: 42,
    status: 'open',
    author: 'Avery Chen',
    posts: [
      {
        author: 'Avery Chen',
        body: 'Should we **memoize** the totals here? Re-renders feel chunky on slow devices.',
        ts: '2h',
      },
      {
        author: 'Bao Nguyen',
        body: 'Agreed — `useMemo` is fine, the deps array is stable.',
        ts: '1h',
      },
    ],
    reactions: [{ emoji: '👍', count: 3 }, { emoji: '🚀', count: 1 }],
  },
  {
    id: 't2',
    file: 'app/(shop)/cart/page.tsx',
    line: 88,
    status: 'open',
    author: 'Cleo Diaz',
    posts: [
      {
        author: 'Cleo Diaz',
        body: 'The empty-cart copy doesn’t match the spec — should be _"Your cart is empty"_ not _"No items"_.',
        ts: '4h',
      },
    ],
    reactions: [{ emoji: '👀', count: 2 }],
  },
  {
    id: 't3',
    file: 'app/api/orders/route.ts',
    line: 17,
    status: 'open',
    author: 'Bao Nguyen',
    posts: [
      {
        author: 'Bao Nguyen',
        body: 'We need to validate the `customerId` here — no schema check yet.',
        ts: '6h',
      },
      {
        author: 'Avery Chen',
        body: 'Want me to drop in a zod schema?',
        ts: '5h',
      },
      {
        author: 'Bao Nguyen',
        body: 'Yes please — match the one in `entities/order`.',
        ts: '5h',
      },
    ],
    reactions: [{ emoji: '✅', count: 2 }],
  },
  {
    id: 't4',
    file: 'app/api/orders/route.ts',
    line: 64,
    status: 'resolved',
    author: 'Dani Park',
    posts: [
      {
        author: 'Dani Park',
        body: 'Repro: when discount > total, response returns NaN.',
        ts: '1d',
      },
      {
        author: 'Bao Nguyen',
        body: 'Fixed — clamp at 0 in `applyDiscount`.',
        ts: '23h',
      },
    ],
    reactions: [{ emoji: '🙌', count: 4 }],
  },
  {
    id: 't5',
    file: 'app/(marketing)/page.tsx',
    line: 12,
    status: 'open',
    author: 'Cleo Diaz',
    posts: [
      {
        author: 'Cleo Diaz',
        body: 'Hero CTA tracking event name is wrong — `cta_click` vs `hero_cta_click` everywhere else.',
        ts: '3h',
      },
    ],
    reactions: [],
  },
  {
    id: 't6',
    file: 'app/(marketing)/page.tsx',
    line: 38,
    status: 'outdated',
    author: 'Farah Lin',
    posts: [
      {
        author: 'Farah Lin',
        body: 'Old layout had a footer here — no longer applies after the redesign.',
        ts: '3d',
      },
    ],
    reactions: [{ emoji: '🕒', count: 1 }],
  },
  {
    id: 't7',
    file: 'entities/user/queries.ts',
    line: 23,
    status: 'open',
    author: 'Ezra Patel',
    posts: [
      {
        author: 'Ezra Patel',
        body: 'This query fans out to 4 tables — can we move it to a single view?',
        ts: '8h',
      },
      {
        author: 'Bao Nguyen',
        body: 'Yes, but let’s wait until the migration tier lands.',
        ts: '7h',
      },
    ],
    reactions: [{ emoji: '🤔', count: 2 }],
  },
  {
    id: 't8',
    file: 'entities/user/queries.ts',
    line: 71,
    status: 'resolved',
    author: 'Avery Chen',
    posts: [
      {
        author: 'Avery Chen',
        body: 'N+1 risk — addressed via `dataloader` wrapper.',
        ts: '2d',
      },
    ],
    reactions: [{ emoji: '👍', count: 1 }],
  },
];

export const ME = 'Avery Chen';

export type ThreadFilter = 'open' | 'resolved' | 'mine' | 'mentions';

export function filterThreads(
  threads: ReadonlyArray<Thread>,
  filter: ThreadFilter,
): ReadonlyArray<Thread> {
  switch (filter) {
    case 'open':
      return threads.filter((t) => t.status === 'open');
    case 'resolved':
      return threads.filter((t) => t.status === 'resolved');
    case 'mine':
      return threads.filter(
        (t) => t.author === ME || t.posts.some((p) => p.author === ME),
      );
    case 'mentions':
      return threads.filter((t) =>
        t.posts.some((p) => p.body.includes('@me') || p.body.includes(ME)),
      );
  }
}
