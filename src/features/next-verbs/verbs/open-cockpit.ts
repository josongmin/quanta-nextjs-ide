/**
 * Verb 11 — "Open Cockpit".
 *
 * Opens the cockpit overlay; touches no internal state.
 */

import { Icon } from '@shared/ui';
import { useUiStore } from '@entities/ui-shell';
import type { NextVerb } from '../types';

export const openCockpitVerb: NextVerb = {
  id: 'open-cockpit',
  title: 'Open Cockpit',
  description: 'Show the deploy / runtime cockpit overlay.',
  category: 'navigation',
  icon: Icon.Cog,
  shouldShow: () => true,
  run: () => {
    useUiStore.getState().openOverlay('cockpit');
  },
};
