export interface SpecificityVec {
  a: number;
  b: number;
  c: number;
}

export interface LayerRule {
  id: string;
  selector: string;
  declaration: string;
  matches: boolean;
  specificity: SpecificityVec;
}

export interface Layer {
  id: string;
  name: string;
  rank: number;
  rules: LayerRule[];
}

export const targetSelectors: ReadonlyArray<string> = [
  '.button.primary',
  '.button.danger',
  '.card .title',
  'a.link:hover',
];

const make = (
  id: string,
  selector: string,
  declaration: string,
  matches: boolean,
  spec: SpecificityVec,
): LayerRule => ({ id, selector, declaration, matches, specificity: spec });

export const layers: ReadonlyArray<Layer> = [
  {
    id: 'reset',
    name: 'reset',
    rank: 1,
    rules: [
      make('r1', '*', 'box-sizing: border-box', false, { a: 0, b: 0, c: 0 }),
      make('r2', 'button', 'all: unset', true, { a: 0, b: 0, c: 1 }),
      make('r3', 'a', 'text-decoration: none', false, { a: 0, b: 0, c: 1 }),
      make('r4', 'h1, h2', 'margin: 0', false, { a: 0, b: 0, c: 1 }),
      make('r5', 'img', 'max-width: 100%', false, { a: 0, b: 0, c: 1 }),
      make('r6', 'p', 'margin: 0', false, { a: 0, b: 0, c: 1 }),
      make('r7', 'ul', 'list-style: none', false, { a: 0, b: 0, c: 1 }),
      make('r8', 'input', 'font: inherit', false, { a: 0, b: 0, c: 1 }),
    ],
  },
  {
    id: 'tokens',
    name: 'tokens',
    rank: 2,
    rules: [
      make('t1', ':root', '--color-accent: #6366f1', false, { a: 0, b: 0, c: 0 }),
      make('t2', ':root', '--radius-sm: 2px', false, { a: 0, b: 0, c: 0 }),
      make('t3', ':root', '--space-2: 8px', false, { a: 0, b: 0, c: 0 }),
      make('t4', ':root', '--font-body: ui-sans-serif', false, { a: 0, b: 0, c: 0 }),
      make('t5', ':root', '--shadow-pop: 0 6px 24px rgba(0,0,0,.08)', false, { a: 0, b: 0, c: 0 }),
      make('t6', ':root', '--ink-1: #111', false, { a: 0, b: 0, c: 0 }),
      make('t7', ':root', '--bg: #fff', false, { a: 0, b: 0, c: 0 }),
      make('t8', ':root', '--line: #e5e7eb', false, { a: 0, b: 0, c: 0 }),
    ],
  },
  {
    id: 'base',
    name: 'base',
    rank: 3,
    rules: [
      make('b1', 'body', 'font-family: var(--font-body)', false, { a: 0, b: 0, c: 1 }),
      make('b2', 'button', 'cursor: pointer', true, { a: 0, b: 0, c: 1 }),
      make('b3', 'button', 'font: inherit', true, { a: 0, b: 0, c: 1 }),
      make('b4', 'a', 'color: var(--color-accent)', false, { a: 0, b: 0, c: 1 }),
      make('b5', 'h1', 'font-size: 24px', false, { a: 0, b: 0, c: 1 }),
      make('b6', 'h2', 'font-size: 20px', false, { a: 0, b: 0, c: 1 }),
      make('b7', 'p', 'line-height: 1.5', false, { a: 0, b: 0, c: 1 }),
      make('b8', 'small', 'font-size: 12px', false, { a: 0, b: 0, c: 1 }),
    ],
  },
  {
    id: 'components',
    name: 'components',
    rank: 4,
    rules: [
      make('c1', '.button', 'padding: 6px 12px', true, { a: 0, b: 1, c: 0 }),
      make('c2', '.button', 'border-radius: var(--radius-sm)', true, { a: 0, b: 1, c: 0 }),
      make('c3', '.button.primary', 'background: var(--color-accent)', true, { a: 0, b: 2, c: 0 }),
      make('c4', '.button.primary', 'color: white', true, { a: 0, b: 2, c: 0 }),
      make('c5', '.button.danger', 'background: #ef4444', false, { a: 0, b: 2, c: 0 }),
      make('c6', '.card', 'padding: 16px', false, { a: 0, b: 1, c: 0 }),
      make('c7', '.card .title', 'font-weight: 600', false, { a: 0, b: 2, c: 0 }),
      make('c8', '.input', 'border: 1px solid var(--line)', false, { a: 0, b: 1, c: 0 }),
    ],
  },
  {
    id: 'utilities',
    name: 'utilities',
    rank: 5,
    rules: [
      make('u1', '.mt-2', 'margin-top: 8px', false, { a: 0, b: 1, c: 0 }),
      make('u2', '.flex', 'display: flex', false, { a: 0, b: 1, c: 0 }),
      make('u3', '.gap-2', 'gap: 8px', false, { a: 0, b: 1, c: 0 }),
      make('u4', '.text-sm', 'font-size: 13px', false, { a: 0, b: 1, c: 0 }),
      make('u5', '.rounded', 'border-radius: 4px', false, { a: 0, b: 1, c: 0 }),
      make('u6', '.shadow', 'box-shadow: var(--shadow-pop)', false, { a: 0, b: 1, c: 0 }),
      make('u7', '.hidden', 'display: none', false, { a: 0, b: 1, c: 0 }),
      make('u8', '.w-full', 'width: 100%', false, { a: 0, b: 1, c: 0 }),
    ],
  },
  {
    id: 'app',
    name: 'app',
    rank: 6,
    rules: [
      make('a1', '.button.primary', 'background: #4f46e5', true, { a: 0, b: 2, c: 0 }),
      make('a2', '.button.primary:hover', 'background: #4338ca', false, { a: 0, b: 2, c: 1 }),
      make('a3', '.app-shell', 'min-height: 100vh', false, { a: 0, b: 1, c: 0 }),
      make('a4', '.app-shell header', 'position: sticky', false, { a: 0, b: 1, c: 1 }),
      make('a5', '.app-shell main', 'padding: 24px', false, { a: 0, b: 1, c: 1 }),
      make('a6', '.toast', 'background: var(--ink-1)', false, { a: 0, b: 1, c: 0 }),
      make('a7', '.dialog', 'box-shadow: var(--shadow-pop)', false, { a: 0, b: 1, c: 0 }),
      make('a8', '.brand', 'color: var(--color-accent)', false, { a: 0, b: 1, c: 0 }),
    ],
  },
];

export interface WinnerInfo {
  ruleId: string | null;
  layerId: string | null;
}

export function findWinner(target: string): WinnerInfo {
  // pick from the highest-rank layer that has a matching rule
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (!l) continue;
    const m = l.rules.find((r) => r.matches && (r.selector === target || target.includes(r.selector) || r.selector.includes(target)));
    if (m) return { ruleId: m.id, layerId: l.id };
  }
  return { ruleId: null, layerId: null };
}

export function specStr(s: SpecificityVec): string {
  return `(${s.a},${s.b},${s.c})`;
}
