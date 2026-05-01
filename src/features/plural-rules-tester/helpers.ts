export type LocaleId =
  | 'en'
  | 'ru'
  | 'ar'
  | 'pl'
  | 'fr'
  | 'ja'
  | 'cy'
  | 'lt';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface LocaleMeta {
  id: LocaleId;
  label: string;
  categories: readonly PluralCategory[];
  formula: string;
}

export const localeData: readonly LocaleMeta[] = [
  {
    id: 'en',
    label: 'English (en)',
    categories: ['one', 'other'],
    formula: [
      '// CLDR plural rules · en',
      'one  : i = 1 and v = 0',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'ru',
    label: 'Russian (ru)',
    categories: ['one', 'few', 'many', 'other'],
    formula: [
      '// CLDR plural rules · ru',
      'one  : v = 0 and i % 10 = 1 and i % 100 != 11',
      'few  : v = 0 and i % 10 in 2..4 and i % 100 not in 12..14',
      'many : v = 0 and (i % 10 = 0 or i % 10 in 5..9 or i % 100 in 11..14)',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'ar',
    label: 'Arabic (ar)',
    categories: ['zero', 'one', 'two', 'few', 'many', 'other'],
    formula: [
      '// CLDR plural rules · ar',
      'zero : n = 0',
      'one  : n = 1',
      'two  : n = 2',
      'few  : n % 100 in 3..10',
      'many : n % 100 in 11..99',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'pl',
    label: 'Polish (pl)',
    categories: ['one', 'few', 'many', 'other'],
    formula: [
      '// CLDR plural rules · pl',
      'one  : i = 1 and v = 0',
      'few  : v = 0 and i % 10 in 2..4 and i % 100 not in 12..14',
      'many : v = 0 and (i != 1 and i % 10 in 0..1 or i % 10 in 5..9 or i % 100 in 12..14)',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'fr',
    label: 'French (fr)',
    categories: ['one', 'many', 'other'],
    formula: [
      '// CLDR plural rules · fr',
      'one  : i in 0..1',
      'many : e = 0 and i != 0 and i % 10^6 = 0 and v = 0 or e not in 0..5',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'ja',
    label: 'Japanese (ja)',
    categories: ['other'],
    formula: ['// CLDR plural rules · ja', 'other: always'].join('\n'),
  },
  {
    id: 'cy',
    label: 'Welsh (cy)',
    categories: ['zero', 'one', 'two', 'few', 'many', 'other'],
    formula: [
      '// CLDR plural rules · cy',
      'zero : n = 0',
      'one  : n = 1',
      'two  : n = 2',
      'few  : n = 3',
      'many : n = 6',
      'other: <everything else>',
    ].join('\n'),
  },
  {
    id: 'lt',
    label: 'Lithuanian (lt)',
    categories: ['one', 'few', 'many', 'other'],
    formula: [
      '// CLDR plural rules · lt',
      'one  : n % 10 = 1 and n % 100 not in 11..19',
      'few  : n % 10 in 2..9 and n % 100 not in 11..19',
      'many : f != 0',
      'other: <everything else>',
    ].join('\n'),
  },
];

export function categorize(locale: LocaleId, n: number): PluralCategory {
  const isInt = Number.isInteger(n);
  const i = Math.trunc(Math.abs(n));

  switch (locale) {
    case 'en':
      return isInt && i === 1 ? 'one' : 'other';
    case 'ru': {
      if (!isInt) return 'other';
      const m10 = i % 10;
      const m100 = i % 100;
      if (m10 === 1 && m100 !== 11) return 'one';
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
      if (m10 === 0 || (m10 >= 5 && m10 <= 9) || (m100 >= 11 && m100 <= 14))
        return 'many';
      return 'other';
    }
    case 'ar': {
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      const m100 = isInt ? i % 100 : -1;
      if (m100 >= 3 && m100 <= 10) return 'few';
      if (m100 >= 11 && m100 <= 99) return 'many';
      return 'other';
    }
    case 'pl': {
      if (!isInt) return 'other';
      if (i === 1) return 'one';
      const m10 = i % 10;
      const m100 = i % 100;
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
      if (
        i !== 1 &&
        (m10 === 0 || m10 === 1 || (m10 >= 5 && m10 <= 9) || (m100 >= 12 && m100 <= 14))
      )
        return 'many';
      return 'other';
    }
    case 'fr':
      return i >= 0 && i <= 1 ? 'one' : 'other';
    case 'ja':
      return 'other';
    case 'cy':
      if (n === 0) return 'zero';
      if (n === 1) return 'one';
      if (n === 2) return 'two';
      if (n === 3) return 'few';
      if (n === 6) return 'many';
      return 'other';
    case 'lt': {
      if (!isInt) return 'many';
      const m10 = i % 10;
      const m100 = i % 100;
      if (m10 === 1 && (m100 < 11 || m100 > 19)) return 'one';
      if (m10 >= 2 && m10 <= 9 && (m100 < 11 || m100 > 19)) return 'few';
      return 'other';
    }
  }
}

export interface IcuMessage {
  id: string;
  label: string;
  icu: string;
  forms: Record<PluralCategory, string>;
}

export const messages: readonly IcuMessage[] = [
  {
    id: 'cart-items',
    label: 'Cart items',
    icu: '{count, plural, one {# item in cart} other {# items in cart}}',
    forms: {
      zero: 'no items in cart',
      one: '# item in cart',
      two: '# items in cart',
      few: '# items in cart',
      many: '# items in cart',
      other: '# items in cart',
    },
  },
  {
    id: 'unread',
    label: 'Unread messages',
    icu: '{count, plural, one {# unread message} other {# unread messages}}',
    forms: {
      zero: 'no unread messages',
      one: '# unread message',
      two: '# unread messages',
      few: '# unread messages',
      many: '# unread messages',
      other: '# unread messages',
    },
  },
  {
    id: 'days-ago',
    label: 'Days ago',
    icu: '{n, plural, one {# day ago} other {# days ago}}',
    forms: {
      zero: 'today',
      one: '# day ago',
      two: '# days ago',
      few: '# days ago',
      many: '# days ago',
      other: '# days ago',
    },
  },
  {
    id: 'comments',
    label: 'Comments count',
    icu: '{n, plural, =0 {No comments} one {# comment} other {# comments}}',
    forms: {
      zero: 'No comments',
      one: '# comment',
      two: '# comments',
      few: '# comments',
      many: '# comments',
      other: '# comments',
    },
  },
];

export function render(form: string, n: number): string {
  return form.replace(/#/g, String(n));
}

export const SAMPLE_NS: readonly number[] = [0, 1, 2, 3, 5, 10, 21, 100, 1.5];

export function missingCategories(
  locale: LocaleMeta,
  msg: IcuMessage,
): readonly PluralCategory[] {
  // Heuristic: ICU only declares 'one' and 'other' (and maybe '=0').
  const declared = new Set<PluralCategory>(['other']);
  if (msg.icu.includes(' one ')) declared.add('one');
  if (msg.icu.includes(' two ')) declared.add('two');
  if (msg.icu.includes(' few ')) declared.add('few');
  if (msg.icu.includes(' many ')) declared.add('many');
  if (msg.icu.includes(' zero ')) declared.add('zero');
  return locale.categories.filter((c) => !declared.has(c));
}
