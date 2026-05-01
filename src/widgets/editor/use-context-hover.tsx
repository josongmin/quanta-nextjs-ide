/**
 * Phase 6 — Full-context Monaco overlay hover.
 *
 * Mounts a Monaco IContentWidget that renders the React-based
 * <FullContextHoverCard> when the user hovers a symbol. Lives alongside
 * the LSP hover provider (which contributes its own markdown hover);
 * this widget gives us an out-of-band, fully-styled card without fighting
 * Monaco's hover widget for layout.
 *
 * Strategy:
 *   - Listen to `editor.onMouseMove`.
 *   - When the target is text content and the cursor lingers (~280ms),
 *     compute the word at the position and render the card pinned to
 *     the editor's content widget layer.
 *   - Hide on mouse out, scroll, focus loss, or Esc.
 *
 * The card is always portaled to the editor itself — not the document body —
 * so the editor's clipping handles edge cases for free.
 */

import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { editor as MonacoEditor, IDisposable } from 'monaco-editor';
import { FullContextHoverCard } from '@features/full-context-hover';

const HOVER_DELAY_MS = 280;
const WIDGET_ID = 'nss.full-context-hover';

interface UseContextHoverArgs {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  /** Logical file path of the currently focused editor. */
  file: string | null;
}

/**
 * Mount/unmount the full-context hover widget for one editor instance.
 *
 * Safe to call when the editor is null — does nothing.
 */
export function useContextHover({ editor, file }: UseContextHoverArgs): void {
  const widgetRef = useRef<MonacoEditor.IContentWidget | null>(null);
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor || !file) return;

    // ─── Build widget DOM ──────────────────────────────────────────
    const container = document.createElement('div');
    container.style.zIndex = '60';
    container.style.position = 'absolute';
    container.style.pointerEvents = 'auto';
    container.setAttribute('data-nss-widget', WIDGET_ID);
    containerRef.current = container;

    const root = createRoot(container);
    rootRef.current = root;

    let currentSymbol: string | null = null;
    let currentLine = 1;
    let currentColumn = 1;
    let visible = false;

    const hide = () => {
      if (!visible) return;
      visible = false;
      root.render(null);
      try {
        editor.removeContentWidget(widget);
      } catch {
        /* widget may have been removed already */
      }
    };

    const show = () => {
      if (!currentSymbol) return;
      visible = true;
      try {
        editor.addContentWidget(widget);
      } catch {
        /* fine — already added */
      }
      root.render(
        <FullContextHoverCard
          symbol={currentSymbol}
          file={file}
          line={currentLine}
          onDismiss={hide}
        />,
      );
    };

    const widget: MonacoEditor.IContentWidget = {
      getId: () => WIDGET_ID,
      getDomNode: () => container,
      getPosition: () => ({
        position: { lineNumber: currentLine, column: currentColumn },
        // Prefer below; fall back above. Monaco keeps within the viewport.
        preference: [1 /* ABOVE */, 2 /* BELOW */],
      }),
    };
    widgetRef.current = widget;

    const disposables: IDisposable[] = [];

    // Hover detection on a delay.
    disposables.push(
      editor.onMouseMove((e) => {
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        const pos = e.target.position;
        // Only trigger over actual text content.
        if (!pos || e.target.type !== 6 /* CONTENT_TEXT */) {
          // Outside text — schedule a hide so the card doesn't linger.
          timerRef.current = window.setTimeout(() => {
            hide();
          }, 120);
          return;
        }
        const model = editor.getModel();
        if (!model) return;
        const word = model.getWordAtPosition(pos);
        if (!word) {
          timerRef.current = window.setTimeout(() => hide(), 120);
          return;
        }
        // Skip 1-letter symbols and obvious keywords. Cheaper than a real
        // tokenizer; good enough for the UX hover-to-reveal experience.
        if (word.word.length < 2) return;
        if (word.word === currentSymbol && currentLine === pos.lineNumber) return;

        currentSymbol = word.word;
        currentLine = pos.lineNumber;
        currentColumn = word.startColumn;

        timerRef.current = window.setTimeout(() => {
          // Re-resolve in case the user moved away during the delay.
          const layout = editor.getLayoutInfo();
          if (!layout) return;
          show();
        }, HOVER_DELAY_MS);
      }),
    );

    disposables.push(
      editor.onMouseLeave(() => {
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        timerRef.current = window.setTimeout(() => hide(), 200);
      }),
    );

    disposables.push(
      editor.onDidScrollChange(() => {
        hide();
      }),
    );

    disposables.push(
      editor.onDidBlurEditorWidget(() => {
        hide();
      }),
    );

    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const d of disposables) d.dispose();
      hide();
      // Defer unmount to next microtask so React doesn't warn about
      // synchronous unmount during a lifecycle.
      queueMicrotask(() => {
        try {
          root.unmount();
        } catch {
          /* ignore */
        }
      });
      widgetRef.current = null;
      rootRef.current = null;
      containerRef.current = null;
    };
  }, [editor, file]);
}
