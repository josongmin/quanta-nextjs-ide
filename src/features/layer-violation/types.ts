/**
 * Layer Violation Detector — types.
 *
 * Models a layered architecture (ui → service → data) and the violations
 * that arise when an outer layer reaches past its neighbour to import
 * directly from a deeper layer (e.g. a UI component importing prisma).
 */

export type LayerKind = 'ui' | 'service' | 'data';

export interface LayerDefinition {
  /** Canonical id used in violations & rendering. */
  readonly id: LayerKind;
  /** Display label shown in the pyramid. */
  readonly label: string;
  /** Glob patterns (workspace-relative) that members of this layer match. */
  readonly globs: ReadonlyArray<string>;
  /** Tone hint for visualisation. */
  readonly tone: 'accent' | 'info' | 'warn' | 'static';
}

export type ViolationKind =
  | 'ui-to-data'
  | 'cross-layer'
  | 'reverse';

export interface Violation {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly fromLayer: LayerKind;
  readonly toLayer: LayerKind;
  readonly kind: ViolationKind;
  readonly hint: string;
}

export interface ViolationReport {
  readonly violations: ReadonlyArray<Violation>;
  readonly scanned: number;
  readonly edges: number;
}
