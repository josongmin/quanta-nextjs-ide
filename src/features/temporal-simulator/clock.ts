// Pure virtual-time engine for the temporal cache simulator.
//
// Replays a `Timeline` event-by-event up to the cursor `tSec` and produces a
// `SimSnapshot` describing each route's freshness. The model is intentionally
// simple — every route shares the same `revalidateSec` window, mutations bump
// the "last invalidate" timestamp for matching tags, and a page-request at T
// is "fresh" iff (T - lastRevalidate) ≤ revalidateSec.
import type {
  RouteFreshness,
  RouteState,
  SimSnapshot,
  Timeline,
  TimelineEvent,
} from './types';

interface RouteSim {
  routeId: string;
  routeLabel: string;
  /** Wallclock t (seconds) of the last revalidation. */
  lastRevalidateAt: number;
  /** Wallclock t (seconds) of the last mutation (= "stale-from"). */
  lastMutationAt: number | null;
  /** Has the route been requested at least once? */
  hasBeenSeen: boolean;
}

/** Snapshot evaluation at a cursor moment. */
export function evaluateAt(timeline: Timeline, tCursorSec: number): SimSnapshot {
  const tCursor = Math.max(0, Math.min(timeline.horizonSec, tCursorSec));
  const sims = new Map<string, RouteSim>();
  for (const r of timeline.routes) {
    sims.set(r.id, {
      routeId: r.id,
      routeLabel: r.label,
      // Routes start "fresh at t=0" — typical for ISR'd pages.
      lastRevalidateAt: 0,
      lastMutationAt: null,
      hasBeenSeen: false,
    });
  }

  const sortedEvents = [...timeline.events].sort((a, b) => a.t - b.t);
  for (const ev of sortedEvents) {
    if (ev.t > tCursor) break;
    applyEvent(sims, ev, timeline);
  }

  const routes: RouteState[] = [];
  for (const sim of sims.values()) {
    routes.push(toRouteState(sim, timeline, tCursor));
  }

  const staleWindows = computeMaxStaleWindows(timeline);

  return { tSec: tCursor, routes, staleWindows };
}

function applyEvent(
  sims: Map<string, RouteSim>,
  ev: TimelineEvent,
  timeline: Timeline,
): void {
  const tagMatches = !ev.tag || ev.tag === timeline.tag;
  switch (ev.kind) {
    case 'mutation':
      if (tagMatches) {
        for (const sim of sims.values()) {
          // A mutation invalidates "in spirit" but the cache won't notice
          // until a `revalidate-tag` or natural expiry.
          sim.lastMutationAt = ev.t;
        }
      }
      break;
    case 'revalidate-tag':
      if (tagMatches) {
        for (const sim of sims.values()) {
          sim.lastRevalidateAt = ev.t;
          // Once revalidated the data is fresh again.
          sim.lastMutationAt = null;
        }
      }
      break;
    case 'revalidate-path':
      // Revalidate-path applies to a single route — we attach by label match.
      for (const sim of sims.values()) {
        if (!ev.label || sim.routeLabel.includes(ev.label) || ev.label === '*') {
          sim.lastRevalidateAt = ev.t;
          sim.lastMutationAt = null;
        }
      }
      break;
    case 'page-request':
      // A page request consumes the cache — if the natural revalidate window
      // has elapsed, it triggers a background revalidation (stale-while-rev).
      for (const sim of sims.values()) {
        sim.hasBeenSeen = true;
        if (ev.t - sim.lastRevalidateAt >= timeline.revalidateSec) {
          // Background revalidate kicks off; we model this as "fresh from now".
          sim.lastRevalidateAt = ev.t;
          sim.lastMutationAt = null;
        }
      }
      break;
  }
}

function toRouteState(sim: RouteSim, tl: Timeline, tCursor: number): RouteState {
  const ageSec = sim.hasBeenSeen ? tCursor - sim.lastRevalidateAt : null;
  const freshness = computeFreshness(sim, tl, tCursor);
  return {
    routeId: sim.routeId,
    routeLabel: sim.routeLabel,
    ageSec,
    revalidateSec: tl.revalidateSec,
    tag: tl.tag,
    freshness,
    reason: explain(sim, tl, tCursor, freshness),
  };
}

function computeFreshness(
  sim: RouteSim,
  tl: Timeline,
  tCursor: number,
): RouteFreshness {
  if (!sim.hasBeenSeen && sim.lastMutationAt == null) return 'unknown';
  const age = tCursor - sim.lastRevalidateAt;
  const hasUnseenMutation =
    sim.lastMutationAt != null && sim.lastMutationAt > sim.lastRevalidateAt;
  if (hasUnseenMutation && age <= tl.revalidateSec) return 'stale';
  if (hasUnseenMutation) return 'mixed';
  if (age > tl.revalidateSec) return 'mixed';
  return 'fresh';
}

function explain(
  sim: RouteSim,
  tl: Timeline,
  tCursor: number,
  f: RouteFreshness,
): string {
  const age = tCursor - sim.lastRevalidateAt;
  switch (f) {
    case 'fresh':
      return `Cache hit. Age ${age.toFixed(0)}s ≤ revalidate ${tl.revalidateSec}s.`;
    case 'stale': {
      const mutAt = sim.lastMutationAt ?? 0;
      return `User sees pre-mutation data. Mutation at t=${mutAt}s, no revalidate yet.`;
    }
    case 'mixed':
      return 'Background revalidate in flight — first viewer gets stale, then fresh.';
    case 'unknown':
    default:
      return 'No traffic yet — cache state undefined.';
  }
}

function computeMaxStaleWindows(timeline: Timeline) {
  // For each route: scan forward and find the longest stretch where a
  // mutation happens but no revalidate / page-request follows for ≤ revalidateSec.
  const sortedEvents = [...timeline.events].sort((a, b) => a.t - b.t);
  return timeline.routes.map((r) => {
    let maxStale = 0;
    for (let i = 0; i < sortedEvents.length; i++) {
      const ev = sortedEvents[i]!;
      if (ev.kind !== 'mutation') continue;
      if (ev.tag && ev.tag !== timeline.tag) continue;
      // Find next revalidate or page-request that would clear the stale flag.
      let cleared = timeline.horizonSec;
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const next = sortedEvents[j]!;
        if (next.kind === 'revalidate-tag' && (!next.tag || next.tag === timeline.tag)) {
          cleared = next.t;
          break;
        }
        if (next.kind === 'page-request' && next.t - ev.t >= timeline.revalidateSec) {
          cleared = next.t;
          break;
        }
      }
      // Cap by natural expiry.
      const natural = ev.t + timeline.revalidateSec;
      const window = Math.min(cleared, natural) - ev.t;
      if (window > maxStale) maxStale = window;
    }
    return { routeId: r.id, routeLabel: r.label, maxStaleSec: Math.round(maxStale) };
  });
}
