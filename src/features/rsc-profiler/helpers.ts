import { mockRscComponents } from '@shared/mocks/runtime';
import type { RscComponent } from '@shared/types';

// Shape types live in `shared/types`; re-export so existing
// `@features/rsc-profiler/helpers` consumers keep working.
export type { RscComponent } from '@shared/types';

export const rscComponents: ReadonlyArray<RscComponent> = mockRscComponents;

export type SortKey = 'renderMs' | 'payload' | 'cacheHit' | 'awaits';

export function sortComponents(
  list: ReadonlyArray<RscComponent>,
  key: SortKey,
): RscComponent[] {
  const arr = [...list];
  arr.sort((a, b) => {
    switch (key) {
      case 'renderMs':
        return b.renderMs - a.renderMs;
      case 'payload':
        return b.payloadBytes - a.payloadBytes;
      case 'cacheHit':
        return Number(a.cacheHit) - Number(b.cacheHit);
      case 'awaits':
        return b.awaitsCount - a.awaitsCount;
    }
  });
  return arr;
}

export function suggestionsFor(c: RscComponent): string[] {
  const s: string[] = [];
  if (!c.cacheHit && c.renderMs > 100) s.push("Wrap in React.cache()");
  if (c.awaitsCount >= 3) s.push('Lift fetch to parent (parallelize)');
  if (!c.cacheHit && c.payloadBytes > 6000) s.push("Add 'use cache' directive");
  if (c.serializationCost > 2000) s.push('Stream as Suspense boundary');
  if (s.length === 0) s.push('No optimizations needed');
  return s;
}
