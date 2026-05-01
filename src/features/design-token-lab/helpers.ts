export type TokenGroup = 'color' | 'spacing' | 'radius' | 'type';

export interface ColorToken {
  readonly name: string;
  value: string; // hex
}

export interface SpacingToken {
  readonly name: string;
  px: number;
}

export interface RadiusToken {
  readonly name: string;
  px: number;
}

export interface TypeToken {
  readonly name: string;
  fontSize: number;
  lineHeight: number;
  weight: number;
}

export interface TokenSet {
  colors: ColorToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  type: TypeToken[];
}

export const INITIAL_TOKENS: TokenSet = {
  colors: [
    { name: 'bg', value: '#ffffff' },
    { name: 'bg-subtle', value: '#f7f7f8' },
    { name: 'ink-1', value: '#0a0a0a' },
    { name: 'ink-2', value: '#3f3f46' },
    { name: 'ink-3', value: '#737373' },
    { name: 'line', value: '#e5e5e5' },
    { name: 'accent', value: '#3b82f6' },
    { name: 'accent-soft', value: '#dbeafe' },
    { name: 'sev-err', value: '#dc2626' },
    { name: 'sev-warn', value: '#d97706' },
  ],
  spacing: [
    { name: 's-0', px: 0 },
    { name: 's-1', px: 4 },
    { name: 's-2', px: 8 },
    { name: 's-3', px: 12 },
    { name: 's-4', px: 16 },
    { name: 's-5', px: 24 },
    { name: 's-6', px: 32 },
    { name: 's-7', px: 48 },
  ],
  radius: [
    { name: 'r-none', px: 0 },
    { name: 'r-xs', px: 2 },
    { name: 'r-sm', px: 3 },
    { name: 'r-md', px: 6 },
    { name: 'r-lg', px: 8 },
    { name: 'r-full', px: 9999 },
  ],
  type: [
    { name: 'xs', fontSize: 11, lineHeight: 16, weight: 400 },
    { name: 'sm', fontSize: 12, lineHeight: 16, weight: 400 },
    { name: 'md', fontSize: 14, lineHeight: 20, weight: 500 },
    { name: 'lg', fontSize: 16, lineHeight: 24, weight: 600 },
    { name: 'xl', fontSize: 20, lineHeight: 28, weight: 700 },
  ],
};

export interface ContrastPair {
  readonly fg: string;
  readonly bg: string;
  readonly label: string;
}

export const CONTRAST_PAIRS: ReadonlyArray<{ fg: string; bg: string; label: string }> = [
  { fg: 'ink-1', bg: 'bg', label: 'body on bg' },
  { fg: 'ink-2', bg: 'bg', label: 'secondary on bg' },
  { fg: 'ink-3', bg: 'bg', label: 'muted on bg' },
  { fg: 'accent', bg: 'bg', label: 'accent on bg' },
  { fg: 'sev-err', bg: 'bg', label: 'error on bg' },
  { fg: 'ink-1', bg: 'bg-subtle', label: 'body on subtle' },
];

export const TOKEN_USAGE: Record<string, number> = {
  bg: 412,
  'bg-subtle': 188,
  'ink-1': 524,
  'ink-2': 388,
  'ink-3': 246,
  line: 312,
  accent: 192,
  'accent-soft': 88,
  'sev-err': 64,
  'sev-warn': 41,
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const expand =
    m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function cloneTokens(set: TokenSet): TokenSet {
  return {
    colors: set.colors.map((c) => ({ ...c })),
    spacing: set.spacing.map((s) => ({ ...s })),
    radius: set.radius.map((r) => ({ ...r })),
    type: set.type.map((t) => ({ ...t })),
  };
}

export function contrast(hexA: string, hexB: string): number {
  const la = relLuminance(hexToRgb(hexA));
  const lb = relLuminance(hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

export function colorByName(set: TokenSet, name: string): string {
  return set.colors.find((c) => c.name === name)?.value ?? '#000000';
}

export function spacingByName(set: TokenSet, name: string): number {
  return set.spacing.find((s) => s.name === name)?.px ?? 0;
}

export function radiusByName(set: TokenSet, name: string): number {
  return set.radius.find((r) => r.name === name)?.px ?? 0;
}

export function typeByName(set: TokenSet, name: string): TypeToken | undefined {
  return set.type.find((t) => t.name === name);
}

export function diffCount(initial: TokenSet, current: TokenSet): number {
  let n = 0;
  initial.colors.forEach((c, i) => {
    if (current.colors[i]?.value !== c.value) n++;
  });
  initial.spacing.forEach((s, i) => {
    if (current.spacing[i]?.px !== s.px) n++;
  });
  initial.radius.forEach((r, i) => {
    if (current.radius[i]?.px !== r.px) n++;
  });
  initial.type.forEach((t, i) => {
    const cur = current.type[i];
    if (
      !cur ||
      cur.fontSize !== t.fontSize ||
      cur.lineHeight !== t.lineHeight ||
      cur.weight !== t.weight
    ) {
      n++;
    }
  });
  return n;
}

export function toCss(set: TokenSet): string {
  const lines: string[] = [':root {'];
  for (const c of set.colors) lines.push(`  --${c.name}: ${c.value};`);
  for (const s of set.spacing) lines.push(`  --${s.name}: ${s.px}px;`);
  for (const r of set.radius) lines.push(`  --${r.name}: ${r.px}px;`);
  for (const t of set.type) {
    lines.push(
      `  --t-${t.name}: ${t.fontSize}px/${t.lineHeight}px ${t.weight};`,
    );
  }
  lines.push('}');
  return lines.join('\n');
}
