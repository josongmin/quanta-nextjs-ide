/**
 * Cache snapshot source — synthesizes a "current cache state" tree from
 * `useCacheTagStore`. Until a real Next runtime adapter exists, we simulate
 * TTL countdowns: each tag is seeded with a deterministic ttlMs based on the
 * tag id; once it elapses, the tag flips fresh -> stale. Calling
 * `revalidateTagLocally(id)` flips it to revalidating, then to fresh after a
 * short delay (and synthesizes a `revalidate` LiveEvent).
 */

import { useCacheTagStore } from '@entities/cache-tag';
import type { CacheTag } from '@shared/types';
import { useLiveBottomTabsStore, nextEventId } from '../store';
import type { CacheTagLive, RevalidateEvent } from '../types';

const REVALIDATE_DELAY_MS = 800;

/** Stable hash so each tag gets a deterministic but varied TTL across reloads. */
function hashTtl(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  // 20s..2min in 10s buckets
  const bucket = Math.abs(h) % 11; // 0..10
  return 20_000 + bucket * 10_000;
}

function seedFromTag(tag: CacheTag, now: number): CacheTagLive {
  const ttlMs = hashTtl(tag.id);
  // Skew freshAt across tags so they don't all flip simultaneously.
  const skew = (Math.abs(hashCode(tag.id)) % ttlMs) * -1;
  const freshAt = now + skew;
  const remainingMs = Math.max(0, freshAt + ttlMs - now);
  return {
    id: tag.id,
    name: tag.name,
    state: remainingMs > 0 ? 'fresh' : 'stale',
    freshAt,
    ttlMs,
    remainingMs,
    changedAt: now,
    recentInvalidations: [],
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

let _attached = false;
let _tickHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Seed the live cache slice from useCacheTagStore and start a 1Hz tick that
 * decrements `remainingMs`. Idempotent.
 */
export function attachCacheSnapshotSource(): () => void {
  if (_attached) return () => {};
  _attached = true;

  const seed = () => {
    const tags = useCacheTagStore.getState().tags;
    const now = Date.now();
    const upsert = useLiveBottomTabsStore.getState().upsertCache;
    for (const t of tags) upsert(seedFromTag(t, now));
  };
  seed();

  // Re-seed when tags change (length-based diff is enough for our mock data).
  let lastLen = useCacheTagStore.getState().tags.length;
  const unsubTags = useCacheTagStore.subscribe((s) => {
    if (s.tags.length !== lastLen) {
      lastLen = s.tags.length;
      seed();
    }
  });

  _tickHandle = setInterval(() => {
    const store = useLiveBottomTabsStore.getState();
    const now = Date.now();
    for (const id of store.cacheOrder) {
      const cur = store.cache[id];
      if (!cur) continue;
      if (cur.state === 'revalidating') continue;
      const remaining = Math.max(0, cur.freshAt + cur.ttlMs - now);
      const nextState = remaining > 0 ? 'fresh' : 'stale';
      if (remaining === cur.remainingMs && nextState === cur.state) continue;
      store.upsertCache({
        ...cur,
        remainingMs: remaining,
        state: nextState,
        changedAt: nextState !== cur.state ? now : cur.changedAt,
      });
    }
  }, 1000);

  return () => {
    unsubTags();
    if (_tickHandle) clearInterval(_tickHandle);
    _tickHandle = null;
    _attached = false;
  };
}

/**
 * Locally simulate revalidateTag(name). Flips state to revalidating, schedules
 * a refresh, and pushes a synthetic revalidate event into the live stream.
 *
 * TODO: when a real Next dev adapter exists, route this through the runner
 * via an HTTP call to `/__nextjs_dev_indicator__/revalidate` (or similar).
 */
export function revalidateTagLocally(id: string, source = 'manual'): void {
  const store = useLiveBottomTabsStore.getState();
  const tag = store.cache[id];
  if (!tag) return;

  store.recordInvalidation(id, source);

  // Lookup how many routes this tag affects via the cache-tag entity.
  const cacheTag = useCacheTagStore.getState().byId(id);
  const routesAffected = cacheTag?.affectedRouteIds.length ?? 0;

  const ev: RevalidateEvent = {
    id: nextEventId('rev'),
    ts: Date.now(),
    kind: 'revalidate',
    summary: `revalidateTag('${tag.name}') · ${routesAffected} route${routesAffected === 1 ? '' : 's'} affected`,
    tag: tag.name,
    routesAffected,
  };
  if (!store.paused) store.pushEvent(ev);

  setTimeout(() => {
    const s = useLiveBottomTabsStore.getState();
    const cur = s.cache[id];
    if (!cur) return;
    s.upsertCache({
      ...cur,
      state: 'fresh',
      freshAt: Date.now(),
      remainingMs: cur.ttlMs,
      changedAt: Date.now(),
    });
  }, REVALIDATE_DELAY_MS);
}
