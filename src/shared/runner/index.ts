// Public surface of the runner subsystem.
//
// Tauri side (src-tauri/src/runner/mod.rs) commands:
//   runner_start(kind, workspaceRoot) -> RunId
//   runner_stop(runId)
//   runner_status(runId) -> RunnerStatus
//
// Streamed events:
//   runner:stdout / runner:stderr / runner:exit / runner:diagnostic / runner:summary

export type {
  KindResult,
  RunRecord,
  RunState,
  RunnerDiagnostic,
  RunnerKind,
  RunnerKindLabel,
  RunnerLogLine,
  RunnerStatus,
  RunnerSummary,
} from './types';

export {
  useRunnerStore,
  useBuildStatus,
  useTypeCheckStatus,
  useLintStatus,
  useTestStatus,
  useDeployRiskScore,
  selectDeployRiskScore,
  selectActiveRunIds,
  getWorkspaceRoot,
} from './store';

export {
  isRunnerAvailable,
  runnerStart,
  runnerStop,
  runnerStatus,
} from './api';
