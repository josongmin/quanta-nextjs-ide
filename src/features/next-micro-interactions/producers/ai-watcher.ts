/**
 * AI producer: subscribes to the agent store and watches the `lastPatchId`
 * to drive a faux "server-action linked" micro-moment when a patch lands.
 *
 * NOTE: The AI store does not currently expose a structured "patch flow"
 * stream — Phase 22 wires up the subscription scaffold, but the only event
 * we can confidently derive without coupling to other features is "new
 * patch produced". Future phases can replace the body here without
 * touching consumers.
 */

import { useAgentStore } from '@shared/ai';
import { emit } from '../bus';

export interface AiWatcherHandle {
  dispose(): void;
}

export function startAiWatcher(): AiWatcherHandle {
  let prevPatchId: string | null = useAgentStore.getState().lastPatchId;

  const unsub = useAgentStore.subscribe((state) => {
    if (state.lastPatchId && state.lastPatchId !== prevPatchId) {
      const patch = state.patches.find((p) => p.id === state.lastPatchId);
      prevPatchId = state.lastPatchId;
      // Heuristic: a patch implies a server-action declaration→call link
      // somewhere in the touched file. Ranges are best-effort: we use the
      // first non-empty line of the new content as the def, and the last
      // non-empty line as the call site so the SVG curve has something to
      // bridge.
      if (patch) {
        const lines = patch.newContent.split(/\r?\n/);
        let defLine = 1;
        let callLine = lines.length;
        for (let i = 0; i < lines.length; i++) {
          const ln = lines[i];
          if (ln && ln.trim().length > 0) {
            defLine = i + 1;
            break;
          }
        }
        for (let i = lines.length - 1; i >= 0; i--) {
          const ln = lines[i];
          if (ln && ln.trim().length > 0) {
            callLine = i + 1;
            break;
          }
        }
        emit({
          kind: 'server-action-linked',
          file: patch.filePath,
          defLine,
          callLine: Math.max(defLine, callLine),
        });
      }
    }
  });

  return {
    dispose() {
      unsub();
    },
  };
}
