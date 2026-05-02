/**
 * Vercel deploy adapter for the Ship-it Drawer.
 *
 * Runs `vercel deploy --prod --yes` via the existing runner subsystem
 * (Custom kind), then parses the deployment URL from stdout. If the
 * runner is not available (web mode) we fall back to a no-op success
 * with a marker URL so the UI flow stays demo-able.
 */

import {
  isRunnerAvailable,
  useRunnerStore,
  getWorkspaceRoot,
  type RunnerKind,
} from '@shared/runner';
import type { ShipResult } from './types';

const URL_RE = /https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[a-z0-9-_/]*)?/gi;

export interface VercelDeployOptions {
  prod?: boolean;
  workspaceRoot?: string;
  /** Optional override of the binary (e.g. 'pnpx vercel'). */
  binary?: string;
  /** Override for tests. */
  cwd?: string;
}

/**
 * Builds the runner kind we hand to the Tauri runner. Uses `--yes` to skip
 * the interactive confirmation Vercel CLI shows on first run.
 */
function buildKind(opts: VercelDeployOptions): RunnerKind {
  const args = ['deploy', '--yes'];
  if (opts.prod !== false) args.push('--prod');
  return { kind: 'Custom', command: opts.binary ?? 'vercel', args };
}

/**
 * Parse the deployment URL from runner stdout. Vercel CLI prints the
 * production URL on the last "Production:" line, but we're tolerant of
 * any https URL too.
 */
export function parseDeployUrl(output: string): string | undefined {
  const prodLine = output
    .split(/\r?\n/)
    .reverse()
    .find((l) => /Production:|Preview:|✅/i.test(l) && /https:\/\//i.test(l));
  const fromProd = prodLine?.match(URL_RE)?.[0];
  if (fromProd) return fromProd;
  const all = output.match(URL_RE);
  if (!all || all.length === 0) return undefined;
  return all[all.length - 1];
}

/**
 * Kicks off the deploy. Resolves once the run finishes (succeeded or failed)
 * and returns a `ShipResult`. The drawer uses this directly.
 */
export async function deployToVercel(
  opts: VercelDeployOptions = {},
): Promise<ShipResult> {
  if (!isRunnerAvailable()) {
    // Web/demo mode — pretend it worked so the UI flow is exercisable.
    return {
      ok: true,
      url: 'https://acme-shop.vercel.app',
      log: '[demo] vercel deploy --prod (runner unavailable in web mode)',
    };
  }

  const runner = useRunnerStore.getState();
  const root = opts.workspaceRoot ?? opts.cwd ?? getWorkspaceRoot();
  const id = await runner.start(buildKind(opts), root);
  if (!id) {
    return { ok: false, error: runner.lastError ?? 'Failed to start runner', log: '' };
  }

  // Poll the runner store for completion. Fast (50ms) — the runner is
  // event-driven so this resolves shortly after the process exits.
  return new Promise((resolve) => {
    const start = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000; // 5min hard cap
    const tick = () => {
      const rec = useRunnerStore.getState().runs[id];
      if (!rec) {
        if (Date.now() - start > TIMEOUT_MS) {
          resolve({ ok: false, error: 'Deploy timed out', log: '' });
          return;
        }
        setTimeout(tick, 250);
        return;
      }
      if (rec.state === 'running') {
        if (Date.now() - start > TIMEOUT_MS) {
          resolve({ ok: false, error: 'Deploy timed out', log: '' });
          return;
        }
        setTimeout(tick, 250);
        return;
      }
      const log = rec.logs.map((l) => l.text).join('\n');
      if (rec.state === 'succeeded') {
        resolve({ ok: true, url: parseDeployUrl(log), log });
      } else {
        resolve({
          ok: false,
          error:
            rec.state === 'stopped'
              ? 'Deploy was cancelled'
              : `vercel exited with code ${rec.exitCode ?? '?'}`,
          log,
        });
      }
    };
    tick();
  });
}
