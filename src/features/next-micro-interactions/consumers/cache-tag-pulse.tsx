/**
 * On `revalidate-tag-typed`, briefly pulses any DOM node tagged with
 * `data-cache-tag="<tag>"` (or `data-route-affected-tag="<tag>"` on the
 * left-rail routes list) using a CSS animation. The cache panel and routes
 * list opt in by adding the data attribute — read-only contract across
 * features.
 */

import { useEffect, useRef, useState } from 'react';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

interface PulseRecord {
  id: number;
  tag: string;
  startedAt: number;
}

const PULSE_MS = 1000;

export function CacheTagPulse(): JSX.Element | null {
  const [pulses, setPulses] = useState<PulseRecord[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    return on('revalidate-tag-typed', (e) => {
      if (prefersReducedMotion()) return;
      const id = ++idRef.current;
      setPulses((p) => [...p, { id, tag: e.tag, startedAt: Date.now() }]);
      // Apply data-attr on matching nodes; on cleanup remove after animation.
      const sel = `[data-cache-tag="${cssEscape(e.tag)}"], [data-route-affected-tag="${cssEscape(e.tag)}"]`;
      const matches = document.querySelectorAll<HTMLElement>(sel);
      const startedAt = Date.now();
      matches.forEach((n) => {
        n.setAttribute('data-nmi-pulse', String(id));
      });
      window.setTimeout(() => {
        matches.forEach((n) => {
          if (n.getAttribute('data-nmi-pulse') === String(id)) {
            n.removeAttribute('data-nmi-pulse');
          }
        });
        setPulses((p) => p.filter((x) => x.id !== id));
        // Use startedAt to keep the timing self-evident in dev tools.
        void startedAt;
      }, PULSE_MS);
    });
  }, []);

  if (pulses.length === 0) return null;

  // Inject one global stylesheet that targets `[data-nmi-pulse]`. Each pulse
  // node uses CSS animation rather than JS rAF to stay cheap.
  return (
    <style data-nmi="cache-tag-pulse-style">{`
      [data-nmi-pulse] {
        position: relative;
        animation: nmi-tag-pulse 1000ms cubic-bezier(0.22, 1, 0.36, 1) 1;
      }
      [data-route-affected-tag][data-nmi-pulse] {
        background-color: hsl(var(--sem-isr-soft)) !important;
        transition: background-color 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes nmi-tag-pulse {
        0%   { box-shadow: 0 0 0 0 hsl(var(--accent) / 0.45); }
        70%  { box-shadow: 0 0 0 8px hsl(var(--accent) / 0); }
        100% { box-shadow: 0 0 0 0 hsl(var(--accent) / 0); }
      }
    `}</style>
  );
}

/** Tiny CSS.escape polyfill for tag attribute selectors. */
function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(s);
  }
  return s.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
