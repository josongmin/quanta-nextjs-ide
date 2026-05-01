import { useEffect, useId, useRef } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { buildHints } from './inline-param-hints-helpers';

interface Props {
  editor: MonacoEditor.IStandaloneCodeEditor | null;
  file: string;
}

const SCAN_DEBOUNCE_MS = 90;

export function InlineParamHintsLayer({ editor, file }: Props) {
  const styleId = useId().replace(/[:]/g, '');
  const collectionRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(
    null,
  );

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.dataset.iph = styleId;
    styleEl.textContent = `.iph-${styleId}-name::before { content: attr(data-name); color: rgb(140 140 156); font-style: italic; opacity: 0.85; margin-right: 2px; padding: 0 2px; border-radius: 2px; }`;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [styleId]);

  useEffect(() => {
    if (!editor) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const compute = () => {
      const model = editor.getModel();
      if (!model) {
        collectionRef.current?.clear();
        return;
      }
      const ranges = editor.getVisibleRanges();
      if (ranges.length === 0) {
        collectionRef.current?.clear();
        return;
      }
      const visible: { line: number; text: string }[] = [];
      for (const r of ranges) {
        const start = Math.max(1, r.startLineNumber - 2);
        const end = Math.min(model.getLineCount(), r.endLineNumber + 2);
        for (let line = start; line <= end; line++) {
          visible.push({ line, text: model.getLineContent(line) });
        }
      }
      const hints = buildHints(visible, 6);

      const decorations: MonacoEditor.IModelDeltaDecoration[] = hints.map(
        (h) => ({
          range: {
            startLineNumber: h.line,
            startColumn: h.column,
            endLineNumber: h.line,
            endColumn: h.column,
          },
          options: {
            before: {
              content: `${h.label}:`,
              inlineClassName: `iph-${styleId}-name`,
            },
            stickiness: 1,
          },
        }),
      );

      if (collectionRef.current) {
        collectionRef.current.set(decorations);
      } else {
        collectionRef.current = editor.createDecorationsCollection(decorations);
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(compute, SCAN_DEBOUNCE_MS);
    };

    compute();
    const dScroll = editor.onDidScrollChange(schedule);
    const dContent = editor.onDidChangeModelContent(schedule);
    const dLayout = editor.onDidLayoutChange(schedule);
    const dModel = editor.onDidChangeModel(schedule);

    return () => {
      dScroll.dispose();
      dContent.dispose();
      dLayout.dispose();
      dModel.dispose();
      if (timer) clearTimeout(timer);
      collectionRef.current?.clear();
      collectionRef.current = null;
    };
  }, [editor, file, styleId]);

  return null;
}
