/**
 * Local store for the error → code feature.
 *
 * Each "incident" is one paste: the raw text, the parsed result, and a
 * timestamp. Held in-memory only — pastes are throwaway by design.
 */

import { create } from 'zustand';
import { parseStack, type ParsedError } from './parser';

export interface Incident {
  id: string;
  pastedAt: number;
  raw: string;
  parsed: ParsedError;
}

interface ErrorMapStore {
  incidents: Incident[];
  selectedId: string | null;
  add(raw: string): string;
  clear(): void;
  select(id: string | null): void;
  remove(id: string): void;
}

let counter = 0;
const newId = (): string => {
  counter += 1;
  return `inc-${Date.now().toString(36)}-${counter}`;
};

const SAMPLE_RAW = `TypeError: Cannot read properties of undefined (reading 'price')
    at ProductCard (webpack-internal:///./src/components/ProductCard.tsx:42:18)
    at renderWithHooks (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:14803:12)
    at mountIndeterminateComponent (webpack-internal:///./node_modules/react-dom/cjs/react-dom.development.js:17482:5)
    at addToCart (src/lib/cart.ts:88:24)
    at handleSubmit (src/components/CheckoutForm.tsx:120:9)`;

export const useErrorMapStore = create<ErrorMapStore>((set) => {
  const seedId = newId();
  const seedIncident: Incident = {
    id: seedId,
    pastedAt: Date.now(),
    raw: SAMPLE_RAW,
    parsed: parseStack(SAMPLE_RAW),
  };
  return {
    incidents: [seedIncident],
    selectedId: seedId,
    add: (raw) => {
      const id = newId();
      const incident: Incident = {
        id,
        pastedAt: Date.now(),
        raw,
        parsed: parseStack(raw),
      };
      set((s) => ({
        incidents: [incident, ...s.incidents].slice(0, 50),
        selectedId: id,
      }));
      return id;
    },
    clear: () => set({ incidents: [], selectedId: null }),
    select: (id) => set({ selectedId: id }),
    remove: (id) =>
      set((s) => {
        const next = s.incidents.filter((i) => i.id !== id);
        return {
          incidents: next,
          selectedId: s.selectedId === id ? (next[0]?.id ?? null) : s.selectedId,
        };
      }),
  };
});
