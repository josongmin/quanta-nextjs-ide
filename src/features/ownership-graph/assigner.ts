/**
 * Reviewer suggestion engine.
 *
 * Given a list of changed files and a criticality level, returns a
 * dedup'd ordered list of reviewers:
 *
 *  1. For each file, resolve owners via CODEOWNERS (last match wins)
 *     with manual overrides layered on top.
 *  2. Group owners → teams (an owner that doesn't map to a known team
 *     is treated as an individual reviewer with `kind: 'user'`).
 *  3. If criticality is `high|critical`, prefer team members tagged
 *     `senior`. Otherwise return the owner string as-is.
 */

import type { CodeownersRule } from './parser';
import { ownersFor, parseCodeowners } from './parser';
import type { ManualOverride, TeamMeta } from './store';

export type Criticality = 'low' | 'medium' | 'high' | 'critical';

export interface Reviewer {
  id: string;
  /** If we can attribute this reviewer to a team, this is the team id. */
  teamId?: string;
  kind: 'team' | 'senior' | 'user';
  reason: string;
}

export interface AssignerInput {
  changedFiles: ReadonlyArray<string>;
  rules: ReadonlyArray<CodeownersRule>;
  overrides: ReadonlyArray<ManualOverride>;
  teams: Record<string, TeamMeta>;
  criticality: Criticality;
}

function rulesFromOverrides(overrides: ReadonlyArray<ManualOverride>): ReadonlyArray<CodeownersRule> {
  // Cheap reuse: build a tiny CODEOWNERS file from overrides and parse it.
  const text = overrides.map((o) => `${o.pattern} ${o.owners.join(' ')}`).join('\n');
  if (!text) return [];
  return parseCodeowners(text).rules;
}

export function suggestReviewers(input: AssignerInput): Reviewer[] {
  const overrideRules = rulesFromOverrides(input.overrides);
  // Manual overrides take priority over CODEOWNERS — concat so that
  // override matches win in the "last match" pass.
  const allRules = [...input.rules, ...overrideRules];

  const ownerCounts = new Map<string, number>();
  const ownerFiles = new Map<string, string[]>();

  for (const file of input.changedFiles) {
    const owners = ownersFor(file, allRules);
    for (const owner of owners) {
      ownerCounts.set(owner, (ownerCounts.get(owner) ?? 0) + 1);
      const arr = ownerFiles.get(owner) ?? [];
      arr.push(file);
      ownerFiles.set(owner, arr);
    }
  }

  const wantsSenior = input.criticality === 'high' || input.criticality === 'critical';
  const reviewers: Reviewer[] = [];

  // Sort owners by hit count desc to put the most-impacted team first.
  const sorted = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1]);

  for (const [owner, count] of sorted) {
    const team = input.teams[owner];
    if (team) {
      reviewers.push({
        id: team.id,
        teamId: team.id,
        kind: 'team',
        reason: `Owns ${count} changed file${count === 1 ? '' : 's'}`,
      });
      if (wantsSenior) {
        for (const senior of team.seniors) {
          reviewers.push({
            id: senior,
            teamId: team.id,
            kind: 'senior',
            reason: `Senior on ${team.label} — required for ${input.criticality} change`,
          });
        }
      }
    } else {
      reviewers.push({
        id: owner,
        kind: 'user',
        reason: `Owns ${count} changed file${count === 1 ? '' : 's'}`,
      });
    }
  }

  // Dedup by id, preserving order.
  const seen = new Set<string>();
  return reviewers.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/**
 * Read the criticality of the current change from
 * `quanta.criticalFlows` localStorage if set; else fall back to a
 * keyword heuristic over the changed files.
 */
export function inferCriticality(changedFiles: ReadonlyArray<string>): Criticality {
  // Hook: read tags from critical-flow store (if available in this runtime).
  try {
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem('quanta.criticalFlows')
      : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { manual?: Array<{ kind: string; routes?: string[]; actions?: string[] }> } };
      const tags = parsed?.state?.manual ?? [];
      const kinds = new Set(tags.map((t) => t.kind));
      if (kinds.has('payment') || kinds.has('auth')) return 'high';
      if (kinds.size > 0) return 'medium';
    }
  } catch {
    /* ignore */
  }
  // Keyword fallback.
  const text = changedFiles.join(' ').toLowerCase();
  if (/(payment|checkout|stripe|billing|auth|password|secret|token)/.test(text)) {
    return 'high';
  }
  if (/(admin|migration|prisma|db\/)/.test(text)) return 'medium';
  return 'low';
}
