export interface VTPair {
  name: string;
  oldSel: string;
  newSel: string;
}

export interface VTPreset {
  id: string;
  name: string;
  duration: number;
  easing: string;
  pairs: ReadonlyArray<VTPair>;
  css: string;
}

export const presets: ReadonlyArray<VTPreset> = [
  {
    id: 'page-fade',
    name: 'page-fade',
    duration: 250,
    easing: 'cubic-bezier(.2, 0, 0, 1)',
    pairs: [{ name: 'page', oldSel: '.page', newSel: '.page' }],
    css: `::view-transition-old(page),
::view-transition-new(page) {
  animation-duration: 250ms;
  animation-timing-function: cubic-bezier(.2, 0, 0, 1);
}
::view-transition-old(page) { animation-name: vt-fade-out; }
::view-transition-new(page) { animation-name: vt-fade-in; }`,
  },
  {
    id: 'cross-fade',
    name: 'cross-fade',
    duration: 320,
    easing: 'ease-in-out',
    pairs: [
      { name: 'header', oldSel: '.h.old', newSel: '.h.new' },
      { name: 'body', oldSel: '.b.old', newSel: '.b.new' },
    ],
    css: `::view-transition-old(header),
::view-transition-new(header) {
  animation-duration: 320ms;
  animation-timing-function: ease-in-out;
  mix-blend-mode: normal;
}
::view-transition-old(body),
::view-transition-new(body) {
  animation-duration: 320ms;
  animation-timing-function: ease-in-out;
}`,
  },
  {
    id: 'shared-element-product',
    name: 'shared-element-product',
    duration: 480,
    easing: 'cubic-bezier(.4, 0, .2, 1)',
    pairs: [
      { name: 'product-image', oldSel: 'img.thumb', newSel: 'img.hero' },
      { name: 'product-title', oldSel: 'h3.title', newSel: 'h1.title' },
    ],
    css: `img.thumb { view-transition-name: product-image; }
img.hero  { view-transition-name: product-image; }
::view-transition-old(product-image),
::view-transition-new(product-image) {
  animation-duration: 480ms;
  animation-timing-function: cubic-bezier(.4, 0, .2, 1);
}`,
  },
];

export interface Frame {
  pct: number;
  label: string;
}

export const frames: ReadonlyArray<Frame> = [
  { pct: 0, label: 'start' },
  { pct: 25, label: '25%' },
  { pct: 50, label: '50%' },
  { pct: 75, label: '75%' },
  { pct: 100, label: 'end' },
];
