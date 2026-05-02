/**
 * Tiny rAF-driven number ticker. Animates from 0 → target with a
 * spring-soft curve over `durationMs`. Honours `prefers-reduced-motion`
 * by snapping to the target on first paint.
 */

import { useEffect, useRef, useState } from 'react';

interface TickerOptions {
  /** Total animation duration in ms. */
  durationMs?: number;
  /** Initial value before animation starts (default 0). */
  from?: number;
  /** Optional formatter — purely display-side, has no effect on the
   *  numeric value passed to consumers. */
  decimals?: number;
}

// spring-soft cubic-bezier(0.22, 1, 0.36, 1) approximation —
// closed-form ease-out cubic.
function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useTicker(target: number, opts: TickerOptions = {}): number {
  const { durationMs = 800, from = 0, decimals = 0 } = opts;
  const [value, setValue] = useState<number>(() =>
    prefersReducedMotion() ? target : from,
  );
  const startedAtRef = useRef<number | null>(null);
  const fromRef = useRef<number>(from);
  const targetRef = useRef<number>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    fromRef.current = value;
    targetRef.current = target;
    startedAtRef.current = null;

    const step = (now: number) => {
      if (startedAtRef.current == null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const next =
        fromRef.current + (targetRef.current - fromRef.current) * eased;
      const factor = 10 ** decimals;
      setValue(Math.round(next * factor) / factor);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // We intentionally re-run the animation only when the *target* changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs, decimals]);

  return value;
}
