export type ReaderId = 'nvda' | 'voiceover' | 'talkback';
export type ReaderMode = 'browse' | 'focus' | 'forms';
export type PageId = '/' | '/products/[id]' | '/checkout' | '/login';

export interface ScriptStep {
  id: string;
  elementId: string; // matches PageElement.id
  role: string;
  name: string;
  state?: string;
  announce: string;
}

export interface PageElement {
  id: string;
  role: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLandmark?: boolean;
}

export interface PageMock {
  id: PageId;
  label: string;
  elements: readonly PageElement[];
  scripts: Record<ReaderMode, readonly ScriptStep[]>;
  issues: readonly Issue[];
}

export type IssueSeverity = 'err' | 'warn' | 'info';

export interface Issue {
  id: string;
  severity: IssueSeverity;
  rule: string;
  message: string;
  fix: string;
}

const homeElements: readonly PageElement[] = [
  { id: 'h-banner', role: 'banner', label: 'Header', x: 8, y: 8, width: 384, height: 36, isLandmark: true },
  { id: 'h-nav', role: 'navigation', label: 'Primary nav', x: 8, y: 50, width: 384, height: 28, isLandmark: true },
  { id: 'h-h1', role: 'heading', label: 'Welcome', x: 8, y: 90, width: 200, height: 24 },
  { id: 'h-img', role: 'img', label: 'Hero (no alt!)', x: 8, y: 124, width: 384, height: 110 },
  { id: 'h-cta', role: 'link', label: 'Shop now', x: 8, y: 244, width: 120, height: 36 },
  { id: 'h-h3', role: 'heading', label: 'Featured (h3)', x: 8, y: 290, width: 180, height: 20 },
];

const productElements: readonly PageElement[] = [
  { id: 'p-banner', role: 'banner', label: 'Header', x: 8, y: 8, width: 384, height: 36, isLandmark: true },
  { id: 'p-h1', role: 'heading', label: 'Pixel Carbon Tee', x: 8, y: 56, width: 250, height: 24 },
  { id: 'p-img', role: 'img', label: 'Product image · alt="Tee on model"', x: 8, y: 88, width: 384, height: 220 },
  { id: 'p-price', role: 'text', label: '$48.00', x: 8, y: 318, width: 120, height: 20 },
  { id: 'p-add', role: 'button', label: 'Add to cart', x: 8, y: 348, width: 160, height: 36 },
];

const checkoutElements: readonly PageElement[] = [
  { id: 'c-h1', role: 'heading', label: 'Checkout', x: 8, y: 8, width: 200, height: 24 },
  { id: 'c-form', role: 'form', label: 'Payment form', x: 8, y: 40, width: 384, height: 280, isLandmark: true },
  { id: 'c-name', role: 'textbox', label: 'Name (no label!)', x: 16, y: 56, width: 360, height: 32 },
  { id: 'c-email', role: 'textbox', label: 'Email', x: 16, y: 100, width: 360, height: 32 },
  { id: 'c-card', role: 'textbox', label: 'Card number', x: 16, y: 144, width: 360, height: 32 },
  { id: 'c-pay', role: 'button', label: 'Pay $48.00', x: 16, y: 188, width: 360, height: 40 },
];

const loginElements: readonly PageElement[] = [
  { id: 'l-h1', role: 'heading', label: 'Sign in', x: 8, y: 8, width: 160, height: 24 },
  { id: 'l-form', role: 'form', label: 'Login form', x: 8, y: 40, width: 384, height: 200, isLandmark: true },
  { id: 'l-email', role: 'textbox', label: 'Email', x: 16, y: 56, width: 360, height: 32 },
  { id: 'l-pw', role: 'textbox', label: 'Password', x: 16, y: 100, width: 360, height: 32 },
  { id: 'l-submit', role: 'button', label: 'Sign in', x: 16, y: 144, width: 360, height: 36 },
  { id: 'l-forgot', role: 'link', label: 'Forgot password', x: 16, y: 192, width: 140, height: 18 },
];

export const pages: readonly PageMock[] = [
  {
    id: '/',
    label: 'Home',
    elements: homeElements,
    scripts: {
      browse: [
        { id: 's1', elementId: 'h-banner', role: 'banner', name: 'Header', announce: 'Banner landmark' },
        { id: 's2', elementId: 'h-nav', role: 'navigation', name: 'Primary nav', announce: 'Navigation landmark, 4 links' },
        { id: 's3', elementId: 'h-h1', role: 'heading', name: 'Welcome', announce: 'Heading level 1, Welcome' },
        { id: 's4', elementId: 'h-img', role: 'img', name: '', announce: 'Image, unlabeled' },
        { id: 's5', elementId: 'h-cta', role: 'link', name: 'Shop now', announce: 'Link, Shop now' },
        { id: 's6', elementId: 'h-h3', role: 'heading', name: 'Featured', announce: 'Heading level 3, Featured (skipped h2)' },
      ],
      focus: [
        { id: 's1', elementId: 'h-nav', role: 'navigation', name: 'Primary nav', announce: 'Navigation, 4 links' },
        { id: 's2', elementId: 'h-cta', role: 'link', name: 'Shop now', announce: 'Link, Shop now' },
      ],
      forms: [],
    },
    issues: [
      { id: 'i1', severity: 'err', rule: 'image-alt', message: 'Hero image has no alt text', fix: 'Add alt="Featured spring collection"' },
      { id: 'i2', severity: 'warn', rule: 'heading-order', message: 'Heading skipped from h1 to h3', fix: 'Insert h2 between sections' },
    ],
  },
  {
    id: '/products/[id]',
    label: 'Product detail',
    elements: productElements,
    scripts: {
      browse: [
        { id: 's1', elementId: 'p-banner', role: 'banner', name: 'Header', announce: 'Banner landmark' },
        { id: 's2', elementId: 'p-h1', role: 'heading', name: 'Pixel Carbon Tee', announce: 'Heading level 1, Pixel Carbon Tee' },
        { id: 's3', elementId: 'p-img', role: 'img', name: 'Tee on model', announce: 'Image, Tee on model' },
        { id: 's4', elementId: 'p-price', role: 'text', name: '$48.00', announce: '48 dollars' },
        { id: 's5', elementId: 'p-add', role: 'button', name: 'Add to cart', state: 'enabled', announce: 'Button, Add to cart' },
      ],
      focus: [
        { id: 's1', elementId: 'p-add', role: 'button', name: 'Add to cart', announce: 'Button, Add to cart' },
      ],
      forms: [],
    },
    issues: [
      { id: 'i1', severity: 'info', rule: 'main-landmark', message: 'No <main> landmark on the page', fix: 'Wrap product content in <main>' },
    ],
  },
  {
    id: '/checkout',
    label: 'Checkout',
    elements: checkoutElements,
    scripts: {
      browse: [
        { id: 's1', elementId: 'c-h1', role: 'heading', name: 'Checkout', announce: 'Heading level 1, Checkout' },
        { id: 's2', elementId: 'c-form', role: 'form', name: 'Payment form', announce: 'Form, Payment form' },
        { id: 's3', elementId: 'c-name', role: 'textbox', name: '', announce: 'Edit text, unlabeled' },
        { id: 's4', elementId: 'c-email', role: 'textbox', name: 'Email', announce: 'Edit text, Email' },
        { id: 's5', elementId: 'c-card', role: 'textbox', name: 'Card number', announce: 'Edit text, Card number' },
        { id: 's6', elementId: 'c-pay', role: 'button', name: 'Pay $48.00', announce: 'Button, Pay 48 dollars' },
      ],
      focus: [
        { id: 's1', elementId: 'c-name', role: 'textbox', name: '', announce: 'Edit text, unlabeled (focus)' },
      ],
      forms: [
        { id: 's1', elementId: 'c-name', role: 'textbox', name: '', announce: 'Forms mode: Edit text, unlabeled' },
        { id: 's2', elementId: 'c-email', role: 'textbox', name: 'Email', announce: 'Edit text, Email, type to enter' },
        { id: 's3', elementId: 'c-card', role: 'textbox', name: 'Card number', announce: 'Edit text, Card number, 16 digits' },
      ],
    },
    issues: [
      { id: 'i1', severity: 'err', rule: 'form-label', message: 'Name input has no associated label', fix: 'Add <label htmlFor="name">Name</label>' },
      { id: 'i2', severity: 'warn', rule: 'autocomplete', message: 'Card field missing autocomplete="cc-number"', fix: 'Add autocomplete attribute' },
    ],
  },
  {
    id: '/login',
    label: 'Login',
    elements: loginElements,
    scripts: {
      browse: [
        { id: 's1', elementId: 'l-h1', role: 'heading', name: 'Sign in', announce: 'Heading level 1, Sign in' },
        { id: 's2', elementId: 'l-form', role: 'form', name: 'Login form', announce: 'Form, Login form' },
        { id: 's3', elementId: 'l-email', role: 'textbox', name: 'Email', announce: 'Edit text, Email' },
        { id: 's4', elementId: 'l-pw', role: 'textbox', name: 'Password', announce: 'Edit text, Password, secure' },
        { id: 's5', elementId: 'l-submit', role: 'button', name: 'Sign in', announce: 'Button, Sign in' },
        { id: 's6', elementId: 'l-forgot', role: 'link', name: 'Forgot password', announce: 'Link, Forgot password' },
      ],
      focus: [
        { id: 's1', elementId: 'l-email', role: 'textbox', name: 'Email', announce: 'Edit text, Email' },
      ],
      forms: [
        { id: 's1', elementId: 'l-email', role: 'textbox', name: 'Email', announce: 'Forms mode: Edit text, Email' },
        { id: 's2', elementId: 'l-pw', role: 'textbox', name: 'Password', announce: 'Edit text, Password, secure' },
      ],
    },
    issues: [
      { id: 'i1', severity: 'info', rule: 'autocomplete', message: 'Email lacks autocomplete="username"', fix: 'Add autocomplete="username"' },
    ],
  },
];

export const readers: readonly { id: ReaderId; label: string }[] = [
  { id: 'nvda', label: 'NVDA' },
  { id: 'voiceover', label: 'VoiceOver' },
  { id: 'talkback', label: 'TalkBack' },
];

export const modes: readonly { id: ReaderMode; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'focus', label: 'Focus' },
  { id: 'forms', label: 'Forms' },
];

export function readerPrefix(r: ReaderId): string {
  if (r === 'nvda') return 'NVDA';
  if (r === 'voiceover') return 'VO';
  return 'TB';
}
