/**
 * Verb 12 — "Ask the codebase".
 *
 * Dispatches a custom DOM event the AskCodebaseButton can listen for.
 * If nobody subscribes the user falls back to using the top-bar button.
 */

import { toast } from 'sonner';
import { Icon } from '@shared/ui';
import type { NextVerb } from '../types';

export const ASK_CODEBASE_OPEN_EVENT = 'next-verbs:ask-codebase-open';

export const askCodebaseVerb: NextVerb = {
  id: 'ask-codebase',
  title: 'Ask the codebase',
  description: 'Open the streamed-AI codebase Q&A dialog.',
  category: 'navigation',
  icon: Icon.Bulb,
  shouldShow: () => true,
  run: () => {
    const ev = new CustomEvent(ASK_CODEBASE_OPEN_EVENT, {
      cancelable: true,
      bubbles: true,
    });
    const handled = !window.dispatchEvent(ev);
    if (!handled) {
      toast('Ask the codebase', {
        description: 'Press ⌘⇧A in the top bar (or wire AskCodebaseButton to listen).',
      });
    }
  },
};
