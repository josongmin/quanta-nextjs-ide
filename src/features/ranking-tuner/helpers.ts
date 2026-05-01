import { SEARCH_INDEX, parseQuery, type SearchDoc } from '@features/search-playground/helpers';

export type SignalKey =
  | 'textRelevance'
  | 'popularity'
  | 'recency'
  | 'priceBoost'
  | 'inventoryAvailable'
  | 'personalizedScore';

export interface RankingSignal {
  key: SignalKey;
  label: string;
  description: string;
}

export const RANKING_SIGNALS: ReadonlyArray<RankingSignal> = [
  { key: 'textRelevance', label: 'Text relevance', description: 'BM25-like text match score' },
  { key: 'popularity', label: 'Popularity', description: 'Aggregated CTR / purchases' },
  { key: 'recency', label: 'Recency', description: 'Newer items boosted' },
  { key: 'priceBoost', label: 'Price boost', description: 'Lower prices boosted slightly' },
  { key: 'inventoryAvailable', label: 'Inventory', description: 'In-stock items boosted' },
  { key: 'personalizedScore', label: 'Personalized', description: 'Mock per-user affinity' },
];

export type WeightProfile = Record<SignalKey, number>;

export const PROFILE_CURRENT: WeightProfile = {
  textRelevance: 70,
  popularity: 50,
  recency: 20,
  priceBoost: 10,
  inventoryAvailable: 30,
  personalizedScore: 15,
};

export const PROFILE_EXPERIMENTAL: WeightProfile = {
  textRelevance: 80,
  popularity: 30,
  recency: 40,
  priceBoost: 15,
  inventoryAvailable: 25,
  personalizedScore: 35,
};

function textRelevance(doc: SearchDoc, terms: ReadonlyArray<string>): number {
  if (terms.length === 0) return 0.4;
  let score = 0;
  for (const t of terms) {
    if (doc.title.toLowerCase().includes(t)) score += 0.4;
    if (doc.description.toLowerCase().includes(t)) score += 0.15;
    if (doc.tags.some((g) => g.includes(t))) score += 0.2;
    if (doc.category.toLowerCase().includes(t)) score += 0.1;
  }
  return Math.min(1, score);
}

function rankDoc(doc: SearchDoc, terms: ReadonlyArray<string>, w: WeightProfile): number {
  const tr = textRelevance(doc, terms);
  const pop = doc.popularity / 100;
  const rec = 1 - doc.createdAtAgoDays / 365;
  const price = doc.price < 50 ? 1 : doc.price < 150 ? 0.6 : 0.3;
  const inv = doc.inventory > 0 ? 1 : 0;
  const personal = ((doc.id.charCodeAt(2) % 10) + (doc.popularity % 7)) / 17;
  return (
    (w.textRelevance / 100) * tr * 1.4 +
    (w.popularity / 100) * pop * 0.9 +
    (w.recency / 100) * rec * 0.6 +
    (w.priceBoost / 100) * price * 0.4 +
    (w.inventoryAvailable / 100) * inv * 0.3 +
    (w.personalizedScore / 100) * personal * 0.5
  );
}

export interface RankedHit {
  doc: SearchDoc;
  score: number;
  rank: number;
}

export function rankAll(query: string, w: WeightProfile, limit = 10): RankedHit[] {
  const parsed = parseQuery(query);
  const terms = [...parsed.required, ...parsed.bare, ...parsed.phrases];
  const arr = SEARCH_INDEX.map((doc) => ({
    doc,
    score: rankDoc(doc, terms, w),
  }));
  arr.sort((a, b) => b.score - a.score);
  return arr.slice(0, limit).map((h, i) => ({ ...h, rank: i + 1 }));
}

export function rankShift(idA: string, listB: ReadonlyArray<RankedHit>): number | 'new' {
  const idx = listB.findIndex((h) => h.doc.id === idA);
  if (idx === -1) return 'new';
  return idx + 1;
}

export interface LiftStats {
  avgRankDelta: number;
  top10Churn: number;
  ndcg: number;
}

export function computeLift(
  current: ReadonlyArray<RankedHit>,
  exp: ReadonlyArray<RankedHit>,
): LiftStats {
  const currentIds = new Map(current.map((h, i) => [h.doc.id, i + 1]));
  let deltaSum = 0;
  let churn = 0;
  for (const h of exp) {
    const c = currentIds.get(h.doc.id);
    if (c === undefined) churn++;
    else deltaSum += c - h.rank;
  }
  const avg = exp.length === 0 ? 0 : deltaSum / exp.length;
  // mock NDCG: similarity of top-N
  let overlap = 0;
  for (let i = 0; i < Math.min(current.length, exp.length); i++) {
    if (current[i]?.doc.id === exp[i]?.doc.id) overlap += 1 / Math.log2(i + 2);
  }
  const ideal = Array.from({ length: Math.min(current.length, exp.length) }, (_, i) => 1 / Math.log2(i + 2)).reduce(
    (a, b) => a + b,
    0,
  );
  return {
    avgRankDelta: Number(avg.toFixed(2)),
    top10Churn: churn,
    ndcg: ideal === 0 ? 0 : Number((overlap / ideal).toFixed(3)),
  };
}

export const PER_QUERY_BENCH: ReadonlyArray<{ q: string; winner: 'current' | 'experimental' | 'tie' }> = [
  { q: 'sweater wool', winner: 'experimental' },
  { q: 'jacket', winner: 'current' },
  { q: 'mug ceramic', winner: 'tie' },
  { q: 'shoe trail', winner: 'experimental' },
  { q: 'kettle', winner: 'experimental' },
  { q: 'pen', winner: 'current' },
];
