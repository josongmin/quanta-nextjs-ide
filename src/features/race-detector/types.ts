// Types for the server action race detector.

export type RaceKind =
  | 'double-submit' // same action invoked concurrently with no idempotency key
  | 'lost-update' // read-then-write on the same row without a transaction
  | 'phantom-read' // read-then-decision in non-serializable context
  | 'no-dedupe'; // multiple call sites for the same action without dedupe

export type RaceSeverity = 'low' | 'medium' | 'high';

export interface RaceEvidence {
  /** Workspace-relative file path. */
  file: string;
  /** 1-based line of the offending construct. */
  line: number;
  /** Short snippet (≤ 120 chars). */
  snippet: string;
  /** ≤ 1-line explanation. */
  reason: string;
}

export interface RaceRisk {
  id: string;
  /** Server-action display name. */
  action: string;
  kind: RaceKind;
  severity: RaceSeverity;
  evidence: RaceEvidence[];
  /** Suggested mitigation, in plain English. */
  mitigation: string;
  /** Tiny "before / after" code shown when the user expands the card. */
  before?: string;
  after?: string;
}

export interface RaceReport {
  risks: RaceRisk[];
  filesScanned: number;
  durationMs: number;
}
