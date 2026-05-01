export type FileKind = 'route' | 'component' | 'action' | 'schema' | 'test' | 'config' | 'style';

export interface RecentFile {
  id: string;
  name: string;
  path: string;
  kind: FileKind;
  ts: number;
}

export interface ChangedTab {
  id: string;
  name: string;
  path: string;
  kind: FileKind;
  adds: number;
  removes: number;
}

const NOW = 1_714_500_000_000;

export const RECENT_FILES: ReadonlyArray<RecentFile> = [
  { id: 'f_01', name: 'page.tsx', path: 'src/app/(shop)/products/[id]', kind: 'route', ts: NOW - 30_000 },
  { id: 'f_02', name: 'Cart.tsx', path: 'src/components', kind: 'component', ts: NOW - 90_000 },
  { id: 'f_03', name: 'checkout.ts', path: 'src/app/api/checkout', kind: 'action', ts: NOW - 4 * 60_000 },
  { id: 'f_04', name: 'schema.ts', path: 'src/lib/db', kind: 'schema', ts: NOW - 8 * 60_000 },
  { id: 'f_05', name: 'pricing.test.ts', path: 'src/lib', kind: 'test', ts: NOW - 12 * 60_000 },
  { id: 'f_06', name: 'route.ts', path: 'src/app/api/products', kind: 'action', ts: NOW - 18 * 60_000 },
  { id: 'f_07', name: 'tailwind.config.ts', path: '.', kind: 'config', ts: NOW - 22 * 60_000 },
  { id: 'f_08', name: 'Header.tsx', path: 'src/components/layout', kind: 'component', ts: NOW - 30 * 60_000 },
  { id: 'f_09', name: 'globals.css', path: 'src/app', kind: 'style', ts: NOW - 45 * 60_000 },
  { id: 'f_10', name: 'middleware.ts', path: 'src', kind: 'config', ts: NOW - 50 * 60_000 },
  { id: 'f_11', name: 'Button.tsx', path: 'src/shared/ui', kind: 'component', ts: NOW - 80 * 60_000 },
  { id: 'f_12', name: 'page.tsx', path: 'src/app/(shop)/cart', kind: 'route', ts: NOW - 120 * 60_000 },
  { id: 'f_13', name: 'auth.ts', path: 'src/lib', kind: 'config', ts: NOW - 180 * 60_000 },
  { id: 'f_14', name: 'orders.test.ts', path: 'src/lib', kind: 'test', ts: NOW - 240 * 60_000 },
];

export const CHANGED_TABS: ReadonlyArray<ChangedTab> = [
  { id: 't_01', name: 'page.tsx', path: 'src/app/(shop)/products/[id]', kind: 'route', adds: 12, removes: 3 },
  { id: 't_02', name: 'schema.ts', path: 'src/lib/db', kind: 'schema', adds: 8, removes: 2 },
  { id: 't_03', name: 'Cart.tsx', path: 'src/components', kind: 'component', adds: 24, removes: 11 },
  { id: 't_04', name: 'checkout.ts', path: 'src/app/api/checkout', kind: 'action', adds: 5, removes: 1 },
  { id: 't_05', name: 'pricing.test.ts', path: 'src/lib', kind: 'test', adds: 17, removes: 0 },
];

export function relativeTime(ts: number, now = NOW): string {
  const ms = now - ts;
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

export function kindLetter(k: FileKind): string {
  switch (k) {
    case 'route': return 'R';
    case 'component': return 'C';
    case 'action': return 'A';
    case 'schema': return 'S';
    case 'test': return 'T';
    case 'config': return '⚙';
    case 'style': return '#';
  }
}

export function kindTone(
  k: FileKind,
): 'static' | 'accent' | 'info' | 'warn' | 'neutral' | 'static' {
  switch (k) {
    case 'route': return 'accent';
    case 'component': return 'info';
    case 'action': return 'warn';
    case 'schema': return 'static';
    case 'test': return 'info';
    case 'config': return 'neutral';
    case 'style': return 'neutral';
  }
}
