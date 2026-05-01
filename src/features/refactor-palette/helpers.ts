export type RefactorKind =
  | 'extract'
  | 'convert'
  | 'inline'
  | 'surround'
  | 'server'
  | 'client';

export interface RefactorEntry {
  readonly id: string;
  readonly name: string;
  readonly kind: RefactorKind;
  readonly shortcut: ReadonlyArray<string>;
  readonly when: string;
  readonly recentCount: number;
}

export const KIND_TONE: Record<
  RefactorKind,
  'accent' | 'info' | 'static' | 'warn' | 'server' | 'client'
> = {
  extract: 'accent',
  convert: 'info',
  inline: 'static',
  surround: 'warn',
  server: 'server',
  client: 'client',
};

export const KINDS: ReadonlyArray<RefactorKind> = [
  'extract',
  'convert',
  'inline',
  'surround',
  'server',
  'client',
];

export const REFACTORS: ReadonlyArray<RefactorEntry> = [
  {
    id: 'extract-function',
    name: 'Extract function',
    kind: 'extract',
    shortcut: ['⌃', '⇧', 'M'],
    when: 'Selection is a contiguous statement block.',
    recentCount: 14,
  },
  {
    id: 'extract-component',
    name: 'Extract component',
    kind: 'extract',
    shortcut: ['⌃', '⇧', 'C'],
    when: 'Selection contains JSX.',
    recentCount: 9,
  },
  {
    id: 'extract-server-action',
    name: 'Extract Server Action',
    kind: 'server',
    shortcut: ['⌃', '⇧', 'A'],
    when: 'Inside a client form onSubmit doing fetch + db work.',
    recentCount: 5,
  },
  {
    id: 'inline-symbol',
    name: 'Inline symbol',
    kind: 'inline',
    shortcut: ['⌃', '⇧', 'I'],
    when: 'Cursor on a function/const referenced ≤ N callsites.',
    recentCount: 3,
  },
  {
    id: 'move-to-file',
    name: 'Move to file',
    kind: 'extract',
    shortcut: ['F6'],
    when: 'Cursor on top-level declaration.',
    recentCount: 2,
  },
  {
    id: 'convert-to-server',
    name: 'Convert to Server Component',
    kind: 'server',
    shortcut: ['⌃', '⇧', 'S'],
    when: 'Component has no client-only API usage.',
    recentCount: 7,
  },
  {
    id: 'convert-to-client',
    name: 'Convert to Client Component',
    kind: 'client',
    shortcut: ['⌃', '⇧', 'L'],
    when: 'Component needs hooks / events / browser APIs.',
    recentCount: 6,
  },
  {
    id: 'wrap-with-suspense',
    name: 'Wrap with Suspense',
    kind: 'surround',
    shortcut: ['⌃', '⇧', 'U'],
    when: 'Selected JSX contains an async data dep.',
    recentCount: 4,
  },
  {
    id: 'promote-to-route',
    name: 'Promote to route',
    kind: 'server',
    shortcut: ['⌃', '⇧', 'R'],
    when: 'Component used in a single host & has no implicit context.',
    recentCount: 1,
  },
  {
    id: 'rename',
    name: 'Rename symbol',
    kind: 'convert',
    shortcut: ['F2'],
    when: 'Cursor on identifier.',
    recentCount: 22,
  },
  {
    id: 'fn-to-arrow',
    name: 'Convert function to arrow',
    kind: 'convert',
    shortcut: ['⌃', '⇧', 'F'],
    when: 'Cursor on `function …()` declaration.',
    recentCount: 2,
  },
  {
    id: 'arrow-to-fn',
    name: 'Convert arrow to function',
    kind: 'convert',
    shortcut: [],
    when: 'Cursor on arrow assigned to top-level const.',
    recentCount: 0,
  },
  {
    id: 'try-catch',
    name: 'Surround with try/catch',
    kind: 'surround',
    shortcut: ['⌃', '⇧', 'T'],
    when: 'Selection is a statement block.',
    recentCount: 1,
  },
  {
    id: 'if-else',
    name: 'Surround with if/else',
    kind: 'surround',
    shortcut: [],
    when: 'Selection is a statement block.',
    recentCount: 0,
  },
  {
    id: 'toggle-export',
    name: 'Toggle named/default export',
    kind: 'convert',
    shortcut: [],
    when: 'Cursor on top-level export.',
    recentCount: 1,
  },
  {
    id: 'sort-imports',
    name: 'Sort imports',
    kind: 'convert',
    shortcut: ['⌃', '⇧', 'O'],
    when: 'Cursor inside import block.',
    recentCount: 11,
  },
  {
    id: 'add-usememo',
    name: 'Add useMemo',
    kind: 'convert',
    shortcut: [],
    when: 'Cursor on expensive computed value.',
    recentCount: 0,
  },
  {
    id: 'remove-usememo',
    name: 'Remove useMemo if cheap',
    kind: 'convert',
    shortcut: [],
    when: 'Cursor on useMemo whose body is trivial.',
    recentCount: 0,
  },
  {
    id: 'add-usecallback',
    name: 'Add useCallback',
    kind: 'convert',
    shortcut: [],
    when: 'Cursor on inline event handler used as prop.',
    recentCount: 0,
  },
  {
    id: 'pull-up-props',
    name: 'Pull props up',
    kind: 'extract',
    shortcut: [],
    when: 'Selected props duplicated across siblings.',
    recentCount: 0,
  },
  {
    id: 'extract-hook',
    name: 'Extract custom hook',
    kind: 'extract',
    shortcut: ['⌃', '⇧', 'H'],
    when: 'Selection contains hooks-only logic.',
    recentCount: 3,
  },
  {
    id: 'inline-jsx-fragment',
    name: 'Inline JSX fragment',
    kind: 'inline',
    shortcut: [],
    when: 'Cursor on <>…</> with single child.',
    recentCount: 0,
  },
  {
    id: 'wrap-fragment',
    name: 'Wrap with fragment',
    kind: 'surround',
    shortcut: [],
    when: 'Selection is multiple JSX siblings.',
    recentCount: 0,
  },
  {
    id: 'split-component',
    name: 'Split component',
    kind: 'extract',
    shortcut: [],
    when: 'Component exceeds size threshold.',
    recentCount: 0,
  },
];
