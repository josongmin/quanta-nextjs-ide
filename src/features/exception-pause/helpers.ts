export type Runtime = 'node' | 'edge' | 'browser';

export interface ExFrame {
  id: string;
  fn: string;
  file: string;
  line: number;
  col: number;
  isUserCode: boolean;
}

export interface CauseLink {
  className: string;
  message: string;
}

export interface SuggestedFix {
  id: string;
  title: string;
  rationale: string;
  before: string;
  after: string;
}

export interface ExceptionState {
  className: string;
  message: string;
  runtime: Runtime;
  whereFile: string;
  whereLine: number;
  frames: ReadonlyArray<ExFrame>;
  causes: ReadonlyArray<CauseLink>;
  fixes: ReadonlyArray<SuggestedFix>;
  source: ReadonlyArray<string>;
  errorLineIndex: number; // index into source
  squiggleCol: { start: number; end: number };
}

export const RUNTIME_TONE: Record<Runtime, 'server' | 'edge' | 'client'> = {
  node: 'server',
  edge: 'edge',
  browser: 'client',
};

export const RUNTIME_LABEL: Record<Runtime, string> = {
  node: 'Node',
  edge: 'Edge',
  browser: 'Browser',
};

export const mockException: ExceptionState = {
  className: 'TypeError',
  message: "Cannot read properties of undefined (reading 'name')",
  runtime: 'node',
  whereFile: 'src/features/cart/render-line-item.tsx',
  whereLine: 38,
  frames: [
    {
      id: 'ef_0',
      fn: 'renderLineItem',
      file: 'src/features/cart/render-line-item.tsx',
      line: 38,
      col: 27,
      isUserCode: true,
    },
    {
      id: 'ef_1',
      fn: 'CartList',
      file: 'src/features/cart/cart-list.tsx',
      line: 22,
      col: 6,
      isUserCode: true,
    },
    {
      id: 'ef_2',
      fn: 'CartPage',
      file: 'src/app/(commerce)/cart/page.tsx',
      line: 14,
      col: 4,
      isUserCode: true,
    },
    {
      id: 'ef_3',
      fn: 'renderToReadableStream',
      file: 'react-server-dom-webpack/server.edge.js',
      line: 442,
      col: 1,
      isUserCode: false,
    },
    {
      id: 'ef_4',
      fn: 'createRSCStream',
      file: 'next/dist/server/app-render/create-rsc-stream.js',
      line: 211,
      col: 5,
      isUserCode: false,
    },
    {
      id: 'ef_5',
      fn: 'handler',
      file: 'next/dist/server/lib/router-server.js',
      line: 320,
      col: 12,
      isUserCode: false,
    },
    {
      id: 'ef_6',
      fn: 'processTicksAndRejections',
      file: 'node:internal/process/task_queues',
      line: 95,
      col: 5,
      isUserCode: false,
    },
    {
      id: 'ef_7',
      fn: '<anonymous>',
      file: 'node:internal/main/run_main_module',
      line: 23,
      col: 47,
      isUserCode: false,
    },
  ],
  causes: [
    { className: 'TypeError', message: "Cannot read properties of undefined (reading 'name')" },
    { className: 'AppError', message: 'failed to render cart line item' },
    { className: 'CacheMiss', message: 'product:sku_88421 not in cache' },
  ],
  fixes: [
    {
      id: 'fix_1',
      title: 'Guard against missing product',
      rationale: 'Item.product can be undefined when cache is cold',
      before: 'const label = item.product.name;',
      after: 'const label = item.product?.name ?? item.fallbackName;',
    },
    {
      id: 'fix_2',
      title: 'Hydrate product from cache before render',
      rationale: 'Pre-fetch product in parent before iterating items',
      before: 'items.map(renderLineItem)',
      after: 'await Promise.all(items.map(hydrateProduct));\nitems.map(renderLineItem)',
    },
    {
      id: 'fix_3',
      title: 'Filter incomplete items',
      rationale: 'Skip items missing a product reference entirely',
      before: 'items.map(renderLineItem)',
      after: 'items.filter(it => it.product).map(renderLineItem)',
    },
  ],
  source: [
    'export function renderLineItem(item: CartItem) {',
    '  const qty = item.quantity ?? 1;',
    '  const unitPrice = item.priceCents;',
    '',
    '  return (',
    '    <li className="line-item">',
    '      <span className="title">',
    '        {item.product.name}',
    '      </span>',
    '      <span className="qty">{qty}</span>',
    '      <Price cents={unitPrice * qty} />',
    '    </li>',
    '  );',
    '}',
  ],
  errorLineIndex: 7,
  squiggleCol: { start: 9, end: 25 },
};
