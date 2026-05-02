/**
 * Visual side-effects for admission events.
 *
 *  - ADMIT  → adds a glow-accent halo to `[data-ship-button]` for 1.4s and
 *             surfaces a "⌘↵ to ship" tooltip via `data-nmi-ship-hint`.
 *  - REJECT → applies a 6px horizontal shake to `[data-ship-drawer]` for one
 *             cycle (~220ms).
 *
 * The contract is opt-in: phases that own those surfaces add the data
 * attribute on their root node. We never reach into their state.
 */

import { useEffect } from 'react';
import { on } from '../bus';
import { prefersReducedMotion } from '../utils/spring';

const ADMIT_GLOW_MS = 1400;
const REJECT_SHAKE_MS = 240;

export function AdmissionEffects(): JSX.Element {
  useEffect(() => {
    const offAdmit = on('admission-admit', () => {
      if (prefersReducedMotion()) return;
      const btn = document.querySelector<HTMLElement>('[data-ship-button]');
      if (!btn) return;
      btn.setAttribute('data-nmi-ship-glow', '1');
      btn.setAttribute('data-nmi-ship-hint', '⌘↵ to ship');
      window.setTimeout(() => {
        btn.removeAttribute('data-nmi-ship-glow');
        btn.removeAttribute('data-nmi-ship-hint');
      }, ADMIT_GLOW_MS);
    });

    const offReject = on('admission-reject', () => {
      if (prefersReducedMotion()) return;
      const drawer = document.querySelector<HTMLElement>('[data-ship-drawer]');
      if (!drawer) return;
      drawer.setAttribute('data-nmi-ship-shake', '1');
      window.setTimeout(() => {
        drawer.removeAttribute('data-nmi-ship-shake');
      }, REJECT_SHAKE_MS);
    });

    return () => {
      offAdmit();
      offReject();
    };
  }, []);

  return (
    <style data-nmi="admission-effects-style">{`
      [data-nmi-ship-glow] {
        box-shadow:
          0 0 0 1px hsl(var(--accent) / 0.4),
          0 0 18px hsl(var(--accent) / 0.18) !important;
        transition: box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      [data-nmi-ship-hint]::after {
        content: attr(data-nmi-ship-hint);
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        font-size: 11px;
        padding: 3px 6px;
        border-radius: 6px;
        background: hsl(var(--bg-elev, var(--bg)));
        color: hsl(var(--text));
        border: 1px solid hsl(var(--border));
        box-shadow: 0 4px 12px hsl(var(--text) / 0.08);
        white-space: nowrap;
        animation: nmi-spring-up 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
      }
      [data-nmi-ship-shake] {
        animation: nmi-shake 220ms cubic-bezier(0.22, 1, 0.36, 1) 1;
      }
      @keyframes nmi-shake {
        0%   { transform: translateX(0); }
        20%  { transform: translateX(-6px); }
        40%  { transform: translateX(6px); }
        60%  { transform: translateX(-3px); }
        80%  { transform: translateX(3px); }
        100% { transform: translateX(0); }
      }
      @keyframes nmi-spring-up {
        0%   { opacity: 0; transform: translateY(4px) scale(0.985); }
        60%  { opacity: 1; transform: translateY(-1px) scale(1.005); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-nmi-ship-shake], [data-nmi-ship-hint]::after { animation: none; }
      }
    `}</style>
  );
}
