/**
 * Phase 20 — Next.js Verbs in the Command Palette.
 *
 * Public surface:
 *   - <NextVerbsRegistration /> — drop-in component, mounts hotkeys,
 *     overlay, and preview shell.
 *   - NEXT_VERBS, findVerb — registry access for tests / external surfaces.
 *   - getRelevantVerbs(ctx) — pick the 3 most context-relevant verbs.
 *   - useVerbContext() / readVerbContext() — derive the verb context.
 *   - showVerbPreview(payload) — imperative preview shell entry.
 */

export { NextVerbsRegistration, useVerbContext, readVerbContext, getRelevantVerbs } from './integration';
export {
  NEXT_VERBS,
  VERB_CATEGORY_LABEL,
  VERB_CATEGORY_ORDER,
  findVerb,
} from './registry';
export {
  NextVerbPreviewShell,
  showVerbPreview,
  useVerbPreviewStore,
} from './preview-shell';
export type {
  NextVerb,
  VerbContext,
  VerbCategory,
  VerbIcon,
  PreviewPayload,
} from './types';
export { ASK_CODEBASE_OPEN_EVENT } from './verbs/ask-codebase';
