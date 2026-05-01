export type SeedStrategy =
  | 'uuid'
  | 'name.firstName'
  | 'name.lastName'
  | 'email'
  | 'int.range'
  | 'date.recent'
  | 'enum'
  | 'image.product'
  | 'lorem.sentence'
  | 'fk.ref';

export interface SeedField {
  name: string;
  defaultStrategy: SeedStrategy;
  enumValues?: ReadonlyArray<string>;
  fkModel?: string;
  intMin?: number;
  intMax?: number;
}

export interface SeedModel {
  id: string;
  name: string;
  defaultRows: number;
  fields: ReadonlyArray<SeedField>;
  dependsOn: ReadonlyArray<string>;
}

export const seedModels: ReadonlyArray<SeedModel> = [
  {
    id: 'User',
    name: 'User',
    defaultRows: 50,
    dependsOn: [],
    fields: [
      { name: 'id', defaultStrategy: 'uuid' },
      { name: 'firstName', defaultStrategy: 'name.firstName' },
      { name: 'lastName', defaultStrategy: 'name.lastName' },
      { name: 'email', defaultStrategy: 'email' },
      { name: 'age', defaultStrategy: 'int.range', intMin: 18, intMax: 80 },
      {
        name: 'role',
        defaultStrategy: 'enum',
        enumValues: ['admin', 'user', 'guest'],
      },
      { name: 'createdAt', defaultStrategy: 'date.recent' },
    ],
  },
  {
    id: 'Product',
    name: 'Product',
    defaultRows: 100,
    dependsOn: [],
    fields: [
      { name: 'id', defaultStrategy: 'uuid' },
      { name: 'title', defaultStrategy: 'lorem.sentence' },
      { name: 'price', defaultStrategy: 'int.range', intMin: 5, intMax: 999 },
      { name: 'image', defaultStrategy: 'image.product' },
      {
        name: 'category',
        defaultStrategy: 'enum',
        enumValues: ['apparel', 'home', 'tech', 'beauty'],
      },
    ],
  },
  {
    id: 'Order',
    name: 'Order',
    defaultRows: 200,
    dependsOn: ['User', 'Product'],
    fields: [
      { name: 'id', defaultStrategy: 'uuid' },
      { name: 'userId', defaultStrategy: 'fk.ref', fkModel: 'User' },
      { name: 'productId', defaultStrategy: 'fk.ref', fkModel: 'Product' },
      { name: 'quantity', defaultStrategy: 'int.range', intMin: 1, intMax: 6 },
      { name: 'placedAt', defaultStrategy: 'date.recent' },
      {
        name: 'status',
        defaultStrategy: 'enum',
        enumValues: ['pending', 'shipped', 'delivered', 'cancelled'],
      },
    ],
  },
  {
    id: 'Review',
    name: 'Review',
    defaultRows: 150,
    dependsOn: ['User', 'Product'],
    fields: [
      { name: 'id', defaultStrategy: 'uuid' },
      { name: 'userId', defaultStrategy: 'fk.ref', fkModel: 'User' },
      { name: 'productId', defaultStrategy: 'fk.ref', fkModel: 'Product' },
      { name: 'rating', defaultStrategy: 'int.range', intMin: 1, intMax: 5 },
      { name: 'body', defaultStrategy: 'lorem.sentence' },
    ],
  },
  {
    id: 'Address',
    name: 'Address',
    defaultRows: 60,
    dependsOn: ['User'],
    fields: [
      { name: 'id', defaultStrategy: 'uuid' },
      { name: 'userId', defaultStrategy: 'fk.ref', fkModel: 'User' },
      { name: 'street', defaultStrategy: 'lorem.sentence' },
      { name: 'city', defaultStrategy: 'name.firstName' },
      { name: 'zip', defaultStrategy: 'int.range', intMin: 10000, intMax: 99999 },
    ],
  },
];

export const STRATEGY_OPTIONS: ReadonlyArray<SeedStrategy> = [
  'uuid',
  'name.firstName',
  'name.lastName',
  'email',
  'int.range',
  'date.recent',
  'enum',
  'image.product',
  'lorem.sentence',
  'fk.ref',
];

export const LOCALE_OPTIONS: ReadonlyArray<string> = ['en-US', 'en-GB', 'fr-FR', 'ja-JP', 'de-DE'];

const FIRST_NAMES_EN = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Casey',
  'Riley',
  'Morgan',
  'Avery',
  'Quinn',
  'Reese',
];
const FIRST_NAMES_FR = ['Léa', 'Hugo', 'Camille', 'Jules', 'Manon', 'Lucas'];
const FIRST_NAMES_JP = ['Yui', 'Sora', 'Haru', 'Ren', 'Aoi'];
const FIRST_NAMES_DE = ['Lukas', 'Mia', 'Finn', 'Lea'];
const LAST_NAMES = [
  'Smith',
  'Lee',
  'Patel',
  'Garcia',
  'Brown',
  'Nguyen',
  'Park',
  'Khan',
  'Müller',
  'Sato',
];
const LOREM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'tempor',
  'magna',
];

function localeFirstNames(locale: string): ReadonlyArray<string> {
  if (locale.startsWith('fr')) return FIRST_NAMES_FR;
  if (locale.startsWith('ja')) return FIRST_NAMES_JP;
  if (locale.startsWith('de')) return FIRST_NAMES_DE;
  return FIRST_NAMES_EN;
}

// Simple deterministic PRNG (mulberry32)
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(r: () => number, arr: ReadonlyArray<T>): T {
  const idx = Math.floor(r() * arr.length);
  return arr[Math.min(idx, arr.length - 1)] as T;
}

export interface GenContext {
  rand: () => number;
  locale: string;
  rowIndex: number;
  modelId: string;
  refs: Record<string, ReadonlyArray<string>>;
}

export function generateValue(
  field: SeedField,
  strategy: SeedStrategy,
  ctx: GenContext,
): string | number | boolean {
  switch (strategy) {
    case 'uuid':
      return `uuid-${ctx.modelId.toLowerCase()}-${ctx.rowIndex.toString().padStart(4, '0')}`;
    case 'name.firstName':
      return pick(ctx.rand, localeFirstNames(ctx.locale));
    case 'name.lastName':
      return pick(ctx.rand, LAST_NAMES);
    case 'email': {
      const fn = pick(ctx.rand, localeFirstNames(ctx.locale)).toLowerCase();
      return `${fn}.${ctx.rowIndex}@example.com`;
    }
    case 'int.range': {
      const min = field.intMin ?? 0;
      const max = field.intMax ?? 100;
      return min + Math.floor(ctx.rand() * (max - min + 1));
    }
    case 'date.recent': {
      const daysAgo = Math.floor(ctx.rand() * 30);
      const d = new Date(Date.now() - daysAgo * 86_400_000);
      return d.toISOString();
    }
    case 'enum':
      return field.enumValues && field.enumValues.length > 0
        ? pick(ctx.rand, field.enumValues)
        : 'unknown';
    case 'image.product':
      return `https://images.example.com/p/${ctx.rowIndex}.webp`;
    case 'lorem.sentence': {
      const len = 4 + Math.floor(ctx.rand() * 5);
      const words: string[] = [];
      for (let i = 0; i < len; i += 1) words.push(pick(ctx.rand, LOREM_WORDS));
      return words.join(' ');
    }
    case 'fk.ref': {
      const refs = field.fkModel ? ctx.refs[field.fkModel] ?? [] : [];
      if (refs.length === 0) return `ref-${field.fkModel ?? 'x'}-${ctx.rowIndex}`;
      return pick(ctx.rand, refs);
    }
  }
}

export function generateRows(
  model: SeedModel,
  count: number,
  fieldStrategies: Record<string, SeedStrategy>,
  locale: string,
  seed: number,
  refs: Record<string, ReadonlyArray<string>>,
): Array<Record<string, string | number | boolean>> {
  const rand = rng(seed + model.id.length);
  const rows: Array<Record<string, string | number | boolean>> = [];
  for (let i = 0; i < count; i += 1) {
    const row: Record<string, string | number | boolean> = {};
    for (const f of model.fields) {
      const s = fieldStrategies[f.name] ?? f.defaultStrategy;
      row[f.name] = generateValue(f, s, {
        rand,
        locale,
        rowIndex: i,
        modelId: model.id,
        refs,
      });
    }
    rows.push(row);
  }
  return rows;
}

// Topological order based on dependencies
export function dependencyOrder(): ReadonlyArray<SeedModel> {
  const out: SeedModel[] = [];
  const remaining = [...seedModels];
  const placed = new Set<string>();
  let guard = 0;
  while (remaining.length > 0 && guard < 50) {
    guard += 1;
    for (let i = 0; i < remaining.length; i += 1) {
      const m = remaining[i];
      if (!m) continue;
      if (m.dependsOn.every((d) => placed.has(d))) {
        out.push(m);
        placed.add(m.id);
        remaining.splice(i, 1);
        i -= 1;
      }
    }
  }
  return out;
}
