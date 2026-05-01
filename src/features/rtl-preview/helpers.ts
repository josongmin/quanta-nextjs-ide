export type ComponentId =
  | 'header'
  | 'nav'
  | 'card'
  | 'form'
  | 'table'
  | 'chart';

export type LocaleId = 'ar' | 'he' | 'fa';

export interface RtlIssue {
  id: string;
  file: string;
  line: number;
  prop: string;
  before: string;
  after: string;
  rationale: string;
}

export interface ComponentMock {
  id: ComponentId;
  label: string;
  description: string;
  issues: readonly RtlIssue[];
}

export const components: readonly ComponentMock[] = [
  {
    id: 'header',
    label: 'Site header',
    description: 'Logo + nav + actions; logo should remain leading.',
    issues: [
      {
        id: 'h1',
        file: 'src/widgets/header/header.css',
        line: 14,
        prop: 'margin-left',
        before: 'margin-left: 16px;',
        after: 'margin-inline-start: 16px;',
        rationale: 'Use logical property so it flips under RTL.',
      },
      {
        id: 'h2',
        file: 'src/widgets/header/header.css',
        line: 41,
        prop: 'text-align',
        before: 'text-align: left;',
        after: 'text-align: start;',
        rationale: '`start` adapts to writing direction.',
      },
    ],
  },
  {
    id: 'nav',
    label: 'Primary navigation',
    description: 'Inline list of links separated by chevrons.',
    issues: [
      {
        id: 'n1',
        file: 'src/widgets/nav/nav.css',
        line: 22,
        prop: 'padding-left',
        before: 'padding-left: 24px;',
        after: 'padding-inline-start: 24px;',
        rationale: 'List indent should mirror in RTL.',
      },
    ],
  },
  {
    id: 'card',
    label: 'Product card',
    description: 'Image + meta. Star rating uses ::before icons.',
    issues: [
      {
        id: 'c1',
        file: 'src/features/card/card.css',
        line: 9,
        prop: 'border-left',
        before: 'border-left: 2px solid var(--accent);',
        after: 'border-inline-start: 2px solid var(--accent);',
        rationale: 'Accent rule should appear on leading edge.',
      },
      {
        id: 'c2',
        file: 'src/features/card/card.css',
        line: 33,
        prop: 'transform',
        before: 'transform: translateX(8px);',
        after: 'transform: translateX(calc(8px * var(--dir, 1)));',
        rationale: 'Translate by direction-aware multiplier.',
      },
    ],
  },
  {
    id: 'form',
    label: 'Sign-up form',
    description: 'Stacked label/input rows + a 2-up CTA.',
    issues: [
      {
        id: 'f1',
        file: 'src/features/signup/signup.css',
        line: 18,
        prop: 'margin-right',
        before: 'margin-right: 12px;',
        after: 'margin-inline-end: 12px;',
        rationale: 'Spacing should follow trailing edge.',
      },
    ],
  },
  {
    id: 'table',
    label: 'Pricing table',
    description: '4-col table with currency aligned right.',
    issues: [
      {
        id: 't1',
        file: 'src/features/pricing/pricing.css',
        line: 7,
        prop: 'text-align',
        before: 'text-align: right;',
        after: 'text-align: end;',
        rationale: 'Currency should align to trailing edge.',
      },
      {
        id: 't2',
        file: 'src/features/pricing/pricing.css',
        line: 28,
        prop: 'padding-right',
        before: 'padding-right: 16px;',
        after: 'padding-inline-end: 16px;',
        rationale: 'Cell padding should mirror.',
      },
    ],
  },
  {
    id: 'chart',
    label: 'KPI chart',
    description: 'Axis labels left side; series legend right.',
    issues: [
      {
        id: 'ch1',
        file: 'src/features/kpi/kpi.tsx',
        line: 56,
        prop: 'left',
        before: 'left: 12px;',
        after: 'inset-inline-start: 12px;',
        rationale: 'Anchor to leading edge so legend mirrors.',
      },
    ],
  },
];

export interface LocaleSample {
  id: LocaleId;
  label: string;
  sample: string;
  numerals: string;
}

export const locales: readonly LocaleSample[] = [
  {
    id: 'ar',
    label: 'العربية (Arabic)',
    sample: 'مرحبا بالعالم — السعر ٤٨ دولارًا',
    numerals: '٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩',
  },
  {
    id: 'he',
    label: 'עברית (Hebrew)',
    sample: 'שלום עולם — מחיר $48',
    numerals: '0 1 2 3 4 5 6 7 8 9',
  },
  {
    id: 'fa',
    label: 'فارسی (Persian)',
    sample: 'سلام دنیا — قیمت ۴۸ دلار',
    numerals: '۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹',
  },
];

export function totalIssues(): number {
  return components.reduce((sum, c) => sum + c.issues.length, 0);
}
