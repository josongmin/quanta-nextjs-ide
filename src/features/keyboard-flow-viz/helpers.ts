export type Anomaly = 'skip' | 'loop' | 'unreachable' | 'out-of-trap' | null;

export interface Focusable {
  id: string;
  role: string;
  label: string;
  tabIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  group?: 'page' | 'modal-1' | 'modal-2';
  anomaly: Anomaly;
}

export interface ModalTrap {
  id: string;
  label: string;
  trapInstalled: boolean;
  firstFocus: string;
  restoresOnClose: boolean;
  firstFocusElementId: string;
}

export interface PageMock {
  id: string;
  label: string;
  focusables: readonly Focusable[];
  modals: readonly ModalTrap[];
}

export const pages: readonly PageMock[] = [
  {
    id: 'home',
    label: 'Home page',
    focusables: [
      { id: 'f1', role: 'a', label: 'Skip to content', tabIndex: 0, x: 12, y: 8, width: 130, height: 24, anomaly: null },
      { id: 'f2', role: 'a', label: 'Logo', tabIndex: 0, x: 12, y: 40, width: 50, height: 28, anomaly: null },
      { id: 'f3', role: 'a', label: 'Nav · Products', tabIndex: 0, x: 80, y: 44, width: 80, height: 22, anomaly: null },
      { id: 'f4', role: 'a', label: 'Nav · Pricing', tabIndex: 0, x: 170, y: 44, width: 70, height: 22, anomaly: null },
      { id: 'f5', role: 'button', label: 'Cart (icon-only)', tabIndex: 0, x: 700, y: 40, width: 32, height: 32, anomaly: null },
      { id: 'f6', role: 'button', label: 'Open menu', tabIndex: 3, x: 740, y: 40, width: 32, height: 32, anomaly: 'skip' },
      { id: 'f7', role: 'h1', label: 'Hero heading', tabIndex: -1, x: 40, y: 100, width: 320, height: 32, anomaly: 'unreachable' },
      { id: 'f8', role: 'a', label: 'Hero CTA', tabIndex: 0, x: 40, y: 144, width: 140, height: 36, anomaly: null },
      { id: 'f9', role: 'a', label: 'Card 1', tabIndex: 0, x: 40, y: 200, width: 200, height: 80, anomaly: null },
      { id: 'f10', role: 'a', label: 'Card 2', tabIndex: 0, x: 260, y: 200, width: 200, height: 80, anomaly: null },
      { id: 'f11', role: 'a', label: 'Card 3', tabIndex: 0, x: 480, y: 200, width: 200, height: 80, anomaly: 'loop' },
      { id: 'f12', role: 'input', label: 'Newsletter email', tabIndex: 0, x: 40, y: 320, width: 240, height: 30, anomaly: null },
      { id: 'f13', role: 'button', label: 'Subscribe', tabIndex: 0, x: 290, y: 320, width: 100, height: 30, anomaly: null },
      { id: 'm1-1', role: 'button', label: 'Modal · Confirm', tabIndex: 0, x: 240, y: 360, width: 120, height: 28, group: 'modal-1', anomaly: 'out-of-trap' },
    ],
    modals: [
      {
        id: 'modal-1',
        label: 'Confirm dialog',
        trapInstalled: false,
        firstFocus: '(no autofocus)',
        restoresOnClose: false,
        firstFocusElementId: 'm1-1',
      },
      {
        id: 'modal-2',
        label: 'Sign-in dialog',
        trapInstalled: true,
        firstFocus: 'Email field',
        restoresOnClose: true,
        firstFocusElementId: 'f12',
      },
    ],
  },
];

export function tabOrder(focusables: readonly Focusable[]): readonly Focusable[] {
  const positive = focusables
    .filter((f) => f.tabIndex > 0)
    .slice()
    .sort((a, b) => a.tabIndex - b.tabIndex);
  const zero = focusables.filter((f) => f.tabIndex === 0);
  return [...positive, ...zero];
}

export function anomalyLabel(a: Anomaly): string {
  if (a === 'skip') return 'tabIndex skip';
  if (a === 'loop') return 'loops back';
  if (a === 'unreachable') return 'unreachable';
  if (a === 'out-of-trap') return 'leaks from modal';
  return 'ok';
}

export function anomalyTone(a: Anomaly): 'static' | 'warn' | 'err' | 'info' {
  if (a === null) return 'static';
  if (a === 'skip') return 'warn';
  if (a === 'loop') return 'info';
  return 'err';
}
