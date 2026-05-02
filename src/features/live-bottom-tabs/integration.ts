/**
 * Phase 19 integration glue. Centralized so the feature is registered with one
 * call from the bottom-panel widget.
 *
 * Sources are attached lazily on first call and are idempotent — the bottom
 * panel can mount/unmount without leaking.
 */

import { attachDevServerSource } from './sources/dev-server';
import { attachCacheSnapshotSource } from './sources/cache-snapshot';
import { attachOtelCollectorSource } from './sources/otel-collector';

export interface LiveBottomTabsRegistration {
  detach: () => void;
}

let _registration: LiveBottomTabsRegistration | null = null;

/**
 * Attach all three sources. Returns a `detach()` to unwire them. Calling
 * twice without detaching returns the existing registration.
 */
export function registerLiveBottomTabs(): LiveBottomTabsRegistration {
  if (_registration) return _registration;
  const detachDev = attachDevServerSource();
  const detachCache = attachCacheSnapshotSource();
  const detachOtel = attachOtelCollectorSource();
  const reg: LiveBottomTabsRegistration = {
    detach: () => {
      detachDev();
      detachCache();
      detachOtel();
      _registration = null;
    },
  };
  _registration = reg;
  return reg;
}

/** Tab identity tuples consumed by the bottom-panel widget. */
export const LIVE_BOTTOM_TAB_KEYS = [
  'live-events',
  'cache-state',
  'trace-graph',
] as const;

export type LiveBottomTabKey = (typeof LIVE_BOTTOM_TAB_KEYS)[number];

export const LIVE_BOTTOM_TAB_LABELS: Record<LiveBottomTabKey, string> = {
  'live-events': 'Live Events',
  'cache-state': 'Cache State',
  'trace-graph': 'Trace',
};
