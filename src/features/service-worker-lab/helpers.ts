export type SwState = 'installing' | 'installed' | 'waiting' | 'active' | 'redundant';

export interface SwRegistration {
  scope: string;
  scriptURL: string;
  state: SwState;
  version: string;
  controlledClients: number;
  lastUpdateCheck: string;
}

export interface CacheBucket {
  name: string;
  entries: ReadonlyArray<{
    url: string;
    method: 'GET' | 'POST';
    status: number;
    bytes: number;
  }>;
}

export interface PushSubscription {
  endpoint: string;
  expirationTime: string | null;
  vapidKey: string;
  active: boolean;
  notifications: ReadonlyArray<{ id: string; title: string; ts: string }>;
}

export interface SyncTask {
  id: string;
  tag: string;
  retries: number;
  nextAttemptIn: string;
  payload: string;
}

export const registration: SwRegistration = {
  scope: '/',
  scriptURL: '/sw.js',
  state: 'active',
  version: 'v3.2.1',
  controlledClients: 4,
  lastUpdateCheck: '2 min ago',
};

export const cacheBuckets: ReadonlyArray<CacheBucket> = [
  {
    name: 'app-shell-v3',
    entries: [
      { url: '/', method: 'GET', status: 200, bytes: 18432 },
      { url: '/index.html', method: 'GET', status: 200, bytes: 4321 },
      { url: '/assets/main.js', method: 'GET', status: 200, bytes: 145820 },
      { url: '/assets/main.css', method: 'GET', status: 200, bytes: 22450 },
      { url: '/manifest.webmanifest', method: 'GET', status: 200, bytes: 612 },
    ],
  },
  {
    name: 'images-v2',
    entries: [
      { url: '/img/hero.jpg', method: 'GET', status: 200, bytes: 250100 },
      { url: '/img/logo.svg', method: 'GET', status: 200, bytes: 1832 },
      { url: '/img/avatar.png', method: 'GET', status: 200, bytes: 18244 },
    ],
  },
  {
    name: 'api-runtime-v1',
    entries: [
      {
        url: '/api/products?page=1',
        method: 'GET',
        status: 200,
        bytes: 5680,
      },
      { url: '/api/me', method: 'GET', status: 200, bytes: 942 },
    ],
  },
];

export const push: PushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/d_eyk4Pd…',
  expirationTime: null,
  vapidKey: 'BNc7-gIzN3v6mFm6gWk7sjHpRn2QkF…',
  active: true,
  notifications: [
    { id: 'n1', title: 'Welcome back!', ts: '14:02' },
    { id: 'n2', title: 'New comment on your PR', ts: '13:48' },
  ],
};

export const syncQueue: SyncTask[] = [
  {
    id: 's1',
    tag: 'sync-likes',
    retries: 1,
    nextAttemptIn: '32s',
    payload: '{"postId":"p_123","action":"like"}',
  },
  {
    id: 's2',
    tag: 'sync-comments',
    retries: 0,
    nextAttemptIn: 'now',
    payload: '{"postId":"p_88","comment":"…"}',
  },
  {
    id: 's3',
    tag: 'sync-uploads',
    retries: 3,
    nextAttemptIn: '4m',
    payload: '{"file":"upload_42.png"}',
  },
];

export function totalCacheBytes(): number {
  return cacheBuckets.reduce(
    (a, b) => a + b.entries.reduce((c, e) => c + e.bytes, 0),
    0,
  );
}
