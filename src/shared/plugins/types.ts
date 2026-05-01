/**
 * Quanta plugin API.
 *
 * Lets users (or first-party "official" packs) register custom analyzers
 * that consume the Probe trace + AST graph and surface findings in the
 * IDE. Example use cases:
 *
 *  - org-specific lint rules ("client component must not import lodash")
 *  - project-specific telemetry ("warn if /admin/* ships > 5KB")
 *  - team conventions ("Server Action names must end in `Action`")
 *
 * Plugins are pure functions today (no UI extension). Phase 18 will add a
 * surface registration API.
 */

import type { RscChunk } from '@entities/rsc-payload';
import type { DirectiveInputFile } from '@shared/analyzer/use-client-lite';

export type FindingSeverity = 'err' | 'warn' | 'info' | 'hint';

export interface PluginFinding {
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  /** Optional file the finding belongs to. */
  file?: string;
  /** Optional chunk id the finding belongs to. */
  chunkId?: string;
}

export interface PluginContext {
  url: string | null;
  chunks: ReadonlyArray<RscChunk>;
  files: ReadonlyArray<DirectiveInputFile>;
}

export interface QuantaPlugin {
  /** Unique id, e.g. `@org/lint-no-lodash-on-client`. */
  id: string;
  /** Human label shown in plugin list + finding badges. */
  label: string;
  /** Run on every Probe trace + AST snapshot. */
  analyze(ctx: PluginContext): ReadonlyArray<PluginFinding>;
}
