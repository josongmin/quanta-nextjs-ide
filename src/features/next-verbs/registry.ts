/**
 * Phase 20 — verb registry. Order is the default display order in the
 * command palette (the integration layer may re-rank by context relevance).
 */

import { makeStaticVerb } from './verbs/make-static';
import { whyDynamicVerb } from './verbs/why-dynamic';
import { traceTagVerb } from './verbs/trace-tag';
import { findDupFetchesVerb } from './verbs/find-dup-fetches';
import { moveToActionVerb } from './verbs/move-to-action';
import { liftToUrlVerb } from './verbs/lift-to-url';
import { addRevalidateVerb } from './verbs/add-revalidate';
import { proveNoSecretVerb } from './verbs/prove-no-secret';
import { traceFullstackVerb } from './verbs/trace-fullstack';
import { runAdmissionVerb } from './verbs/run-admission';
import { openCockpitVerb } from './verbs/open-cockpit';
import { askCodebaseVerb } from './verbs/ask-codebase';
import type { NextVerb, VerbCategory } from './types';

export const NEXT_VERBS: ReadonlyArray<NextVerb> = [
  makeStaticVerb,
  whyDynamicVerb,
  traceTagVerb,
  findDupFetchesVerb,
  moveToActionVerb,
  liftToUrlVerb,
  addRevalidateVerb,
  proveNoSecretVerb,
  traceFullstackVerb,
  runAdmissionVerb,
  openCockpitVerb,
  askCodebaseVerb,
];

/** Look up a verb by id. */
export function findVerb(id: string): NextVerb | undefined {
  return NEXT_VERBS.find((v) => v.id === id);
}

/** Categories in display order. */
export const VERB_CATEGORY_ORDER: ReadonlyArray<VerbCategory> = [
  'mode',
  'cache',
  'fetch',
  'refactor',
  'security',
  'admission',
  'navigation',
];

export const VERB_CATEGORY_LABEL: Record<VerbCategory, string> = {
  mode: 'Render Mode',
  cache: 'Cache',
  fetch: 'Fetching',
  refactor: 'Refactor',
  security: 'Security',
  admission: 'Admission',
  navigation: 'Navigation',
};
