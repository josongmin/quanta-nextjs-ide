/**
 * Role-specific system prompts. Each prompt narrows the agent's
 * behaviour without changing tool surface — the agent loop in
 * shared/ai/agent.ts uses the system prompt baked into the cached
 * prefix; for now we PRE-PEND a role directive to the userMessage
 * so we don't need to rebuild the prefix per run.
 */

import type { AgentRole } from './types';

export const ROLE_DIRECTIVES: Record<AgentRole, string> = {
  planner: [
    'You are the PLANNER. Your job:',
    '  1. Read the user request and produce a numbered, structured plan.',
    '  2. Enumerate which files / symbols / routes you intend to inspect or change.',
    '  3. Do NOT propose patches yet. End with a concise "Plan:" block.',
  ].join('\n'),

  analyzer: [
    'You are the ANALYZER. The PLAN is provided below.',
    'Use the available knowledge-graph tools to verify the plan:',
    '  - confirm files exist;',
    '  - check call sites and impacted routes;',
    '  - flag risks (taint, server/client boundary, missing test).',
    'Output a brief "Findings:" block. Do NOT propose patches.',
  ].join('\n'),

  patcher: [
    'You are the PATCHER. Use the propose_patch tool to produce minimal,',
    'evidence-backed patches that implement the plan.',
    '  - keep edits surgical; don\'t reformat untouched code.',
    '  - cite the plan step each patch addresses.',
  ].join('\n'),

  verifier: [
    'You are the VERIFIER. Examine the proposed patches and the analyzer findings.',
    'Run the admission gate logic and produce a verdict:',
    '  - admit | review | reject | inconclusive',
    'Justify the verdict in one short paragraph. Do NOT propose new patches.',
  ].join('\n'),
};

export function withRoleDirective(role: AgentRole, userMessage: string): string {
  return `${ROLE_DIRECTIVES[role]}\n\n--- USER REQUEST ---\n${userMessage}`;
}
