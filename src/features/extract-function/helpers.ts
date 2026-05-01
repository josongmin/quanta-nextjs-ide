export interface ExtractParam {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** comes from outer scope (read inside selection). */
  readonly origin: 'closure' | 'arg';
}

export interface ExtractTarget {
  readonly file: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly beforeCode: string;
  readonly afterSelectionCode: string;
  readonly extractedBody: string;
  readonly returnType: string;
  readonly defaultName: string;
  readonly nameCandidates: ReadonlyArray<string>;
  readonly params: ReadonlyArray<ExtractParam>;
}

const BEFORE = `function HeaderActions(props: Props) {
  const { items, locale } = props;
  const count = items.length;

  // ── selection start ───────────────────────────
  const totalUSD = items.reduce((sum, it) => sum + it.priceCents, 0) / 100;
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(totalUSD);
  const summary = count === 0
    ? 'Cart is empty'
    : \`\${count} item\${count === 1 ? '' : 's'} · \${formatted}\`;
  // ── selection end ─────────────────────────────

  return <span title={summary}>{summary}</span>;
}`;

const AFTER_CALLSITE = `function HeaderActions(props: Props) {
  const { items, locale } = props;
  const count = items.length;

  const summary = extractedHelper(items, count, locale);

  return <span title={summary}>{summary}</span>;
}`;

const EXTRACTED = `function extractedHelper(
  items: ReadonlyArray<CartItem>,
  count: number,
  locale: string,
): string {
  const totalUSD = items.reduce((sum, it) => sum + it.priceCents, 0) / 100;
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(totalUSD);
  return count === 0
    ? 'Cart is empty'
    : \`\${count} item\${count === 1 ? '' : 's'} · \${formatted}\`;
}`;

export const TARGET: ExtractTarget = {
  file: 'src/widgets/header/header.tsx',
  startLine: 5,
  endLine: 13,
  beforeCode: BEFORE,
  afterSelectionCode: AFTER_CALLSITE + '\n\n' + EXTRACTED,
  extractedBody: EXTRACTED,
  returnType: 'string',
  defaultName: 'extractedHelper',
  nameCandidates: ['buildCartSummary', 'formatCartTotals', 'cartSummaryLabel'],
  params: [
    { id: 'p1', name: 'items', type: 'ReadonlyArray<CartItem>', origin: 'closure' },
    { id: 'p2', name: 'count', type: 'number', origin: 'closure' },
    { id: 'p3', name: 'locale', type: 'string', origin: 'closure' },
  ],
};

export interface AffectedFile {
  readonly path: string;
  readonly hunks: number;
}

export const AFFECTED_FILES: ReadonlyArray<AffectedFile> = [
  { path: 'src/widgets/header/header.tsx', hunks: 1 },
];

export type TargetFileMode = 'current' | 'new';

export function reorderParams(
  params: ReadonlyArray<ExtractParam>,
  fromIdx: number,
  toIdx: number,
): ReadonlyArray<ExtractParam> {
  if (fromIdx === toIdx) return params;
  const next = params.slice();
  const moved = next[fromIdx];
  if (!moved) return params;
  next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

export function buildSignature(
  name: string,
  params: ReadonlyArray<ExtractParam>,
  returnType: string,
): string {
  const args = params.map((p) => `${p.name}: ${p.type}`).join(', ');
  return `function ${name}(${args}): ${returnType}`;
}
