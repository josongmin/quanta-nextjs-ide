export interface SearchDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  tags: ReadonlyArray<string>;
  popularity: number;
  inventory: number;
  createdAtAgoDays: number;
}

const CATEGORIES = ['Apparel', 'Home', 'Electronics', 'Outdoor', 'Books', 'Beauty'];
const TAGS = ['new', 'sale', 'pro', 'eco', 'kids', 'limited', 'top-rated', 'bestseller'];

function rngFn(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return (s >>> 0) / 0x80000000;
  };
}

const TITLES: ReadonlyArray<string> = [
  'Merino wool sweater', 'Linen short sleeve shirt', 'Recycled cotton hoodie',
  'Stainless travel mug', 'Ceramic pour-over kettle', 'Bamboo cutting board',
  'Wireless noise-cancel headphones', 'Mechanical keyboard 65%', 'Ultrawide monitor 34"',
  'Hiking trail running shoe', 'Down puffer jacket', 'Insulated water bottle',
  'Hardcover notebook', 'Pocket sketchbook', 'Fountain pen starter kit',
  'Mineral sunscreen SPF50', 'Vitamin C serum', 'Bamboo toothbrush set',
  'Standing desk converter', 'LED desk lamp', 'Aluminum monitor stand',
  'Cast iron skillet 12"', 'Enamel dutch oven', 'Wooden salad bowl',
  'Smart thermostat v3', 'HEPA air purifier', 'Robot vacuum slim',
  'Yoga mat eco', 'Resistance bands set', 'Compact massage gun',
  'Kids science kit', 'Wooden train set', 'Plush dinosaur',
  'Gardening glove set', 'Compost bin steel', 'Seed starter tray',
  'Espresso grinder', 'French press', 'AeroPress brewer',
  'Bluetooth speaker mini', 'Soundbar 2.1', 'Earbuds active',
  'Camera tripod', 'Lens cleaning kit', 'Memory card 128GB',
  'Trail backpack 30L', 'Daypack 18L', 'Travel cube set',
  'Reusable shopping tote', 'Glass food storage', 'Beeswax wraps',
  'Cookbook: Pantry', 'Novel: The Quiet Sea', 'Poetry: Ash & Light',
  'Hand cream lavender', 'Lip balm trio', 'Body oil neroli',
  'Wool blanket throw', 'Linen duvet cover', 'Down pillow',
];

export const SYNONYMS: ReadonlyArray<{ a: string; b: string }> = [
  { a: 'shirt', b: 'tee' },
  { a: 'sweater', b: 'jumper' },
  { a: 'hoodie', b: 'pullover' },
  { a: 'shoe', b: 'sneaker' },
  { a: 'mug', b: 'cup' },
  { a: 'pen', b: 'fountain pen' },
  { a: 'puffer', b: 'down jacket' },
  { a: 'kettle', b: 'teapot' },
];

function buildIndex(): SearchDoc[] {
  const rng = rngFn(13);
  const out: SearchDoc[] = [];
  for (let i = 0; i < TITLES.length; i++) {
    const title = TITLES[i] ?? `Product ${i}`;
    const cat = CATEGORIES[Math.floor(rng() * CATEGORIES.length)] ?? 'Home';
    const price = Math.round(rng() * 240) + 8;
    const popularity = Math.round(rng() * 100);
    const inv = Math.round(rng() * 80);
    const tagCount = 1 + Math.floor(rng() * 3);
    const tags: string[] = [];
    for (let k = 0; k < tagCount; k++) {
      const t = TAGS[Math.floor(rng() * TAGS.length)];
      if (t && !tags.includes(t)) tags.push(t);
    }
    out.push({
      id: `p-${i}`,
      title,
      description: `${title} — ${cat.toLowerCase()} essential. ${tags.join(', ')}.`,
      category: cat,
      price,
      tags,
      popularity,
      inventory: inv,
      createdAtAgoDays: Math.round(rng() * 365),
    });
  }
  return out;
}

export const SEARCH_INDEX: ReadonlyArray<SearchDoc> = buildIndex();

export const SEARCH_ATTRIBUTES = ['title', 'description', 'category', 'tags'] as const;
export type SearchAttribute = (typeof SEARCH_ATTRIBUTES)[number];

export interface ParsedQuery {
  required: ReadonlyArray<string>;
  excluded: ReadonlyArray<string>;
  phrases: ReadonlyArray<string>;
  bare: ReadonlyArray<string>;
}

export function parseQuery(q: string): ParsedQuery {
  const required: string[] = [];
  const excluded: string[] = [];
  const phrases: string[] = [];
  const bare: string[] = [];
  const re = /"([^"]+)"|(\+\S+)|(-\S+)|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q)) !== null) {
    if (m[1] !== undefined) phrases.push(m[1].toLowerCase());
    else if (m[2] !== undefined) required.push(m[2].slice(1).toLowerCase());
    else if (m[3] !== undefined) excluded.push(m[3].slice(1).toLowerCase());
    else if (m[4] !== undefined) bare.push(m[4].toLowerCase());
  }
  return { required, excluded, phrases, bare };
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  matches: ReadonlyArray<string>;
}

export interface SearchResult {
  hits: ReadonlyArray<SearchHit>;
  totalHits: number;
  ms: number;
  facets: Record<string, ReadonlyArray<{ key: string; count: number }>>;
}

export interface SearchFilters {
  categories: ReadonlySet<string>;
  priceRange: 'all' | 'lt50' | '50-150' | 'gt150';
  attrs: ReadonlySet<SearchAttribute>;
}

function matchAttr(doc: SearchDoc, term: string, attrs: ReadonlySet<SearchAttribute>): boolean {
  const t = term.toLowerCase();
  if (attrs.has('title') && doc.title.toLowerCase().includes(t)) return true;
  if (attrs.has('description') && doc.description.toLowerCase().includes(t)) return true;
  if (attrs.has('category') && doc.category.toLowerCase().includes(t)) return true;
  if (attrs.has('tags') && doc.tags.some((tag) => tag.toLowerCase().includes(t))) return true;
  return false;
}

export function runSearch(query: string, filters: SearchFilters): SearchResult {
  const start = performance.now();
  const parsed = parseQuery(query);
  const hits: SearchHit[] = [];
  for (const doc of SEARCH_INDEX) {
    if (filters.categories.size > 0 && !filters.categories.has(doc.category)) continue;
    if (filters.priceRange === 'lt50' && doc.price >= 50) continue;
    if (filters.priceRange === '50-150' && (doc.price < 50 || doc.price > 150)) continue;
    if (filters.priceRange === 'gt150' && doc.price <= 150) continue;

    let score = 0;
    const matches: string[] = [];
    let excluded = false;

    for (const t of parsed.excluded) {
      if (matchAttr(doc, t, filters.attrs)) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;

    let allRequired = true;
    for (const t of parsed.required) {
      if (!matchAttr(doc, t, filters.attrs)) {
        allRequired = false;
        break;
      }
      score += 8;
      matches.push(t);
    }
    if (!allRequired) continue;

    for (const ph of parsed.phrases) {
      const inTitle = doc.title.toLowerCase().includes(ph);
      const inDesc = doc.description.toLowerCase().includes(ph);
      if (!inTitle && !inDesc) {
        allRequired = false;
        break;
      }
      score += inTitle ? 12 : 6;
      matches.push(ph);
    }
    if (!allRequired) continue;

    for (const b of parsed.bare) {
      if (matchAttr(doc, b, filters.attrs)) {
        score += doc.title.toLowerCase().includes(b) ? 5 : 2;
        matches.push(b);
      }
    }
    if (parsed.bare.length > 0 && matches.length === 0) continue;

    if (parsed.required.length === 0 && parsed.phrases.length === 0 && parsed.bare.length === 0) {
      score = doc.popularity / 20;
    }
    score += doc.popularity / 50;
    if (score > 0) {
      hits.push({ doc, score, matches });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const ms = Math.max(0.4, performance.now() - start);
  // facets
  const cats: Record<string, number> = {};
  const tags: Record<string, number> = {};
  for (const h of hits) {
    cats[h.doc.category] = (cats[h.doc.category] ?? 0) + 1;
    for (const t of h.doc.tags) tags[t] = (tags[t] ?? 0) + 1;
  }
  return {
    hits: hits.slice(0, 20),
    totalHits: hits.length,
    ms: Number(ms.toFixed(2)),
    facets: {
      category: Object.entries(cats)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count),
      tags: Object.entries(tags)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    },
  };
}

export function highlight(text: string, terms: ReadonlyArray<string>): Array<{ text: string; hit: boolean }> {
  if (terms.length === 0) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const hits: Array<{ start: number; end: number }> = [];
  for (const t of terms) {
    if (!t) continue;
    let from = 0;
    while (true) {
      const idx = lower.indexOf(t, from);
      if (idx === -1) break;
      hits.push({ start: idx, end: idx + t.length });
      from = idx + t.length;
    }
  }
  hits.sort((a, b) => a.start - b.start);
  // merge overlapping
  const merged: Array<{ start: number; end: number }> = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.start <= last.end) {
      last.end = Math.max(last.end, h.end);
    } else {
      merged.push({ ...h });
    }
  }
  if (merged.length === 0) return [{ text, hit: false }];
  const out: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const m of merged) {
    if (cursor < m.start) out.push({ text: text.slice(cursor, m.start), hit: false });
    out.push({ text: text.slice(m.start, m.end), hit: true });
    cursor = m.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false });
  return out;
}

export const RECENT_QUERIES: ReadonlyArray<string> = [
  'merino +sweater',
  '"down jacket"',
  'shoe -kids',
  'speaker bluetooth',
  'mug ceramic',
  '+pen',
  '"yoga mat"',
  'sale -limited',
];
