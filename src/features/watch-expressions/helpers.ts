export type WatchStatus = 'ok' | 'err' | 'stale';

export interface HistoryPoint {
  at: number; // unix ms
  value: string;
  numeric?: number;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value: string;
  type: string;
  status: WatchStatus;
  lastEvaluatedMs: number;
  numeric?: number;
  history: ReadonlyArray<HistoryPoint>;
}

const NOW = 1_714_500_000_000;

export const initialWatches: ReadonlyArray<WatchExpression> = [
  {
    id: 'w_1',
    expression: 'product.priceCents',
    value: '12900',
    type: 'number',
    status: 'ok',
    lastEvaluatedMs: NOW - 200,
    numeric: 12900,
    history: [
      { at: NOW - 6000, value: '11900', numeric: 11900 },
      { at: NOW - 5000, value: '12100', numeric: 12100 },
      { at: NOW - 4000, value: '12400', numeric: 12400 },
      { at: NOW - 3000, value: '12600', numeric: 12600 },
      { at: NOW - 2000, value: '12800', numeric: 12800 },
      { at: NOW - 200, value: '12900', numeric: 12900 },
    ],
  },
  {
    id: 'w_2',
    expression: 'cart.items.length',
    value: '3',
    type: 'number',
    status: 'ok',
    lastEvaluatedMs: NOW - 800,
    numeric: 3,
    history: [
      { at: NOW - 6000, value: '0', numeric: 0 },
      { at: NOW - 5000, value: '1', numeric: 1 },
      { at: NOW - 4000, value: '1', numeric: 1 },
      { at: NOW - 3000, value: '2', numeric: 2 },
      { at: NOW - 2000, value: '2', numeric: 2 },
      { at: NOW - 800, value: '3', numeric: 3 },
    ],
  },
  {
    id: 'w_3',
    expression: 'session.user.email',
    value: '"shopper@example.com"',
    type: 'string',
    status: 'ok',
    lastEvaluatedMs: NOW - 400,
    history: [
      { at: NOW - 6000, value: 'undefined' },
      { at: NOW - 5000, value: 'undefined' },
      { at: NOW - 4000, value: '"shopper@example.com"' },
      { at: NOW - 3000, value: '"shopper@example.com"' },
      { at: NOW - 2000, value: '"shopper@example.com"' },
      { at: NOW - 400, value: '"shopper@example.com"' },
    ],
  },
  {
    id: 'w_4',
    expression: 'fetchProduct.cache.size',
    value: '7',
    type: 'number',
    status: 'ok',
    lastEvaluatedMs: NOW - 100,
    numeric: 7,
    history: [
      { at: NOW - 6000, value: '0', numeric: 0 },
      { at: NOW - 5000, value: '1', numeric: 1 },
      { at: NOW - 4000, value: '3', numeric: 3 },
      { at: NOW - 3000, value: '4', numeric: 4 },
      { at: NOW - 2000, value: '6', numeric: 6 },
      { at: NOW - 100, value: '7', numeric: 7 },
    ],
  },
  {
    id: 'w_5',
    expression: 'product.dimensions.width * product.dimensions.depth',
    value: '432',
    type: 'number',
    status: 'ok',
    lastEvaluatedMs: NOW - 300,
    numeric: 432,
    history: [
      { at: NOW - 6000, value: '432', numeric: 432 },
      { at: NOW - 5000, value: '432', numeric: 432 },
      { at: NOW - 4000, value: '432', numeric: 432 },
      { at: NOW - 3000, value: '432', numeric: 432 },
      { at: NOW - 2000, value: '432', numeric: 432 },
      { at: NOW - 300, value: '432', numeric: 432 },
    ],
  },
  {
    id: 'w_6',
    expression: 'request.headers.get("x-trace-id")',
    value: 'TypeError: headers.get is not a function',
    type: 'error',
    status: 'err',
    lastEvaluatedMs: NOW - 1500,
    history: [
      { at: NOW - 6000, value: 'TypeError: headers.get is not a function' },
      { at: NOW - 4000, value: 'TypeError: headers.get is not a function' },
      { at: NOW - 1500, value: 'TypeError: headers.get is not a function' },
    ],
  },
  {
    id: 'w_7',
    expression: 'isPreview',
    value: 'false',
    type: 'boolean',
    status: 'ok',
    lastEvaluatedMs: NOW - 700,
    history: [
      { at: NOW - 5000, value: 'false' },
      { at: NOW - 700, value: 'false' },
    ],
  },
  {
    id: 'w_8',
    expression: 'qty',
    value: '3',
    type: 'number',
    status: 'stale',
    lastEvaluatedMs: NOW - 9000,
    numeric: 3,
    history: [
      { at: NOW - 12000, value: '1', numeric: 1 },
      { at: NOW - 10000, value: '2', numeric: 2 },
      { at: NOW - 9000, value: '3', numeric: 3 },
    ],
  },
];

export const suggestedWatches: ReadonlyArray<{ expression: string; reason: string }> = [
  { expression: 'product.tags.length', reason: 'array in current frame' },
  { expression: 'session.userId', reason: 'recently accessed' },
  { expression: 'cacheTags[0]', reason: 'closure variable' },
  { expression: 'request.method', reason: 'recently accessed' },
];

export const STATUS_TONE: Record<
  WatchStatus,
  'accent' | 'err' | 'warn'
> = {
  ok: 'accent',
  err: 'err',
  stale: 'warn',
};

export const STATUS_LABEL: Record<WatchStatus, string> = {
  ok: 'OK',
  err: 'ERR',
  stale: 'STALE',
};

export function fmtRelative(now: number, then: number): string {
  const ms = now - then;
  if (ms < 1000) return `${ms}ms ago`;
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  return `${Math.floor(ms / 60_000)}m ago`;
}
