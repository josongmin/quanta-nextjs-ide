/**
 * Render-mode badge types.  Spec area 26-1.
 *
 * The "resolved" mode is the *final* render mode after Next merges signals
 * from the segment, its layout chain, dynamic API calls, fetch options and
 * Suspense boundaries.  Tracking the chain (signals) is what makes the
 * "why card" actionable.
 */

export type RenderMode =
  | 'static'
  | 'isr'
  | 'dynamic-cookies'
  | 'dynamic-headers'
  | 'dynamic-noStore'
  | 'streaming';

export type SignalKind =
  | 'cookies'
  | 'headers'
  | 'searchParams'
  | 'noStore'
  | 'fetch-no-store'
  | 'fetch-cache'
  | 'revalidate'
  | 'force-dynamic'
  | 'force-static'
  | 'suspense'
  | 'use-client';

export interface ModeSignal {
  readonly kind: SignalKind;
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
  /** "Forces static", "Forces dynamic", "Caps revalidation", etc. */
  readonly effect: string;
}

export interface ResolvedMode {
  readonly route: string;
  readonly mode: RenderMode;
  /** revalidate seconds when mode === 'isr'. */
  readonly revalidate: number | null;
  readonly signals: ReadonlyArray<ModeSignal>;
  /** Dominant reason — "because cookies()". */
  readonly cause: string;
  /** Final, plain-English description for the inspector. */
  readonly behavior: string;
  /** Manual overrides detected in the route segment config. */
  readonly overrides: ReadonlyArray<string>;
  readonly confidence: 'high' | 'medium' | 'low';
}
