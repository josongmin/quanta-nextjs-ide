/**
 * Auto-escalation policy.
 *
 * Rules:
 *   - any request that touches a critical flow (file-name OR keyword
 *     match) → upgrade to 'governed'.
 *   - any request that mentions >2 file paths or critical keywords →
 *     upgrade from 'instant' to 'guided'.
 *
 * The user-selected mode is a floor: we never *down*-grade.
 */

import { MODE_RANK, type AiMode, type ResolvedMode } from './types';

export interface EscalationContext {
  /** Free-form user request text. */
  userRequest: string;
  /** Files explicitly mentioned in the request or selected for context. */
  mentionedFiles?: string[];
  /** Critical-flow file globs / paths the user is touching. */
  criticalFlowFiles?: string[];
  /** Critical-flow kinds the user is touching. */
  criticalFlowKinds?: string[];
}

const CRITICAL_KEYWORDS = [
  'payment',
  'checkout',
  'stripe',
  'auth',
  'login',
  'signup',
  'password',
  'token',
  'admin',
  'role',
  'billing',
  'subscription',
];

const PATH_REGEX = /(\.\/|\.\.\/|\/?[\w.@-]+\/)+[\w.@-]+\.(?:tsx?|jsx?|mjs|cjs|json|css|md)/g;

function extractPaths(text: string): string[] {
  return Array.from(text.matchAll(PATH_REGEX), (m) => m[0]);
}

function hasCriticalKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

function maxMode(a: AiMode, b: AiMode): AiMode {
  return MODE_RANK[a] >= MODE_RANK[b] ? a : b;
}

export function resolveMode(
  requested: AiMode,
  ctx: EscalationContext,
): ResolvedMode {
  const reasons: string[] = [];
  let effective: AiMode = requested;

  const touchesCriticalFlow =
    (ctx.criticalFlowFiles?.length ?? 0) > 0 ||
    (ctx.criticalFlowKinds?.length ?? 0) > 0;

  if (touchesCriticalFlow) {
    if (MODE_RANK[effective] < MODE_RANK.governed) {
      reasons.push(
        `Request touches critical flow (${
          ctx.criticalFlowKinds?.join(', ') ?? 'detected'
        }) — escalating to Governed.`,
      );
      effective = 'governed';
    }
  }

  // Heuristic escalation: many files OR critical keyword.
  const filesMentioned = new Set([
    ...(ctx.mentionedFiles ?? []),
    ...extractPaths(ctx.userRequest),
  ]);
  const kw = hasCriticalKeyword(ctx.userRequest);

  if ((filesMentioned.size > 2 || kw) && requested === 'instant') {
    if (MODE_RANK[effective] < MODE_RANK.guided) {
      reasons.push(
        kw
          ? `Critical keyword "${kw}" in request — escalating from Instant to Guided.`
          : `Request mentions ${filesMentioned.size} files — escalating from Instant to Guided.`,
      );
      effective = maxMode(effective, 'guided');
    }
  }

  return { requested, effective, escalationReasons: reasons };
}
