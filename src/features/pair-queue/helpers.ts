export interface Teammate {
  id: string;
  name: string;
  initials: string;
  role: string;
  expertise: ReadonlyArray<string>;
  energy: number; // 0-100
  topic: string;
}

export interface ActivePair {
  id: string;
  a: { initials: string; name: string };
  b: { initials: string; name: string };
  startedAt: number; // ms epoch
  focus: string;
  mood: string; // emoji-style chip word
}

export const TEAMMATES: ReadonlyArray<Teammate> = [
  {
    id: 'p1',
    name: 'Bao Nguyen',
    initials: 'BN',
    role: 'Backend',
    expertise: ['db', 'rsc', 'auth'],
    energy: 78,
    topic: 'orders schema migration',
  },
  {
    id: 'p2',
    name: 'Avery Chen',
    initials: 'AC',
    role: 'Full-stack',
    expertise: ['rsc', 'forms', 'design'],
    energy: 62,
    topic: 'checkout validation',
  },
  {
    id: 'p3',
    name: 'Cleo Diaz',
    initials: 'CD',
    role: 'Design eng',
    expertise: ['design', 'i18n', 'a11y'],
    energy: 50,
    topic: 'dialog focus traps',
  },
  {
    id: 'p4',
    name: 'Dani Park',
    initials: 'DP',
    role: 'QA',
    expertise: ['testing', 'qa', 'forms'],
    energy: 84,
    topic: 'flake hunt in cart specs',
  },
  {
    id: 'p5',
    name: 'Ezra Patel',
    initials: 'EP',
    role: 'Platform',
    expertise: ['db', 'platform', 'edge'],
    energy: 35,
    topic: 'cache key invalidation',
  },
  {
    id: 'p6',
    name: 'Farah Lin',
    initials: 'FL',
    role: 'PM eng',
    expertise: ['spec', 'pm', 'rsc'],
    energy: 70,
    topic: 'scope cut for v2',
  },
];

export const ACTIVE_PAIRS: ReadonlyArray<ActivePair> = [
  {
    id: 'ap1',
    a: { initials: 'GM', name: 'Greta Mori' },
    b: { initials: 'HB', name: 'Hugo Bell' },
    startedAt: Date.now() - 1000 * 60 * 42,
    focus: 'edge auth handshake',
    mood: 'flowing',
  },
  {
    id: 'ap2',
    a: { initials: 'IS', name: 'Iris Sato' },
    b: { initials: 'JM', name: 'Jay Moss' },
    startedAt: Date.now() - 1000 * 60 * 12,
    focus: 'image format audit',
    mood: 'warming up',
  },
  {
    id: 'ap3',
    a: { initials: 'KW', name: 'Kai Werner' },
    b: { initials: 'LP', name: 'Lina Park' },
    startedAt: Date.now() - 1000 * 60 * 78,
    focus: 'webhook retry policy',
    mood: 'deep',
  },
  {
    id: 'ap4',
    a: { initials: 'MO', name: 'Mira Ortiz' },
    b: { initials: 'NS', name: 'Nico Silva' },
    startedAt: Date.now() - 1000 * 60 * 6,
    focus: 'design tokens drift',
    mood: 'starting',
  },
];

export const ALL_TOPICS: ReadonlyArray<string> = (() => {
  const set = new Set<string>();
  for (const t of TEAMMATES) for (const tag of t.expertise) set.add(tag);
  return [...set].sort();
})();

export function fmtDuration(startedAt: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m - h * 60;
  return `${h}h ${mm}m`;
}

export interface MatchSuggestion {
  a: Teammate;
  b: Teammate;
  reason: string;
  score: number;
}

export function suggestMatch(
  list: ReadonlyArray<Teammate>,
): MatchSuggestion | null {
  if (list.length < 2) return null;
  let best: MatchSuggestion | null = null;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      const overlap = a.expertise.filter((t) => b.expertise.includes(t)).length;
      const energyComplement = 100 - Math.abs(a.energy - b.energy);
      const score = overlap * 30 + energyComplement * 0.5;
      if (!best || score > best.score) {
        best = {
          a,
          b,
          score,
          reason:
            overlap > 0
              ? `${overlap} shared tag${overlap === 1 ? '' : 's'} · complementary energy (${a.energy}/${b.energy})`
              : `complementary energy (${a.energy}/${b.energy})`,
        };
      }
    }
  }
  return best;
}
