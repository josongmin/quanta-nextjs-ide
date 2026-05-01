// Mock git blame data — one entry per content line for a curated set of files.
// Used by features/inline-blame for the active-cursor-line ghost overlay.

export interface BlameEntry {
  file: string;
  line: number;
  author: string;
  ageDays: number;
  sha: string;
  subject: string;
}

const AUTHORS = ['songmin', 'ada-park', 'lin-kim', 'theo-tan', 'ravi-patel'] as const;
const AGES = [0, 2, 7, 30, 90] as const;
const SUBJECTS = [
  'init route boilerplate',
  'wire generateMetadata to product',
  'introduce session lookup',
  'add reviews fetch',
  'fix notFound when product missing',
  'extract ProductDetail island',
  'add AddToCart client component',
  'tighten z schema for updates',
  'add server-only guard',
  'mock decode for unauthenticated',
  'pass cookie value through to AppShell',
  'introduce cart cookie reader',
  'add tx wrapper for orders',
  'invalidate orders cache tag',
  'redirect to order detail on success',
  'log createOrder failures',
  'use prisma db client',
  'tweak revalidate window',
  'rename lib/auth helpers',
  'narrow id parsing in deleteUser',
] as const;

function shaFor(file: string, line: number): string {
  // Stable pseudo-sha derived from file + line.
  let h = 2166136261;
  const s = `${file}:${line}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

function pick<T>(arr: ReadonlyArray<T>, file: string, line: number, salt: number): T {
  let h = salt;
  const s = `${file}:${line}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return arr[h % arr.length] as T;
}

const FILES_TO_BLAME: ReadonlyArray<{ file: string; lines: number }> = [
  { file: 'app/(shop)/products/[id]/page.tsx', lines: 36 },
  { file: 'app/(shop)/layout.tsx', lines: 14 },
  { file: 'app/admin/products/actions.ts', lines: 16 },
  { file: 'app/admin/users/delete/actions.ts', lines: 10 },
  { file: 'app/(shop)/checkout/actions.ts', lines: 18 },
  { file: 'lib/auth.ts', lines: 12 },
];

function build(): BlameEntry[] {
  const out: BlameEntry[] = [];
  for (const { file, lines } of FILES_TO_BLAME) {
    for (let line = 1; line <= lines; line++) {
      out.push({
        file,
        line,
        author: pick(AUTHORS, file, line, 7),
        ageDays: pick(AGES, file, line, 13),
        sha: shaFor(file, line),
        subject: pick(SUBJECTS, file, line, 19),
      });
    }
  }
  return out;
}

export const mockBlame: ReadonlyArray<BlameEntry> = build();

const blameIndex: Map<string, BlameEntry> = (() => {
  const m = new Map<string, BlameEntry>();
  for (const e of mockBlame) m.set(`${e.file}:${e.line}`, e);
  return m;
})();

export function blameForLine(file: string, line: number): BlameEntry | undefined {
  return blameIndex.get(`${file}:${line}`);
}
