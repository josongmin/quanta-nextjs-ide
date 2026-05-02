/**
 * Phase 22 — Next.js-aware Micro-interactions.
 *
 * One mount in `App.tsx`:
 *
 *   <NextMicroInteractions />
 *
 * Boots all four producers and renders all consumers in a fixed-position
 * overlay layer. Producers and consumers are decoupled via the typed event
 * bus in `./bus.ts` — see file header there for the contract.
 */

import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';
import {
  startEditorWatcher,
  type EditorWatcherHandle,
} from './producers/editor-watcher';
import { startAdmissionWatcher } from './producers/admission-watcher';
import { startRunnerWatcher } from './producers/runner-watcher';
import { startAiWatcher } from './producers/ai-watcher';
import { TopProgress } from './consumers/top-progress';
import { MiniCallout } from './consumers/mini-callout';
import { LineSweep } from './consumers/line-sweep';
import { LinkLine } from './consumers/link-line';
import { CacheTagPulse } from './consumers/cache-tag-pulse';
import { ToastBridge } from './consumers/toast-bridge';
import { AdmissionEffects } from './consumers/admission-effects';
import { SecondaryEffects } from './consumers/secondary-effects';

export { emit, on, subscribe } from './bus';
export type { NextMiEvent, NextMiEventKind, NextMiHandler } from './bus';

export function NextMicroInteractions(): JSX.Element {
  const monaco = useMonaco();

  // Editor watcher needs the monaco namespace; (re)start when it appears.
  useEffect(() => {
    if (!monaco) return undefined;
    let handle: EditorWatcherHandle | undefined;
    try {
      handle = startEditorWatcher(monaco);
    } catch {
      handle = undefined;
    }
    return () => {
      handle?.dispose();
    };
  }, [monaco]);

  // Store-driven watchers boot once on mount.
  useEffect(() => {
    const admission = startAdmissionWatcher();
    const runner = startRunnerWatcher();
    const ai = startAiWatcher();
    return () => {
      admission.dispose();
      runner.dispose();
      ai.dispose();
    };
  }, []);

  return (
    <>
      <TopProgress />
      <MiniCallout />
      <LineSweep />
      <LinkLine />
      <CacheTagPulse />
      <ToastBridge />
      <AdmissionEffects />
      <SecondaryEffects />
    </>
  );
}
