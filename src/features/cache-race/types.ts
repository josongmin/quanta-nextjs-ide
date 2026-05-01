// Types for cache race / overlap detection.

export type CacheRaceKind =
  | 'overlap-revalidate' // 2+ mutations target the same tag within Δt
  | 'redundant-revalidate' // both revalidatePath + revalidateTag for same data
  | 'stale-overwrite'; // mutation racing with an in-flight cached fetch

export type CacheRaceSeverity = 'low' | 'medium' | 'high';

export interface CacheRaceTimelineEvent {
  /** Stable id for React keys. */
  id: string;
  /** Display label for the event chip. */
  label: string;
  /** Bound tag (when known). */
  tag?: string;
  /** Origin file. */
  file: string;
  /** Origin line. */
  line: number;
  /** Synthetic offset in seconds for the mini-timeline. */
  tSec: number;
  kind: 'producer' | 'invalidator' | 'mutation';
}

export interface CacheRaceRisk {
  id: string;
  kind: CacheRaceKind;
  /** Human title — used as the card heading. */
  title: string;
  severity: CacheRaceSeverity;
  /** Cache-tag(s) involved. */
  tags: string[];
  /** Mini-timeline of overlapping operations. */
  events: CacheRaceTimelineEvent[];
  /** ≤ 1-line explanation of the hazard. */
  reason: string;
  /** Suggested mitigation. */
  mitigation: string;
}

export interface CacheRaceReport {
  risks: CacheRaceRisk[];
  durationMs: number;
}
