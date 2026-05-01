export type CommitStyle = 'concise' | 'detailed' | 'verbose';
export type CommitScope =
  | 'feat'
  | 'fix'
  | 'chore'
  | 'refactor'
  | 'docs'
  | 'perf'
  | 'test';

export interface StagedFile {
  path: string;
  added: number;
  removed: number;
  excerpt: string;
}

const fmt = (s: string): string => s.replace(/^\n/, '').replace(/\n$/, '');

export const STAGED_FILES: ReadonlyArray<StagedFile> = [
  {
    path: 'src/features/route-list/index.tsx',
    added: 32,
    removed: 8,
    excerpt: fmt(`
- export function RouteList({ routes }: Props) {
-   return <ul>{routes.map((r) => <li key={r.path}>{r.path}</li>)}</ul>;
- }
+ export function RouteList({ routes, sortBy }: Props) {
+   const sorted = useMemo(
+     () => [...routes].sort(compareBy(sortBy)),
+     [routes, sortBy],
+   );
+   return (
+     <ul>
+       {sorted.map((r) => (
+         <RouteRow key={r.path} route={r} />
+       ))}
+     </ul>
+   );
+ }
`),
  },
  {
    path: 'src/features/route-list/sort.ts',
    added: 26,
    removed: 0,
    excerpt: fmt(`
+ import type { Route, SortKey } from './types';
+
+ export function compareBy(key: SortKey) {
+   return (a: Route, b: Route): number => {
+     if (key === 'size') return b.sizeKb - a.sizeKb;
+     if (key === 'name') return a.path.localeCompare(b.path);
+     return 0;
+   };
+ }
`),
  },
  {
    path: 'src/widgets/route-list-toolbar/index.tsx',
    added: 18,
    removed: 4,
    excerpt: fmt(`
- <SearchInput value={q} onChange={setQ} />
+ <SearchInput value={q} onChange={setQ} />
+ <SelectControl
+   value={sortBy}
+   options={SORT_OPTIONS}
+   onChange={setSortBy}
+   label="Sort"
+ />
`),
  },
  {
    path: 'src/features/route-list/index.test.tsx',
    added: 8,
    removed: 10,
    excerpt: fmt(`
- it('renders rows', () => { ... });
+ it('renders rows sorted by size', () => {
+   const view = render(<RouteList routes={SAMPLE} sortBy="size" />);
+   expect(view.getAllByRole('listitem')[0]).toHaveTextContent('/big');
+ });
`),
  },
];

export interface CommitTotals {
  files: number;
  added: number;
  removed: number;
}

export function totals(): CommitTotals {
  const t: CommitTotals = { files: STAGED_FILES.length, added: 0, removed: 0 };
  for (const f of STAGED_FILES) {
    t.added += f.added;
    t.removed += f.removed;
  }
  return t;
}

export function buildCommitMessage(
  style: CommitStyle,
  scope: CommitScope,
): string {
  const subject = `${scope}(route-list): sort routes and extract row component`;
  if (style === 'concise') return subject;
  if (style === 'detailed') {
    return [
      subject,
      '',
      '- Add sort key plumbing (size, name) with stable comparators',
      '- Extract RouteRow to keep map() readable and memo-friendly',
      '- Update tests to assert sort-by-size ordering',
    ].join('\n');
  }
  return [
    subject,
    '',
    'Reworks the route list to support a sort key controlled from the toolbar. The previous inline implementation rendered all rows directly inside .map() which made memoization brittle and the component hard to scan.',
    '',
    '- Introduce compareBy(sortBy) returning a stable Route comparator',
    '- Extract RouteRow component for clearer markup and stable identity',
    '- Wire SelectControl in the toolbar to drive sortBy state',
    '- Update unit tests to assert sort-by-size ordering',
  ].join('\n');
}

export function splitMessageIntoChunks(msg: string): string[] {
  // Split keeping line breaks as their own chunks for nice streaming.
  const out: string[] = [];
  for (const line of msg.split('\n')) {
    const words = line.split(/\s+/).filter(Boolean);
    let i = 0;
    while (i < words.length) {
      const size = 3 + (i % 4); // 3..6 words
      const end = Math.min(words.length, i + size);
      out.push(words.slice(i, end).join(' ') + ' ');
      i = end;
    }
    out.push('\n');
  }
  // Trim trailing newline chunk.
  if (out.length > 0 && out[out.length - 1] === '\n') out.pop();
  return out;
}

export const SCOPE_OPTIONS: ReadonlyArray<{ value: CommitScope; label: string }> = [
  { value: 'feat', label: 'feat' },
  { value: 'fix', label: 'fix' },
  { value: 'chore', label: 'chore' },
  { value: 'refactor', label: 'refactor' },
  { value: 'docs', label: 'docs' },
  { value: 'perf', label: 'perf' },
  { value: 'test', label: 'test' },
];
