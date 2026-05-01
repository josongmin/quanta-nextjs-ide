import type { ModuleEnvironment, RscChunk } from '@shared/types/rsc-payload';

/**
 * Mock module chunks below carry payloads whose chunk paths do not reference
 * the Next.js runtime / RSC internals, so the environment-detection heuristic
 * (see `entities/rsc-payload/model/parser.ts#detectEnvironment`) would always
 * yield `'client'`. Inlining the constant here removes the upward dependency
 * (`shared` -> `entities`) without changing observable behaviour.
 */
const MODULE_ENV: ModuleEnvironment = 'client';

const rawMockChunks: ReadonlyArray<RscChunk> = [
  {
    id: '0:',
    kind: 'hint',
    payload: 'M{"id":"./components/RootLayout.js","chunks":["app/layout-1ab2.js"],"name":""}',
    arrivedAtMs: 0,
    sizeBytes: 96,
    label: 'preload layout',
  },
  {
    id: '1:',
    kind: 'module',
    payload: 'I["MainLayout",["chunks/app-layout-9f1e.js"],"default"]',
    arrivedAtMs: 12,
    sizeBytes: 78,
    label: 'MainLayout',
  },
  {
    id: '2:',
    kind: 'element',
    payload: '["$","$L1",null,{"locale":"en-US","children":"$L3"}]',
    parent: '1:',
    arrivedAtMs: 24,
    sizeBytes: 112,
    resolvesRefs: ['1:'],
    label: '<MainLayout/>',
  },
  {
    id: '3:',
    kind: 'module',
    payload: 'I["ProductPage",["chunks/product-page-c14a.js"],"default"]',
    arrivedAtMs: 38,
    sizeBytes: 88,
    label: 'ProductPage',
  },
  {
    id: '4:',
    kind: 'reference',
    payload: '$Sreact.suspense',
    parent: '3:',
    arrivedAtMs: 52,
    sizeBytes: 24,
    label: 'Suspense ref',
  },
  {
    id: '5:',
    kind: 'element',
    payload: '["$","$L4",null,{"fallback":"$L6","children":"$L7"}]',
    parent: '3:',
    arrivedAtMs: 70,
    sizeBytes: 132,
    resolvesRefs: ['4:'],
    label: '<Suspense/>',
  },
  {
    id: '6:',
    kind: 'element',
    payload: '["$","div",null,{"className":"skeleton","children":"Loading…"}]',
    arrivedAtMs: 80,
    sizeBytes: 88,
    label: 'fallback',
  },
  {
    id: '7:',
    kind: 'module',
    payload: 'I["ProductDetails",["chunks/product-details-7c10.js"],"default"]',
    arrivedAtMs: 110,
    sizeBytes: 96,
    label: 'ProductDetails',
  },
  {
    id: '8:',
    kind: 'element',
    payload: '["$","$L7",null,{"id":"sku_88421","children":["$","$L9",null,{"product":"$@10"}]}]',
    parent: '7:',
    arrivedAtMs: 142,
    sizeBytes: 184,
    resolvesRefs: ['7:'],
    label: '<ProductDetails/>',
  },
  {
    id: '9:',
    kind: 'module',
    payload: 'I["AddToCart",["chunks/add-to-cart-2bf1.js"],"default"]',
    arrivedAtMs: 168,
    sizeBytes: 84,
    label: 'AddToCart (client)',
  },
  {
    id: '10:',
    kind: 'reference',
    payload: '@{"id":"sku_88421","title":"Walnut Side Table","priceCents":12900}',
    arrivedAtMs: 195,
    sizeBytes: 132,
    label: 'product data',
  },
  {
    id: '11:',
    kind: 'element',
    payload: '["$","$L9",null,{"sku":"sku_88421","label":"Add to cart"}]',
    parent: '9:',
    arrivedAtMs: 210,
    sizeBytes: 96,
    resolvesRefs: ['9:'],
    label: '<AddToCart/>',
  },
  {
    id: '12:',
    kind: 'text',
    payload: '"Walnut Side Table — handcrafted from FSC walnut."',
    arrivedAtMs: 240,
    sizeBytes: 64,
    label: 'description',
  },
  {
    id: '13:',
    kind: 'hint',
    payload: 'H{"as":"image","href":"/img/sku_88421-hero.webp"}',
    arrivedAtMs: 260,
    sizeBytes: 56,
    label: 'preload hero',
  },
  {
    id: '14:',
    kind: 'element',
    payload: '["$","img",null,{"src":"/img/sku_88421-hero.webp","alt":"Walnut Side Table"}]',
    arrivedAtMs: 285,
    sizeBytes: 96,
    label: '<img/>',
  },
  {
    id: '15:',
    kind: 'module',
    payload: 'I["RelatedProducts",["chunks/related-3e91.js"],"default"]',
    arrivedAtMs: 320,
    sizeBytes: 84,
    label: 'RelatedProducts',
  },
  {
    id: '16:',
    kind: 'element',
    payload: '["$","$L15",null,{"tags":["furniture","living-room"]}]',
    parent: '15:',
    arrivedAtMs: 360,
    sizeBytes: 88,
    resolvesRefs: ['15:'],
    label: '<RelatedProducts/>',
  },
  {
    id: '17:',
    kind: 'text',
    payload: '"$/"',
    arrivedAtMs: 412,
    sizeBytes: 12,
    label: 'stream end',
  },
];

export const mockRscChunks: ReadonlyArray<RscChunk> = rawMockChunks.map((c) =>
  c.kind === 'module' && !c.environment ? { ...c, environment: MODULE_ENV } : c,
);

export const MOCK_RSC_TOTAL_MS =
  mockRscChunks[mockRscChunks.length - 1]?.arrivedAtMs ?? 0;
