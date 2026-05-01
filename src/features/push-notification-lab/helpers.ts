export type PushKind = 'transactional' | 'promo' | 'system' | 'chat' | 'abandoned-cart';
export type DeviceTarget = 'ios-safari' | 'android-chrome' | 'desktop-chrome' | 'desktop-firefox';
export type Urgency = 'very-low' | 'low' | 'normal' | 'high';

export interface NotificationAction {
  action: string;
  title: string;
}

export interface PushNotificationDef {
  id: PushKind;
  label: string;
  title: string;
  body: string;
  iconUrl: string;
  imageUrl?: string;
  actions: ReadonlyArray<NotificationAction>;
  ttl: number;
  urgency: Urgency;
  badge: number;
}

export const PUSH_KINDS: ReadonlyArray<PushNotificationDef> = [
  {
    id: 'transactional',
    label: 'Transactional',
    title: 'Order #1284 shipped',
    body: 'Your order is on the way. Estimated delivery Tue, Mar 12.',
    iconUrl: '/icons/order.png',
    actions: [
      { action: 'track', title: 'Track' },
      { action: 'view', title: 'View order' },
    ],
    ttl: 86400,
    urgency: 'normal',
    badge: 1,
  },
  {
    id: 'promo',
    label: 'Promo',
    title: 'Flash sale — 24h only',
    body: 'Pro Annual is 30% off until tomorrow midnight.',
    iconUrl: '/icons/promo.png',
    imageUrl: '/images/promo-hero.jpg',
    actions: [{ action: 'shop', title: 'Shop now' }],
    ttl: 3600,
    urgency: 'low',
    badge: 0,
  },
  {
    id: 'system',
    label: 'System',
    title: 'Security alert',
    body: 'New sign-in from Chrome on macOS. If this wasn\'t you, secure your account.',
    iconUrl: '/icons/shield.png',
    actions: [
      { action: 'review', title: 'Review' },
      { action: 'dismiss', title: 'Not me' },
    ],
    ttl: 0,
    urgency: 'high',
    badge: 1,
  },
  {
    id: 'chat',
    label: 'Chat',
    title: 'Sam · 2 messages',
    body: 'Sam: Did the deploy go through? Sam: Looks like the preview is broken.',
    iconUrl: '/icons/chat.png',
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'mark-read', title: 'Mark read' },
    ],
    ttl: 600,
    urgency: 'high',
    badge: 2,
  },
  {
    id: 'abandoned-cart',
    label: 'Abandoned cart',
    title: 'You left something behind',
    body: '1× Pro Annual is waiting in your cart. 10% off if you check out today.',
    iconUrl: '/icons/cart.png',
    imageUrl: '/images/cart-hero.jpg',
    actions: [{ action: 'checkout', title: 'Resume checkout' }],
    ttl: 7200,
    urgency: 'low',
    badge: 0,
  },
];

export const DEVICE_TARGETS: ReadonlyArray<DeviceTarget> = [
  'ios-safari',
  'android-chrome',
  'desktop-chrome',
  'desktop-firefox',
];

export function deviceLabel(d: DeviceTarget): string {
  if (d === 'ios-safari') return 'iOS Safari';
  if (d === 'android-chrome') return 'Android Chrome';
  if (d === 'desktop-chrome') return 'Desktop Chrome';
  return 'Desktop Firefox';
}

export function buildPayload(n: PushNotificationDef): string {
  const obj: Record<string, unknown> = {
    title: n.title,
    body: n.body,
    icon: n.iconUrl,
    badge: n.badge,
    actions: n.actions,
    data: { kind: n.id },
    ttl: n.ttl,
    urgency: n.urgency,
  };
  if (n.imageUrl) obj.image = n.imageUrl;
  return JSON.stringify(obj, null, 2);
}

export interface RecentSend {
  id: string;
  kind: PushKind;
  target: DeviceTarget;
  at: string;
  status: 'delivered' | 'failed' | 'pending';
}

export const RECENT_SENDS: ReadonlyArray<RecentSend> = [
  { id: 'r1', kind: 'transactional', target: 'ios-safari', at: '2m ago', status: 'delivered' },
  { id: 'r2', kind: 'chat', target: 'android-chrome', at: '5m ago', status: 'delivered' },
  { id: 'r3', kind: 'promo', target: 'desktop-chrome', at: '12m ago', status: 'failed' },
  { id: 'r4', kind: 'system', target: 'desktop-firefox', at: '34m ago', status: 'delivered' },
  { id: 'r5', kind: 'abandoned-cart', target: 'ios-safari', at: '1h ago', status: 'pending' },
];

export const VAPID_PUBLIC_KEY =
  'BLNd1jK_mock_vapid_key_AbCdEf123456789hQwxyz_NoRealKeyHereJustMockData_aBcDeFgHiJkLmNoPqRsTuV';
