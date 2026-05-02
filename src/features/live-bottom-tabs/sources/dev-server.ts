/**
 * Dev-server source — listens to `@shared/runner` stdout/stderr from
 * `next dev` (and `next build`) and parses recognizable lines into typed
 * LiveEvents (rsc-chunk, server-action, revalidate, mutation, error).
 *
 * The parser is intentionally heuristic: Next emits informal log strings,
 * not a structured stream, so we match a small set of common patterns and
 * fall through anything else.
 *
 * Subscribes once via `useRunnerStore.subscribe` — calling `attachDevServerSource()`
 * is idempotent.
 */

import { useRunnerStore } from '@shared/runner';
import { useLiveBottomTabsStore, nextEventId } from '../store';
import type { LiveEvent } from '../types';

let _attached = false;
let _seenLines = 0;

const RSC_RX = /RSC chunk\s+([^\s]+)\s+(\d+(?:\.\d+)?)\s*KB\s+(\d+)\s*ms/i;
const ACTION_RX = /Action\s+([\w$.]+)\s+(OK|ERR|FAIL)\s+(\d+)\s*ms/i;
const REVALIDATE_RX = /revalidateTag\(['"]?([^'")\s]+)['"]?\)/i;
const MUTATION_RX = /(prisma\.[\w.]+|drizzle\.[\w.]+|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/i;
const ERROR_RX = /^(?:Error|TypeError|ReferenceError|RangeError):\s*(.+)$/i;

export interface ParsedDevLine {
  event: LiveEvent | null;
}

/** Pure parser exported for tests. */
export function parseDevLine(line: string, ts: number = Date.now()): LiveEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let m: RegExpExecArray | null;

  m = RSC_RX.exec(trimmed);
  if (m) {
    const route = m[1] ?? '/';
    const kb = parseFloat(m[2] ?? '0');
    const ms = parseInt(m[3] ?? '0', 10);
    return {
      id: nextEventId('rsc'),
      ts,
      kind: 'rsc-chunk',
      summary: `RSC chunk · ${route} · ${kb.toFixed(1)}KB · ${ms}ms`,
      route,
      bytes: Math.round(kb * 1024),
      durationMs: ms,
    };
  }

  m = ACTION_RX.exec(trimmed);
  if (m) {
    const name = m[1] ?? 'action';
    const status = (m[2] ?? 'OK').toUpperCase() === 'OK' ? 'ok' : 'err';
    const ms = parseInt(m[3] ?? '0', 10);
    return {
      id: nextEventId('act'),
      ts,
      kind: 'server-action',
      summary: `${name} · ${status === 'ok' ? 'OK' : 'ERR'} · ${ms}ms`,
      actionName: name,
      durationMs: ms,
      status,
    };
  }

  m = REVALIDATE_RX.exec(trimmed);
  if (m) {
    const tag = m[1] ?? 'unknown';
    return {
      id: nextEventId('rev'),
      ts,
      kind: 'revalidate',
      summary: `revalidateTag('${tag}')`,
      tag,
      routesAffected: 0,
    };
  }

  m = MUTATION_RX.exec(trimmed);
  if (m) {
    const target = m[1] ?? 'mutation';
    return {
      id: nextEventId('mut'),
      ts,
      kind: 'mutation',
      summary: target,
      target,
    };
  }

  m = ERROR_RX.exec(trimmed);
  if (m) {
    const msg = m[1] ?? trimmed;
    return {
      id: nextEventId('err'),
      ts,
      kind: 'error',
      summary: `Error · ${msg.slice(0, 120)}`,
      message: msg,
    };
  }

  return null;
}

/**
 * Subscribe to runner-store changes and stream new dev/build log lines through
 * `parseDevLine`. We diff log lengths per run to find new lines without holding
 * a per-line cursor.
 */
export function attachDevServerSource(): () => void {
  if (_attached) return () => {};
  _attached = true;

  const cursor: Record<string, number> = {};

  const unsub = useRunnerStore.subscribe((state) => {
    // We only follow `build` + `custom` (where `next dev` typically lives) +
    // anything else with a label like 'build' for safety.
    const events: LiveEvent[] = [];
    for (const runId of state.history) {
      const run = state.runs[runId];
      if (!run) continue;
      if (run.kindLabel !== 'build' && run.kindLabel !== 'custom') continue;
      const seen = cursor[runId] ?? 0;
      if (run.logs.length <= seen) continue;
      for (let i = seen; i < run.logs.length; i++) {
        const line = run.logs[i];
        if (!line) continue;
        _seenLines += 1;
        const ev = parseDevLine(line.text, line.ts);
        if (ev) events.push(ev);
      }
      cursor[runId] = run.logs.length;
    }
    if (events.length === 0) return;
    if (useLiveBottomTabsStore.getState().paused) return;
    useLiveBottomTabsStore.getState().pushEvents(events);
  });

  return () => {
    unsub();
    _attached = false;
  };
}

/** Used by tests / status displays. */
export function devServerSourceSeenLines(): number {
  return _seenLines;
}
