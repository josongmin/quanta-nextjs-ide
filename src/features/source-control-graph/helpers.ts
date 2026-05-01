export type BranchName =
  | 'main'
  | 'feat/audit-log'
  | 'bug/hydration'
  | 'release/0.4';

export interface FileChange {
  path: string;
  added: number;
  removed: number;
}

export interface Commit {
  sha: string;
  parents: ReadonlyArray<string>;
  branch: BranchName;
  author: string;
  ts: number;
  message: string;
  filesChanged: ReadonlyArray<FileChange>;
}

export const BRANCHES: ReadonlyArray<BranchName> = [
  'main',
  'feat/audit-log',
  'bug/hydration',
  'release/0.4',
];

export const BRANCH_LANES: Record<BranchName, number> = {
  main: 0,
  'release/0.4': 1,
  'feat/audit-log': 2,
  'bug/hydration': 3,
};

export const BRANCH_COLOR: Record<BranchName, string> = {
  main: '#5b8def',
  'release/0.4': '#7c3aed',
  'feat/audit-log': '#10a37f',
  'bug/hydration': '#e0851d',
};

export const AUTHORS: ReadonlyArray<string> = [
  'songmin',
  'kara',
  'priya',
  'tomo',
  'vikram',
];

const NOW = 1_730_000_000_000;

function ts(minutesAgo: number): number {
  return NOW - minutesAgo * 60_000;
}

const FILE_POOL: ReadonlyArray<FileChange> = [
  { path: 'src/app/page.tsx', added: 14, removed: 8 },
  { path: 'src/lib/audit.ts', added: 64, removed: 0 },
  { path: 'src/lib/hydration.ts', added: 22, removed: 31 },
  { path: 'src/components/Header.tsx', added: 4, removed: 2 },
  { path: 'src/widgets/sidebar.tsx', added: 19, removed: 11 },
  { path: 'package.json', added: 2, removed: 1 },
  { path: 'tests/e2e/checkout.spec.ts', added: 41, removed: 0 },
  { path: 'src/api/orders.ts', added: 12, removed: 4 },
  { path: 'CHANGELOG.md', added: 9, removed: 0 },
  { path: 'src/styles/tokens.css', added: 7, removed: 3 },
];

function pickFiles(seed: number, count: number): ReadonlyArray<FileChange> {
  const out: FileChange[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed * 13 + i * 7) % FILE_POOL.length;
    const f = FILE_POOL[idx];
    if (f) out.push(f);
  }
  return out;
}

interface Seed {
  sha: string;
  parents: ReadonlyArray<string>;
  branch: BranchName;
  authorIdx: number;
  minsAgo: number;
  message: string;
  fileSeed: number;
  fileCount: number;
}

const SEEDS: ReadonlyArray<Seed> = [
  // main lane (0): newest first
  { sha: 'a91f4e2', parents: ['7c3a019'], branch: 'main', authorIdx: 0, minsAgo: 12, message: 'chore: bump deps and lockfile', fileSeed: 1, fileCount: 2 },
  { sha: '7c3a019', parents: ['e421aa8'], branch: 'main', authorIdx: 1, minsAgo: 47, message: 'fix(audit): redact email in error path', fileSeed: 2, fileCount: 3 },
  { sha: 'e421aa8', parents: ['1d04bb1', 'b0c7c2a'], branch: 'main', authorIdx: 0, minsAgo: 90, message: "Merge branch 'feat/audit-log' into main", fileSeed: 3, fileCount: 4 },
  { sha: '1d04bb1', parents: ['44de1c6'], branch: 'main', authorIdx: 2, minsAgo: 220, message: 'docs: README install steps for v18', fileSeed: 4, fileCount: 1 },
  { sha: '44de1c6', parents: ['9a200ce', 'cc11afe'], branch: 'main', authorIdx: 1, minsAgo: 320, message: "Merge branch 'bug/hydration' into main", fileSeed: 5, fileCount: 3 },
  { sha: '9a200ce', parents: ['27e90b3'], branch: 'main', authorIdx: 0, minsAgo: 480, message: 'feat: add /api/orders pagination', fileSeed: 6, fileCount: 2 },
  { sha: '27e90b3', parents: ['8be4011'], branch: 'main', authorIdx: 3, minsAgo: 720, message: 'refactor: split Header subcomponents', fileSeed: 7, fileCount: 3 },
  { sha: '8be4011', parents: [], branch: 'main', authorIdx: 0, minsAgo: 4_400, message: 'chore: initial commit', fileSeed: 8, fileCount: 1 },

  // release/0.4 lane (1)
  { sha: 'd7780cb', parents: ['7c3a019'], branch: 'release/0.4', authorIdx: 1, minsAgo: 30, message: 'release: cut 0.4.2 candidate', fileSeed: 9, fileCount: 2 },
  { sha: 'b14d553', parents: ['1d04bb1'], branch: 'release/0.4', authorIdx: 1, minsAgo: 240, message: 'release: cut 0.4.1', fileSeed: 10, fileCount: 1 },
  { sha: 'f2cc880', parents: ['9a200ce'], branch: 'release/0.4', authorIdx: 1, minsAgo: 500, message: 'release: cut 0.4.0', fileSeed: 11, fileCount: 1 },
  { sha: '6a31aa4', parents: ['27e90b3'], branch: 'release/0.4', authorIdx: 4, minsAgo: 740, message: 'release: prepare 0.4 line', fileSeed: 12, fileCount: 2 },

  // feat/audit-log lane (2)
  { sha: 'b0c7c2a', parents: ['51a92dd'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 100, message: 'feat(audit): emit JSONL log writer', fileSeed: 13, fileCount: 4 },
  { sha: '51a92dd', parents: ['9c440ea'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 130, message: 'feat(audit): redactor for PII fields', fileSeed: 14, fileCount: 3 },
  { sha: '9c440ea', parents: ['e3aabb8'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 160, message: 'feat(audit): scaffold AuditEvent type', fileSeed: 15, fileCount: 2 },
  { sha: 'e3aabb8', parents: ['1d04bb1'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 200, message: 'wip: experiment with hooks pattern', fileSeed: 16, fileCount: 2 },
  { sha: '7771bbf', parents: ['b0c7c2a'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 80, message: 'test(audit): cover redactor edge cases', fileSeed: 17, fileCount: 2 },

  // bug/hydration lane (3)
  { sha: 'cc11afe', parents: ['ad9133a'], branch: 'bug/hydration', authorIdx: 3, minsAgo: 340, message: 'fix(hydration): suspense boundary mismatch', fileSeed: 18, fileCount: 3 },
  { sha: 'ad9133a', parents: ['cb2188c'], branch: 'bug/hydration', authorIdx: 3, minsAgo: 380, message: 'test(hydration): repro for #4421', fileSeed: 19, fileCount: 2 },
  { sha: 'cb2188c', parents: ['8d4400a'], branch: 'bug/hydration', authorIdx: 3, minsAgo: 410, message: 'wip: bisecting layout shift', fileSeed: 20, fileCount: 2 },
  { sha: '8d4400a', parents: ['9a200ce'], branch: 'bug/hydration', authorIdx: 4, minsAgo: 460, message: 'wip: branch off main', fileSeed: 21, fileCount: 1 },

  // additional misc commits to fill 28
  { sha: 'aa72004', parents: ['e3aabb8'], branch: 'feat/audit-log', authorIdx: 4, minsAgo: 195, message: 'wip: typed event ids', fileSeed: 22, fileCount: 2 },
  { sha: 'cda6611', parents: ['51a92dd'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 125, message: 'docs(audit): inline JSDoc on writer', fileSeed: 23, fileCount: 1 },
  { sha: '11dc40b', parents: ['ad9133a'], branch: 'bug/hydration', authorIdx: 3, minsAgo: 370, message: 'wip: revert noise', fileSeed: 24, fileCount: 1 },
  { sha: '4b2298f', parents: ['cb2188c'], branch: 'bug/hydration', authorIdx: 4, minsAgo: 400, message: 'wip: try suspense boundary tweak', fileSeed: 25, fileCount: 2 },
  { sha: 'c00fa11', parents: ['d7780cb'], branch: 'release/0.4', authorIdx: 1, minsAgo: 20, message: 'release: tag v0.4.2-rc.1', fileSeed: 26, fileCount: 1 },
  { sha: '3ee0acd', parents: ['7c3a019'], branch: 'main', authorIdx: 0, minsAgo: 35, message: 'chore: prune dead exports', fileSeed: 27, fileCount: 2 },
  { sha: 'fffe201', parents: ['1d04bb1'], branch: 'main', authorIdx: 4, minsAgo: 230, message: 'perf: memoize SearchInput change handler', fileSeed: 28, fileCount: 1 },
  { sha: '0b59ac3', parents: ['9a200ce'], branch: 'feat/audit-log', authorIdx: 2, minsAgo: 470, message: 'wip: branch off main pre-feature', fileSeed: 29, fileCount: 1 },
];

export const COMMITS: ReadonlyArray<Commit> = SEEDS.map((s) => ({
  sha: s.sha,
  parents: s.parents,
  branch: s.branch,
  author: AUTHORS[s.authorIdx] ?? 'unknown',
  ts: ts(s.minsAgo),
  message: s.message,
  filesChanged: pickFiles(s.fileSeed, s.fileCount),
}));

export function relTime(ts2: number): string {
  const diff = NOW - ts2;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
