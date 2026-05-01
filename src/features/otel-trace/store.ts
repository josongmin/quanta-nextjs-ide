/**
 * Local store for OTel trace ingestion. Holds the parsed traces in memory
 * — pastes are throwaway. Selected trace + selected span drives the panes.
 */

import { create } from 'zustand';
import { parseOtlp } from './parser';
import type { TraceTree } from './types';

interface OtelStore {
  traces: TraceTree[];
  selectedTraceId: string | null;
  selectedSpanId: string | null;
  ingest(input: string): { ok: boolean; count: number; skipped: number };
  selectTrace(id: string | null): void;
  selectSpan(id: string | null): void;
  clear(): void;
}

const SAMPLE_PAYLOAD = JSON.stringify({
  resourceSpans: [
    {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'next-app' } },
        ],
      },
      scopeSpans: [
        {
          scope: { name: '@vercel/otel' },
          spans: [
            {
              traceId: 't0001',
              spanId: 's_root',
              name: 'GET /products/[id]',
              kind: 2,
              startTimeUnixNano: '0',
              endTimeUnixNano: '420000000',
              attributes: [
                { key: 'http.route', value: { stringValue: '/products/[id]' } },
                { key: 'http.method', value: { stringValue: 'GET' } },
                {
                  key: 'code.filepath',
                  value: { stringValue: 'app/products/[id]/page.tsx' },
                },
              ],
            },
            {
              traceId: 't0001',
              spanId: 's_layout',
              parentSpanId: 's_root',
              name: 'render layout',
              startTimeUnixNano: '8000000',
              endTimeUnixNano: '32000000',
              attributes: [
                {
                  key: 'code.filepath',
                  value: { stringValue: 'app/layout.tsx' },
                },
                { key: 'code.function', value: { stringValue: 'RootLayout' } },
              ],
            },
            {
              traceId: 't0001',
              spanId: 's_data',
              parentSpanId: 's_root',
              name: 'fetch product',
              kind: 3,
              startTimeUnixNano: '40000000',
              endTimeUnixNano: '210000000',
              attributes: [
                {
                  key: 'http.url',
                  value: { stringValue: 'https://api.example/products/123' },
                },
                {
                  key: 'code.filepath',
                  value: { stringValue: 'src/lib/products.ts' },
                },
                { key: 'code.function', value: { stringValue: 'getProduct' } },
                { key: 'code.lineno', value: { intValue: '24' } },
              ],
            },
            {
              traceId: 't0001',
              spanId: 's_db',
              parentSpanId: 's_data',
              name: 'pg.query products',
              kind: 3,
              startTimeUnixNano: '52000000',
              endTimeUnixNano: '178000000',
              attributes: [
                { key: 'db.system', value: { stringValue: 'postgresql' } },
                {
                  key: 'db.statement',
                  value: { stringValue: 'SELECT * FROM products WHERE id=$1' },
                },
              ],
            },
            {
              traceId: 't0001',
              spanId: 's_render',
              parentSpanId: 's_root',
              name: 'render ProductPage',
              startTimeUnixNano: '215000000',
              endTimeUnixNano: '395000000',
              attributes: [
                {
                  key: 'code.filepath',
                  value: { stringValue: 'app/products/[id]/page.tsx' },
                },
                {
                  key: 'code.function',
                  value: { stringValue: 'ProductPage' },
                },
              ],
            },
            {
              traceId: 't0001',
              spanId: 's_island',
              parentSpanId: 's_render',
              name: 'serialize island',
              startTimeUnixNano: '350000000',
              endTimeUnixNano: '388000000',
              attributes: [
                {
                  key: 'code.filepath',
                  value: { stringValue: 'app/products/[id]/AddToCart.tsx' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

const initial = parseOtlp(SAMPLE_PAYLOAD);

export const useOtelStore = create<OtelStore>((set) => ({
  traces: initial.traces,
  selectedTraceId: initial.traces[0]?.traceId ?? null,
  selectedSpanId: initial.traces[0]?.rootIds[0] ?? null,
  ingest: (input) => {
    const result = parseOtlp(input);
    if (result.traces.length === 0) {
      return { ok: false, count: 0, skipped: result.skipped };
    }
    set((s) => ({
      traces: [...result.traces, ...s.traces].slice(0, 20),
      selectedTraceId: result.traces[0]!.traceId,
      selectedSpanId: result.traces[0]!.rootIds[0] ?? null,
    }));
    return { ok: true, count: result.traces.length, skipped: result.skipped };
  },
  selectTrace: (id) =>
    set((s) => {
      const tr = s.traces.find((t) => t.traceId === id);
      return {
        selectedTraceId: id,
        selectedSpanId: tr?.rootIds[0] ?? null,
      };
    }),
  selectSpan: (id) => set({ selectedSpanId: id }),
  clear: () => set({ traces: [], selectedTraceId: null, selectedSpanId: null }),
}));
