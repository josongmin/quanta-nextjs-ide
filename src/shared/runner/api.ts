// Tauri-side wrappers for the runner. We avoid importing `@tauri-apps/api`
// statically so the web build still works — instead we resolve `invoke` and
// `event.listen` from `window.__TAURI__` (Tauri 2 injects them as
// `window.__TAURI__.core.invoke` / `window.__TAURI__.event.listen`).

import type {
  RunnerDiagnostic,
  RunnerKind,
  RunnerStatus,
  RunnerSummary,
} from './types';

type Unlisten = () => void;
type Listen = <T>(event: string, handler: (e: { payload: T }) => void) => Promise<Unlisten>;
type Invoke = <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

interface TauriGlobal {
  core?: { invoke: Invoke };
  event?: { listen: Listen };
  // Older Tauri 1 shape (defensive):
  invoke?: Invoke;
}

function getTauri(): TauriGlobal | null {
  const g = (globalThis as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  return g ?? null;
}

export function isRunnerAvailable(): boolean {
  const t = getTauri();
  return !!(t?.core?.invoke ?? t?.invoke);
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const t = getTauri();
  const inv = t?.core?.invoke ?? t?.invoke;
  if (!inv) throw new Error(`Tauri invoke unavailable for "${cmd}"`);
  return inv<T>(cmd, args);
}

async function listen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<Unlisten> {
  const t = getTauri();
  if (!t?.event?.listen) {
    return () => {};
  }
  return t.event.listen<T>(event, (e) => handler(e.payload));
}

// ---- Commands -------------------------------------------------------------

export async function runnerStart(
  kind: RunnerKind,
  workspaceRoot: string,
): Promise<string> {
  return invoke<string>('runner_start', { kind, workspaceRoot });
}

export async function runnerStop(runId: string): Promise<void> {
  return invoke('runner_stop', { runId });
}

export async function runnerStatus(runId: string): Promise<RunnerStatus | null> {
  return invoke<RunnerStatus | null>('runner_status', { runId });
}

// ---- Events ---------------------------------------------------------------

export interface RunnerLogPayload {
  runId: string;
  line: string;
}

export interface RunnerExitPayload {
  runId: string;
  kind: string;
  code: number | null;
  durationMs: number;
}

export const onRunnerStdout = (h: (p: RunnerLogPayload) => void) =>
  listen<RunnerLogPayload>('runner:stdout', h);

export const onRunnerStderr = (h: (p: RunnerLogPayload) => void) =>
  listen<RunnerLogPayload>('runner:stderr', h);

export const onRunnerExit = (h: (p: RunnerExitPayload) => void) =>
  listen<RunnerExitPayload>('runner:exit', h);

export const onRunnerDiagnostic = (h: (p: RunnerDiagnostic) => void) =>
  listen<RunnerDiagnostic>('runner:diagnostic', h);

export const onRunnerSummary = (h: (p: RunnerSummary) => void) =>
  listen<RunnerSummary>('runner:summary', h);
