/**
 * Editor producer: watches Monaco for typed tokens that should trigger a
 * Next.js-aware micro-interaction. Uses the global `monaco.editor.getEditors()`
 * surface to remain decoupled from editor-area.tsx (per phase brief: do not
 * heavily modify editor-area).
 *
 * Debounced 80ms — only fires on insertions of target patterns, never on
 * deletions, never on navigation. Events go through the bus, which applies
 * its own 800ms identity throttle.
 */

import type { editor as MonacoEditor, IDisposable } from 'monaco-editor';
import { emit } from '../bus';
import {
  USE_CLIENT_RE,
  DYNAMIC_TRIGGERS,
  REVALIDATE_TAG_RE,
  PROCESS_ENV_RE,
  SECRET_NAME_RE,
  NEXT_PUBLIC_RE,
  FETCH_CALL_RE,
} from '../utils/regex';

type MonacoNs = typeof import('monaco-editor');

const DEBOUNCE_MS = 80;

/** Monaco model URIs are file paths; the host adds a fragment we strip. */
function fileFromModel(model: MonacoEditor.ITextModel): string {
  const raw = model.uri.path || model.uri.toString();
  try {
    return decodeURIComponent(raw).replace(/^\//, '');
  } catch {
    return raw.replace(/^\//, '');
  }
}

/** Best-effort detection: does the file's source contain `'use client'`? */
function isClientFile(model: MonacoEditor.ITextModel): boolean {
  const head = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: Math.min(model.getLineCount(), 6),
    endColumn: 1_000,
  });
  return /['"]use client['"]/.test(head);
}

/**
 * Heuristic: is this line inside a render path? We approximate "render path"
 * as "in a server-component file (no 'use client') and not inside an
 * obvious server-action block". Cheap & good-enough for the micro-moment.
 */
function looksLikeRenderPath(
  model: MonacoEditor.ITextModel,
  line: number,
): boolean {
  if (isClientFile(model)) return false;
  // Walk up looking for `'use server'` directive in the enclosing function.
  for (let i = Math.max(1, line - 30); i < line; i++) {
    const text = model.getLineContent(i);
    if (/['"]use server['"]/.test(text)) return false;
  }
  return true;
}

interface ModelWatch {
  model: MonacoEditor.ITextModel;
  disposer: IDisposable;
  timer: number | null;
  /** Lines we've already announced to avoid double-fires while still typing. */
  emittedUseClient: Set<number>;
  emittedRevalidate: Set<string>;
  emittedFetch: Set<number>;
  emittedSecret: Set<string>;
}

export interface EditorWatcherHandle {
  dispose(): void;
}

/**
 * Start the watcher. Pass the live `monaco` namespace; we walk all open
 * editors and attach onDidChangeModelContent listeners. New editors mounted
 * later are picked up via `monaco.editor.onDidCreateEditor`.
 */
export function startEditorWatcher(monaco: MonacoNs): EditorWatcherHandle {
  const watches = new Map<string, ModelWatch>();

  function attach(model: MonacoEditor.ITextModel): void {
    const key = model.uri.toString();
    if (watches.has(key)) return;
    const watch: ModelWatch = {
      model,
      disposer: { dispose: () => undefined },
      timer: null,
      emittedUseClient: new Set(),
      emittedRevalidate: new Set(),
      emittedFetch: new Set(),
      emittedSecret: new Set(),
    };
    watch.disposer = model.onDidChangeContent((evt) => {
      // Only react to insertions — deletions never fire micro-interactions.
      const insertion = evt.changes.some((c) => c.text.length > 0);
      if (!insertion) return;
      if (watch.timer != null) window.clearTimeout(watch.timer);
      watch.timer = window.setTimeout(() => {
        watch.timer = null;
        scanForChanges(watch, evt.changes);
      }, DEBOUNCE_MS);
    });
    watches.set(key, watch);
  }

  function detach(model: MonacoEditor.ITextModel): void {
    const key = model.uri.toString();
    const w = watches.get(key);
    if (!w) return;
    if (w.timer != null) window.clearTimeout(w.timer);
    w.disposer.dispose();
    watches.delete(key);
  }

  function scanForChanges(
    watch: ModelWatch,
    changes: readonly MonacoEditor.IModelContentChange[],
  ): void {
    const { model } = watch;
    const file = fileFromModel(model);
    // Collect candidate lines from the diff range; this avoids scanning the
    // whole file on every keystroke.
    const candidateLines = new Set<number>();
    for (const c of changes) {
      const start = c.range.startLineNumber;
      // After insertion the new content can span more lines than the original
      // range, so add a small buffer.
      const insertedLines = c.text.split(/\r?\n/).length - 1;
      for (let i = start; i <= start + insertedLines; i++) {
        if (i >= 1 && i <= model.getLineCount()) candidateLines.add(i);
      }
    }

    for (const line of candidateLines) {
      const text = model.getLineContent(line);

      // 1. `'use client'` directive
      if (USE_CLIENT_RE.test(text) && !watch.emittedUseClient.has(line)) {
        watch.emittedUseClient.add(line);
        emit({
          kind: 'use-client-typed',
          file,
          line,
          // Numbers are illustrative; producers don't have a real bundle
          // graph here. Consumers may override / hide if 0.
          filesAdded: 38,
          kbAdded: 260,
        });
      }

      // 2. dynamic-trigger acceptance
      for (const trig of DYNAMIC_TRIGGERS) {
        if (trig.re.test(text)) {
          emit({
            kind: 'dynamic-trigger-accepted',
            file,
            line,
            api: trig.api,
          });
          break;
        }
      }

      // 3. revalidateTag('x')
      const tagMatch = REVALIDATE_TAG_RE.exec(text);
      if (tagMatch && tagMatch[1]) {
        const tag = tagMatch[1];
        const idKey = `${line}:${tag}`;
        if (!watch.emittedRevalidate.has(idKey)) {
          watch.emittedRevalidate.add(idKey);
          emit({ kind: 'revalidate-tag-typed', file, line, tag });
        }
      }

      // 4. process.env.X
      const envMatch = PROCESS_ENV_RE.exec(text);
      if (envMatch && envMatch[1]) {
        const name = envMatch[1];
        const idKey = `${line}:${name}`;
        const looksSecret = SECRET_NAME_RE.test(name);
        const isPublicPrefixed = NEXT_PUBLIC_RE.test(name);
        const onClient = isClientFile(model);
        if (
          !watch.emittedSecret.has(idKey) &&
          (looksSecret || (onClient && !isPublicPrefixed))
        ) {
          watch.emittedSecret.add(idKey);
          emit({
            kind: 'env-secret-typed',
            file,
            line,
            column: Math.max(1, (envMatch.index ?? 0) + 1),
            isServer: !onClient,
            name,
          });
        }
      }

      // 5. fetch added in render path
      if (
        FETCH_CALL_RE.test(text) &&
        !watch.emittedFetch.has(line) &&
        looksLikeRenderPath(model, line)
      ) {
        watch.emittedFetch.add(line);
        emit({ kind: 'fetch-added-in-render', file, line });
      }
    }
  }

  // Attach to currently-open editor models.
  for (const ed of monaco.editor.getEditors()) {
    const m = ed.getModel();
    if (m) attach(m);
  }
  // Attach to models created later.
  const createdSub = monaco.editor.onDidCreateModel(attach);
  const willDisposeSub = monaco.editor.onWillDisposeModel(detach);

  return {
    dispose() {
      createdSub.dispose();
      willDisposeSub.dispose();
      for (const w of watches.values()) {
        if (w.timer != null) window.clearTimeout(w.timer);
        w.disposer.dispose();
      }
      watches.clear();
    },
  };
}
