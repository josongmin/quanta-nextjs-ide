export type SnapshotKind = 'Edit' | 'Save' | 'External change' | 'Labeled';

export interface ChangedLine {
  line: number;
  kind: 'add' | 'remove' | 'modify';
}

export interface Snapshot {
  id: string;
  file: string;
  ts: number; // ms epoch (frozen relative to NOW)
  label: string;
  labelKind: SnapshotKind;
  contentBefore: string;
  contentAfter: string;
  changedLines: ReadonlyArray<ChangedLine>;
}

export const FILES: ReadonlyArray<string> = [
  'src/app/(shop)/products/[id]/page.tsx',
  'src/components/Cart.tsx',
  'src/lib/db/schema.ts',
  'src/app/api/checkout/route.ts',
];

// Frozen "now" so timestamps are deterministic for the demo.
export const NOW = 1_714_500_000_000;
const M = 60_000;
const H = 60 * M;
const D = 24 * H;

interface SeedSnap {
  agoMs: number;
  label: string;
  labelKind: SnapshotKind;
  before: string[];
  after: string[];
}

// 12 entries per file: denser at the top (last few hours), sparser further back (over 7d).
function seedFor(file: string): ReadonlyArray<SeedSnap> {
  const tag = file.split('/').pop() ?? file;
  return [
    {
      agoMs: 4 * M,
      label: 'Edit',
      labelKind: 'Edit',
      before: [
        `// ${tag}`,
        'export function load() {',
        '  const url = "/api/items";',
        '  return fetch(url);',
        '}',
      ],
      after: [
        `// ${tag}`,
        'export function load() {',
        '  const url = "/api/items?limit=20";',
        '  return fetch(url, { cache: "no-store" });',
        '}',
      ],
    },
    {
      agoMs: 18 * M,
      label: 'Save',
      labelKind: 'Save',
      before: [
        'export const PRICE = 19',
        'export function format(p: number) {',
        '  return `$${p}`;',
        '}',
      ],
      after: [
        'export const PRICE = 19.99',
        'export function format(p: number) {',
        '  return p.toFixed(2);',
        '}',
      ],
    },
    {
      agoMs: 42 * M,
      label: 'before refactor',
      labelKind: 'Labeled',
      before: [
        'function pricing(items) {',
        '  let total = 0;',
        '  for (const it of items) total += it.price;',
        '  return total;',
        '}',
      ],
      after: [
        'function pricing(items: Item[]): number {',
        '  return items.reduce((a, b) => a + b.price, 0);',
        '}',
      ],
    },
    {
      agoMs: 1 * H + 30 * M,
      label: 'Edit',
      labelKind: 'Edit',
      before: [
        'const cfg = {',
        '  ttl: 60,',
        '  retries: 1,',
        '};',
      ],
      after: [
        'const cfg = {',
        '  ttl: 120,',
        '  retries: 3,',
        '  backoff: "exp",',
        '};',
      ],
    },
    {
      agoMs: 3 * H,
      label: 'Save',
      labelKind: 'Save',
      before: [
        'export default function Page() {',
        '  return <div>Hi</div>;',
        '}',
      ],
      after: [
        'export default function Page() {',
        '  return (',
        '    <div className="grid gap-2">',
        '      <Header />',
        '      <Body />',
        '    </div>',
        '  );',
        '}',
      ],
    },
    {
      agoMs: 7 * H,
      label: 'External change',
      labelKind: 'External change',
      before: [
        'import { z } from "zod";',
        'export const S = z.object({ id: z.string() });',
      ],
      after: [
        'import { z } from "zod";',
        'export const S = z.object({',
        '  id: z.string(),',
        '  name: z.string().min(1),',
        '});',
      ],
    },
    {
      agoMs: 18 * H,
      label: 'Edit',
      labelKind: 'Edit',
      before: [
        'function pricing(item) {',
        '  return item.price * 1.1;',
        '}',
      ],
      after: [
        'function pricing(item: Item) {',
        '  return Number((item.price * 1.1).toFixed(2));',
        '}',
      ],
    },
    {
      agoMs: 1 * D + 6 * H,
      label: 'Save',
      labelKind: 'Save',
      before: [
        'try {',
        '  await save();',
        '} catch (e) {',
        '  console.error(e);',
        '}',
      ],
      after: [
        'try {',
        '  await save();',
        '} catch (e) {',
        '  log.error("save failed", e);',
        '  throw e;',
        '}',
      ],
    },
    {
      agoMs: 2 * D + 4 * H,
      label: 'pre-merge',
      labelKind: 'Labeled',
      before: [
        'const route = "/products";',
        'export const meta = { route };',
      ],
      after: [
        'const route = "/products";',
        'export const meta = { route, prefetch: true };',
      ],
    },
    {
      agoMs: 3 * D + 11 * H,
      label: 'Edit',
      labelKind: 'Edit',
      before: [
        'function color(t) {',
        '  return t === "warn" ? "yellow" : "gray";',
        '}',
      ],
      after: [
        'function color(t: Tone): string {',
        '  switch (t) {',
        '    case "warn": return "yellow";',
        '    case "err":  return "red";',
        '    default:     return "gray";',
        '  }',
        '}',
      ],
    },
    {
      agoMs: 5 * D + 2 * H,
      label: 'External change',
      labelKind: 'External change',
      before: [
        'const items: Item[] = [];',
      ],
      after: [
        'const items: Item[] = [];',
        'export function add(i: Item) { items.push(i); }',
      ],
    },
    {
      agoMs: 6 * D + 22 * H,
      label: 'initial',
      labelKind: 'Labeled',
      before: [
        '// (empty)',
      ],
      after: [
        `// ${tag}`,
        'export {};',
      ],
    },
  ];
}

function diffLines(
  before: ReadonlyArray<string>,
  after: ReadonlyArray<string>,
): ReadonlyArray<ChangedLine> {
  const out: ChangedLine[] = [];
  const max = Math.max(before.length, after.length);
  for (let i = 0; i < max; i++) {
    const b = before[i];
    const a = after[i];
    if (b === undefined && a !== undefined) {
      out.push({ line: i + 1, kind: 'add' });
    } else if (b !== undefined && a === undefined) {
      out.push({ line: i + 1, kind: 'remove' });
    } else if (b !== a) {
      out.push({ line: i + 1, kind: 'modify' });
    }
  }
  return out;
}

export const SNAPSHOTS: ReadonlyArray<Snapshot> = FILES.flatMap((file) =>
  seedFor(file).map((s, idx) => {
    const id = `snap_${file.split('/').pop()}_${idx}`;
    const before = s.before.join('\n');
    const after = s.after.join('\n');
    return {
      id,
      file,
      ts: NOW - s.agoMs,
      label: s.label,
      labelKind: s.labelKind,
      contentBefore: before,
      contentAfter: after,
      changedLines: diffLines(s.before, s.after),
    } satisfies Snapshot;
  }),
);

export function snapshotsForFile(file: string): ReadonlyArray<Snapshot> {
  return SNAPSHOTS.filter((s) => s.file === file).slice().sort((a, b) => b.ts - a.ts);
}

export function relativeTime(ts: number): string {
  const ms = NOW - ts;
  if (ms < M) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < H) return `${Math.round(ms / M)}m ago`;
  if (ms < D) return `${Math.round(ms / H)}h ago`;
  return `${Math.round(ms / D)}d ago`;
}

export function lineDelta(s: Snapshot): { adds: number; removes: number; mods: number } {
  let adds = 0;
  let removes = 0;
  let mods = 0;
  for (const c of s.changedLines) {
    if (c.kind === 'add') adds++;
    else if (c.kind === 'remove') removes++;
    else mods++;
  }
  return { adds, removes, mods };
}

export function oldestSnapshotAge(): string {
  const oldest = [...SNAPSHOTS].sort((a, b) => a.ts - b.ts)[0];
  if (!oldest) return '-';
  return relativeTime(oldest.ts);
}
