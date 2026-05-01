export type Availability = 'available' | 'busy' | 'out';

export interface Reviewer {
  id: string;
  name: string;
  initials: string;
  expertise: ReadonlyArray<string>;
  score: number; // 0-100
  availability: Availability;
  reason: string;
}

export const REVIEWERS: ReadonlyArray<Reviewer> = [
  {
    id: 'r1',
    name: 'Bao Nguyen',
    initials: 'BN',
    expertise: ['db', 'rsc', 'auth'],
    score: 92,
    availability: 'available',
    reason: 'Touched 4 of 6 changed files in the last 30d',
  },
  {
    id: 'r2',
    name: 'Avery Chen',
    initials: 'AC',
    expertise: ['rsc', 'forms'],
    score: 84,
    availability: 'available',
    reason: 'Reviewed 8 PRs in `app/(shop)` recently',
  },
  {
    id: 'r3',
    name: 'Cleo Diaz',
    initials: 'CD',
    expertise: ['design', 'i18n'],
    score: 71,
    availability: 'busy',
    reason: 'Owns design tokens; UI drift detected',
  },
  {
    id: 'r4',
    name: 'Dani Park',
    initials: 'DP',
    expertise: ['testing', 'qa'],
    score: 65,
    availability: 'available',
    reason: 'Author of 12 of the touched test files',
  },
  {
    id: 'r5',
    name: 'Ezra Patel',
    initials: 'EP',
    expertise: ['db', 'platform'],
    score: 58,
    availability: 'busy',
    reason: 'Owns `entities/user`; relevant schema impact',
  },
  {
    id: 'r6',
    name: 'Farah Lin',
    initials: 'FL',
    expertise: ['pm', 'spec'],
    score: 44,
    availability: 'available',
    reason: 'Spec author for the affected feature',
  },
  {
    id: 'r7',
    name: 'Greta Mori',
    initials: 'GM',
    expertise: ['perf', 'edge'],
    score: 38,
    availability: 'out',
    reason: 'Recently optimized adjacent route',
  },
  {
    id: 'r8',
    name: 'Hugo Bell',
    initials: 'HB',
    expertise: ['auth', 'security'],
    score: 31,
    availability: 'available',
    reason: 'Auth flow is touched by 1 file',
  },
];

export interface ChangedFile {
  file: string;
  area: string;
}

export const CHANGED_FILES: ReadonlyArray<ChangedFile> = [
  { file: 'app/(shop)/cart/page.tsx', area: 'rsc' },
  { file: 'app/api/orders/route.ts', area: 'db' },
  { file: 'entities/user/queries.ts', area: 'db' },
  { file: 'features/auth-flow-tracer/index.tsx', area: 'auth' },
  { file: 'shared/ui/button.tsx', area: 'design' },
  { file: 'tests/orders.spec.ts', area: 'testing' },
];

export const CHECKLIST: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'k1', label: 'Tests cover the new behavior' },
  { id: 'k2', label: 'No accessibility regressions' },
  { id: 'k3', label: 'Performance budgets respected' },
  { id: 'k4', label: 'Translations updated' },
  { id: 'k5', label: 'Migration / rollout plan documented' },
];
