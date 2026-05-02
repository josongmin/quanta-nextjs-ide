/**
 * PR adapter for the Ship-it Drawer.
 *
 * Strategy:
 *   1. If `gh` is on PATH, run `gh pr create` via the runner (Custom kind).
 *   2. If `gh` is not present, fall back to copying a generated PR
 *      description to clipboard and opening github.com in the system
 *      browser.
 *
 * We purposely keep the heuristic simple — the IDE's git slice owns real
 * git inspection; this adapter just wraps the action.
 */

import {
  isRunnerAvailable,
  useRunnerStore,
  getWorkspaceRoot,
  type RunnerKind,
} from '@shared/runner';
import type { ShipReadiness, ShipResult } from './types';

const PR_URL_RE = /https:\/\/github\.com\/[^\s]+\/pull\/\d+/i;

export interface OpenPrOptions {
  workspaceRoot?: string;
  title?: string;
  body?: string;
  /** Default to current branch if absent. */
  base?: string;
}

/** Build a default PR title from readiness state. */
export function defaultPrTitle(r: ShipReadiness | null): string {
  if (!r) return 'Ship pending changes';
  if (r.criticalFlowsTouched.length > 0) {
    const f = r.criticalFlowsTouched[0]!;
    return `[${f.flow.kind}] update ${f.touchedFiles.length} file(s)`;
  }
  if (r.costDelta.isIncrease) {
    return `Cost-impacting deploy: +$${r.costDelta.totalDelta.toFixed(0)}/mo`;
  }
  return 'Ship pending changes';
}

/** Build a markdown PR description from readiness state. */
export function defaultPrBody(r: ShipReadiness | null): string {
  if (!r) return '## Summary\n\nNo readiness data available.\n';
  const lines: string[] = ['## Summary', ''];
  const verdict = r.admission?.decision ?? 'unknown';
  lines.push(`- **Admission**: ${verdict.toUpperCase()} (score ${r.admission?.score ?? 0})`);
  for (const c of r.runners) {
    const state =
      c.state === 'pass' ? '✓' : c.state === 'fail' ? '✗' : c.state === 'running' ? '…' : '·';
    lines.push(`- **${c.label}**: ${state}${c.detail ? ` (${c.detail})` : ''}`);
  }
  if (r.costDelta.rows.length > 0) {
    lines.push('', '## Cost delta', '');
    for (const row of r.costDelta.rows.slice(0, 5)) {
      const sign = row.monthlyDelta >= 0 ? '+' : '';
      lines.push(
        `- \`${row.path}\`: ${row.fromBucket} → ${row.toBucket} (${sign}$${row.monthlyDelta.toFixed(2)}/mo)`,
      );
    }
  }
  if (r.criticalFlowsTouched.length > 0) {
    lines.push('', '## Critical flows touched', '');
    for (const t of r.criticalFlowsTouched) {
      lines.push(`- **${t.flow.kind}** (${t.flow.label}) — ${t.touchedFiles.length} file(s)`);
    }
  }
  if (r.suggestions.length > 0) {
    lines.push('', '## Outstanding', '');
    for (const s of r.suggestions) lines.push(`- ${s.title}`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Best-effort clipboard write. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

function ghKind(title: string, body: string, base?: string): RunnerKind {
  const args = ['pr', 'create', '--title', title, '--body', body];
  if (base) args.push('--base', base);
  return { kind: 'Custom', command: 'gh', args };
}

function detectGhKind(): RunnerKind {
  // `gh --version` exits 0 when installed.
  return { kind: 'Custom', command: 'gh', args: ['--version'] };
}

async function runAndCollect(kind: RunnerKind, root: string): Promise<{
  ok: boolean;
  log: string;
  exitCode: number | null;
}> {
  const runner = useRunnerStore.getState();
  const id = await runner.start(kind, root);
  if (!id) return { ok: false, log: runner.lastError ?? 'failed to start', exitCode: null };
  return new Promise((resolve) => {
    const tick = () => {
      const rec = useRunnerStore.getState().runs[id];
      if (!rec || rec.state === 'running') {
        setTimeout(tick, 200);
        return;
      }
      const log = rec.logs.map((l) => l.text).join('\n');
      resolve({ ok: rec.state === 'succeeded', log, exitCode: rec.exitCode });
    };
    tick();
  });
}

function openInBrowser(url: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.open(url, '_blank', 'noopener');
    } catch {
      /* ignore */
    }
  }
}

/**
 * Open a PR. Returns a `ShipResult` mirroring `deployToVercel`.
 */
export async function openPullRequest(
  readiness: ShipReadiness | null,
  opts: OpenPrOptions = {},
): Promise<ShipResult> {
  const title = opts.title ?? defaultPrTitle(readiness);
  const body = opts.body ?? defaultPrBody(readiness);

  if (!isRunnerAvailable()) {
    // Web mode — clipboard fallback only.
    const ok = await copyToClipboard(`${title}\n\n${body}`);
    openInBrowser('https://github.com/');
    return ok
      ? { ok: true, url: 'https://github.com/', log: '[demo] PR description copied to clipboard' }
      : { ok: false, error: 'Clipboard unavailable', log: '' };
  }

  const root = opts.workspaceRoot ?? getWorkspaceRoot();

  // Step 1: detect gh.
  const probe = await runAndCollect(detectGhKind(), root);
  if (!probe.ok) {
    // Fallback: copy + open github.
    const ok = await copyToClipboard(`${title}\n\n${body}`);
    openInBrowser('https://github.com/');
    return ok
      ? {
          ok: true,
          url: 'https://github.com/',
          log: '[fallback] gh CLI not found; PR description copied to clipboard',
        }
      : {
          ok: false,
          error: 'gh CLI absent and clipboard unavailable',
          log: probe.log,
        };
  }

  // Step 2: run `gh pr create`.
  const result = await runAndCollect(ghKind(title, body, opts.base), root);
  if (!result.ok) {
    return {
      ok: false,
      error: `gh pr create exited with code ${result.exitCode ?? '?'}`,
      log: result.log,
    };
  }
  const url = result.log.match(PR_URL_RE)?.[0];
  if (url) openInBrowser(url);
  return { ok: true, url, log: result.log };
}
