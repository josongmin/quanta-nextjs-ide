export type DeviceId =
  | 'iphone-15-pro'
  | 'iphone-se'
  | 'pixel-8'
  | 'galaxy-s24'
  | 'ipad-pro'
  | 'surface'
  | 'foldable'
  | 'watch';

export interface DeviceFrame {
  id: DeviceId;
  label: string;
  category: 'phone' | 'tablet' | 'laptop' | 'foldable' | 'wearable';
  width: number;
  height: number;
  safeTop: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
  dpr: number;
  notch: boolean;
}

export const devices: readonly DeviceFrame[] = [
  {
    id: 'iphone-15-pro',
    label: 'iPhone 15 Pro',
    category: 'phone',
    width: 393,
    height: 852,
    safeTop: 59,
    safeBottom: 34,
    safeLeft: 0,
    safeRight: 0,
    dpr: 3,
    notch: true,
  },
  {
    id: 'iphone-se',
    label: 'iPhone SE',
    category: 'phone',
    width: 375,
    height: 667,
    safeTop: 20,
    safeBottom: 0,
    safeLeft: 0,
    safeRight: 0,
    dpr: 2,
    notch: false,
  },
  {
    id: 'pixel-8',
    label: 'Pixel 8',
    category: 'phone',
    width: 412,
    height: 915,
    safeTop: 28,
    safeBottom: 24,
    safeLeft: 0,
    safeRight: 0,
    dpr: 2.625,
    notch: true,
  },
  {
    id: 'galaxy-s24',
    label: 'Galaxy S24',
    category: 'phone',
    width: 384,
    height: 832,
    safeTop: 24,
    safeBottom: 24,
    safeLeft: 0,
    safeRight: 0,
    dpr: 3,
    notch: true,
  },
  {
    id: 'ipad-pro',
    label: 'iPad Pro 11"',
    category: 'tablet',
    width: 834,
    height: 1194,
    safeTop: 24,
    safeBottom: 20,
    safeLeft: 0,
    safeRight: 0,
    dpr: 2,
    notch: false,
  },
  {
    id: 'surface',
    label: 'Surface Pro',
    category: 'laptop',
    width: 1368,
    height: 912,
    safeTop: 0,
    safeBottom: 0,
    safeLeft: 0,
    safeRight: 0,
    dpr: 1.5,
    notch: false,
  },
  {
    id: 'foldable',
    label: 'Galaxy Z Fold (open)',
    category: 'foldable',
    width: 768,
    height: 832,
    safeTop: 32,
    safeBottom: 24,
    safeLeft: 0,
    safeRight: 0,
    dpr: 2.5,
    notch: true,
  },
  {
    id: 'watch',
    label: 'Apple Watch (Ultra)',
    category: 'wearable',
    width: 205,
    height: 251,
    safeTop: 24,
    safeBottom: 24,
    safeLeft: 12,
    safeRight: 12,
    dpr: 2,
    notch: false,
  },
];

export interface ViewportCheck {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'warn';
  recommended: string;
}

export const viewportChecks: readonly ViewportCheck[] = [
  {
    id: 'meta-viewport',
    label: 'meta[name=viewport]',
    description: 'Required for responsive layouts on mobile.',
    status: 'pass',
    recommended:
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  },
  {
    id: 'viewport-fit',
    label: 'viewport-fit=cover',
    description:
      'Required to honor safe-area insets behind notch / home indicator.',
    status: 'warn',
    recommended:
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  },
  {
    id: 'theme-color',
    label: 'meta[name=theme-color]',
    description: 'Tints the iOS / Android browser chrome.',
    status: 'fail',
    recommended:
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />',
  },
  {
    id: 'apple-capable',
    label: 'apple-mobile-web-app-capable',
    description: 'Enables full-screen launch from iOS home screen.',
    status: 'fail',
    recommended:
      '<meta name="apple-mobile-web-app-capable" content="yes" />',
  },
  {
    id: 'mobile-capable',
    label: 'mobile-web-app-capable',
    description: 'Android equivalent of the Apple meta above.',
    status: 'fail',
    recommended: '<meta name="mobile-web-app-capable" content="yes" />',
  },
  {
    id: 'apple-status-bar',
    label: 'apple-mobile-web-app-status-bar-style',
    description: 'Controls the iOS status-bar overlay color.',
    status: 'pass',
    recommended:
      '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  },
];

export function deviceCss(d: DeviceFrame): string {
  return [
    `/* ${d.label} */`,
    `@media (width: ${d.width}px) and (height: ${d.height}px) and (-webkit-device-pixel-ratio: ${d.dpr}) {`,
    `  :root {`,
    `    --safe-top: env(safe-area-inset-top, ${d.safeTop}px);`,
    `    --safe-right: env(safe-area-inset-right, ${d.safeRight}px);`,
    `    --safe-bottom: env(safe-area-inset-bottom, ${d.safeBottom}px);`,
    `    --safe-left: env(safe-area-inset-left, ${d.safeLeft}px);`,
    `  }`,
    `  body { padding: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left); }`,
    `}`,
  ].join('\n');
}

export function aspectFit(d: DeviceFrame, max: number): {
  w: number;
  h: number;
} {
  const ratio = Math.min(max / d.width, max / d.height);
  return { w: Math.round(d.width * ratio), h: Math.round(d.height * ratio) };
}
