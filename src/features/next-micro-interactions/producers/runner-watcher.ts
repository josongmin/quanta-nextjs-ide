/**
 * Runner producer: subscribes to the runner store, watches the `latest.build`
 * KindResult, and translates state transitions into bus events.
 */

import { useRunnerStore } from '@shared/runner';
import type { KindResult, RunState } from '@shared/runner/types';
import { emit } from '../bus';

export interface RunnerWatcherHandle {
  dispose(): void;
}

export function startRunnerWatcher(): RunnerWatcherHandle {
  let prev: KindResult | undefined = useRunnerStore.getState().latest.build;
  let prevState: RunState | undefined = prev?.state;
  let prevRunId: string | undefined = prev?.runId;

  const unsub = useRunnerStore.subscribe((state) => {
    const cur = state.latest.build;
    if (!cur) return;
    const idChanged = cur.runId !== prevRunId;
    const stateChanged = cur.state !== prevState;
    if (idChanged && cur.state === 'running') {
      emit({ kind: 'build-started', runId: cur.runId });
    } else if (stateChanged) {
      if (cur.state === 'succeeded') {
        emit({
          kind: 'build-success',
          runId: cur.runId,
          durationMs: cur.durationMs ?? null,
        });
      } else if (cur.state === 'failed') {
        emit({ kind: 'build-failed', runId: cur.runId });
      }
    }
    prevRunId = cur.runId;
    prevState = cur.state;
    prev = cur;
  });

  return {
    dispose() {
      unsub();
      prev = undefined;
    },
  };
}
