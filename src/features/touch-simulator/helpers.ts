export type GestureKind =
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe-left'
  | 'swipe-right'
  | 'pinch'
  | 'rotate'
  | 'drag';

export interface GestureEvent {
  t: number; // ms offset
  type:
    | 'touchstart'
    | 'touchmove'
    | 'touchend'
    | 'touchcancel'
    | 'pointerdown'
    | 'pointerup';
  x: number;
  y: number;
  pointerId?: number;
  scale?: number;
  rotation?: number;
}

export interface GestureMeta {
  id: GestureKind;
  label: string;
  description: string;
  events: readonly GestureEvent[];
}

export const gestures: readonly GestureMeta[] = [
  {
    id: 'tap',
    label: 'Tap',
    description: 'Single touchstart → touchend within 200ms, < 5px movement.',
    events: [
      { t: 0, type: 'touchstart', x: 320, y: 180, pointerId: 1 },
      { t: 80, type: 'touchend', x: 320, y: 180, pointerId: 1 },
    ],
  },
  {
    id: 'double-tap',
    label: 'Double tap',
    description: 'Two taps within 300ms; pageZoom suppression recommended.',
    events: [
      { t: 0, type: 'touchstart', x: 320, y: 180, pointerId: 1 },
      { t: 60, type: 'touchend', x: 320, y: 180, pointerId: 1 },
      { t: 180, type: 'touchstart', x: 322, y: 181, pointerId: 1 },
      { t: 240, type: 'touchend', x: 322, y: 181, pointerId: 1 },
    ],
  },
  {
    id: 'long-press',
    label: 'Long press',
    description: 'Single touchstart held > 500ms with negligible movement.',
    events: [
      { t: 0, type: 'touchstart', x: 320, y: 180, pointerId: 1 },
      { t: 540, type: 'touchend', x: 320, y: 180, pointerId: 1 },
    ],
  },
  {
    id: 'swipe-left',
    label: 'Swipe left',
    description: 'Horizontal flick > 30px/s in negative-x direction.',
    events: [
      { t: 0, type: 'touchstart', x: 480, y: 180, pointerId: 1 },
      { t: 30, type: 'touchmove', x: 420, y: 182, pointerId: 1 },
      { t: 60, type: 'touchmove', x: 360, y: 184, pointerId: 1 },
      { t: 90, type: 'touchmove', x: 300, y: 184, pointerId: 1 },
      { t: 120, type: 'touchmove', x: 240, y: 184, pointerId: 1 },
      { t: 150, type: 'touchend', x: 200, y: 184, pointerId: 1 },
    ],
  },
  {
    id: 'swipe-right',
    label: 'Swipe right',
    description: 'Horizontal flick > 30px/s in positive-x direction.',
    events: [
      { t: 0, type: 'touchstart', x: 160, y: 180, pointerId: 1 },
      { t: 30, type: 'touchmove', x: 220, y: 182, pointerId: 1 },
      { t: 60, type: 'touchmove', x: 280, y: 184, pointerId: 1 },
      { t: 90, type: 'touchmove', x: 340, y: 184, pointerId: 1 },
      { t: 120, type: 'touchmove', x: 400, y: 184, pointerId: 1 },
      { t: 150, type: 'touchend', x: 440, y: 184, pointerId: 1 },
    ],
  },
  {
    id: 'pinch',
    label: 'Pinch',
    description: 'Two pointers converging; scale shrinks below 1.0.',
    events: [
      { t: 0, type: 'touchstart', x: 280, y: 180, pointerId: 1, scale: 1.0 },
      { t: 0, type: 'touchstart', x: 360, y: 180, pointerId: 2, scale: 1.0 },
      { t: 60, type: 'touchmove', x: 300, y: 180, pointerId: 1, scale: 0.85 },
      { t: 60, type: 'touchmove', x: 340, y: 180, pointerId: 2, scale: 0.85 },
      { t: 120, type: 'touchend', x: 320, y: 180, pointerId: 1, scale: 0.7 },
      { t: 120, type: 'touchend', x: 320, y: 180, pointerId: 2, scale: 0.7 },
    ],
  },
  {
    id: 'rotate',
    label: 'Rotate',
    description: 'Two pointers rotating about midpoint; rotation in degrees.',
    events: [
      { t: 0, type: 'touchstart', x: 280, y: 160, pointerId: 1, rotation: 0 },
      { t: 0, type: 'touchstart', x: 360, y: 200, pointerId: 2, rotation: 0 },
      { t: 80, type: 'touchmove', x: 300, y: 140, pointerId: 1, rotation: 18 },
      { t: 80, type: 'touchmove', x: 340, y: 220, pointerId: 2, rotation: 18 },
      { t: 160, type: 'touchend', x: 320, y: 130, pointerId: 1, rotation: 35 },
      { t: 160, type: 'touchend', x: 320, y: 230, pointerId: 2, rotation: 35 },
    ],
  },
  {
    id: 'drag',
    label: 'Drag',
    description: 'Sustained touchmove sequence with no release until target.',
    events: [
      { t: 0, type: 'touchstart', x: 200, y: 120, pointerId: 1 },
      { t: 50, type: 'touchmove', x: 240, y: 150, pointerId: 1 },
      { t: 100, type: 'touchmove', x: 280, y: 180, pointerId: 1 },
      { t: 150, type: 'touchmove', x: 320, y: 210, pointerId: 1 },
      { t: 200, type: 'touchmove', x: 360, y: 240, pointerId: 1 },
      { t: 260, type: 'touchend', x: 380, y: 250, pointerId: 1 },
    ],
  },
];

export interface TapTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selector: string;
}

export const tapTargets: readonly TapTarget[] = [
  {
    id: 't1',
    label: 'Header logo',
    x: 24,
    y: 18,
    width: 48,
    height: 48,
    selector: 'header > a.logo',
  },
  {
    id: 't2',
    label: 'Nav · Products',
    x: 96,
    y: 24,
    width: 72,
    height: 36,
    selector: 'nav a[href="/products"]',
  },
  {
    id: 't3',
    label: 'Nav · About',
    x: 184,
    y: 26,
    width: 60,
    height: 28,
    selector: 'nav a[href="/about"]',
  },
  {
    id: 't4',
    label: 'Cart icon',
    x: 568,
    y: 22,
    width: 44,
    height: 44,
    selector: 'header button.cart',
  },
  {
    id: 't5',
    label: 'Hero CTA',
    x: 220,
    y: 130,
    width: 200,
    height: 48,
    selector: 'section.hero a.cta',
  },
  {
    id: 't6',
    label: 'Card · Quick add',
    x: 60,
    y: 240,
    width: 30,
    height: 30,
    selector: 'article.card button.add',
  },
  {
    id: 't7',
    label: 'Card · Wishlist',
    x: 100,
    y: 244,
    width: 22,
    height: 22,
    selector: 'article.card button.wishlist',
  },
  {
    id: 't8',
    label: 'Footer link · Privacy',
    x: 480,
    y: 322,
    width: 80,
    height: 18,
    selector: 'footer a[href="/privacy"]',
  },
];

export type TargetTone = 'static' | 'warn' | 'err';

export function targetTone(t: TapTarget): TargetTone {
  const min = Math.min(t.width, t.height);
  if (min >= 44) return 'static';
  if (min >= 32) return 'warn';
  return 'err';
}

export function targetSizeLabel(t: TapTarget): string {
  return `${t.width}×${t.height}`;
}

export function formatEvent(e: GestureEvent): string {
  const parts = [
    `${e.t.toString().padStart(4, ' ')}ms`,
    e.type.padEnd(11, ' '),
    `(${e.x},${e.y})`,
  ];
  if (e.pointerId !== undefined) parts.push(`p${e.pointerId}`);
  if (e.scale !== undefined) parts.push(`scale=${e.scale.toFixed(2)}`);
  if (e.rotation !== undefined) parts.push(`rot=${e.rotation}°`);
  return parts.join('  ');
}
