/**
 * AI Mode System types (spec 21-3).
 *
 * Four operational modes selectable in the AI panel:
 *   - instant: skip plan, single patch, no admission gate
 *   - guided: produce plan first, user approves, then patch
 *   - autonomous: agent loops up to N iterations, no user prompts
 *   - governed: like guided + admission gate verdict required
 *
 * Mode is allowed to escalate automatically (e.g. instant -> guided
 * for non-trivial requests, anything -> governed for critical-flow
 * touches). The user-selected mode is the *floor*, escalation only
 * goes up.
 */

export type AiMode = 'instant' | 'guided' | 'autonomous' | 'governed';

export interface AiModeConfig {
  id: AiMode;
  label: string;
  description: string;
  /** ~ms latency hint for the UI cards. */
  latencyHint: string;
  /** Plain-English safety label. */
  safetyHint: string;
  /** Whether the mode produces a plan before applying patches. */
  producesPlan: boolean;
  /** Whether the mode runs the admission gate before applying patches. */
  enforcesGate: boolean;
  /** Whether the agent may loop autonomously without user prompts. */
  autonomous: boolean;
}

export const MODE_RANK: Record<AiMode, number> = {
  instant: 0,
  guided: 1,
  autonomous: 1, // parallel branch — same "rank" as guided for floors
  governed: 2,
};

export const MODE_CONFIG: Record<AiMode, AiModeConfig> = {
  instant: {
    id: 'instant',
    label: 'Instant',
    description:
      'Single-shot patch, no plan, no admission gate. Best for tiny edits.',
    latencyHint: '~2s',
    safetyHint: 'No safety checks',
    producesPlan: false,
    enforcesGate: false,
    autonomous: false,
  },
  guided: {
    id: 'guided',
    label: 'Guided',
    description: 'Plan first, you approve, then patch. Lightweight checks.',
    latencyHint: '~6s',
    safetyHint: 'User-confirmed',
    producesPlan: true,
    enforcesGate: false,
    autonomous: false,
  },
  autonomous: {
    id: 'autonomous',
    label: 'Autonomous',
    description: 'Agent loops, fixes its own errors. No user prompts.',
    latencyHint: '~30s',
    safetyHint: 'Agent self-checks',
    producesPlan: true,
    enforcesGate: false,
    autonomous: true,
  },
  governed: {
    id: 'governed',
    label: 'Governed',
    description:
      'Multi-agent: plan → analyze → patch → verify. Admission gate required.',
    latencyHint: '~45s',
    safetyHint: 'Admission gate enforced',
    producesPlan: true,
    enforcesGate: true,
    autonomous: false,
  },
};

export interface ResolvedMode {
  /** The mode the user selected. */
  requested: AiMode;
  /** The mode actually in effect after escalation. */
  effective: AiMode;
  /** Reasons we promoted past `requested`. Empty when no escalation. */
  escalationReasons: string[];
}
