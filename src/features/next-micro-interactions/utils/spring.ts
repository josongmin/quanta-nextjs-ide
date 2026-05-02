/**
 * Tiny spring/tween helpers for color + number interpolation. We deliberately
 * avoid pulling in framer-motion / react-spring just for these micro-moments.
 */

export type EasingFn = (t: number) => number;

/** cubic-bezier(0.34, 1.56, 0.64, 1) — Tailwind `spring`. Adapted closed form. */
export const easeSpring: EasingFn = (t) => {
  // Slight overshoot then settle. Derived to roughly mirror the cubic-bezier
  // values used in the global `spring` easing token.
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - x, 3) + 0.18 * Math.sin(x * Math.PI);
};

/** cubic-bezier(0.22, 1, 0.36, 1) — Tailwind `spring-soft`. */
export const easeSpringSoft: EasingFn = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - x, 3);
};

/** Linearly interpolate two scalars. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate two HSL triplets. Hue takes the shorter arc. Saturation +
 * lightness lerp directly. Returns an `hsl(h s% l%)` string.
 */
export function lerpHsl(
  from: { h: number; s: number; l: number },
  to: { h: number; s: number; l: number },
  t: number,
): string {
  let dh = to.h - from.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  let h = from.h + dh * t;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  const s = lerp(from.s, to.s, t);
  const l = lerp(from.l, to.l, t);
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

interface TweenOpts {
  durationMs: number;
  ease?: EasingFn;
  onUpdate: (t: number) => void;
  onDone?: () => void;
}

/**
 * Run a JS-driven tween via rAF. Returns a cancel handle that aborts the
 * remaining frames. Intended for one-shot moments — not a general animation
 * library. Respects prefers-reduced-motion: callers should branch before
 * invoking; this helper does NOT auto-skip.
 */
export function tween(opts: TweenOpts): () => void {
  const { durationMs, ease = easeSpringSoft, onUpdate, onDone } = opts;
  let cancelled = false;
  let raf = 0;
  const start =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const step = (now: number) => {
    if (cancelled) return;
    const dt = now - start;
    const linear = Math.max(0, Math.min(1, dt / durationMs));
    onUpdate(ease(linear));
    if (linear < 1) {
      raf = requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };
  raf = requestAnimationFrame(step);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}

/** True when the user has opted into reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
