/**
 * Incremental analyzer bus.
 *
 * Each analyzer registers itself with `bus.register({ id, dependsOn, run })`.
 * When the workspace is opened, `bus.runAll(root)` invokes every registered
 * analyzer once. Afterwards, `fs:changed` events from the Rust watcher are
 * fan-routed to only those analyzers whose `dependsOn(path)` predicate
 * matches at least one changed path.
 *
 * The bus is intentionally tiny — it does not own analyzer output (each
 * analyzer writes to its own zustand store), only the scheduling and
 * deduplication of runs.
 */

import { workspace } from '@shared/workspace';
import type { FsChangedPayload } from '@shared/workspace';

export interface AnalyzerRegistration {
  /** Stable identifier — also used to dedupe re-registration. */
  id: string;
  /**
   * Returns true when the analyzer cares about the given workspace-relative
   * POSIX path. Called once per changed path.
   */
  dependsOn: (path: string) => boolean;
  /**
   * Runs the analysis. Receives the active workspace root. Implementations
   * are responsible for reading files via `workspace.readFile` /
   * `workspace.listFiles` and pushing results into their own store.
   */
  run: (workspaceRoot: string) => Promise<void> | void;
}

class AnalyzerBus {
  private analyzers = new Map<string, AnalyzerRegistration>();
  private currentRoot: string | null = null;
  private inflight = new Map<string, Promise<void>>();
  private fsUnsub: (() => void) | null = null;

  register(reg: AnalyzerRegistration): () => void {
    this.analyzers.set(reg.id, reg);
    // If a workspace is already open, run this analyzer once on registration
    // so late-mounted features see fresh data.
    if (this.currentRoot) {
      void this.runOne(reg.id, this.currentRoot);
    }
    return () => {
      this.analyzers.delete(reg.id);
    };
  }

  list(): AnalyzerRegistration[] {
    return Array.from(this.analyzers.values());
  }

  /**
   * Run every analyzer for the given workspace root. Subsequent fs:changed
   * events are subscribed to lazily on the first `runAll`.
   */
  async runAll(root: string): Promise<void> {
    this.currentRoot = root;
    await this.ensureFsSubscription();
    const tasks = Array.from(this.analyzers.keys()).map((id) =>
      this.runOne(id, root),
    );
    await Promise.allSettled(tasks);
  }

  private async runOne(id: string, root: string): Promise<void> {
    const reg = this.analyzers.get(id);
    if (!reg) return;
    // Coalesce: if a run for this analyzer is already in-flight, await it
    // and then schedule another (so the most recent fs change wins).
    const existing = this.inflight.get(id);
    if (existing) {
      try {
        await existing;
      } catch {
        // ignore — we'll attempt again below
      }
    }
    const p = (async () => {
      try {
        await reg.run(root);
      } catch (e) {
        console.warn(`[analyzer-bus] ${id} failed`, e);
      }
    })();
    this.inflight.set(id, p);
    try {
      await p;
    } finally {
      if (this.inflight.get(id) === p) this.inflight.delete(id);
    }
  }

  private async ensureFsSubscription(): Promise<void> {
    if (this.fsUnsub) return;
    this.fsUnsub = await workspace.onFsChanged((payload) => {
      this.handleFsChanged(payload);
    });
  }

  private handleFsChanged(payload: FsChangedPayload): void {
    const root = this.currentRoot;
    if (!root) return;
    const affected = new Set<string>();
    for (const reg of this.analyzers.values()) {
      if (payload.paths.some((p) => reg.dependsOn(p))) {
        affected.add(reg.id);
      }
    }
    for (const id of affected) {
      void this.runOne(id, root);
    }
  }

  /** Used in tests and on workspace close. */
  reset(): void {
    if (this.fsUnsub) {
      this.fsUnsub();
      this.fsUnsub = null;
    }
    this.currentRoot = null;
    this.inflight.clear();
  }
}

export const analyzerBus = new AnalyzerBus();

// ── dependsOn helpers ──────────────────────────────────────────────────────

/** True if `path` matches a Next.js source file under the project root. */
export function isTsLike(path: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs)$/.test(path);
}

/** True if `path` lives under `app/` (or `src/app/`). */
export function isAppRouterPath(path: string): boolean {
  return path.startsWith('app/') || path.startsWith('src/app/');
}
