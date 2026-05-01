// Cache-race detector.
//
// Pure function — given the existing `CacheTag` snapshots from the cache-tag
// store, infer:
//   • overlap-revalidate   – 2+ invalidators per tag (concurrent mutations
//                             in production WILL race)
//   • redundant-revalidate – multiple invalidator sites in the same file
//                             targeting the same tag (likely a copy-paste
//                             leftover or revalidatePath + revalidateTag pair)
//   • stale-overwrite      – producer with `revalidate > 0` AND an
//                             invalidator on the same tag — a fetch in flight
//                             at the moment of `revalidateTag()` will overwrite
//                             the freshly-revalidated value with stale data.
//
// All severity scoring is heuristic but deterministic.
import type { CacheTag } from '@shared/types';
import type {
  CacheRaceKind,
  CacheRaceReport,
  CacheRaceRisk,
  CacheRaceSeverity,
  CacheRaceTimelineEvent,
} from './types';

export function analyzeCacheRaces(tags: CacheTag[]): CacheRaceReport {
  const start = Date.now();
  const risks: CacheRaceRisk[] = [];

  for (const tag of tags) {
    risks.push(...detectForTag(tag));
  }

  // Cross-tag: same file invalidates 2 distinct tags within close lines.
  risks.push(...detectCrossTagRedundant(tags));

  return { risks, durationMs: Date.now() - start };
}

function detectForTag(tag: CacheTag): CacheRaceRisk[] {
  const out: CacheRaceRisk[] = [];

  // 1. overlap-revalidate — multiple invalidator sites on this tag.
  if (tag.invalidators.length >= 2) {
    const events: CacheRaceTimelineEvent[] = tag.invalidators.map((inv, i) => ({
      id: `${tag.id}_inv_${i}`,
      label: `revalidateTag('${tag.name}')`,
      tag: tag.name,
      file: inv.location.file,
      line: inv.location.line,
      tSec: i * 1.5,
      kind: 'invalidator',
    }));
    out.push({
      id: `${tag.id}__overlap`,
      kind: 'overlap-revalidate',
      title: `Concurrent invalidators on '${tag.name}'`,
      severity: pickSeverity(tag.invalidators.length),
      tags: [tag.name],
      events,
      reason: `${tag.invalidators.length} call sites invalidate the same tag — concurrent mutations race the cache write.`,
      mitigation:
        'Centralize the invalidator behind a single helper, or coalesce calls with `unstable_cache` + a request-scoped dedupe.',
    });
  }

  // 2. stale-overwrite — producer w/ revalidate AND invalidator on same tag.
  const hasTimedRevalidate = tag.producers.some(
    (p) => typeof p.revalidate === 'number' && p.revalidate > 0,
  );
  if (hasTimedRevalidate && tag.invalidators.length >= 1) {
    const events: CacheRaceTimelineEvent[] = [];
    tag.producers.forEach((p, i) => {
      if (typeof p.revalidate === 'number' && p.revalidate > 0) {
        events.push({
          id: `${tag.id}_prod_${i}`,
          label: `fetch (revalidate=${p.revalidate})`,
          tag: tag.name,
          file: p.location.file,
          line: p.location.line,
          tSec: 0,
          kind: 'producer',
        });
      }
    });
    tag.invalidators.forEach((inv, i) => {
      events.push({
        id: `${tag.id}_inv_x_${i}`,
        label: `revalidateTag('${tag.name}')`,
        tag: tag.name,
        file: inv.location.file,
        line: inv.location.line,
        tSec: 1.2 + i * 0.6,
        kind: 'invalidator',
      });
    });
    out.push({
      id: `${tag.id}__stale_overwrite`,
      kind: 'stale-overwrite',
      title: `Stale-overwrite on '${tag.name}'`,
      severity: 'medium',
      tags: [tag.name],
      events,
      reason:
        'A timed-revalidate fetch can resolve AFTER `revalidateTag()` runs, overwriting the freshly invalidated entry with stale data.',
      mitigation:
        'Either drop the timed `revalidate` (let invalidation drive freshness), or wrap fetches in `unstable_cache` with the tag and rely on a single mechanism.',
    });
  }

  // 3. redundant-revalidate — same file + same tag, multiple invalidator sites.
  const byFile = new Map<string, typeof tag.invalidators>();
  for (const inv of tag.invalidators) {
    const arr = byFile.get(inv.location.file) ?? [];
    arr.push(inv);
    byFile.set(inv.location.file, arr);
  }
  for (const [file, invs] of byFile.entries()) {
    if (invs.length >= 2) {
      out.push({
        id: `${tag.id}__redundant_${slugify(file)}`,
        kind: 'redundant-revalidate',
        title: `Redundant invalidators in ${file}`,
        severity: 'low',
        tags: [tag.name],
        events: invs.map((inv, i) => ({
          id: `${tag.id}_red_${i}`,
          label: `revalidateTag('${tag.name}')`,
          tag: tag.name,
          file: inv.location.file,
          line: inv.location.line,
          tSec: i * 0.4,
          kind: 'invalidator',
        })),
        reason: `${invs.length} invalidator calls in the same file target tag '${tag.name}'.`,
        mitigation:
          'Likely a copy-paste from `revalidatePath` to `revalidateTag` — keep one or wrap both in a single helper.',
      });
    }
  }

  return out;
}

function detectCrossTagRedundant(tags: CacheTag[]): CacheRaceRisk[] {
  // Find any two tags whose names suggest the same data (same prefix or one
  // is a substring of the other) and that have invalidators in the same file.
  const out: CacheRaceRisk[] = [];
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i]!;
      const b = tags[j]!;
      if (!namesLookRelated(a.name, b.name)) continue;
      const sharedFiles = sharedInvalidatorFiles(a, b);
      if (sharedFiles.length === 0) continue;
      const events: CacheRaceTimelineEvent[] = [];
      for (const inv of a.invalidators) {
        if (sharedFiles.includes(inv.location.file)) {
          events.push({
            id: `${a.id}_${b.id}_a_${inv.location.line}`,
            label: `revalidateTag('${a.name}')`,
            tag: a.name,
            file: inv.location.file,
            line: inv.location.line,
            tSec: 0,
            kind: 'invalidator',
          });
        }
      }
      for (const inv of b.invalidators) {
        if (sharedFiles.includes(inv.location.file)) {
          events.push({
            id: `${a.id}_${b.id}_b_${inv.location.line}`,
            label: `revalidateTag('${b.name}')`,
            tag: b.name,
            file: inv.location.file,
            line: inv.location.line,
            tSec: 1,
            kind: 'invalidator',
          });
        }
      }
      if (events.length === 0) continue;
      out.push({
        id: `crosstag_${a.id}_${b.id}`,
        kind: 'redundant-revalidate',
        title: `Possible duplicate invalidation: '${a.name}' & '${b.name}'`,
        severity: 'low',
        tags: [a.name, b.name],
        events,
        reason: `Both tags are invalidated in the same file(s) and look related by name.`,
        mitigation:
          'Confirm whether one tag subsumes the other; if so, drop the duplicate `revalidateTag()` call.',
      });
    }
  }
  return out;
}

function namesLookRelated(a: string, b: string): boolean {
  const an = a.toLowerCase();
  const bn = b.toLowerCase();
  if (an === bn) return true;
  if (an.startsWith(bn) || bn.startsWith(an)) return true;
  if (an.replace(/s$/, '') === bn.replace(/s$/, '')) return true;
  return false;
}

function sharedInvalidatorFiles(a: CacheTag, b: CacheTag): string[] {
  const aFiles = new Set(a.invalidators.map((i) => i.location.file));
  const out: string[] = [];
  for (const inv of b.invalidators) {
    if (aFiles.has(inv.location.file)) out.push(inv.location.file);
  }
  return out;
}

function pickSeverity(n: number): CacheRaceSeverity {
  if (n >= 4) return 'high';
  if (n >= 2) return 'medium';
  return 'low';
}

function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 32);
}

export type { CacheRaceKind };
