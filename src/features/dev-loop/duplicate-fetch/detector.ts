/**
 * Duplicate fetch detector. Groups fetch calls by their normalized cache key
 * and emits a DuplicateGroup whenever a key occurs more than once.
 *
 * `suggestedLoader` is heuristic — it picks the longest common path prefix of
 * the calling files and tacks on `_lib/loaders.ts`. Future versions can use
 * the route boundary instead, but the prefix is good enough to be actionable.
 */

import { normalizeFetchKey } from './normalizer';
import type { DuplicateGroup, FetchCall } from './types';

function commonPrefix(paths: ReadonlyArray<string>): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return paths[0]!.split('/').slice(0, -1).join('/');
  const split = paths.map((p) => p.split('/'));
  const first = split[0]!;
  let i = 0;
  outer: for (; i < first.length; i++) {
    for (let j = 1; j < split.length; j++) {
      if (split[j]![i] !== first[i]) break outer;
    }
  }
  // Drop trailing filename
  return first.slice(0, Math.max(0, i)).join('/');
}

function suggestLoader(calls: ReadonlyArray<FetchCall>): string {
  const files = Array.from(new Set(calls.map((c) => c.file)));
  const prefix = commonPrefix(files);
  return (prefix ? prefix + '/' : '') + '_lib/loaders.ts';
}

export function detectDuplicates(
  fetchCalls: ReadonlyArray<FetchCall>,
): DuplicateGroup[] {
  const buckets = new Map<string, FetchCall[]>();
  for (const call of fetchCalls) {
    const key = normalizeFetchKey({
      url: call.url,
      method: call.method,
      ...(call.cache.cache !== undefined ? { cache: call.cache.cache } : {}),
      ...(call.cache.revalidate !== undefined
        ? { revalidate: call.cache.revalidate }
        : {}),
      ...(call.cache.tags !== undefined ? { tags: call.cache.tags } : {}),
    });
    const arr = buckets.get(key);
    if (arr) arr.push(call);
    else buckets.set(key, [call]);
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, calls] of buckets.entries()) {
    if (calls.length < 2) continue;
    const callerCount = new Set(calls.map((c) => c.file)).size;
    // Severity: info if same file (likely accidental loop), warn if 2-3
    // distinct callers, err if 4+ (very likely a fan-out problem).
    const severity: DuplicateGroup['severity'] =
      callerCount === 1 ? 'info' : callerCount < 4 ? 'warn' : 'err';
    groups.push({
      key,
      calls,
      callerCount,
      suggestedLoader: suggestLoader(calls),
      severity,
    });
  }

  // Sort: highest severity first, then most callers.
  const sevOrder: Record<DuplicateGroup['severity'], number> = {
    err: 0,
    warn: 1,
    info: 2,
  };
  groups.sort(
    (a, b) =>
      sevOrder[a.severity] - sevOrder[b.severity] ||
      b.callerCount - a.callerCount ||
      b.calls.length - a.calls.length,
  );
  return groups;
}
