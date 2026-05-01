// Runner store — single source of truth for build / typecheck / lint / test
// status across the IDE. Subscribes to Tauri runner events on first use and
// derives aggregate metrics for the status bar + Deploy Readiness inspector.

import { create } from 'zustand';
import { useWorkspaceStore, DEMO_WORKSPACE_ROOT } from '@shared/workspace';
import {
  isRunnerAvailable,
  onRunnerDiagnostic,
  onRunnerExit,
  onRunnerStderr,
  onRunnerStdout,
  onRunnerSummary,
  runnerStart,
  runnerStop,
} from './api';
import type {
  KindResult,
  RunRecord,
  RunnerDiagnostic,
  RunnerKind,
  RunnerKindLabel,
  RunnerLogLine,
  RunState,
} from './types';

const MAX_LOG_LINES_PER_RUN = 5000;
const MAX_HISTORY = 50;

const KINDS: RunnerKindLabel[] = ['build', 'typecheck', 'lint', 'test', 'e2e'];

interface RunnerStoreState {
  /** All runs, keyed by runId. Ring buffer of last MAX_HISTORY. */
  runs: Record<string, RunRecord>;
  history: string[]; // run ids, most-recent last
  /** Latest result per kind label. */
  latest: Partial<Record<RunnerKindLabel, KindResult>>;
  /** Currently active runId per kind, if any. */
  active: Partial<Record<RunnerKindLabel, string>>;
  /** Whether event subscriptions are wired. */
  wired: boolean;
  /** Last (lazy) error message from invoke. */
  lastError: string | null;

  // ---- actions ----
  ensureWired: () => Promise<void>;
  start: (kind: RunnerKind, workspaceRoot?: string) => Promise<string | null>;
  stop: (runId: string) => Promise<void>;
  startByLabel: (label: RunnerKindLabel, workspaceRoot?: string) => Promise<string | null>;
  clearLogs: (runId: string) => void;
}

function labelToKind(label: RunnerKindLabel): RunnerKind {
  switch (label) {
    case 'build': return { kind: 'Build' };
    case 'typecheck': return { kind: 'TypeCheck' };
    case 'lint': return { kind: 'Lint' };
    case 'test': return { kind: 'Test' };
    case 'e2e': return { kind: 'E2E' };
    case 'custom': return { kind: 'Custom', command: 'echo', args: ['noop'] };
  }
}

function normalizeKindLabel(raw: string | undefined): RunnerKindLabel {
  if (!raw) return 'custom';
  const k = raw.toLowerCase();
  if ((KINDS as string[]).includes(k)) return k as RunnerKindLabel;
  return 'custom';
}

/**
 * Resolves the workspace root for a runner invocation. Pulls from the Phase 1
 * workspace store; falls back to localStorage / "." when in demo mode.
 */
export function getWorkspaceRoot(): string {
  const root = useWorkspaceStore.getState().root;
  if (root && root !== DEMO_WORKSPACE_ROOT) return root;
  if (typeof localStorage !== 'undefined') {
    const v = localStorage.getItem('quanta.workspaceRoot');
    if (v && v.trim().length > 0) return v;
  }
  return '.';
}

export const useRunnerStore = create<RunnerStoreState>((set, get) => ({
  runs: {},
  history: [],
  latest: {},
  active: {},
  wired: false,
  lastError: null,

  async ensureWired() {
    if (get().wired) return;
    if (!isRunnerAvailable()) {
      // Web/dev shell: skip subscriptions but mark as wired so we don't retry.
      set({ wired: true });
      return;
    }
    set({ wired: true });

    const upsertRun = (
      runId: string,
      patch: Partial<RunRecord>,
      seedKindLabel?: RunnerKindLabel,
    ) => {
      const s = get();
      const existing = s.runs[runId];
      const next: RunRecord = existing
        ? { ...existing, ...patch }
        : {
            runId,
            kindLabel: seedKindLabel ?? 'custom',
            state: 'running',
            startedAtMs: Date.now(),
            durationMs: null,
            exitCode: null,
            logs: [],
            diagnostics: [],
            ...patch,
          };
      const history = existing
        ? s.history
        : [...s.history, runId].slice(-MAX_HISTORY);
      set({ runs: { ...s.runs, [runId]: next }, history });
    };

    const appendLog = (runId: string, line: RunnerLogLine) => {
      const s = get();
      const r = s.runs[runId];
      if (!r) {
        upsertRun(runId, { logs: [line] });
        return;
      }
      const logs = r.logs.length >= MAX_LOG_LINES_PER_RUN
        ? [...r.logs.slice(-MAX_LOG_LINES_PER_RUN + 1), line]
        : [...r.logs, line];
      set({ runs: { ...s.runs, [runId]: { ...r, logs } } });
    };

    const appendDiagnostic = (runId: string, d: RunnerDiagnostic) => {
      const s = get();
      const r = s.runs[runId];
      if (!r) return;
      set({
        runs: {
          ...s.runs,
          [runId]: { ...r, diagnostics: [...r.diagnostics, d] },
        },
      });
    };

    await onRunnerStdout((p) =>
      appendLog(p.runId, { ts: Date.now(), channel: 'stdout', text: p.line }),
    );
    await onRunnerStderr((p) =>
      appendLog(p.runId, { ts: Date.now(), channel: 'stderr', text: p.line }),
    );
    await onRunnerDiagnostic((p) => appendDiagnostic(p.runId, p));
    await onRunnerExit((p) => {
      const s = get();
      const r = s.runs[p.runId];
      const kindLabel = normalizeKindLabel(p.kind ?? r?.kindLabel);
      const state: RunState =
        p.code === 0 ? 'succeeded' : p.code == null ? 'stopped' : 'failed';
      const startedAtMs = r?.startedAtMs ?? Date.now() - p.durationMs;
      const result: KindResult = {
        runId: p.runId,
        state,
        startedAtMs,
        durationMs: p.durationMs,
        ...(s.latest[kindLabel]
          ? {
              typecheckErrors: s.latest[kindLabel]?.typecheckErrors,
              lintErrors: s.latest[kindLabel]?.lintErrors,
              lintWarnings: s.latest[kindLabel]?.lintWarnings,
              testsPassed: s.latest[kindLabel]?.testsPassed,
              testsFailed: s.latest[kindLabel]?.testsFailed,
            }
          : {}),
      };

      const active = { ...s.active };
      if (active[kindLabel] === p.runId) delete active[kindLabel];

      const updatedRun: RunRecord = r
        ? { ...r, state, durationMs: p.durationMs, exitCode: p.code }
        : {
            runId: p.runId,
            kindLabel,
            state,
            startedAtMs,
            durationMs: p.durationMs,
            exitCode: p.code,
            logs: [],
            diagnostics: [],
          };

      set({
        runs: { ...s.runs, [p.runId]: updatedRun },
        latest: { ...s.latest, [kindLabel]: result },
        active,
      });
    });
    await onRunnerSummary((p) => {
      const s = get();
      const kindLabel = normalizeKindLabel(p.kind);
      const existing = s.latest[kindLabel];
      if (!existing) return;
      const merged: KindResult = {
        ...existing,
        typecheckErrors: p.typecheckErrors,
        lintErrors: p.lintErrors,
        lintWarnings: p.lintWarnings,
        testsPassed: p.testsPassed,
        testsFailed: p.testsFailed,
      };
      set({ latest: { ...s.latest, [kindLabel]: merged } });
    });
  },

  async start(kind, workspaceRoot) {
    await get().ensureWired();
    const root = workspaceRoot ?? getWorkspaceRoot();
    if (!isRunnerAvailable()) {
      set({ lastError: 'Runner unavailable in web mode' });
      return null;
    }
    try {
      const id = await runnerStart(kind, root);
      const label: RunnerKindLabel =
        kind.kind === 'Custom' ? 'custom' : (kind.kind.toLowerCase() as RunnerKindLabel);
      const s = get();
      const seed: RunRecord = {
        runId: id,
        kindLabel: label,
        state: 'running',
        startedAtMs: Date.now(),
        durationMs: null,
        exitCode: null,
        logs: [],
        diagnostics: [],
      };
      set({
        runs: { ...s.runs, [id]: seed },
        history: [...s.history, id].slice(-MAX_HISTORY),
        active: { ...s.active, [label]: id },
        latest: {
          ...s.latest,
          [label]: {
            runId: id,
            state: 'running',
            startedAtMs: seed.startedAtMs,
            durationMs: null,
          },
        },
        lastError: null,
      });
      return id;
    } catch (e) {
      set({ lastError: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  async startByLabel(label, workspaceRoot) {
    return get().start(labelToKind(label), workspaceRoot);
  },

  async stop(runId) {
    if (!isRunnerAvailable()) return;
    try {
      await runnerStop(runId);
    } catch (e) {
      set({ lastError: e instanceof Error ? e.message : String(e) });
    }
  },

  clearLogs(runId) {
    const s = get();
    const r = s.runs[runId];
    if (!r) return;
    set({ runs: { ...s.runs, [runId]: { ...r, logs: [] } } });
  },
}));

// ---- Selectors / derived helpers ------------------------------------------

export function useBuildStatus() {
  return useRunnerStore((s) => s.latest.build);
}
export function useTypeCheckStatus() {
  return useRunnerStore((s) => s.latest.typecheck);
}
export function useLintStatus() {
  return useRunnerStore((s) => s.latest.lint);
}
export function useTestStatus() {
  return useRunnerStore((s) => s.latest.test);
}

/**
 * Risk score per Phase 3 spec:
 *   build fail = +50, typecheck errors = +5 each,
 *   lint errors = +2 each, test fail = +10 each.
 */
export function selectDeployRiskScore(state: RunnerStoreState): number {
  const { build, typecheck, lint, test } = state.latest;
  let score = 0;
  if (build && build.state === 'failed') score += 50;
  if (typecheck?.typecheckErrors) score += 5 * typecheck.typecheckErrors;
  if (lint?.lintErrors) score += 2 * lint.lintErrors;
  if (test?.testsFailed) score += 10 * test.testsFailed;
  return score;
}

export function useDeployRiskScore() {
  return useRunnerStore(selectDeployRiskScore);
}

export function selectActiveRunIds(state: RunnerStoreState): string[] {
  return Object.values(state.active).filter((v): v is string => !!v);
}
