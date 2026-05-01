// Public types for the runner subsystem (build / typecheck / lint / test / e2e).
// Mirrors the Rust enums in `src-tauri/src/runner/mod.rs`.

export type RunnerKindLabel =
  | 'build'
  | 'typecheck'
  | 'lint'
  | 'test'
  | 'e2e'
  | 'custom';

export type RunnerKind =
  | { kind: 'Build' }
  | { kind: 'TypeCheck' }
  | { kind: 'Lint' }
  | { kind: 'Test' }
  | { kind: 'E2E' }
  | { kind: 'Custom'; command: string; args: string[] };

export type RunState = 'running' | 'succeeded' | 'failed' | 'stopped';

export interface RunnerStatus {
  runId: string;
  kindLabel: RunnerKindLabel;
  state: RunState;
  exitCode: number | null;
  startedAtMs: number;
  durationMs: number | null;
}

export interface RunnerLogLine {
  ts: number;
  channel: 'stdout' | 'stderr';
  text: string;
}

export interface RunnerDiagnostic {
  runId: string;
  kind: RunnerKindLabel;
  file: string;
  line: number;
  col: number;
  code?: string | null;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface RunnerSummary {
  runId: string;
  kind: RunnerKindLabel;
  typecheckErrors: number;
  lintErrors: number;
  lintWarnings: number;
  testsPassed: number;
  testsFailed: number;
}

/** Aggregated, per-kind result the status bar / inspectors observe. */
export interface KindResult {
  runId: string;
  state: RunState;
  startedAtMs: number;
  durationMs: number | null;
  // Optional parsed metrics (filled in by the summary event):
  typecheckErrors?: number;
  lintErrors?: number;
  lintWarnings?: number;
  testsPassed?: number;
  testsFailed?: number;
}

export interface RunRecord {
  runId: string;
  kindLabel: RunnerKindLabel;
  state: RunState;
  startedAtMs: number;
  durationMs: number | null;
  exitCode: number | null;
  logs: RunnerLogLine[];
  diagnostics: RunnerDiagnostic[];
}
