// Types for the temporal cache simulator.
//
// Models a virtual clock and a small set of user events scheduled along a
// timeline, then evaluates "what does each viewer see at time T" given the
// route's cache configuration (revalidate seconds, tag invalidations, etc).

export type EventKind =
  | 'mutation'
  | 'page-request'
  | 'revalidate-tag'
  | 'revalidate-path';

export type RouteFreshness = 'fresh' | 'stale' | 'mixed' | 'unknown';

export interface TimelineEvent {
  /** Stable id for React keys + scrubbing. */
  id: string;
  /** Whose action this is. Drawn as a swimlane. */
  user: string;
  /** What kind of action. */
  kind: EventKind;
  /** Seconds from t=0. */
  t: number;
  /** Tag(s) this event produces or invalidates. Used for cross-route fan-out. */
  tag?: string;
  /** Optional human label for the event chip. */
  label?: string;
}

/** Snapshot of a single route at a given moment. */
export interface RouteState {
  routeId: string;
  routeLabel: string;
  /** Seconds since the last successful revalidation. `null` = never revalidated. */
  ageSec: number | null;
  /** Configured revalidate window, in seconds. */
  revalidateSec: number;
  /** Bound tag name (if any). */
  tag?: string;
  /** Computed freshness for the cursor moment. */
  freshness: RouteFreshness;
  /** ≤ 1-line explanation for the right preview pane. */
  reason: string;
}

/** A complete what-if scenario for a single bound tag. */
export interface Timeline {
  id: string;
  /** Display title – usually "Tag: <name>" or "Route: <label>". */
  title: string;
  /** Bound cache-tag this scenario derives from. */
  tag: string;
  /** Total simulated horizon, in seconds. */
  horizonSec: number;
  /** Default revalidate window for routes consuming this tag. */
  revalidateSec: number;
  events: TimelineEvent[];
  /** Routes affected by this tag — populate from the cache-tag store. */
  routes: { id: string; label: string }[];
}

/** Result of evaluating a Timeline at cursor=tSec. */
export interface SimSnapshot {
  tSec: number;
  routes: RouteState[];
  /** The "max staleness window" for each route — how long User B could see
   * stale data after User A's mutation, given the current schedule. */
  staleWindows: { routeId: string; routeLabel: string; maxStaleSec: number }[];
}
