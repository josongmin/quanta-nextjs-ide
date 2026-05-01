/**
 * Error Boundary Trace types.
 *
 * For each route, we walk up the layout chain and find the nearest
 * `error.tsx`, `not-found.tsx`, and `global-error.tsx` files. Result is a
 * BoundaryChain — a structured view of which file would catch what.
 */

export interface BoundaryChain {
  /** The route this chain belongs to (e.g. "app/products/[id]/page.tsx"). */
  route: string;
  /** The directory segments from app root → route (each becomes a layout box). */
  segments: ReadonlyArray<string>;
  /** Layout files between root and route, in render order (outer first). */
  layoutsBetween: ReadonlyArray<string>;
  /** Nearest error.tsx (catches render errors). */
  error: string | null;
  /** Nearest not-found.tsx (catches notFound() throws). */
  notFound: string | null;
  /** Top-level global-error.tsx (last-resort root error). */
  globalError: string | null;
}
