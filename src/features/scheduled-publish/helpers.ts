export type PublishStatus =
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

export interface ScheduledItem {
  readonly id: string;
  readonly contentType: 'Article' | 'Product' | 'LandingPage' | 'Author' | 'Category';
  readonly title: string;
  readonly scheduledFor: string;
  readonly hour: number;
  readonly day: 'today' | 'tomorrow' | 'this-week' | 'this-month';
  readonly author: string;
  readonly locale: string;
  readonly status: PublishStatus;
  readonly dependencies: ReadonlyArray<string>;
}

export const SCHEDULED_ITEMS: ReadonlyArray<ScheduledItem> = [
  {
    id: 'sp-001',
    contentType: 'Article',
    title: 'Spring Launch — running shoe lineup',
    scheduledFor: '2026-05-01 09:00',
    hour: 9,
    day: 'today',
    author: 'pmichel',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-002',
    contentType: 'LandingPage',
    title: 'Spring Launch — landing',
    scheduledFor: '2026-05-01 09:05',
    hour: 9,
    day: 'today',
    author: 'pmichel',
    locale: 'en',
    status: 'scheduled',
    dependencies: ['sp-001'],
  },
  {
    id: 'sp-003',
    contentType: 'Product',
    title: 'Trail runners — coal — KR',
    scheduledFor: '2026-05-01 11:30',
    hour: 11,
    day: 'today',
    author: 'kdoyle',
    locale: 'ko',
    status: 'publishing',
    dependencies: [],
  },
  {
    id: 'sp-004',
    contentType: 'Article',
    title: 'Care guide — merino socks',
    scheduledFor: '2026-05-01 14:00',
    hour: 14,
    day: 'today',
    author: 'amartin',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-005',
    contentType: 'Article',
    title: 'Press release — series B',
    scheduledFor: '2026-05-01 17:00',
    hour: 17,
    day: 'today',
    author: 'comms',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-006',
    contentType: 'Product',
    title: 'Reflective laces — JP',
    scheduledFor: '2026-05-01 19:00',
    hour: 19,
    day: 'today',
    author: 'kdoyle',
    locale: 'ja',
    status: 'failed',
    dependencies: [],
  },
  {
    id: 'sp-007',
    contentType: 'LandingPage',
    title: 'EU privacy update banner',
    scheduledFor: '2026-05-02 08:00',
    hour: 8,
    day: 'tomorrow',
    author: 'legal',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-008',
    contentType: 'Article',
    title: 'Mid-week feature — trail tips',
    scheduledFor: '2026-05-04 10:00',
    hour: 10,
    day: 'this-week',
    author: 'amartin',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-009',
    contentType: 'Author',
    title: 'New author profile — JJang',
    scheduledFor: '2026-05-05 09:00',
    hour: 9,
    day: 'this-week',
    author: 'pmichel',
    locale: 'ko',
    status: 'cancelled',
    dependencies: [],
  },
  {
    id: 'sp-010',
    contentType: 'Category',
    title: 'New category — Recovery',
    scheduledFor: '2026-05-06 12:00',
    hour: 12,
    day: 'this-week',
    author: 'pmichel',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-011',
    contentType: 'Article',
    title: 'Seasonal recap — May',
    scheduledFor: '2026-05-08 16:00',
    hour: 16,
    day: 'this-week',
    author: 'editorial',
    locale: 'en',
    status: 'scheduled',
    dependencies: ['sp-008'],
  },
  {
    id: 'sp-012',
    contentType: 'LandingPage',
    title: 'Father\'s day promo',
    scheduledFor: '2026-05-15 09:00',
    hour: 9,
    day: 'this-month',
    author: 'marketing',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-013',
    contentType: 'Product',
    title: 'New colorway — sun yellow',
    scheduledFor: '2026-05-20 10:00',
    hour: 10,
    day: 'this-month',
    author: 'kdoyle',
    locale: 'en',
    status: 'scheduled',
    dependencies: [],
  },
  {
    id: 'sp-014',
    contentType: 'Article',
    title: 'Q2 community wrap',
    scheduledFor: '2026-05-29 18:00',
    hour: 18,
    day: 'this-month',
    author: 'editorial',
    locale: 'en',
    status: 'published',
    dependencies: [],
  },
];

export type RangeId = 'today' | 'this-week' | 'this-month';

export const RANGES: ReadonlyArray<{ id: RangeId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This week' },
  { id: 'this-month', label: 'This month' },
];

export const STATUSES: ReadonlyArray<PublishStatus> = [
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
];

export const CONTENT_TYPES: ReadonlyArray<ScheduledItem['contentType']> = [
  'Article',
  'Product',
  'LandingPage',
  'Author',
  'Category',
];

export function statusTone(s: PublishStatus): 'static' | 'info' | 'warn' | 'err' | 'muted' {
  switch (s) {
    case 'published':
      return 'static';
    case 'publishing':
      return 'info';
    case 'scheduled':
      return 'warn';
    case 'failed':
      return 'err';
    case 'cancelled':
      return 'muted';
  }
}

export function statusFill(s: PublishStatus): string {
  switch (s) {
    case 'published':
      return 'fill-sem-static-soft';
    case 'publishing':
      return 'fill-sev-info-soft';
    case 'scheduled':
      return 'fill-sev-warn-soft';
    case 'failed':
      return 'fill-sev-err-soft';
    case 'cancelled':
      return 'fill-bg-subtle';
  }
}

export function statusStroke(s: PublishStatus): string {
  switch (s) {
    case 'published':
      return 'stroke-sem-static';
    case 'publishing':
      return 'stroke-sev-info';
    case 'scheduled':
      return 'stroke-sev-warn';
    case 'failed':
      return 'stroke-sev-err';
    case 'cancelled':
      return 'stroke-line';
  }
}

export function inRange(item: ScheduledItem, range: RangeId): boolean {
  if (range === 'today') return item.day === 'today';
  if (range === 'this-week') return item.day === 'today' || item.day === 'tomorrow' || item.day === 'this-week';
  return true;
}

export function statusCounts(items: ReadonlyArray<ScheduledItem>): Record<PublishStatus, number> {
  const out: Record<PublishStatus, number> = {
    scheduled: 0,
    publishing: 0,
    published: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const it of items) out[it.status]++;
  return out;
}
