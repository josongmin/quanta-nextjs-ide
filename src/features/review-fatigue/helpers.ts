export type Recommendation = 'pause' | 'fine' | 'onboard-helper';

export interface Reviewer {
  id: string;
  name: string;
  initials: string;
  reviewsThisWeek: number;
  avgResponseHrs: number;
  currentQueueDepth: number;
  trend8w: ReadonlyArray<number>; // 0-100 fatigue per week
  fatigueScore: number; // 0-100
  recommendation: Recommendation;
  area: string;
}

export const REVIEWERS: ReadonlyArray<Reviewer> = [
  {
    id: 'r1',
    name: 'Bao Nguyen',
    initials: 'BN',
    reviewsThisWeek: 14,
    avgResponseHrs: 3.2,
    currentQueueDepth: 7,
    trend8w: [40, 48, 55, 62, 70, 76, 82, 88],
    fatigueScore: 88,
    recommendation: 'pause',
    area: 'db',
  },
  {
    id: 'r2',
    name: 'Avery Chen',
    initials: 'AC',
    reviewsThisWeek: 9,
    avgResponseHrs: 5.4,
    currentQueueDepth: 4,
    trend8w: [30, 36, 38, 42, 50, 54, 58, 62],
    fatigueScore: 62,
    recommendation: 'onboard-helper',
    area: 'rsc',
  },
  {
    id: 'r3',
    name: 'Cleo Diaz',
    initials: 'CD',
    reviewsThisWeek: 5,
    avgResponseHrs: 8.0,
    currentQueueDepth: 2,
    trend8w: [22, 24, 26, 30, 32, 34, 38, 41],
    fatigueScore: 41,
    recommendation: 'fine',
    area: 'design',
  },
  {
    id: 'r4',
    name: 'Dani Park',
    initials: 'DP',
    reviewsThisWeek: 11,
    avgResponseHrs: 4.1,
    currentQueueDepth: 5,
    trend8w: [50, 55, 58, 60, 64, 68, 72, 75],
    fatigueScore: 75,
    recommendation: 'onboard-helper',
    area: 'testing',
  },
  {
    id: 'r5',
    name: 'Ezra Patel',
    initials: 'EP',
    reviewsThisWeek: 3,
    avgResponseHrs: 12.0,
    currentQueueDepth: 1,
    trend8w: [18, 20, 22, 24, 26, 28, 30, 32],
    fatigueScore: 32,
    recommendation: 'fine',
    area: 'platform',
  },
  {
    id: 'r6',
    name: 'Farah Lin',
    initials: 'FL',
    reviewsThisWeek: 7,
    avgResponseHrs: 6.2,
    currentQueueDepth: 3,
    trend8w: [28, 30, 34, 38, 42, 48, 52, 55],
    fatigueScore: 55,
    recommendation: 'fine',
    area: 'pm',
  },
  {
    id: 'r7',
    name: 'Greta Mori',
    initials: 'GM',
    reviewsThisWeek: 12,
    avgResponseHrs: 3.8,
    currentQueueDepth: 6,
    trend8w: [44, 50, 58, 62, 68, 74, 78, 82],
    fatigueScore: 82,
    recommendation: 'pause',
    area: 'perf',
  },
  {
    id: 'r8',
    name: 'Hugo Bell',
    initials: 'HB',
    reviewsThisWeek: 6,
    avgResponseHrs: 7.0,
    currentQueueDepth: 2,
    trend8w: [24, 26, 30, 32, 36, 40, 44, 48],
    fatigueScore: 48,
    recommendation: 'fine',
    area: 'auth',
  },
];

export type SortKey = 'fatigueScore' | 'queueDepth' | 'responseHrs';

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'fatigueScore', label: 'Fatigue' },
  { value: 'queueDepth', label: 'Queue depth' },
  { value: 'responseHrs', label: 'Response hrs' },
];

export function sortReviewers(
  list: ReadonlyArray<Reviewer>,
  by: SortKey,
): ReadonlyArray<Reviewer> {
  const arr = [...list];
  if (by === 'fatigueScore') arr.sort((a, b) => b.fatigueScore - a.fatigueScore);
  else if (by === 'queueDepth') arr.sort((a, b) => b.currentQueueDepth - a.currentQueueDepth);
  else arr.sort((a, b) => b.avgResponseHrs - a.avgResponseHrs);
  return arr;
}

export function teamFatigue(list: ReadonlyArray<Reviewer>): number {
  if (list.length === 0) return 0;
  const sum = list.reduce((s, r) => s + r.fatigueScore, 0);
  return Math.round(sum / list.length);
}

export const TEAM_SUGGESTIONS: ReadonlyArray<{ id: string; text: string }> = [
  { id: 't1', text: 'Add 1 helper to /db area — Bao is at 88% fatigue.' },
  { id: 't2', text: 'Reroute next 3 perf PRs away from Greta this week.' },
  { id: 't3', text: 'Pair Dani with Hugo on testing reviews — load balance.' },
  { id: 't4', text: 'Block all reviewers from > 5 active PRs at once.' },
];

export function recTone(r: Recommendation): 'err' | 'warn' | 'accent' {
  if (r === 'pause') return 'err';
  if (r === 'onboard-helper') return 'warn';
  return 'accent';
}

export function recLabel(r: Recommendation): string {
  if (r === 'pause') return 'pause';
  if (r === 'onboard-helper') return 'add helper';
  return 'fine';
}
