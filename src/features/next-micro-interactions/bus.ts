/**
 * Phase 22 — Next.js-aware Micro-interactions: typed event bus.
 *
 * Producers (editor watcher, runner watcher, ai watcher, admission watcher)
 * fire events; consumers (line-sweep, mini-callout, top-progress, link-line,
 * cache-tag-pulse, sonner toast bridge) subscribe and render brief, theme-
 * aware visual moments.
 *
 * The bus is intentionally global (module-level), framework-free, and
 * synchronous; subscribers are notified in registration order. A small
 * 800ms throttle is built in so a rapid burst of identical events collapses
 * into one — see DESIGN RULES in the phase brief.
 */

export type NextMiEvent =
  | {
      kind: 'use-client-typed';
      file: string;
      line: number;
      // Optional projected impact (computed by the editor watcher).
      filesAdded?: number;
      kbAdded?: number;
    }
  | {
      kind: 'dynamic-trigger-accepted';
      file: string;
      line: number;
      // Which dynamic API was accepted (cookies / headers / searchParams).
      api: 'cookies' | 'headers' | 'searchParams';
    }
  | {
      kind: 'revalidate-tag-typed';
      file: string;
      line: number;
      tag: string;
    }
  | {
      kind: 'server-action-linked';
      file: string;
      defLine: number;
      callLine: number;
    }
  | {
      kind: 'env-secret-typed';
      file: string;
      line: number;
      column: number;
      // Whether the file is a server file (no "use client") or client file.
      isServer: boolean;
      // The matched env name.
      name: string;
    }
  | { kind: 'build-started'; runId: string }
  | { kind: 'build-success'; runId: string; durationMs: number | null }
  | { kind: 'build-failed'; runId: string }
  | { kind: 'admission-admit'; packetId: string }
  | { kind: 'admission-reject'; packetId: string; reasons: string[] }
  | {
      kind: 'fetch-added-in-render';
      file: string;
      line: number;
      url?: string;
    };

export type NextMiEventKind = NextMiEvent['kind'];

export type NextMiHandler = (event: NextMiEvent) => void;

interface BusInternal {
  handlers: Set<NextMiHandler>;
  /** Last-fire timestamp per (kind+identity) for throttling. */
  lastFireAt: Map<string, number>;
}

const THROTTLE_MS = 800;

const bus: BusInternal = {
  handlers: new Set(),
  lastFireAt: new Map(),
};

/**
 * Build a stable identity key for throttling. Identical events fired within
 * THROTTLE_MS (per identity) collapse into a single emission.
 */
function identityKey(e: NextMiEvent): string {
  switch (e.kind) {
    case 'use-client-typed':
    case 'env-secret-typed':
    case 'fetch-added-in-render':
      return `${e.kind}:${e.file}:${e.line}`;
    case 'dynamic-trigger-accepted':
      return `${e.kind}:${e.file}:${e.line}:${e.api}`;
    case 'revalidate-tag-typed':
      return `${e.kind}:${e.file}:${e.line}:${e.tag}`;
    case 'server-action-linked':
      return `${e.kind}:${e.file}:${e.defLine}-${e.callLine}`;
    case 'build-started':
    case 'build-success':
    case 'build-failed':
      return `${e.kind}:${e.runId}`;
    case 'admission-admit':
    case 'admission-reject':
      return `${e.kind}:${e.packetId}`;
  }
}

export function subscribe(handler: NextMiHandler): () => void {
  bus.handlers.add(handler);
  return () => {
    bus.handlers.delete(handler);
  };
}

/**
 * Subscribe to a specific kind. Convenience wrapper that filters non-matching
 * events. Returns an unsubscribe.
 */
export function on<K extends NextMiEventKind>(
  kind: K,
  handler: (event: Extract<NextMiEvent, { kind: K }>) => void,
): () => void {
  return subscribe((e) => {
    if (e.kind === kind) handler(e as Extract<NextMiEvent, { kind: K }>);
  });
}

export function emit(event: NextMiEvent): void {
  const key = identityKey(event);
  const now =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  const last = bus.lastFireAt.get(key) ?? -Infinity;
  if (now - last < THROTTLE_MS) return;
  bus.lastFireAt.set(key, now);
  // Snapshot to insulate against handlers that unsubscribe during dispatch.
  const snapshot = Array.from(bus.handlers);
  for (const h of snapshot) {
    try {
      h(event);
    } catch {
      // Consumers must not break the bus; swallow + continue.
    }
  }
}

/** Test-only: clear all subscribers + throttle state. */
export function _resetForTests(): void {
  bus.handlers.clear();
  bus.lastFireAt.clear();
}

/** Test-only: peek at active handler count. */
export function _handlerCount(): number {
  return bus.handlers.size;
}
