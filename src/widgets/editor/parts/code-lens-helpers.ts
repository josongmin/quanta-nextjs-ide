export type LensKind = 'refs' | 'impls' | 'blame';

export interface LensChip {
  kind: LensKind;
  label: string;
  tooltip: string;
}

export interface CodeLensDecl {
  line: number;
  symbol: string;
  chips: LensChip[];
}

const AUTHORS = ['John Doe', 'Mei Tanaka', 'Pat Garcia', 'Aisha Khan'];
const AGES = ['2 days ago', '5 days ago', '1 week ago', '3 weeks ago'];
const REF_COUNTS = [3, 7, 12, 1, 4, 9];
const IMPL_COUNTS = [1, 2, 3];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], seed: number, salt: number): T {
  const idx = (seed + salt) % arr.length;
  const v = arr[idx];
  if (v === undefined) throw new Error('pick: empty array');
  return v;
}

const SYMBOL_LINES = [3, 12, 21, 34, 47, 60, 73, 86];

export function lensesForFile(file: string): CodeLensDecl[] {
  const seed = hash(file);
  return SYMBOL_LINES.map((line, i) => {
    const sym = `symbol_${i + 1}`;
    const refCount = pick(REF_COUNTS, seed, i * 3);
    const implCount = pick(IMPL_COUNTS, seed, i * 5);
    const author = pick(AUTHORS, seed, i * 7);
    const age = pick(AGES, seed, i * 11);
    const chips: LensChip[] = [
      {
        kind: 'refs',
        label: `${refCount} refs`,
        tooltip: 'Find references',
      },
      {
        kind: 'impls',
        label: `${implCount} impls`,
        tooltip: 'Show implementations',
      },
      {
        kind: 'blame',
        label: `${author} · ${age}`,
        tooltip: 'Open commit',
      },
    ];
    return { line, symbol: sym, chips };
  });
}
