/**
 * Live Route Spec — Phase 16
 *
 * The "contract card" rendered at the top of every Next.js route file
 * (page.tsx / layout.tsx / route.ts / actions.ts).  It summarises the
 * resolved spec for that route at a glance and expands to show the
 * supporting evidence.
 *
 * The shapes here are the *aggregator output* — built from existing
 * stores (route, diagnostic, cache-tag, server-action, render-mode-badge)
 * by `aggregateRouteSpec()`.  Components must only depend on these
 * types; they never reach into the underlying stores directly.
 */

import type {
  Confidence,
  CostClass,
  RenderingClass,
  Route,
  RouteAuth,
  Severity,
} from '@shared/types';
import type { ModeSignal, RenderMode, ResolvedMode } from '../render-mode-badge/types';

export type ModeFamily = 'static' | 'isr' | 'dynamic' | 'streaming';

export interface RouteSpecMode {
  readonly family: ModeFamily;
  readonly mode: RenderMode | RenderingClass;
  readonly label: string;
  readonly confidence: Confidence;
  /** revalidate window in seconds when family === 'isr'. */
  readonly revalidate: number | null;
  /** "because cookies()…" — the dominant reason. */
  readonly cause: string;
  /** Up to N (max 3 in the UI) supporting signals with file:line. */
  readonly reasoning: ReadonlyArray<ModeSignal>;
}

export interface RouteSpecCacheTag {
  readonly name: string;
  readonly role: 'produces' | 'consumes' | 'invalidates';
}

export interface RouteSpecCache {
  readonly tags: ReadonlyArray<RouteSpecCacheTag>;
  /** Earliest revalidate window across data sources (or null). */
  readonly revalidate: number | null;
  readonly hasInvalidator: boolean;
}

export interface RouteSpecAuth {
  readonly auth: RouteAuth;
  readonly label: string;
  readonly archetypeMatches: boolean;
  readonly middlewareCovered: boolean;
}

export interface RouteSpecActionSummary {
  readonly id: string;
  readonly name: string;
  readonly score: number;
}

export interface RouteSpecDataSummary {
  readonly id: string;
  readonly name: string;
  readonly kind: 'fetch' | 'db' | 'helper' | 'cache';
  readonly revalidate: number | null;
}

export interface RouteSpecRisk {
  readonly id: string;
  readonly title: string;
  readonly severity: Severity;
  readonly confidence: Confidence;
  readonly file: string;
  readonly line: number;
}

export type AdmissionVerdictTone = 'admit' | 'inconclusive' | 'reject' | 'unknown';

export interface ShippingStatus {
  /** ISO date string, or null if never shipped. */
  readonly lastShippedAt: string | null;
  readonly lastShippedBy: string | null;
  readonly verdict: AdmissionVerdictTone;
  readonly verdictLabel: string;
  /** Summary of what's pending. */
  readonly pending: string | null;
}

export interface RouteSpec {
  readonly routeId: string;
  readonly path: string;
  readonly archetype: Route['archetype'];
  readonly costClass: CostClass;
  readonly clientKb: number;
  readonly mode: RouteSpecMode;
  readonly cache: RouteSpecCache;
  readonly auth: RouteSpecAuth;
  readonly actions: ReadonlyArray<RouteSpecActionSummary>;
  readonly data: ReadonlyArray<RouteSpecDataSummary>;
  readonly risks: ReadonlyArray<RouteSpecRisk>;
  readonly shipping: ShippingStatus;
  /** Files that belong to this route — page/layout/route/actions/etc. */
  readonly files: ReadonlyArray<string>;
}

/** Section identifiers used for keyboard navigation inside the card. */
export type RouteSpecSection =
  | 'mode'
  | 'cache'
  | 'auth'
  | 'actions'
  | 'data'
  | 'risk'
  | 'shipping';

/** Bridge from a render-mode-badge ResolvedMode to RouteSpecMode. */
export interface ResolvedModeLike {
  readonly mode: ResolvedMode['mode'];
  readonly cause: string;
  readonly confidence: ResolvedMode['confidence'];
  readonly revalidate: number | null;
  readonly signals: ReadonlyArray<ModeSignal>;
}
